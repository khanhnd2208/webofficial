'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PuzzleEditor } from '@/components/puzzle/admin/PuzzleEditor';

export default function EditPuzzlePage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [data, setData] = useState<{
    layoutJson: unknown;
    solutionJson: unknown;
    status: string;
    title: string;
    dateKey: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/puzzles/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) {
          setError(json.error);
          return;
        }
        setData(json.data);
      });
  }, [id]);

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">{error}</p>
        <Link href="/admin/puzzles" className="text-accent underline text-sm mt-4 inline-block">
          Quay lại
        </Link>
      </div>
    );
  }

  if (!id || !data) {
    return <div className="p-8 text-muted-foreground">Đang tải editor...</div>;
  }

  return (
    <div className="p-8 space-y-4">
      <Link href="/admin/puzzles" className="text-sm text-accent hover:underline">
        ← Danh sách puzzles
      </Link>
      <PuzzleEditor
        puzzleId={id}
        initialLayout={data.layoutJson}
        initialSolution={data.solutionJson}
        initialStatus={data.status}
        initialTitle={data.title}
        initialDateKey={data.dateKey}
      />
    </div>
  );
}
