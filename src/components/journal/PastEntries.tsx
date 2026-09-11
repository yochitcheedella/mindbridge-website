import React, { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, X } from 'lucide-react';
import { apiFetch } from '../../utils/auth';
import { MOODS } from './MoodSelector';

interface PastEntry {
  id: number;
  entry_date: string;
  content: string;
  mood: string | null;
  mood_tag: string | null;
  word_count: number;
}

interface PastEntriesProps {
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
  /** Bump this number to trigger a re-fetch (e.g. after save/delete). */
  refreshKey: number;
}

function getMoodEmoji(mood: string | null) {
  return MOODS.find(m => m.score === mood) ?? null;
}

function formatShortDate(dateStr: string): string {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, mo - 1, d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function parseDateStr(dateStr: string): Date {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(y, mo - 1, d);
}

function toCanonicalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function PastEntries({ onSelectDate, selectedDate, refreshKey }: PastEntriesProps) {
  const [entries, setEntries] = useState<PastEntry[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchEntries = async (q: string) => {
    setLoading(true);
    try {
      const url = q.trim()
        ? `/api/journal/entries?q=${encodeURIComponent(q.trim())}&limit=30`
        : `/api/journal/entries?limit=30`;
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setEntries(data);
      }
    } catch {
      // Silently fail — network issues don't crash the sidebar
    } finally {
      setLoading(false);
    }
  };

  // Reload when refreshKey changes (after save/delete) or on mount
  useEffect(() => {
    fetchEntries(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchEntries(q), 350);
  };

  const clearSearch = () => {
    setQuery('');
    fetchEntries('');
  };

  const selectedDateStr = toCanonicalDateStr(selectedDate);

  return (
    <div className="glass-panel rounded-2xl flex flex-col h-full overflow-hidden">
      {/* Header + search */}
      <div className="p-4 border-b border-border-structural shrink-0">
        <h3 className="font-heading font-semibold text-sm text-text mb-3">Past Entries</h3>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            id="past-entries-search"
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search entries…"
            className="w-full bg-surface-container-low border border-border-structural pl-8 pr-8 py-2 rounded-xl text-xs text-text placeholder-text-muted focus:outline-none focus:border-interactive-primary/50 transition-all"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Entry list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-text-muted/20 border-t-text-muted rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-text-muted">
            <BookOpen size={28} className="opacity-30" />
            <p className="text-xs text-center">
              {query ? 'No entries match your search' : 'No diary entries yet'}
            </p>
          </div>
        ) : (
          entries.map(e => {
            const moodInfo = getMoodEmoji(e.mood);
            const isActive = e.entry_date === selectedDateStr;
            const preview =
              e.content.length > 68
                ? e.content.slice(0, 68) + '…'
                : e.content;

            return (
              <button
                key={e.id}
                id={`past-entry-${e.entry_date}`}
                onClick={() => onSelectDate(parseDateStr(e.entry_date))}
                className={[
                  'w-full text-left p-3 rounded-xl border transition-all duration-150 hover:bg-surface-bright',
                  isActive
                    ? 'bg-interactive-primary/10 border-interactive-primary/30 shadow-sm'
                    : 'bg-surface border-border-structural',
                ].join(' ')}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-text">
                    {formatShortDate(e.entry_date)}
                  </span>
                  {moodInfo && (
                    <span className="text-base leading-none" title={moodInfo.label}>
                      {moodInfo.emoji}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">{preview}</p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
