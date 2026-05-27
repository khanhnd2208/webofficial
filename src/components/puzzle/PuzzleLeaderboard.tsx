'use client';

import type { LeaderboardEntryPublic } from '@/types/puzzle';
import { formatDuration } from '@/lib/puzzle/scoring';

interface PuzzleLeaderboardProps {
  entries: LeaderboardEntryPublic[];
  dateKey?: string;
  highlightUserId?: string | null;
}

export function PuzzleLeaderboard({ entries, dateKey, highlightUserId }: PuzzleLeaderboardProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Chưa có ai hoàn thành{dateKey ? ` (${dateKey})` : ''}.
      </p>
    );
  }

  return (
    <ol className="space-y-2">
      {entries.map((e) => (
        <li
          key={`${e.userId}-${e.rank}`}
          className={[
            'flex items-center justify-between gap-2 text-sm border-b border-border pb-2 last:border-0 rounded-md px-1 -mx-1',
            highlightUserId && e.userId === highlightUserId
              ? 'bg-accent/10 border-accent/30'
              : '',
          ].join(' ')}
        >
          <span className="font-bold w-6 text-accent">#{e.rank}</span>
          <span className="flex-1 truncate">{e.userName}</span>
          <span className="font-mono tabular-nums">{formatDuration(e.durationMs)}</span>
          <span className="text-muted-foreground text-xs w-8 text-right">{e.mistakes}L</span>
        </li>
      ))}
    </ol>
  );
}
