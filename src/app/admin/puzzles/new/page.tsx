'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPuzzlePage() {
  const router = useRouter();
  const [dateKey, setDateKey] = useState('');
  const [title, setTitle] = useState('');
  const [size, setSize] = useState(4);
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { createEmptyLayout } = await import('@/lib/puzzle/layoutUtils');
    const layout = createEmptyLayout(size);

    const res = await fetch('/api/admin/puzzles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateKey,
        title,
        layout,
        solution: {},
        difficulty,
        status: 'DRAFT',
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) {
      setError(json.error);
      return;
    }
    router.push(`/admin/puzzles/${json.data.id}/edit`);
  }

  return (
    <div className="p-8 max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Tạo puzzle mới</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm">
          dateKey
          <input
            className="mt-1 w-full border border-border rounded px-3 py-2 bg-background"
            value={dateKey}
            onChange={(e) => setDateKey(e.target.value)}
            required
            placeholder="2026-05-26"
          />
        </label>
        <label className="block text-sm">
          Tiêu đề
          <input
            className="mt-1 w-full border border-border rounded px-3 py-2 bg-background"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Size
          <select
            className="mt-1 w-full border border-border rounded px-3 py-2 bg-background"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          >
            {[3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n}×{n}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Độ khó
          <select
            className="mt-1 w-full border border-border rounded px-3 py-2 bg-background"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
          >
            <option value="EASY">EASY</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HARD">HARD</option>
          </select>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-full bg-accent text-background font-bold uppercase tracking-wider disabled:opacity-50"
        >
          Tạo & mở editor
        </button>
      </form>
    </div>
  );
}
