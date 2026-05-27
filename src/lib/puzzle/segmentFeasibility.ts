/**
 * Segment domain feasibility — P0 gate before solver/publish.
 * Each segment of length L must hold 1..L; cell caps = min(hSegLen, vSegLen).
 */
import type { PuzzleState } from '@/types/puzzle';
import type { CellMeta, CompiledPuzzle, Segment } from '@/lib/puzzle/types';
import { cellKey } from '@/lib/puzzle/cellKey';
import { getCellMeta } from '@/lib/puzzle/compiler';

export interface SegmentFeasibilityRow {
  id: string;
  direction: 'H' | 'V';
  length: number;
  caps: number[];
  feasible: boolean;
}

export function getSegmentCaps(compiled: CompiledPuzzle, segment: Segment): number[] {
  const L = segment.length;
  return segment.cells
    .map((cell) => {
      const meta = getCellMeta(compiled, cellKey(cell.row, cell.col));
      if (!meta || meta.isBlocked) return 0;
      return Math.min(L, meta.maxAllowedValue ?? 0);
    })
    .sort((a, b) => a - b);
}

export function isSegmentDomainFeasible(compiled: CompiledPuzzle, segment: Segment): boolean {
  const caps = getSegmentCaps(compiled, segment);
  for (let i = 0; i < segment.length; i++) {
    if (caps[i] < i + 1) return false;
  }
  return true;
}

export function getSegmentFeasibilityErrors(compiled: CompiledPuzzle): string[] {
  const errors: string[] = [];
  for (const segment of [...compiled.horizontalSegments, ...compiled.verticalSegments]) {
    if (isSegmentDomainFeasible(compiled, segment)) continue;
    const caps = getSegmentCaps(compiled, segment);
    const missing = caps.findIndex((cap, i) => cap < i + 1);
    const requiredValue = missing >= 0 ? missing + 1 : segment.length;
    errors.push(
      `${segment.id} (${segment.direction} length ${segment.length}) impossible: ` +
        `sorted caps [${caps.join(', ')}] cannot place value ${requiredValue}.`,
    );
  }
  return errors;
}

function hasBipartiteMatching(values: number[], cells: CellMeta[]): boolean {
  const n = values.length;
  if (n === 0) return true;
  if (n !== cells.length) return false;

  const adj: number[][] = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) {
    const v = values[i];
    for (let j = 0; j < cells.length; j++) {
      const cap = cells[j].maxAllowedValue ?? 0;
      if (v <= cap) adj[i].push(j);
    }
  }

  const matchTo = new Array<number>(cells.length).fill(-1);

  function dfs(u: number, seen: boolean[]): boolean {
    for (const v of adj[u]) {
      if (seen[v]) continue;
      seen[v] = true;
      if (matchTo[v] < 0 || dfs(matchTo[v], seen)) {
        matchTo[v] = u;
        return true;
      }
    }
    return false;
  }

  for (let u = 0; u < n; u++) {
    if (!dfs(u, Array(cells.length).fill(false))) return false;
  }
  return true;
}

/** Stronger check when givens already occupy some values in a segment. */
export function getSegmentGivensFeasibilityErrors(compiled: CompiledPuzzle): string[] {
  const errors: string[] = [];
  const givens = compiled.layout.givens ?? {};

  for (const segment of [...compiled.horizontalSegments, ...compiled.verticalSegments]) {
    const L = segment.length;
    const required = new Set(Array.from({ length: L }, (_, i) => i + 1));
    const emptyCells: CellMeta[] = [];
    const seenGiven = new Set<number>();

    for (const coord of segment.cells) {
      const key = cellKey(coord.row, coord.col);
      const meta = getCellMeta(compiled, key);
      if (!meta || meta.isBlocked) continue;

      const gv = givens[key];
      if (gv === undefined) {
        emptyCells.push(meta);
        continue;
      }

      if (!Number.isInteger(gv) || gv < 1 || gv > L) {
        errors.push(`${segment.id}: given ${gv} out of segment range 1..${L} at ${key}.`);
        break;
      }
      if (seenGiven.has(gv)) {
        errors.push(`${segment.id}: duplicate given value ${gv}.`);
        break;
      }
      seenGiven.add(gv);
      required.delete(gv);
    }

    if (errors.some((e) => e.startsWith(segment.id))) continue;

    const values = Array.from(required).sort((a, b) => a - b);
    if (values.length === 0) continue;

    if (!hasBipartiteMatching(values, emptyCells)) {
      errors.push(
        `${segment.id}: givens cannot be extended — need values [${values.join(', ')}] ` +
          `for ${emptyCells.length} empty cell(s) with caps ` +
          `[${emptyCells.map((c) => c.maxAllowedValue ?? 0).join(', ')}].`,
      );
    }
  }

  return errors;
}

/** Dev helper — log segment caps before seed/publish. */
export function explainLayoutFeasibility(compiled: CompiledPuzzle): SegmentFeasibilityRow[] {
  return [...compiled.horizontalSegments, ...compiled.verticalSegments].map((segment) => {
    const caps = getSegmentCaps(compiled, segment);
    return {
      id: segment.id,
      direction: segment.direction,
      length: segment.length,
      caps,
      feasible: isSegmentDomainFeasible(compiled, segment),
    };
  });
}

export function validateSegmentFeasibilityForState(
  compiled: CompiledPuzzle,
  state: PuzzleState,
): string[] {
  const errors: string[] = [];
  for (const segment of [...compiled.horizontalSegments, ...compiled.verticalSegments]) {
    const L = segment.length;
    const required = new Set(Array.from({ length: L }, (_, i) => i + 1));
    const emptyCells: CellMeta[] = [];
    const seen = new Set<number>();

    for (const coord of segment.cells) {
      const key = cellKey(coord.row, coord.col);
      const meta = getCellMeta(compiled, key);
      if (!meta || meta.isBlocked) continue;

      const v = state[key];
      if (v == null || v === undefined) {
        emptyCells.push(meta);
        continue;
      }
      if (!Number.isInteger(v) || v < 1 || v > L) {
        errors.push(`${segment.id}: value ${v} out of range at ${key}.`);
        break;
      }
      if (seen.has(v)) {
        errors.push(`${segment.id}: duplicate value ${v}.`);
        break;
      }
      seen.add(v);
      required.delete(v);
    }

    if (errors.some((e) => e.startsWith(segment.id))) continue;

    const values = Array.from(required).sort((a, b) => a - b);
    if (values.length > 0 && !hasBipartiteMatching(values, emptyCells)) {
      errors.push(`${segment.id}: partial state cannot complete segment.`);
    }
  }
  return errors;
}
