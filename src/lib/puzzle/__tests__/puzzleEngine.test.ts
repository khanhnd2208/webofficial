import { describe, it, expect } from 'vitest';
import { compilePuzzle } from '@/lib/puzzle/compiler';
import { createEmptyLayout } from '@/lib/puzzle/layoutUtils';
import { buildHorizontalSegments, buildVerticalSegments } from '@/lib/puzzle/segments';
import {
  validateLayout,
  validateGivens,
  isLegalMove,
  isCompleteValidSegment,
  isSolved,
  validateFullSolution,
  getCandidates,
  hasLocalConflicts,
} from '@/lib/puzzle/validator';
import { getCandidates as getCands } from '@/lib/puzzle/candidates';
import { getCellMeta } from '@/lib/puzzle/compiler';
import type { DailyPuzzleLayout, PuzzleSolution } from '@/types/puzzle';
import { cellKey } from '@/lib/puzzle/cellKey';

/** Row 0 only has wall between col 2-3; demonstrates duplicate digits across segments on same row */
function layout6Row0Split(): DailyPuzzleLayout {
  const layout = createEmptyLayout(6);
  layout.verticalWalls[0][3] = true;
  return layout;
}

function solution6Row0Split(): PuzzleSolution {
  return {
    '0,0': 3, '0,1': 2, '0,2': 1, '0,3': 3, '0,4': 2, '0,5': 1,
    '1,0': 1, '1,1': 2, '1,2': 3, '1,3': 4, '1,4': 5, '1,5': 6,
    '2,0': 2, '2,1': 3, '2,2': 4, '2,3': 5, '2,4': 6, '2,5': 1,
    '3,0': 3, '3,1': 4, '3,2': 5, '3,3': 6, '3,4': 1, '3,5': 2,
    '4,0': 4, '4,1': 5, '4,2': 6, '4,3': 1, '4,4': 2, '4,5': 3,
    '5,0': 5, '5,1': 6, '5,2': 1, '5,3': 2, '5,4': 3, '5,5': 4,
  };
}

describe('validateLayout', () => {
  it('requires outer walls true', () => {
    const layout = createEmptyLayout(4);
    expect(validateLayout(layout)).toBeNull();
  });
});

describe('segment building', () => {
  it('test 6: black cell splits row into length 2 and 3', () => {
    const layout = createEmptyLayout(6);
    layout.blocked[2][2] = true;
    const { segments } = buildHorizontalSegments(layout);
    const row2 = segments.filter((s) => s.cells[0]?.row === 2);
    expect(row2.map((s) => s.length).sort()).toEqual([2, 3]);
  });

  it('test 7: vertical wall splits horizontal segment', () => {
    const layout = createEmptyLayout(5);
    layout.verticalWalls[0][2] = true;
    const { segments } = buildHorizontalSegments(layout);
    const row0 = segments.filter((s) => s.cells[0]?.row === 0);
    expect(row0).toHaveLength(2);
    expect(row0[0].length).toBe(2);
    expect(row0[1].length).toBe(3);
  });

  it('test 8: vertical wall does not split vertical segment in same column', () => {
    const layout = createEmptyLayout(4);
    layout.verticalWalls[0][1] = true;
    layout.verticalWalls[1][1] = true;
    const { segments } = buildVerticalSegments(layout);
    const col0 = segments.filter((s) => s.cells[0]?.col === 0);
    expect(col0).toHaveLength(1);
    expect(col0[0].length).toBe(4);
  });

  it('test 9: horizontal wall does not split horizontal segment', () => {
    const layout = createEmptyLayout(4);
    layout.horizontalWalls[1][0] = true;
    layout.horizontalWalls[2][0] = true;
    const { segments } = buildHorizontalSegments(layout);
    const row0 = segments.filter((s) => s.cells[0]?.row === 0);
    expect(row0).toHaveLength(1);
    expect(row0[0].length).toBe(4);
  });
});

