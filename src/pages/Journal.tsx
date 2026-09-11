import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { apiFetch } from '../utils/auth';
import JournalCalendar, { type CalendarDay } from '../components/journal/JournalCalendar';
import DiaryPage, { type DiaryEntry } from '../components/journal/DiaryPage';
import PastEntries from '../components/journal/PastEntries';
import JournalStats from '../components/journal/JournalStats';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function toMonthStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ── Page Component ────────────────────────────────────────────────────────────

export default function Journal() {
  const navigate = useNavigate();
  const today = getToday();

  // Core state
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [entriesForDate, setEntriesForDate] = useState<DiaryEntry[]>([]);
  const [entryLoading, setEntryLoading] = useState(true);

  // Re-render keys — bumped after saves/deletes to refresh child components
  const [statsKey, setStatsKey] = useState(0);
  const [pastKey, setPastKey] = useState(0);

  // Mobile: past entries panel toggle
  const [showPast, setShowPast] = useState(false);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const loadCalendar = useCallback(async (month: Date) => {
    try {
      const res = await apiFetch(`/api/journal/calendar?month=${toMonthStr(month)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.days)) setCalendarData(data.days);
      }
    } catch {
      // non-blocking
    }
  }, []);

  const loadEntriesForDate = useCallback(async (date: Date) => {
    setEntryLoading(true);
    setEntriesForDate([]);
    try {
      const res = await apiFetch(`/api/journal/date/${toDateStr(date)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.entries)) {
          setEntriesForDate(data.entries as DiaryEntry[]);
        } else if (data.has_entry && data.entry) {
          setEntriesForDate([data.entry as DiaryEntry]);
        } else {
          setEntriesForDate([]);
        }
      }
    } catch {
      setEntriesForDate([]);
    } finally {
      setEntryLoading(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    loadCalendar(currentMonth);
    loadEntriesForDate(today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Event handlers ─────────────────────────────────────────────────────────

  /** User clicks a day on the calendar */
  const handleDateSelect = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      loadEntriesForDate(date);

      // If the clicked date belongs to a different month, update the calendar view
      if (
        date.getMonth() !== currentMonth.getMonth() ||
        date.getFullYear() !== currentMonth.getFullYear()
      ) {
        const newMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        setCurrentMonth(newMonth);
        loadCalendar(newMonth);
      }
    },
    [currentMonth, loadCalendar, loadEntriesForDate],
  );

  /** User navigates the calendar month */
  const handleMonthChange = useCallback(
    (month: Date) => {
      setCurrentMonth(month);
      loadCalendar(month);
    },
    [loadCalendar],
  );

  /** DiaryPage calls this after a successful save */
  const handleSaved = useCallback(
    (savedEntry: DiaryEntry) => {
      setEntriesForDate(prev => {
        const existingIdx = prev.findIndex(e => e.id === savedEntry.id);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = savedEntry;
          return updated;
        }
        return [...prev, savedEntry];
      });

      // Optimistically update calendar marker for this date
      const dateStr = toDateStr(selectedDate);
      setCalendarData(prev => {
        const existing = prev.find(d => d.date === dateStr);
        if (existing) {
          return prev.map(d =>
            d.date === dateStr
              ? { ...d, has_entry: true, has_mood: d.has_mood || !!savedEntry.mood }
              : d,
          );
        }
        return [
          ...prev,
          {
            date: dateStr,
            has_entry: true,
            has_mood: !!savedEntry.mood,
            mood: savedEntry.mood,
          },
        ];
      });

      setStatsKey(k => k + 1);
      setPastKey(k => k + 1);
    },
    [selectedDate],
  );

  /** DiaryPage calls this after a successful delete */
  const handleDeleted = useCallback(
    (deletedId?: number) => {
      setEntriesForDate(prev => {
        const updated = deletedId ? prev.filter(e => e.id !== deletedId) : [];
        if (updated.length === 0) {
          const dateStr = toDateStr(selectedDate);
          setCalendarData(cPrev => cPrev.filter(d => d.date !== dateStr));
        }
        return updated;
      });

      setStatsKey(k => k + 1);
      setPastKey(k => k + 1);
    },
    [selectedDate],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-6">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-surface-dim/80 backdrop-blur-xl border-b border-border-structural px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-surface border border-border-structural text-text-muted hover:text-text hover:bg-surface-bright transition-all shrink-0"
            >
              <ArrowLeft size={17} />
            </button>
            <div>
              <h1 className="font-heading font-bold text-base flex items-center gap-2 text-text leading-tight">
                <BookOpen size={16} className="text-interactive-primary shrink-0" />
                My Diary
              </h1>
              <p className="text-[10px] text-text-muted">Your private digital diary</p>
            </div>
          </div>

          {/* Privacy badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
            <Lock size={11} className="text-emerald-400" />
            <span className="text-[10px] font-semibold text-emerald-400 hidden sm:inline">
              Private Journal
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-7xl mx-auto px-4 pt-5">

        {/* Stats banner */}
        <div className="mb-5">
          <JournalStats refreshKey={statsKey} />
        </div>

        {/* ── Desktop: 3-column grid ── */}
        <div className="hidden lg:grid lg:grid-cols-[300px_1fr_272px] gap-5 items-start">

          {/* Column 1 — Calendar */}
          <div className="sticky top-[73px]">
            <JournalCalendar
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              calendarData={calendarData}
              onDateSelect={handleDateSelect}
              onMonthChange={handleMonthChange}
            />
          </div>

          {/* Column 2 — Diary Page */}
          <div>
            <DiaryPage
              date={selectedDate}
              entries={entriesForDate}
              loading={entryLoading}
              onSaved={handleSaved}
              onDeleted={handleDeleted}
            />
          </div>

          {/* Column 3 — Past Entries (sticky, scrollable) */}
          <div
            className="sticky top-[73px]"
            style={{ height: 'calc(100vh - 90px)' }}
          >
            <PastEntries
              onSelectDate={handleDateSelect}
              selectedDate={selectedDate}
              refreshKey={pastKey}
            />
          </div>
        </div>

        {/* ── Mobile / Tablet: single-column ── */}
        <div className="lg:hidden space-y-4">

          {/* Calendar */}
          <JournalCalendar
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            calendarData={calendarData}
            onDateSelect={handleDateSelect}
            onMonthChange={handleMonthChange}
          />

          {/* Diary page */}
          <DiaryPage
            date={selectedDate}
            entries={entriesForDate}
            loading={entryLoading}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
          />

          {/* Collapsible past entries */}
          <button
            id="toggle-past-entries-btn"
            onClick={() => setShowPast(p => !p)}
            className="w-full py-3 rounded-xl border border-border-structural bg-surface hover:bg-surface-bright text-text-muted hover:text-text text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            <BookOpen size={15} />
            Past Entries
            {showPast ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showPast && (
            <div className="h-96 animate-fade-in">
              <PastEntries
                onSelectDate={date => {
                  handleDateSelect(date);
                  setShowPast(false); // collapse after selection
                }}
                selectedDate={selectedDate}
                refreshKey={pastKey}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
