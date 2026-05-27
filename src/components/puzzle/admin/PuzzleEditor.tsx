'use client';

import { useCallback, useMemo, useState } from 'react';
import type { DailyPuzzleLayout, PuzzleSolution } from '@/types/puzzle';
import { ensureOuterWalls, hasWallLeft, hasWallTop } from '@/lib/puzzle/layoutUtils';
import { parseLayoutJson } from '@/lib/puzzle/serializer';
import { compilePuzzle } from '@/lib/puzzle/compiler';
import { validateLayout, validateGivens, validateFullSolution } from '@/lib/puzzle/validator';
import { EditorBoard, type EditorMode } from '@/components/puzzle/admin/EditorBoard';

interface PuzzleEditorProps {
  puzzleId: string;
  initialLayout: unknown;
  initialSolution: unknown;
  initialStatus: string;
  initialTitle: string;
  initialDateKey: string;
}

export function PuzzleEditor({
  puzzleId,
  initialLayout,
  initialSolution,
  initialStatus,
  initialTitle,
  initialDateKey,
}: PuzzleEditorProps) {
  const [layout, setLayout] = useState<DailyPuzzleLayout>(() => parseLayoutJson(initialLayout));
  const [solution, setSolution] = useState<PuzzleSolution>(
    () => (initialSolution as PuzzleSolution) ?? {},
  );
  const [mode, setMode] = useState<EditorMode>('solution');
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [validation, setValidation] = useState<{
    valid: boolean;
    errors: string[];
    solutionCount?: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const compiled = useMemo(() => compilePuzzle(layout), [layout]);

  const layoutStatus = useMemo(() => validateLayout(layout), [layout]);
  const givensStatus = useMemo(() => validateGivens(compiled), [compiled]);
  const solutionStatus = useMemo(
    () => validateFullSolution(solution, layout),
    [solution, layout],
  );

  const saveDraft = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    ensureOuterWalls(layout);
    const res = await fetch(`/api/admin/puzzles/${puzzleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        layoutJson: layout,
        solutionJson: solution,
        status: 'DRAFT',
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!json.ok) {
      setMessage(json.error);
      return;
    }
    setStatus('DRAFT');
    setMessage('Đã lưu draft.');
  }, [puzzleId, layout, solution]);

  const runValidate = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/admin/puzzles/${puzzleId}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layoutJson: layout, solutionJson: solution }),
    });
    const json = await res.json();
    setSaving(false);
    if (!json.ok) {
      setMessage(json.error);
      return;
    }
    setValidation(json.data);
    if (json.data.valid) {
      setStatus('VALIDATED');
      setMessage('Puzzle validated — unique solution OK.');
    } else {
      setMessage(json.data.errors?.join('; ') ?? 'Validation failed');
    }
  }, [puzzleId, layout, solution]);

  const publish = useCallback(async () => {
    if (status !== 'VALIDATED') {
      setMessage('Validate puzzle trước khi publish.');
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/admin/puzzles/${puzzleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PUBLISHED' }),
    });
    const json = await res.json();
    setSaving(false);
    if (!json.ok) {
      setMessage(json.error);
      return;
    }
    setStatus('PUBLISHED');
    setMessage('Đã publish puzzle.');
  }, [puzzleId, status]);

  const onSelectCell = (key: string) => {
    setSelectedCell(key);
    const [r, c] = key.split(',').map(Number);
    if (mode === 'blocked') {
      setLayout((prev) => {
        const next = { ...prev, blocked: prev.blocked.map((row) => [...row]) };
        next.blocked[r][c] = !next.blocked[r][c];
        return next;
      });
    } else if (mode === 'givens') {
      if (solution[key] === undefined) return;
      setLayout((prev) => {
        const givens = { ...prev.givens };
        if (givens[key] !== undefined) delete givens[key];
        else givens[key] = solution[key];
        return { ...prev, givens };
      });
    }
  };

  const setSolutionValue = (n: number) => {
    if (!selectedCell) return;
    const [r, c] = selectedCell.split(',').map(Number);
    if (layout.blocked[r][c]) return;
    setSolution((prev) => ({ ...prev, [selectedCell]: n }));
  };

  /** Toggle vertical wall on left of (row,col) — index verticalWalls[row][col] */
  const toggleWallH = (row: number, col: number) => {
    if (mode !== 'walls') return;
    if (col <= 0 || col > layout.size) return;
    setLayout((prev) => {
      const next = { ...prev, verticalWalls: prev.verticalWalls.map((r) => [...r]) };
      next.verticalWalls[row][col] = !hasWallLeft(next, row, col);
      ensureOuterWalls(next);
      return next;
    });
  };

  /** Toggle horizontal wall on top of (row,col) — index horizontalWalls[row][col] */
  const toggleWallV = (row: number, col: number) => {
    if (mode !== 'walls') return;
    if (row <= 0 || row > layout.size) return;
    setLayout((prev) => {
      const next = { ...prev, horizontalWalls: prev.horizontalWalls.map((r) => [...r]) };
      next.horizontalWalls[row][col] = !hasWallTop(next, row, col);
      ensureOuterWalls(next);
      return next;
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-4">
        <div className="flex flex-wrap gap-2">
          {(['walls', 'blocked', 'solution', 'givens'] as EditorMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                mode === m ? 'bg-foreground text-background' : 'border-border'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <EditorBoard
          layout={layout}
          solution={solution}
          mode={mode}
          selectedCell={selectedCell}
          onSelectCell={onSelectCell}
          onToggleWallH={toggleWallH}
          onToggleWallV={toggleWallV}
        />

        {mode === 'solution' && (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: layout.size }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSolutionValue(n)}
                className="w-10 h-10 rounded-full border border-border font-bold hover:bg-accent hover:text-background"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => selectedCell && setSolution((p) => { const n = { ...p }; delete n[selectedCell]; return n; })}
              className="px-3 text-xs font-bold uppercase text-muted-foreground"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <aside className="w-full lg:w-80 space-y-4 shrink-0">
        <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
          <h2 className="font-bold">{initialTitle}</h2>
          <p className="text-muted-foreground">{initialDateKey}</p>
          <p>
            Status: <strong>{status}</strong>
          </p>
        </div>

        <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
          <p>Layout: {layoutStatus ? `❌ ${layoutStatus}` : '✅ OK'}</p>
          <p>Givens: {givensStatus ? `❌ ${givensStatus}` : '✅ OK'}</p>
          <p>Solution: {solutionStatus ? `❌ ${solutionStatus}` : '✅ OK'}</p>
          {validation && (
            <p>
              Unique: {validation.valid ? '✅ 1 solution' : `❌ ${validation.errors.join(', ')}`}
              {validation.solutionCount !== undefined && ` (${validation.solutionCount})`}
            </p>
          )}
        </div>

        {message && (
          <p className="text-sm p-3 rounded-lg border border-border bg-surface-elevated">{message}</p>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={saveDraft}
            className="py-2 rounded-full border border-border font-bold text-sm uppercase tracking-wider"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={runValidate}
            className="py-2 rounded-full bg-accent text-background font-bold text-sm uppercase tracking-wider"
          >
            Validate (Solver)
          </button>
          <button
            type="button"
            disabled={saving || status !== 'VALIDATED'}
            onClick={publish}
            className="py-2 rounded-full bg-foreground text-background font-bold text-sm uppercase tracking-wider disabled:opacity-40"
          >
            Publish
          </button>
        </div>
      </aside>
    </div>
  );
}