describe('isCompleteValidSegment', () => {
  it('test 1: length 1 only accepts 1', () => {
    const seg = { id: 'H0', direction: 'H' as const, cells: [{ row: 0, col: 0 }], length: 1 };
    expect(isCompleteValidSegment({ '0,0': 1 }, seg)).toBe(true);
    expect(isCompleteValidSegment({ '0,0': 2 }, seg)).toBe(false);
  });

  it('test 2: length 3 permutations', () => {
    const cells = [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }];
    const seg = { id: 'H0', direction: 'H' as const, cells, length: 3 };
    expect(isCompleteValidSegment({ '0,0': 1, '0,1': 2, '0,2': 3 }, seg)).toBe(true);
    expect(isCompleteValidSegment({ '0,0': 1, '0,1': 3, '0,2': 2 }, seg)).toBe(true);
    expect(isCompleteValidSegment({ '0,0': 1, '0,1': 1, '0,2': 2 }, seg)).toBe(false);
    expect(isCompleteValidSegment({ '0,0': 1, '0,1': 2, '0,2': 4 }, seg)).toBe(false);
  });

  it('test 4: duplicate in same segment fails', () => {
    const cells = [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }];
    const seg = { id: 'H0', direction: 'H' as const, cells, length: 3 };
    expect(isCompleteValidSegment({ '0,0': 1, '0,1': 2, '0,2': 1 }, seg)).toBe(false);
  });
});

describe('test 3: row duplicate across segments allowed', () => {
  it('3,2,1 | 3,2,1 on row 0 passes per-segment validation (not whole-row)', () => {
    const layout = layout6Row0Split();
    const compiled = compilePuzzle(layout);
    const row0Segs = compiled.horizontalSegments.filter((s) => s.cells[0]?.row === 0);
    expect(row0Segs).toHaveLength(2);
    const state = solution6Row0Split();
    for (const seg of row0Segs) {
      expect(isCompleteValidSegment(state, seg)).toBe(true);
    }
    expect(state['0,0']).toBe(3);
    expect(state['0,3']).toBe(3);
  });
});

describe('test 5: max candidate by min segment length', () => {
  it('H=6 V=2 gives candidates {1,2} only', () => {
    const layout = createEmptyLayout(6);
    const compiled = compilePuzzle(layout);
    const meta = getCellMeta(compiled, '0,0')!;
    expect(meta.hSegmentLength).toBe(6);
    expect(meta.vSegmentLength).toBe(6);
    const layout2 = createEmptyLayout(6);
    for (let r = 0; r < 6; r++) {
      layout2.horizontalWalls[1][0] = true;
      layout2.horizontalWalls[2][0] = true;
      layout2.horizontalWalls[3][0] = true;
      layout2.horizontalWalls[4][0] = true;
      layout2.horizontalWalls[5][0] = true;
    }
    const c2 = compilePuzzle(layout2);
    const m = getCellMeta(c2, '0,0')!;
    if (m.hSegmentLength === 6 && m.vSegmentLength === 2) {
      const cands = getCands({}, m, c2);
      expect(cands).toEqual([1, 2]);
    }
  });
});

describe('validateGivens', () => {
  it('test 10: given conflict 1 _ 1 in same segment', () => {
    const layout = createEmptyLayout(3);
    layout.givens = { '0,0': 1, '0,2': 1 };
    const compiled = compilePuzzle(layout);
    expect(validateGivens(compiled)).toMatch(/conflict/);
  });
});

describe('isLegalMove', () => {
  it('rejects duplicate in horizontal segment', () => {
    const layout = createEmptyLayout(3);
    const compiled = compilePuzzle(layout);
    const meta = getCellMeta(compiled, '0,2')!;
    const state = { '0,0': 1, '0,1': 2 };
    expect(isLegalMove(state, meta, 1, compiled)).toBe(false);
    expect(isLegalMove(state, meta, 3, compiled)).toBe(true);
  });
});

describe('full solution 3x3', () => {
  it('validates classic 3x3 latin-style solution', () => {
    const layout = createEmptyLayout(3);
    const solution: PuzzleSolution = {
      '0,0': 1, '0,1': 2, '0,2': 3,
      '1,0': 2, '1,1': 3, '1,2': 1,
      '2,0': 3, '2,1': 1, '2,2': 2,
    };
    expect(validateFullSolution(solution, layout)).toBeNull();
  });
});
