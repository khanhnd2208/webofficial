'use client';

import { ShareResult } from '@/components/puzzle/ShareResult';

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

interface PuzzleSolvedModalProps {
  durationMs: number;
  mistakes: number;
  streak: number;
  rank: number | null;
  shareText: string;
  onViewLeaderboard: () => void;
}

export function PuzzleSolvedModal({
  durationMs,
  mistakes,
  streak,
  rank,
  shareText,
  onViewLeaderboard,
}: PuzzleSolvedModalProps) {
  return (
    <div
      className="w-full max-w-md rounded-2xl border-2 border-accent/40 bg-surface-elevated p-6 space-y-4 shadow-lg"
      role="status"
      aria-live="polite"
    >
      <p className="text-2xl font-bold text-center text-accent">Hoàn thành!</p>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground text-xs uppercase tracking-wider">Thời gian</dt>
          <dd className="font-bold text-lg tabular-nums">{formatDuration(durationMs)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs uppercase tracking-wider">Lỗi</dt>
          <dd className="font-bold text-lg">{mistakes}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs uppercase tracking-wider">Streak</dt>
          <dd className="font-bold text-lg">{streak} ngày 🔥</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs uppercase tracking-wider">Hôm nay</dt>
          <dd className="font-bold text-lg">{rank != null ? `#${rank}` : '—'}</dd>
        </div>
      </dl>
      <ShareResult shareText={shareText} />
      <button
        type="button"
        onClick={onViewLeaderboard}
        className="w-full py-2.5 rounded-full border border-border font-bold text-sm uppercase tracking-wider hover:bg-surface-elevated"
      >
        Xem bảng xếp hạng
      </button>
    </div>
  );
}
