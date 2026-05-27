'use client';

import { formatDuration } from '@/lib/puzzle/scoring';

interface PuzzleTimerProps {
  elapsedMs: number;
  running?: boolean;
}

export function PuzzleTimer({ elapsedMs, running }: PuzzleTimerProps) {
  return (
    <div className="flex items-center gap-2 font-mono text-lg tabular-nums">
      <span
        className={`inline-block w-2 h-2 rounded-full ${running ? 'bg-accent animate-pulse' : 'bg-muted-foreground'}`}
        aria-hidden
      />
      <span>{formatDuration(elapsedMs)}</span>
    </div>
  );
}
