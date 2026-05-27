/**
 * Player state pipeline: editability, consistency, progress, submit.
 * Do not use isLegalUserMove for givens/conflicts/sanitize.
 */
import type { PuzzleNotes, PuzzleSolution, PuzzleState } from '@/types/puzzle';
import type { CellMeta, CompiledPuzzle, Segment } from '@/lib/puzzle/types';
import { cellKey } from '@/lib/puzzle/cellKey';
import { getCellMeta } from '@/lib/puzzle/compiler';
import { getCandidates } from '@/lib/puzzle/candidates';

function segmentContainsValue(
  state: PuzzleState,
  segment: Segment,
  value: number,
  exceptKey?: string,
): boolean {
  for (const cell of segment.cells) {
    const key = cellKey(cell.row, cell.col);
    if (key === exceptKey) continue;
    if (state[key] === value) return true;
  }
  return false;
}

export function isEditableCell(cell: CellMeta): boolean {
  return !cell.isBlocked && !cell.isGiven;
}

export function isValueInCellDomain(cell: CellMeta, value: number): boolean {
  if (!Number.isInteger(value) || value < 1) return false;
  if (!cell.maxAllowedValue) return false;
  return value <= cell.maxAllowedValue;
}

export function isValueConsistentInState(
  state: PuzzleState,
  cellMeta: CellMeta,
  value: number,
  compiled: CompiledPuzzle,
): boolean {
  if (cellMeta.isBlocked) return false;

  if (cellMeta.isGiven) {
    return value === cellMeta.givenValue;
  }

  if (!isValueInCellDomain(cellMeta, value)) return false;

  if (!cellMeta.hSegmentId || !cellMeta.vSegmentId) return false;

  const hSeg = compiled.segmentById[cellMeta.hSegmentId];
  const vSeg = compiled.segmentById[cellMeta.vSegmentId];

  if (segmentContainsValue(state, hSeg, value, cellMeta.key)) return false;
  if (segmentContainsValue(state, vSeg, value, cellMeta.key)) return false;

  return true;
}

/** Whether the player may place `value` on `cellMeta` in the current state. */
export function isLegalUserMove(
  state: PuzzleState,
  cellMeta: CellMeta,
  value: number,
  compiled: CompiledPuzzle,
): boolean {
  if (!isEditableCell(cellMeta)) return false;
  if (!isValueInCellDomain(cellMeta, value)) return false;
  return getCandidates(state, cellMeta, compiled).includes(value);
}

/** Vietnamese hint when `isLegalUserMove` is false (pad / keyboard blocking). */
export function describeIllegalUserMove(
  state: PuzzleState,
  cellMeta: CellMeta,
  value: number,
  compiled: CompiledPuzzle,
): string {
  if (!isEditableCell(cellMeta)) return 'Không thể nhập vào ô này.';
  if (!isValueInCellDomain(cellMeta, value)) {
    const max = cellMeta.maxAllowedValue ?? compiled.layout.size;
    return `Chỉ được nhập số từ 1 đến ${max} tại ô này.`;
  }
  if (!cellMeta.hSegmentId || !cellMeta.vSegmentId) {
    return 'Số này không hợp lệ tại ô đang chọn.';
  }
  const hSeg = compiled.segmentById[cellMeta.hSegmentId];
  const vSeg = compiled.segmentById[cellMeta.vSegmentId];
  if (segmentContainsValue(state, hSeg, value, cellMeta.key)) {
    return 'Số này đã có trong đoạn ngang liên tục (không được trùng).';
  }
  if (segmentContainsValue(state, vSeg, value, cellMeta.key)) {
    return 'Số này đã có trong đoạn dọc liên tục (không được trùng).';
  }
  return 'Số này không hợp lệ tại ô đang chọn.';
}

/** @deprecated Use isLegalUserMove for new input; isValueConsistentInState for existing values. */
export function isLegalMove(
  state: PuzzleState,
  cellMeta: CellMeta,
  value: number,
  compiled: CompiledPuzzle,
): boolean {
  return isLegalUserMove(state, cellMeta, value, compiled);
}

export function findConflictKeys(state: PuzzleState, compiled: CompiledPuzzle): string[] {
  const conflicts: string[] = [];

  for (const key of compiled.playableKeys) {
    const value = state[key];
    if (value == null || value === undefined) continue;

    const meta = getCellMeta(compiled, key);
    if (!meta) continue;

    if (!isValueConsistentInState(state, meta, value as number, compiled)) {
      conflicts.push(key);
    }
  }

  return conflicts;
}

export function findConflicts(state: PuzzleState, compiled: CompiledPuzzle): Set<string> {
  return new Set(findConflictKeys(state, compiled));
}

export function hasLocalConflicts(state: PuzzleState, compiled: CompiledPuzzle): boolean {
  return findConflictKeys(state, compiled).length > 0;
}

/** Strip malformed / non-editable keys; never remove values because of segment conflicts. */
export function sanitizeUserValuesOnly(
  raw: PuzzleSolution,
  compiled: CompiledPuzzle,
): PuzzleSolution {
  const clean: PuzzleSolution = {};
  const maxVal = compiled.layout.size;

  for (const [key, v] of Object.entries(raw ?? {})) {
    const meta = getCellMeta(compiled, key);
    if (!meta || !isEditableCell(meta)) continue;
    if (!Number.isInteger(v) || (v as number) < 1 || (v as number) > maxVal) continue;
    clean[key] = v as number;
  }

  return clean;
}

export function composeStateWithGivens(
  userValues: PuzzleSolution,
  givens: Record<string, number>,
): PuzzleSolution {
  return { ...userValues, ...givens };
}

/** Full board for display / submit (givens always win). */
export function buildDisplayStateFromCompiled(
  userValues: PuzzleSolution,
  compiled: CompiledPuzzle,
): PuzzleSolution {
  const clean = sanitizeUserValuesOnly(userValues, compiled);
  return composeStateWithGivens(clean, compiled.layout.givens);
}

const MAX_NOTES_PER_CELL = 9;
const MAX_NOTE_CELLS = 64;

/** Strip notes on blocked/given cells and cap payload size for progress API. */
export function sanitizeNotesOnly(
  raw: PuzzleNotes,
  compiled: CompiledPuzzle,
): PuzzleNotes {
  const clean: PuzzleNotes = {};
  let cells = 0;

  for (const [key, list] of Object.entries(raw ?? {})) {
    if (cells >= MAX_NOTE_CELLS) break;
    const meta = getCellMeta(compiled, key);
    if (!meta || !isEditableCell(meta)) continue;
    if (!Array.isArray(list)) continue;

    const nums = list
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= compiled.layout.size)
      .slice(0, MAX_NOTES_PER_CELL);
    if (nums.length === 0) continue;

    clean[key] = [...new Set(nums)].sort((a, b) => a - b);
    cells++;
  }

  return clean;
}
