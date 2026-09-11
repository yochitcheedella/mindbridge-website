import React, { useState, useEffect, useRef } from 'react';
import {
  PenLine, Trash2, CheckCircle2, Lock, Users,
  Sparkles, Edit3, BookOpen, X, AlertTriangle, Plus, Clock
} from 'lucide-react';
import MoodSelector, { MOODS } from './MoodSelector';
import { apiFetch } from '../../utils/auth';

export interface DiaryEntry {
  id: number;
  entry_date: string;
  content: string;
  mood: string | null;
  mood_tag: string | null;
  is_shared_with_counselor: boolean;
  word_count: number;
  created_at?: string;
  updated_at?: string;
}

interface DiaryPageProps {
  date: Date;
  entries: DiaryEntry[];
  loading: boolean;
  onSaved: (entry: DiaryEntry) => void;
  onDeleted: (entryId?: number) => void;
}

const TOPIC_TAGS = [
  { id: 'academic',       label: '📚 Academic' },
  { id: 'relationships',  label: '💛 Relationships' },
  { id: 'family',         label: '🏠 Family' },
  { id: 'finance',        label: '💰 Finance' },
  { id: 'health',         label: '❤️ Health' },
  { id: 'career',         label: '🎯 Career' },
];

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(date: Date) {
  return `${WEEKDAYS[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

function formatTime(isoStr?: string) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return '';
  }
}

function isToday(date: Date) {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function getMoodInfo(mood: string | null) {
  if (!mood) return null;
  return MOODS.find(m => m.score === mood) ?? null;
}

interface AIInsight {
  summary: string;
  patterns: string[];
  advice: string;
}

export default function DiaryPage({ date, entries, loading, onSaved, onDeleted }: DiaryPageProps) {
  // Form / Editor state
  const [isWriting, setIsWriting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [moodTag, setMoodTag] = useState<string | null>(null);
  const [isShared, setIsShared] = useState(false);
  const [saving, setSaving] = useState(false);

  // Deletion state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // AI Reflections map: entryId -> AIInsight
  const [aiInsights, setAiInsights] = useState<Record<number, AIInsight>>({});
  const [aiLoadingId, setAiLoadingId] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // When selected date changes, reset the writing form unless user was already in it
  useEffect(() => {
    setIsWriting(false);
    setEditingId(null);
    setContent('');
    setMood(null);
    setMoodTag(null);
    setIsShared(false);
    setConfirmDeleteId(null);
  }, [date]);

  // Auto-focus when writing starts
  useEffect(() => {
    if (isWriting) {
      setTimeout(() => textareaRef.current?.focus(), 60);
    }
  }, [isWriting]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const today = isToday(date);
  const dateStr = toDateStr(date);

  // ── Open Editor ─────────────────────────────────────────────────────────────

  const startNewEntry = () => {
    setEditingId(null);
    setContent('');
    setMood(null);
    setMoodTag(null);
    setIsShared(false);
    setIsWriting(true);
  };

  const startEditEntry = (entry: DiaryEntry) => {
    setEditingId(entry.id);
    setContent(entry.content);
    setMood(entry.mood ?? null);
    setMoodTag(entry.mood_tag ?? null);
    setIsShared(entry.is_shared_with_counselor);
    setIsWriting(true);
  };

  const cancelWriting = () => {
    setIsWriting(false);
    setEditingId(null);
    setContent('');
    setMood(null);
    setMoodTag(null);
  };

  // ── Save Entry ──────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch('/api/journal/entry', {
        method: 'POST',
        body: JSON.stringify({
          id: editingId ?? undefined,
          entry_date: dateStr,
          content: content.trim(),
          mood: mood ?? undefined,
          mood_tag: moodTag ?? undefined,
          is_shared_with_counselor: isShared,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsWriting(false);
        setEditingId(null);
        setContent('');
        setMood(null);
        setMoodTag(null);
        onSaved({
          id: data.id,
          entry_date: data.entry_date ?? dateStr,
          content: data.content,
          mood: data.mood ?? null,
          mood_tag: data.mood_tag ?? null,
          is_shared_with_counselor: Boolean(data.is_shared_with_counselor),
          word_count: data.word_count ?? wordCount,
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Delete Entry ────────────────────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setDeletingId(id);
    try {
      const res = await apiFetch(`/api/journal/entry/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setConfirmDeleteId(null);
        onDeleted(id);
      }
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  // ── AI Reflection ───────────────────────────────────────────────────────────

  const handleReflect = async (entry: DiaryEntry) => {
    if (!entry.content.trim()) return;
    setAiLoadingId(entry.id);
    try {
      const res = await apiFetch('/api/journal/reflect', {
        method: 'POST',
        body: JSON.stringify({ content: entry.content.trim() }),
      });
      if (res.ok) {
        const insightData = await res.json();
        setAiInsights(prev => ({ ...prev, [entry.id]: insightData }));
      }
    } finally {
      setAiLoadingId(null);
    }
  };

  // ── Date Header Component ───────────────────────────────────────────────────

  const DateHeader = () => (
    <div className="flex items-center justify-between pb-4 border-b border-dashed border-border-structural">
      <div>
        <div className="flex items-center gap-2 mb-1">
          {today ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-interactive-primary/15 border border-interactive-primary/30 text-[10px] font-bold uppercase tracking-wider text-interactive-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-interactive-primary animate-pulse" />
              Today
            </span>
          ) : (
            <span className="text-[11px] font-mono text-text-muted">{dateStr}</span>
          )}
          {entries.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-bright text-text-muted font-medium">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>
        <h2 className="font-heading font-bold text-xl text-text">
          {formatDateLabel(date)}
        </h2>
      </div>

      {!isWriting && (
        <button
          id="diary-add-entry-btn"
          onClick={startNewEntry}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-interactive-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-interactive-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={14} /> New Entry
        </button>
      )}
    </div>
  );

  // ── Loading View ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center min-h-[320px] gap-3 text-text-muted">
        <div className="w-6 h-6 border-2 border-text-muted/20 border-t-text-muted rounded-full animate-spin" />
        <p className="text-xs">Loading diary entries…</p>
      </div>
    );
  }

  // ── Main Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Container Card */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col gap-5 animate-fade-in">
        <DateHeader />

        {/* ── Active Writing / Editing Form ── */}
        {isWriting && (
          <div className="bg-surface-container-low rounded-2xl p-4 border border-interactive-primary/30 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-border-structural">
              <span className="text-xs font-bold text-interactive-primary flex items-center gap-1.5">
                <PenLine size={13} /> {editingId ? 'Edit Diary Entry' : 'New Diary Entry'}
              </span>
              <button
                onClick={cancelWriting}
                className="text-text-muted hover:text-text p-1 rounded-lg hover:bg-surface-bright transition-colors"
                aria-label="Cancel"
              >
                <X size={14} />
              </button>
            </div>

            {/* Mood selector */}
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider text-center mb-1">
                How are you feeling?
              </p>
              <MoodSelector value={mood} onChange={setMood} />
            </div>

            <div className="border-t border-dashed border-border-structural" />

            {/* Textarea */}
            <div className="relative">
              <p className="text-xs text-text-muted italic mb-1.5 font-medium">Dear Diary,</p>
              <textarea
                ref={textareaRef}
                id="diary-editor-textarea"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write your thoughts freely — this is your safe, private space…"
                rows={7}
                className="w-full bg-surface border border-border-structural rounded-xl px-4 py-3 text-sm text-text placeholder-text-muted focus:outline-none focus:border-interactive-primary/50 focus:bg-surface-container resize-none transition-all leading-relaxed"
              />
              <span className="absolute bottom-3 right-4 text-[10px] text-text-muted font-mono pointer-events-none">
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
              </span>
            </div>

            {/* Topic tags */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                Tag this entry (optional)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TOPIC_TAGS.map(t => (
                  <button
                    key={t.id}
                    id={`diary-tag-${t.id}`}
                    onClick={() => setMoodTag(moodTag === t.id ? null : t.id)}
                    className={[
                      'text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all',
                      moodTag === t.id
                        ? 'bg-interactive-primary/20 text-interactive-primary border-interactive-primary/40'
                        : 'bg-surface border-border-structural text-text-muted hover:border-interactive-primary/30',
                    ].join(' ')}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="diary-privacy-private"
                onClick={() => setIsShared(false)}
                className={[
                  'py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border',
                  !isShared
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-surface border-border-structural text-text-muted hover:text-text',
                ].join(' ')}
              >
                <Lock size={11} /> Private (Only Me)
              </button>
              <button
                type="button"
                id="diary-privacy-shared"
                onClick={() => setIsShared(true)}
                className={[
                  'py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border',
                  isShared
                    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                    : 'bg-surface border-border-structural text-text-muted hover:text-text',
                ].join(' ')}
              >
                <Users size={11} /> Share with Psychologist
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={cancelWriting}
                className="px-4 py-2.5 rounded-xl border border-border-structural bg-surface hover:bg-surface-bright text-text-muted text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                id="diary-save-btn"
                onClick={handleSave}
                disabled={saving || !content.trim()}
                className={[
                  'flex-1 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2',
                  !content.trim()
                    ? 'bg-surface border border-border-structural text-text-muted cursor-not-allowed'
                    : 'bg-interactive-primary hover:bg-primary-hover text-white shadow-md shadow-interactive-primary/20 hover:scale-[1.01] active:scale-[0.99]',
                ].join(' ')}
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} /> {editingId ? 'Update Entry' : 'Save Entry'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Empty State (if no entries & not writing) ── */}
        {entries.length === 0 && !isWriting && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center">
              <BookOpen size={28} className="text-text-muted opacity-50" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-text">No entries for this day</p>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Start writing your thoughts — you can add multiple entries throughout the day.
              </p>
            </div>
            <button
              onClick={startNewEntry}
              id="diary-start-writing-btn"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-interactive-primary hover:bg-primary-hover text-white font-semibold text-sm transition-all shadow-lg shadow-interactive-primary/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <PenLine size={15} /> Write First Entry
            </button>
          </div>
        )}

        {/* ── Entries List for this Day ── */}
        {entries.length > 0 && (
          <div className="space-y-4">
            {entries.map((item, idx) => {
              const moodInfo = getMoodInfo(item.mood);
              const insight = aiInsights[item.id];
              const isReflecting = aiLoadingId === item.id;
              const isDeleting = deletingId === item.id;
              const isConfirming = confirmDeleteId === item.id;

              return (
                <div
                  key={item.id}
                  id={`diary-entry-${item.id}`}
                  className="bg-surface-container-low rounded-2xl p-4 border border-border-structural space-y-3 transition-all hover:border-border-structural/80"
                >
                  {/* Entry Header */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-border-structural/60">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-muted">#{idx + 1}</span>
                      {item.created_at && (
                        <span className="flex items-center gap-1 text-[11px] text-text-muted">
                          <Clock size={11} /> {formatTime(item.created_at)}
                        </span>
                      )}
                      {moodInfo && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-interactive-primary/10 border border-interactive-primary/20 text-text">
                          <span>{moodInfo.emoji}</span>
                          <span className="text-[10px] font-semibold">{moodInfo.label}</span>
                        </span>
                      )}
                      {item.mood_tag && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface border border-border-structural text-text-muted">
                          {TOPIC_TAGS.find(t => t.id === item.mood_tag)?.label ?? item.mood_tag}
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-semibold flex items-center gap-1 ${
                        item.is_shared_with_counselor ? 'text-indigo-300' : 'text-emerald-300'
                      }`}
                    >
                      {item.is_shared_with_counselor ? (
                        <><Users size={10} /> Shared</>
                      ) : (
                        <><Lock size={10} /> Private</>
                      )}
                    </span>
                  </div>

                  {/* Content Body */}
                  <div>
                    <p className="text-xs text-text-muted italic mb-1.5 font-medium">Dear Diary,</p>
                    <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </p>
                  </div>

                  {/* Word Count */}
                  <div className="flex items-center justify-between pt-2 text-[10px] text-text-muted font-mono">
                    <span>{item.word_count} words</span>
                  </div>

                  {/* AI Insight Box (if triggered) */}
                  {insight && (
                    <div className="bg-gradient-to-br from-interactive-primary/10 to-transparent rounded-xl p-3 border border-interactive-primary/20 relative animate-fade-in">
                      <button
                        onClick={() =>
                          setAiInsights(prev => {
                            const next = { ...prev };
                            delete next[item.id];
                            return next;
                          })
                        }
                        className="absolute top-2.5 right-2.5 text-text-muted hover:text-text transition-colors"
                        aria-label="Close AI reflection"
                      >
                        <X size={12} />
                      </button>
                      <p className="text-xs font-semibold text-interactive-primary flex items-center gap-1.5 mb-1.5">
                        <Sparkles size={11} /> AI Reflection
                      </p>
                      <p className="text-xs text-text leading-relaxed mb-2">{insight.summary}</p>
                      {insight.patterns.length > 0 && (
                        <ul className="space-y-1 mb-2">
                          {insight.patterns.map((p, i) => (
                            <li key={i} className="text-[11px] text-text-muted flex items-start gap-1.5">
                              <span className="text-interactive-primary/70 mt-0.5 shrink-0">•</span> {p}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="bg-surface/60 rounded-lg p-2.5 border border-border-structural">
                        <p className="text-[10px] font-bold text-interactive-primary mb-0.5">CBT Advice</p>
                        <p className="text-xs text-text leading-relaxed">{insight.advice}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border-structural/60">
                    {!insight && (
                      <button
                        onClick={() => handleReflect(item)}
                        disabled={isReflecting}
                        className="py-1.5 px-3 rounded-lg border border-interactive-primary/20 bg-interactive-primary/5 hover:bg-interactive-primary/10 text-interactive-primary text-xs font-semibold transition-all flex items-center gap-1.5"
                      >
                        {isReflecting ? (
                          <>
                            <div className="w-3 h-3 border-2 border-interactive-primary/30 border-t-interactive-primary rounded-full animate-spin" />
                            Analyzing…
                          </>
                        ) : (
                          <>
                            <Sparkles size={12} /> ✨ Reflect
                          </>
                        )}
                      </button>
                    )}

                    <div className="flex-1" />

                    <button
                      onClick={() => startEditEntry(item)}
                      className="py-1.5 px-3 rounded-lg border border-border-structural bg-surface hover:bg-surface-bright text-text text-xs font-medium transition-all flex items-center gap-1"
                    >
                      <Edit3 size={12} /> Edit
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={isDeleting}
                      className={[
                        'py-1.5 px-3 rounded-lg border text-xs font-medium transition-all flex items-center gap-1',
                        isConfirming
                          ? 'bg-error/20 text-error border-error/40 animate-pulse'
                          : 'border-border-structural bg-surface hover:bg-error/10 hover:text-error hover:border-error/30 text-text-muted',
                      ].join(' ')}
                    >
                      {isDeleting ? (
                        <div className="w-3 h-3 border-2 border-error/30 border-t-error rounded-full animate-spin" />
                      ) : isConfirming ? (
                        <><AlertTriangle size={12} /> Confirm?</>
                      ) : (
                        <><Trash2 size={12} /> Delete</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
