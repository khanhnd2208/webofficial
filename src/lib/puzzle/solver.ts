import type { PuzzleState } from '@/types/puzzle';
import type { CellMeta, CompiledPuzzle } from '@/lib/puzzle/types';
import { getCandidates } from '@/lib/puzzle/candidates';
import { isSolved } from '@/lib/puzzle/validator';
import { isLegalUserMove } from '@/lib/puzzle/statePipeline';
import type { SolverBudget } from '@/lib/puzzle/puzzlePolicy';

function copyState(state: PuzzleState): PuzzleState {
  return { ...state };
}

function buildInitialState(compiled: CompiledPuzzle, givensOnly = true): PuzzleState {
  const state: PuzzleState = {};
  for (const key of compiled.playableKeys) {
    if (givensOnly && compiled.layout.givens[key] !== undefined) {
      state[key] = compiled.layout.givens[key];
    } else {
      state[key] = undefined;
    }
  }
  return state;
}

function findEmptyCellWithFewestCandidates(
  state: PuzzleState,
  compiled: CompiledPuzzle,
): { meta: CellMeta; candidates: number[] } | null {
  let best: { meta: CellMeta; candidates: number[] } | null = null;

  for (const key of compiled.playableKeys) {
    if (state[key] != null && state[key] !== undefined) continue;
    const meta = compiled.cells.flat().find((c) => c?.key === key);
    if (!meta || meta.isGiven) continue;

    const candidates = getCandidates(state, meta, compiled);
    if (candidates.length === 0) return { meta, candidates: [] };
    if (!best || candidates.length < best.candidates.length) {
      best = { meta, candidates };
    }
  }
  return best;
}

export class SolverBudgetExceededError extends Error {
  readonly code = 'SOLVER_TIMEOUT_LAYOUT_TOO_OPEN' as const;
  constructor(
    message: string,
    public readonly nodes: number,
    public readonly elapsedMs: number,
  ) {
    super(message);
    this.name = 'SolverBudgetExceededError';
  }
}

interface SearchContext {
  nodes: number;
  startedAt: number;
  budget?: SolverBudget;
}

function checkBudget(ctx: SearchContext): void {
  if (!ctx.budget) return;
  ctx.nodes++;
  if (ctx.nodes > ctx.budget.maxNodes) {
    const elapsedMs = Date.now() - ctx.startedAt;
    throw new SolverBudgetExceededError(
      `Solver exceeded maxNodes (${ctx.budget.maxNodes})`,
      ctx.nodes,
      elapsedMs,
    );
  }
  const elapsedMs = Date.now() - ctx.startedAt;
  if (elapsedMs > ctx.budget.maxMs) {
    throw new SolverBudgetExceededError(
      `Solver exceeded maxMs (${ctx.budget.maxMs})`,
      ctx.nodes,
      elapsedMs,
    );
  }
}

export function countSolutions(
  compiled: CompiledPuzzle,
  initialState?: PuzzleState,
  limit = 2,
  budget?: SolverBudget,
): number {
  let count = 0;
  const base = initialState ?? buildInitialState(compiled, true);
  const ctx: SearchContext = { nodes: 0, startedAt: Date.now(), budget };

  function search(state: PuzzleState) {
    if (count >= limit) return;
    checkBudget(ctx);

    if (isSolved(state, compiled)) {
      count++;
      return;
    }

    const next = findEmptyCellWithFewestCandidates(state, compiled);
    if (!next) return;
    if (next.candidates.length === 0) return;

    const { meta, candidates } = next;
    for (const value of candidates) {
      if (!isLegalUserMove(state, meta, value, compiled)) continue;
      state[meta.key] = value;
      search(state);
      state[meta.key] = undefined;
      if (count >= limit) return;
    }
  }

  search(copyState(base));
  return count;
}

export function hasUniqueSolution(
  compiled: CompiledPuzzle,
  initialState?: PuzzleState,
  budget?: SolverBudget,
): boolean {
  return countSolutions(compiled, initialState, 2, budget) === 1;
}

export function findFirstSolution(
  compiled: CompiledPuzzle,
  budget?: SolverBudget,
): PuzzleState | null {
  const state: PuzzleState = {};
  for (const key of compiled.playableKeys) {
    state[key] = compiled.layout.givens[key] ?? undefined;
  }

  const ctx: SearchContext = { nodes: 0, startedAt: Date.now(), budget };

  function search(): boolean {
    checkBudget(ctx);

    if (isSolved(state, compiled)) return true;

    const next = findEmptyCellWithFewestCandidates(state, compiled);
    if (!next) return false;
    if (next.candidates.length === 0) return false;

    const { meta, candidates } = next;
    for (const value of candidates) {
      if (!isLegalUserMove(state, meta, value, compiled)) continue;
      state[meta.key] = value;
      if (search()) return true;
      state[meta.key] = undefined;
    }
    return false;
  }

  try {
    return search() ? { ...state } : null;
  } catch (e) {
    if (e instanceof SolverBudgetExceededError) return null;
    throw e;
  }
}

export function validatePuzzleUnique(
  compiled: CompiledPuzzle,
  budget?: SolverBudget,
): { ok: boolean; solutionCount: number; error?: string } {
  try {
    const count = countSolutions(compiled, undefined, 2, budget);
    if (count === 0) return { ok: false, solutionCount: 0, error: 'Puzzle has no solution' };
    if (count >= 2) {
      return { ok: false, solutionCount: count, error: 'Puzzle has multiple solutions' };
    }
    return { ok: true, solutionCount: 1 };
  } catch (e) {
    if (e instanceof SolverBudgetExceededError) {
      return {
        ok: false,
        solutionCount: 0,
        error: `${e.code}: ${e.message}`,
      };
    }
    throw e;
  }
}
