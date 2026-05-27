'use client';

import type { PuzzleStatsPublic } from '@/types/puzzle';

interface PuzzleStatsCardProps {
  stats: PuzzleStatsPublic | null;
}

export function PuzzleStatsCard({ stats }: PuzzleStatsCardProps) {
  if (!stats) return null;

  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-4 space-y-2 text-sm">
      <h3 className="font-bold uppercase tracking-wider text-xs text-muted-foreground">
        Thống kê của bạn
      </h3>
      <div className="flex flex-wrap gap-4">
        <div>
          <span className="text-2xl font-bold text-accent">{stats.currentStreak}</span>
          <span className="block text-muted-foreground text-xs">Streak</span>
        </div>
        <div>
          <span className="text-2xl font-bold">{stats.longestStreak}</span>
          <span className="block text-muted-foreground text-xs">Kỷ lục</span>
        </div>
        <div>
          <span className="text-2xl font-bold">{stats.totalSolved}</span>
          <span className="block text-muted-foreground text-xs">Đã giải</span>
        </div>
      </div>
      {stats.todaySolved && (
        <p className="text-accent font-medium">Đã hoàn thành puzzle hôm nay</p>
      )}
    </div>
  );
}
