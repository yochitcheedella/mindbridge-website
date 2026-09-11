import React from 'react';

export const MOODS = [
  { score: '5', emoji: '😊', label: 'Thriving' },
  { score: '4', emoji: '😌', label: 'Calm' },
  { score: '3', emoji: '😐', label: 'Balanced' },
  { score: '2', emoji: '😔', label: 'Stressed' },
  { score: '1', emoji: '😢', label: 'Overwhelmed' },
] as const;

export type MoodScore = (typeof MOODS)[number]['score'];

interface MoodSelectorProps {
  value: string | null;
  onChange: (score: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

export default function MoodSelector({ value, onChange, disabled = false, compact = false }: MoodSelectorProps) {
  return (
    <div className={`flex items-start justify-center gap-1 ${compact ? 'gap-0.5' : 'gap-2 py-1'}`}>
      {MOODS.map(m => {
        const isSelected = value === m.score;
        return (
          <button
            key={m.score}
            disabled={disabled}
            onClick={() => !disabled && onChange(m.score)}
            title={m.label}
            aria-label={`Mood: ${m.label}`}
            className={[
              'flex flex-col items-center gap-1 rounded-xl transition-all duration-200',
              compact ? 'p-1.5' : 'p-2.5 min-w-[52px]',
              disabled ? 'cursor-default' : 'cursor-pointer hover:bg-surface-bright',
              isSelected
                ? 'bg-interactive-primary/20 ring-2 ring-interactive-primary/50 scale-110'
                : '',
            ].join(' ')}
          >
            <span className={compact ? 'text-xl leading-none' : 'text-2xl leading-none'}>
              {m.emoji}
            </span>
            {!compact && (
              <span
                className={`text-[9px] font-semibold leading-tight text-center ${
                  isSelected ? 'text-interactive-primary' : 'text-text-muted'
                }`}
              >
                {m.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
