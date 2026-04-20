'use client';

import { useEffect, useState } from 'react';

type Entry = { rank: number; userId: string; userName: string; score: number; updatedAt: string };
type LeaderboardData = { MCQ: Entry[]; FILL_BLANK: Entry[]; MATCHING: Entry[]; GUESS_WHO: Entry[] };

const MODES = [
  { key: 'MCQ' as const, label: 'Trắc nghiệm', color: 'text-success', bg: 'bg-success' },
  { key: 'FILL_BLANK' as const, label: 'Điền từ', color: 'text-indigo', bg: 'bg-indigo' },
  { key: 'MATCHING' as const, label: 'Nối từ', color: 'text-purple', bg: 'bg-purple' },
  { key: 'GUESS_WHO' as const, label: 'Guess Who', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-600' },
];

export default function LeaderboardPanel({ vocabSetId }: { vocabSetId: string }) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [activeMode, setActiveMode] = useState<keyof LeaderboardData>('MCQ');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/vocab-sets/${vocabSetId}/leaderboard`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setData(json.data.leaderboard);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [vocabSetId]);

  const activeMeta = MODES.find((m) => m.key === activeMode)!;
  const entries = data?.[activeMode] ?? [];

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <svg className="h-4 w-4 text-warning" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Bảng xếp hạng</h3>
      </div>

      {/* Mode tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {MODES.map((mode) => (
          <button
            key={mode.key}
            onClick={() => setActiveMode(mode.key)}
            className={`flex-1 min-w-fit px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-colors whitespace-nowrap ${
              activeMode === mode.key
                ? `${mode.color} border-b-2 border-current bg-surface-hover`
                : 'text-muted hover:text-foreground'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="divide-y divide-border">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-muted">Chưa có điểm nào</p>
            <p className="mt-1 text-[10px] text-muted/60">Hãy là người đầu tiên!</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.userId} className="flex items-center gap-3 px-4 py-2.5">
              {/* Rank badge */}
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                entry.rank === 2 ? 'bg-zinc-300 text-zinc-700' :
                entry.rank === 3 ? 'bg-orange-400 text-orange-900' :
                'bg-surface-hover text-muted'
              }`}>
                {entry.rank <= 3 ? ['🥇','🥈','🥉'][entry.rank - 1] : entry.rank}
              </div>

              {/* Name */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-foreground">{entry.userName}</p>
              </div>

              {/* Score */}
              <span className={`text-sm font-black tabular-nums ${activeMeta.color}`}>
                {Math.round(entry.score).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
