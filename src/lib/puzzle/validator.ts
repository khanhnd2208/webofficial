import type { DailyPuzzleLayout, PuzzleSolution, PuzzleState } from '@/types/puzzle';
import type { CellMeta, CompiledPuzzle, Segment } from '@/lib/puzzle/types';
import { parseCellKey, cellKey } from '@/lib/puzzle/cellKey';
import { compilePuzzle } from '@/lib/puzzle/compiler';
import { numbersFrom1To } from '@/lib/puzzle/candidates';
import { isBlocked, ensureOuterWalls } from '@/lib/puzzle/layoutUtils';

export {
  isEditableCell,
  isValueInCellDomain,
  isValueConsistentInState,
  isLegalUserMove,
  describeIllegalUserMove,
  isLegalMove,
  findConflictKeys,
  findConflicts,
  hasLocalConflicts,
  sanitizeUserValuesOnly,
  composeStateWithGivens,
  buildDisplayStateFromCompiled,
  sanitizeNotesOnly,
} from '@/lib/puzzle/statePipeline';

function getValue(state: PuzzleState, key: string): number | null | undefined {
  return state[key];
}

function segmentValues(state: PuzzleState, segment: Segment): (number | null | undefined)[] {
  return segment.cells.map((c) => getValue(state, cellKey(c.row, c.col)));
}

export function isCompleteValidSegment(state: PuzzleState, segment: Segment): boolean {
  const L = segment.length;
  const values = segmentValues(state, segment);
  if (values.some((v) => v == null || v === undefined)) return false;

  const required = new Set(numbersFrom1To(L));
  const actual = new Set(values as number[]);
  if (actual.size !== L) return false;
  for (const n of required) {
    if (!actual.has(n)) return false;
  }
  return true;
}

export function validateLayout(layout: DailyPuzzleLayout): string | null {
  const { size } = layout;
  if (!Number.isInteger(size) || size < 3 || size > 9) {
    return 'size must be between 3 and 9';
  }

  if (!layout.blocked?.length || layout.blocked.length !== size) {
    return 'blocked must be size x size matrix';
  }
  if (!layout.verticalWalls?.length || layout.verticalWalls.length !== size) {
    return 'verticalWalls must be size x (size+1)';
  }
  if (!layout.horizontalWalls?.length || layout.horizontalWalls.length !== size + 1) {
    return 'horizontalWalls must be (size+1) x size';
  }

  for (let r = 0; r < size; r++) {
    if (layout.blocked[r].length !== size) return `blocked row ${r} wrong length`;
    if (layout.verticalWalls[r].length !== size + 1) return `verticalWalls row ${r} wrong length`;
    if (layout.verticalWalls[r][0] !== true || layout.verticalWalls[r][size] !== true) {
      return `outer vertical walls must be true at row ${r}`;
    }
  }
  for (let c = 0; c < size; c++) {
    if (layout.horizontalWalls[0][c] !== true || layout.horizontalWalls[size][c] !== true) {
      return `outer horizontal walls must be true at col ${c}`;
    }
  }

  for (const key of Object.keys(layout.givens ?? {})) {
    const parsed = parseCellKey(key);
    if (!parsed) return `invalid given key: ${key}`;
    const [row, col] = parsed;
    if (isBlocked(layout, row, col)) return `given on blocked cell: ${key}`;
  }

  return null;
}

