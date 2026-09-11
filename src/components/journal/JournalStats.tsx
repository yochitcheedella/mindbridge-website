import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/auth';

interface Stats {
  total_entries: number;
  streak_days: number;
  days_logged_this_month: number;
  total_words: number;
}

interface JournalStatsProps {
  /** Bump to re-fetch after saves/deletes. */
  refreshKey: number;
}

export default function JournalStats({ refreshKey }: JournalStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    apiFetch('/api/journal/stats')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data && typeof data.total_entries === 'number') setStats(data);
      })
      .catch(() => {});
  }, [refreshKey]);

  if (!stats) return null;

  const items = [
    { icon: '📝', value: String(stats.total_entries), label: 'Total Entries' },
    {
      icon: '🔥',
      value: `${stats.streak_days} ${stats.streak_days === 1 ? 'day' : 'days'}`,
      label: 'Current Streak',
    },
    {
      icon: '📅',
      value: String(stats.days_logged_this_month),
      label: 'This Month',
    },
    {
      icon: '✍️',
      value: stats.total_words >= 1000
        ? `${(stats.total_words / 1000).toFixed(1)}k`
        : String(stats.total_words),
      label: 'Total Words',
    },
  ];

  return (
    <div className="glass-panel rounded-2xl px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 animate-fade-in">
      {items.map((item, idx) => (
        <React.Fragment key={item.label}>
          {idx > 0 && (
            <div className="hidden sm:block w-px h-7 bg-border-structural" />
          )}
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">{item.icon}</span>
            <div>
              <p className="text-xs font-bold text-text leading-tight">{item.value}</p>
              <p className="text-[10px] text-text-muted leading-tight">{item.label}</p>
            </div>
          </div>
        </React.Fragment>
      ))}

      {stats.streak_days >= 3 && (
        <>
          <div className="hidden sm:block w-px h-7 bg-border-structural" />
          <p className="text-[11px] text-text-muted font-medium">
            ⭐ {stats.streak_days >= 7 ? 'Amazing streak — keep going!' : 'You\'re building a great habit!'}
          </p>
        </>
      )}
    </div>
  );
}
