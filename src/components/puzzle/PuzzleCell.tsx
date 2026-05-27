'use client';

import type { PuzzleNotes } from '@/types/puzzle';

interface PuzzleCellProps {
  value: number | undefined;
  notes?: number[];
  maxNoteValue?: number;
  selected: boolean;
  highlightH: boolean;
  highlightV: boolean;
  highlightSame: boolean;
  segmentConflictTint: boolean;
  given: boolean;
  blocked: boolean;
  conflict: boolean;
  shakeToken: number;
  borderLeft: boolean;
  borderTop: boolean;
  borderRight: boolean;
  borderBottom: boolean;
  onSelect: () => void;
}

export function PuzzleCell({
  value,
  notes = [],
  maxNoteValue = 9,
  selected,
  highlightH,
  highlightV,
  highlightSame,
  segmentConflictTint,
  given,
  blocked,
  conflict,
  shakeToken,
  borderLeft,
  borderTop,
  borderRight,
  borderBottom,
  onSelect,
}: PuzzleCellProps) {
  if (blocked) {
    return (
      <div
        className={[
          'aspect-square bg-foreground/15',
          borderLeft ? 'border-l-[4px] border-l-foreground' : 'border-l border-l-border/50',
          borderTop ? 'border-t-[4px] border-t-foreground' : 'border-t border-t-border/50',
          borderRight ? 'border-r-[4px] border-r-foreground' : 'border-r border-r-border/50',
          borderBottom ? 'border-b-[4px] border-b-foreground' : 'border-b border-b-border/50',
        ].join(' ')}
        aria-hidden
      />
    );
  }

  const segmentHighlight = highlightH || highlightV;
  const bg = conflict
    ? 'bg-red-500/12'
    : selected
      ? 'bg-sky-500/15 dark:bg-sky-400/15'
      : segmentConflictTint
        ? 'bg-red-500/5'
        : segmentHighlight
          ? 'bg-amber-400/12 dark:bg-amber-500/10'
          : highlightSame
            ? 'bg-sky-500/6'
            : 'bg-background';

  const ring = conflict
    ? 'ring-2 ring-inset ring-red-600 dark:ring-red-400'
    : selected
      ? 'ring-2 ring-inset ring-sky-600 dark:ring-sky-400'
      : '';

  const displayNotes = value === undefined ? notes : [];

  const shake = shakeToken > 0;

  return (
    <button
      key={shake ? `shake-${shakeToken}` : 'cell'}
      type="button"
      onClick={onSelect}
      disabled={given}
      aria-pressed={selected}
      aria-label={
        value !== undefined
          ? `Ô ${value}${given ? ', cho sẵn' : ''}${conflict ? ', trùng đoạn' : ''}`
          : displayNotes.length > 0
            ? `Ô ghi chú ${displayNotes.join(', ')}`
            : 'Ô trống'
      }
      className={[
        'aspect-square flex items-center justify-center relative transition-colors duration-150',
        bg,
        ring,
        shake ? 'animate-puzzle-shake' : '',
        borderLeft ? 'border-l-[4px] border-l-foreground' : 'border-l border-l-border/50',
        borderTop ? 'border-t-[4px] border-t-foreground' : 'border-t border-t-border/50',
        borderRight ? 'border-r-[4px] border-r-foreground' : 'border-r border-r-border/50',
        borderBottom ? 'border-b-[4px] border-b-foreground' : 'border-b border-b-border/50',
        given ? 'cursor-default' : 'cursor-pointer hover:bg-surface-elevated/90',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0',
      ].join(' ')}
    >
      {value !== undefined ? (
        <span
          className={[
            'text-lg sm:text-xl font-bold tabular-nums',
            given ? 'text-foreground' : 'text-accent',
            conflict ? 'text-red-600 dark:text-red-400' : '',
          ].join(' ')}
        >
          {value}
        </span>
      ) : displayNotes.length > 0 ? (
        <span
          className="grid grid-cols-3 gap-px p-0.5 w-full h-full text-[8px] sm:text-[9px] text-muted-foreground font-semibold leading-none"
          aria-hidden
        >
          {Array.from({ length: Math.min(maxNoteValue, 9) }, (_, i) => {
            const n = i + 1;
            return (
              <span
                key={n}
                className={[
                  'flex items-center justify-center min-h-0',
                  displayNotes.includes(n) ? 'text-foreground/80' : 'text-transparent select-none',
                ].join(' ')}
              >
                {n}
              </span>
            );
          })}
        </span>
      ) : null}
      {conflict && (
        <span
          className="absolute top-0.5 right-0.5 text-[9px] font-bold text-red-600 dark:text-red-400 leading-none"
          aria-hidden
        >
          !
        </span>
      )}
    </button>
  );
}
