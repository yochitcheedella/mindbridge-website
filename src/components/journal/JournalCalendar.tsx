import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CalendarDay {
  date: string;       // 'YYYY-MM-DD'
  has_entry: boolean;
  has_mood: boolean;
  mood?: string | null;
}

interface JournalCalendarProps {
  currentMonth: Date;
  selectedDate: Date;
  calendarData: CalendarDay[];
  onDateSelect: (date: Date) => void;
  onMonthChange: (month: Date) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function getMarker(d: CalendarDay | undefined): string | null {
  if (!d) return null;
  if (d.has_entry && d.has_mood) return '🟣';
  if (d.has_entry) return '🟢';
  if (d.has_mood) return '🟡';
  return null;
}

export default function JournalCalendar({
  currentMonth,
  selectedDate,
  calendarData,
  onDateSelect,
  onMonthChange,
}: JournalCalendarProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Build a lookup map from 'YYYY-MM-DD' → CalendarDay
  const dataMap = useMemo(() => {
    const m = new Map<string, CalendarDay>();
    calendarData.forEach(d => m.set(d.date, d));
    return m;
  }, [calendarData]);

  // Disable next-month navigation if that month starts in the future
  const nextMonthStart = new Date(year, month + 1, 1);
  const canGoNext = nextMonthStart <= today;

  const cells: React.ReactNode[] = [];

  // Empty leading cells
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(<div key={`pad-${i}`} />);
  }

  // Day buttons
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(year, month, day);
    const isFuture = cellDate > today;
    const isToday = cellDate.toDateString() === today.toDateString();
    const isSelected = cellDate.toDateString() === selectedDate.toDateString();
    const dateStr = toDateStr(year, month, day);
    const dayData = dataMap.get(dateStr);
    const marker = getMarker(dayData);

    cells.push(
      <button
        key={day}
        disabled={isFuture}
        onClick={() => onDateSelect(cellDate)}
        aria-label={`${dateStr}${isToday ? ' (today)' : ''}${isFuture ? ' (unavailable)' : ''}`}
        className={[
          'relative flex flex-col items-center justify-center rounded-xl transition-all duration-150 h-10 text-xs font-semibold select-none',
          isFuture
            ? 'opacity-20 cursor-not-allowed text-text-muted'
            : isSelected
            ? 'bg-interactive-primary text-white shadow-lg shadow-interactive-primary/30 scale-105'
            : isToday
            ? 'ring-2 ring-interactive-primary/70 text-interactive-primary hover:bg-interactive-primary/10'
            : 'text-text hover:bg-surface-bright cursor-pointer',
        ].join(' ')}
      >
        <span className="leading-none">{day}</span>
        {marker && (
          <span className="absolute bottom-0.5 text-[6px] leading-none">{marker}</span>
        )}
      </button>,
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-4 select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onMonthChange(new Date(year, month - 1, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-bright text-text-muted hover:text-text transition-all"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>

        <h3 className="font-heading font-semibold text-sm text-text tracking-tight">
          {MONTH_NAMES[month]} {year}
        </h3>

        <button
          onClick={() => canGoNext && onMonthChange(new Date(year, month + 1, 1))}
          disabled={!canGoNext}
          className={[
            'w-8 h-8 flex items-center justify-center rounded-xl transition-all',
            canGoNext
              ? 'hover:bg-surface-bright text-text-muted hover:text-text'
              : 'opacity-20 cursor-not-allowed text-text-muted',
          ].join(' ')}
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday header row */}
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {DAY_LABELS.map(d => (
          <div
            key={d}
            className="h-7 flex items-center justify-center text-[10px] font-semibold text-text-muted uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">{cells}</div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-border-structural flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <span>🟢</span> Journal
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <span>🟡</span> Mood
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <span>🟣</span> Both
        </span>
      </div>
    </div>
  );
}
