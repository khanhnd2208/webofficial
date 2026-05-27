'use client';

import type { DailyPuzzleLayout, PuzzleSolution } from '@/types/puzzle';
import { cellKey } from '@/lib/puzzle/cellKey';
import { hasWallLeft, hasWallRight, hasWallTop, hasWallBottom } from '@/lib/puzzle/layoutUtils';

export type EditorMode = 'walls' | 'blocked' | 'solution' | 'givens';

interface EditorBoardProps {
  layout: DailyPuzzleLayout;
  solution: PuzzleSolution;
  mode: EditorMode;
  selectedCell: string | null;
  onSelectCell: (key: string) => void;
  onToggleWallH: (row: number, col: number) => void;
  onToggleWallV: (row: number, col: number) => void;
}

export function EditorBoard({
  layout,
  solution,
  mode,
  selectedCell,
  onSelectCell,
  onToggleWallH,
  onToggleWallV,
}: EditorBoardProps) {
  const { size } = layout;

  return (
    <div className="inline-block">
      {Array.from({ length: size }, (_, row) => (
        <div key={row} className="flex items-stretch">
          {Array.from({ length: size }, (_, col) => {
            const key = cellKey(row, col);
            const blocked = layout.blocked[row][col];
            const val = solution[key];
            const isGiven = layout.givens[key] !== undefined;
            return (
              <div key={key} className="flex flex-col">
                {row === 0 && (
                  <button
                    type="button"
                    className="h-2 w-full bg-border/50 hover:bg-accent/40"
                    onClick={() => onToggleWallV(row, col)}
                    title="Toggle top wall"
                  />
                )}
                <div className="flex items-stretch">
                  {col === 0 && (
                    <button
                      type="button"
                      className="w-2 h-full bg-border/50 hover:bg-accent/40 shrink-0"
                      onClick={() => onToggleWallH(row, col)}
                      title="Toggle left wall"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectCell(key)}
                    className={[
                      'w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-sm font-bold border',
                      blocked ? 'bg-foreground/20' : 'bg-background',
                      selectedCell === key ? 'ring-2 ring-accent' : '',
                      isGiven ? 'ring-1 ring-foreground' : '',
                      hasWallLeft(layout, row, col) ? 'border-l-[3px] border-l-foreground' : '',
                      hasWallTop(layout, row, col) ? 'border-t-[3px] border-t-foreground' : '',
                      hasWallRight(layout, row, col) ? 'border-r-[3px] border-r-foreground' : '',
                      hasWallBottom(layout, row, col) ? 'border-b-[3px] border-b-foreground' : '',
                    ].join(' ')}
                  >
                    {!blocked && val !== undefined ? val : ''}
                  </button>
                  <button
                    type="button"
                    className="w-2 h-full bg-border/50 hover:bg-accent/40 shrink-0"
                    onClick={() => onToggleWallH(row, col + 1)}
                    title="Toggle vertical wall"
                  />
                </div>
                {row < size - 1 && (
                  <button
                    type="button"
                    className="h-2 w-full bg-border/50 hover:bg-accent/40"
                    onClick={() => onToggleWallV(row + 1, col)}
                    title="Toggle horizontal wall"
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
      <p className="text-xs text-muted-foreground mt-2">
        Mode: <strong>{mode}</strong> —{' '}
        {mode === 'walls' && 'Click edge bars to toggle walls'}
        {mode === 'blocked' && 'Click cell to toggle black'}
        {mode === 'solution' && 'Click cell then use number pad below'}
        {mode === 'givens' && 'Click solved cell to toggle given'}
      </p>
    </div>
  );
}
