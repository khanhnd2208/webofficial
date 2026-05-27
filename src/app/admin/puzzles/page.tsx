'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface PuzzleRow {
  id: string;
  dateKey: string;
  title: string;
  size: number;
  difficulty: string;
  status: string;
}

export default function AdminPuzzlesPage() {
  const [puzzles, setPuzzles] = useState<PuzzleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/puzzles');
    const json = await res.json();
    if (json.ok) setPuzzles(json.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">ThinkGrid — Puzzles</h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý daily logic puzzles</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/puzzle"
            className="text-sm text-accent hover:underline"
          >
            Xem trang chơi
          </Link>
          <Link
            href="/admin/puzzles/new"
            className="px-4 py-2 rounded-full bg-accent text-background text-sm font-bold uppercase tracking-wider"
          >
            Tạo mới
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Đang tải...</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 pr-4">Ngày</th>
              <th className="py-2 pr-4">Tiêu đề</th>
              <th className="py-2 pr-4">Size</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {puzzles.map((p) => (
              <tr key={p.id} className="border-b border-border">
                <td className="py-2 pr-4 font-mono">{p.dateKey}</td>
                <td className="py-2 pr-4">{p.title}</td>
                <td className="py-2 pr-4">{p.size}×{p.size}</td>
                <td className="py-2 pr-4">
                  <span
                    className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                      p.status === 'PUBLISHED'
                        ? 'bg-accent/20 text-accent'
                        : p.status === 'VALIDATED'
                          ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                          : 'bg-surface-elevated'
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="py-2">
                  <Link href={`/admin/puzzles/${p.id}/edit`} className="text-accent hover:underline text-xs font-bold uppercase">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="text-xs text-muted-foreground">
        Seed dev (wipe):{' '}
        <code className="font-mono">PUZZLE_SEED_CONFIRM=WipeAll npm run db:seed:puzzle:dev</code>
        {' · '}
        Prod-safe: <code className="font-mono">npm run db:seed:puzzle:future</code>
      </p>
    </div>
  );
}