export function validateGivens(compiled: CompiledPuzzle): string | null {
  const seenH = new Map<string, Map<number, string>>();
  const seenV = new Map<string, Map<number, string>>();

  for (const key of compiled.playableKeys) {
    const given = compiled.layout.givens[key];
    if (given === undefined) continue;

    const meta = compiled.cells.flat().find((c) => c?.key === key);
    if (!meta?.maxAllowedValue) return `given on cell without segments: ${key}`;
    if (!Number.isInteger(given) || given < 1 || given > meta.maxAllowedValue) {
      return `given ${given} out of range at ${key} (max ${meta.maxAllowedValue})`;
    }

    if (meta.hSegmentId) {
      if (!seenH.has(meta.hSegmentId)) seenH.set(meta.hSegmentId, new Map());
      const m = seenH.get(meta.hSegmentId)!;
      if (m.has(given)) return `given conflict in horizontal segment ${meta.hSegmentId}: ${m.get(given)} and ${key}`;
      m.set(given, key);
    }
    if (meta.vSegmentId) {
      if (!seenV.has(meta.vSegmentId)) seenV.set(meta.vSegmentId, new Map());
      const m = seenV.get(meta.vSegmentId)!;
      if (m.has(given)) return `given conflict in vertical segment ${meta.vSegmentId}: ${m.get(given)} and ${key}`;
      m.set(given, key);
    }
  }
  return null;
}

export function isSolved(state: PuzzleState, compiled: CompiledPuzzle): boolean {
  for (const key of compiled.playableKeys) {
    const v = state[key];
    if (v == null || v === undefined) return false;
    const meta = compiled.cells.flat().find((c) => c?.key === key)!;
    if (meta.isGiven && state[key] !== meta.givenValue) return false;
  }

  for (const seg of [...compiled.horizontalSegments, ...compiled.verticalSegments]) {
    if (!isCompleteValidSegment(state, seg)) return false;
  }
  return true;
}

export function validateFullSolution(
  solution: PuzzleSolution,
  layout: DailyPuzzleLayout,
): string | null {
  ensureOuterWalls(layout);
  const layoutErr = validateLayout(layout);
  if (layoutErr) return layoutErr;

  const compiled = compilePuzzle(layout);
  const givensErr = validateGivens(compiled);
  if (givensErr) return givensErr;

  for (const key of compiled.playableKeys) {
    if (!Number.isInteger(solution[key])) return `solution missing at ${key}`;
  }
  for (const key of Object.keys(solution)) {
    const parsed = parseCellKey(key);
    if (!parsed) return `invalid solution key ${key}`;
    const [r, c] = parsed;
    if (isBlocked(layout, r, c)) return `solution on blocked cell ${key}`;
  }

  if (!isSolved(solution, compiled)) return 'solution violates segment rules';

  for (const [key, given] of Object.entries(layout.givens)) {
    if (solution[key] !== given) return `solution disagrees with given at ${key}`;
  }

  return null;
}

/** @deprecated use validateFullSolution */
export function validateSolution(layout: DailyPuzzleLayout, solution: PuzzleSolution): string | null {
  return validateFullSolution(solution, layout);
}

export function isAnswerComplete(state: PuzzleState, compiled: CompiledPuzzle): boolean {
  return compiled.playableKeys.every((key) => {
    const v = state[key];
    return Number.isInteger(v) && (v as number) >= 1;
  });
}

export function compareAnswerToSolution(
  answer: PuzzleSolution,
  solution: PuzzleSolution,
  compiled: CompiledPuzzle,
): { correct: boolean; wrongCells: string[] } {
  const wrongCells: string[] = [];
  for (const key of compiled.playableKeys) {
    if (answer[key] !== solution[key]) wrongCells.push(key);
  }
  return { correct: wrongCells.length === 0, wrongCells };
}

/** Row allows duplicate numbers across segments — must NOT fail whole-row uniqueness */
export function validateRowAllowsCrossSegmentDuplicates(
  layout: DailyPuzzleLayout,
  rowValues: number[],
): boolean {
  const compiled = compilePuzzle(layout);
  const rowSegs = compiled.horizontalSegments.filter((s) => s.cells[0]?.row === 0);
  if (rowSegs.length < 2) return true;
  for (const seg of rowSegs) {
    const vals = seg.cells.map((c) => rowValues[c.col]);
    if (!isCompleteValidSegment(
      Object.fromEntries(seg.cells.map((c) => [cellKey(c.row, c.col), vals[c.col]])),
      seg,
    )) {
      return false;
    }
  }
  return true;
}
