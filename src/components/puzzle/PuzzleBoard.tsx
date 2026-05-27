'use client';

import { useMemo } from 'react';
import type { CompiledPuzzle } from '@/lib/puzzle/types';
import type { PuzzleNotes, PuzzleSolution } from '@/types/puzzle';
import { cellKey } from '@/lib/puzzle/cellKey';
import { hasWallLeft, hasWallRight, hasWallTop, hasWallBottom } from '@/lib/puzzle/layoutUtils';
import { PuzzleCell } from '@/components/puzzle/PuzzleCell';

interface PuzzleBoardProps {
  compiled: CompiledPuzzle;
  entries: PuzzleSolution;
  notes: PuzzleNotes;
  selectedCell: string | null;
  conflictCells: Set<string>;
  rejectPulse: number;
  onSelectCell: (key: string) => void;
  /** When false (idle), cells are not selectable for input. */
  inputEnabled?: boolean;
}

export function PuzzleBoard({
  compiled,
  entries,
  notes,
  selectedCell,
  conflictCells,
  rejectPulse,
  onSelectCell,
  inputEnabled = true,
}: PuzzleBoardProps) {
  const { layout } = compiled;
  const size = layout.size;
  const selectedMeta = selectedCell
    ? compiled.cells.flat().find((c) => c?.key === selectedCell)
    : null;
  const selectedValue = selectedCell ? entries[selectedCell] : undefined;

  const conflictSegmentIds = useMemo(() => {
    const h = new Set<string>();
    const v = new Set<string>();
    for (const key of conflictCells) {
      const meta = compiled.cells.flat().find((c) => c?.key === key);
      if (!meta) continue;
      if (meta.hSegmentId) h.add(meta.hSegmentId);
      if (meta.vSegmentId) v.add(meta.vSegmentId);
    }
    return { h, v };
  }, [conflictCells, compiled.cells]);

  return (
    <div
      className="inline-grid gap-0 border-[5px] border-foreground rounded-md overflow-hidden shadow-md"
      style={{
        gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
        width: 'min(100%, min(72vh, 560px))',
      }}
    >
      {Array.from({ length: size }, (_, row) =>
        Array.from({ length: size }, (_, col) => {
          const key = cellKey(row, col);
          const meta = compiled.cells[row][col];
          const isConflict = conflictCells.has(key);
          const segmentConflictTint = Boolean(
            !isConflict &&
              !meta.isBlocked &&
              ((meta.hSegmentId && conflictSegmentIds.h.has(meta.hSegmentId)) ||
                (meta.vSegmentId && conflictSegmentIds.v.has(meta.vSegmentId))),
          );

          return (
            <PuzzleCell
              key={key}
              value={entries[key]}
              notes={notes[key]}
              maxNoteValue={meta.maxAllowedValue ?? size}
              selected={inputEnabled && selectedCell === key}
              highlightH={
                !!selectedMeta?.hSegmentId &&
                meta.hSegmentId === selectedMeta.hSegmentId &&
                !meta.isBlocked
              }
              highlightV={
                !!selectedMeta?.vSegmentId &&
                meta.vSegmentId === selectedMeta.vSegmentId &&
                !meta.isBlocked
              }
              highlightSame={
                selectedValue !== undefined &&
                entries[key] === selectedValue &&
                selectedCell !== key &&
                !meta.isBlocked
              }
              segmentConflictTint={segmentConflictTint}
              given={meta.isGiven}
              blocked={meta.isBlocked}
              conflict={isConflict}
              shakeToken={
                inputEnabled && selectedCell === key ? rejectPulse : 0
              }
              borderLeft={hasWallLeft(layout, row, col)}
              borderTop={hasWallTop(layout, row, col)}
              borderRight={hasWallRight(layout, row, col)}
              borderBottom={hasWallBottom(layout, row, col)}
              onSelect={() => onSelectCell(key)}
            />
          );
        }),
      )}
    </div>
  );
}
