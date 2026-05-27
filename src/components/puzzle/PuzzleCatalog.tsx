'use client';

import { useEffect, useState } from 'react';
import type { PuzzleCatalogEntry } from '@/types/puzzle';

interface PuzzleCatalogProps {
  selectedPuzzleId: string | null;
  onSelect: (puzzleId: string) => void;
}

function statusLabel(status: PuzzleCatalogEntry['attemptStatus']): string {
  if (status === 'SOLVED') return 'Đã hoàn thành';
  if (status === 'IN_PROGRESS') return 'Đang chơi dở';
  return 'Chưa chơi';
}

function difficultyTone(d: PuzzleCatalogEntry['difficulty']): string {
  if (d === 'EASY') return 'text-emerald-600 dark:text-emerald-400';
  if (d === 'HARD') return 'text-red-600 dark:text-red-400';
  return 'text-amber-600 dark:text-amber-400';
}

export function PuzzleCatalog({ selectedPuzzleId, onSelect }: PuzzleCatalogProps) {
  const [puzzles, setPuzzles] = useState<PuzzleCatalogEntry[]>([]);
  const [todayDateKey, setTodayDateKey] = useState<string | null>(null);
  const [featured8x8Id, setFeatured8x8Id] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missing8x8, setMissing8x8] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [catRes, healthRes] = await Promise.all([
          fetch('/api/puzzle/catalog'),
          fetch('/api/puzzle/health'),
        ]);
        const json = await catRes.json();
        const health = await healthRes.json();

        if (!json.ok) {
          if (!cancelled) setError(json.error ?? 'Không tải được danh sách');
          return;
        }
        if (!cancelled) {
          setPuzzles(json.data.puzzles as PuzzleCatalogEntry[]);
          setTodayDateKey(json.data.todayDateKey ?? null);
          setFeatured8x8Id(json.data.featured8x8PuzzleId ?? null);
          setMissing8x8(Boolean(json.data.diagnostics?.missing8x8));
          const empty = (json.data.puzzles as PuzzleCatalogEntry[]).length === 0;
          setSetupRequired(
            empty || Boolean(json.data.diagnostics?.setupRequired) || !health.data?.ready,
          );
        }
      } catch {
        if (!cancelled) setError('Lỗi mạng — kiểm tra server và DATABASE_URL');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground text-center py-6">Đang tải câu đố…</p>;
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 dark:text-red-400 text-center py-4 space-y-2">
        <p>{error}</p>
        <p className="text-muted-foreground text-xs">
          Admin: chạy <code className="font-mono">npm run db:puzzle:reset</code> trên DB của app.
        </p>
      </div>
    );
  }

  if (puzzles.length === 0 || setupRequired) {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-6 text-center space-y-3 max-w-md mx-auto">
        <p className="font-semibold text-amber-900 dark:text-amber-100">Chưa có câu đố để chơi</p>
        <p className="text-sm text-muted-foreground">
          Cơ sở dữ liệu chưa có puzzle đã publish (hoặc chưa migrate). Trên máy dev chạy:
        </p>
        <pre className="text-left text-xs font-mono bg-background/80 rounded-lg p-3 overflow-x-auto">
          npm run db:puzzle:reset
        </pre>
        <p className="text-xs text-muted-foreground">
          Sau đó tải lại trang <strong>/puzzle</strong>.
        </p>
      </div>
    );
  }

  const featured = featured8x8Id ? puzzles.find((p) => p.id === featured8x8Id) : null;

  return (
    <div className="w-full max-w-lg space-y-4 mx-auto">
      {featured && (
        <button
          type="button"
          onClick={() => onSelect(featured.id)}
          className="w-full rounded-xl border-2 border-sky-500/60 bg-sky-500/10 p-4 text-left hover:bg-sky-500/15 transition-colors"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
            Mới — thử ngay
          </p>
          <p className="text-xl font-bold mt-1">{featured.title}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {featured.size}×{featured.size} · {featured.difficulty} · 4 góc 4×4
          </p>
        </button>
      )}

      {missing8x8 && !featured && (
        <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-center">
          Câu <strong>8×8</strong> chưa có trong DB. Chạy{' '}
          <code className="text-xs font-mono">npm run db:puzzle:reset</code>.
        </p>
      )}

      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold">Tất cả câu đố ({puzzles.length})</h2>
        <p className="text-sm text-muted-foreground">
          Chọn bất kỳ câu nào để chơi.
          {todayDateKey ? <> Câu {todayDateKey} có nhãn «Hôm nay».</> : null}
        </p>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {puzzles.map((p) => {
          const selected = p.id === selectedPuzzleId;
          const is8x8 = p.size === 8;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSelect(p.id)}
                className={[
                  'w-full text-left rounded-xl border p-4 transition-colors min-h-[44px]',
                  selected
                    ? 'border-accent bg-accent/10 ring-2 ring-accent/40'
                    : 'border-border bg-surface-elevated hover:border-accent/50 hover:bg-accent/5',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-2xl font-bold tabular-nums">
                    {p.size}×{p.size}
                  </span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {p.isToday && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                        Hôm nay
                      </span>
                    )}
                    {is8x8 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300">
                        8×8
                      </span>
                    )}
                    {p.puzzleKind === 'TUTORIAL' && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Hướng dẫn
                      </span>
                    )}
                  </div>
                </div>
                <p className="font-semibold mt-2 leading-snug">{p.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={difficultyTone(p.difficulty)}>{p.difficulty}</span>
                  {' · '}
                  {statusLabel(p.attemptStatus)}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
