import { describe, it, expect } from 'vitest';
import { compilePuzzle } from '@/lib/puzzle/compiler';
import { createEmptyLayout } from '@/lib/puzzle/layoutUtils';
import { buildHorizontalSegments } from '@/lib/puzzle/segments';
import {
  findConflictKeys,
  describeIllegalUserMove,
  sanitizeUserValuesOnly,
  composeStateWithGivens,
  buildDisplayStateFromCompiled,
  isValueConsistentInState,
} from '@/lib/puzzle/statePipeline';
import { isSolved } from '@/lib/puzzle/validator';
import { getCellMeta } from '@/lib/puzzle/compiler';
import { findFirstSolution } from '@/lib/puzzle/solver';

describe('state pipeline', () => {
  it('given cells are not conflicts', () => {
    const layout = createEmptyLayout(3);
    layout.givens = { '0,0': 1 };
    const compiled = compilePuzzle(layout);
    const state = buildDisplayStateFromCompiled({}, compiled);
    expect(findConflictKeys(state, compiled)).not.toContain('0,0');
  });

  it('duplicate in same segment is a conflict', () => {
    const layout = createEmptyLayout(3);
    const compiled = compilePuzzle(layout);
    const state = { '0,0': 1, '0,1': 1 };
    expect(findConflictKeys(state, compiled)).toContain('0,0');
    expect(findConflictKeys(state, compiled)).toContain('0,1');
  });

  it('describeIllegalUserMove names segment duplicate in Vietnamese', () => {
    const layout = createEmptyLayout(3);
    const compiled = compilePuzzle(layout);
    const state = { '0,0': 1 };
    const meta = getCellMeta(compiled, '0,1')!;
    const hint = describeIllegalUserMove(state, meta, 1, compiled);
    expect(hint).toMatch(/đoạn ngang/i);
  });

  it('sanitizeUserValuesOnly keeps conflicting user values', () => {
    const layout = createEmptyLayout(3);
    const compiled = compilePuzzle(layout);
    const raw = { '0,0': 1, '0,1': 1 };
    const clean = sanitizeUserValuesOnly(raw, compiled);
    expect(clean).toEqual(raw);
  });

  it('sanitizeUserValuesOnly strips givens and blocked', () => {
    const layout = createEmptyLayout(3);
    layout.givens = { '0,0': 1 };
    layout.blocked[1][1] = true;
    const compiled = compilePuzzle(layout);
    const raw = { '0,0': 9, '1,1': 2, '0,1': 2 };
    const clean = sanitizeUserValuesOnly(raw, compiled);
    expect(clean).toEqual({ '0,1': 2 });
  });

  it('composeStateWithGivens overlays givens over bad user progress', () => {
    const givens = { '0,0': 1 };
    const user = { '0,0': 9, '0,1': 2 };
    const state = composeStateWithGivens(user, givens);
    expect(state['0,0']).toBe(1);
    expect(state['0,1']).toBe(2);
  });

  it('server submit path: user values merged with givens for isSolved check', () => {
    const layout = createEmptyLayout(3);
    const compiled = compilePuzzle(layout);
    const solved = findFirstSolution(compiled);
    expect(solved).not.toBeNull();
    layout.givens = { '0,0': solved!['0,0'] as number };
    const userOnly = sanitizeUserValuesOnly(solved!, compiled);
    const state = composeStateWithGivens(userOnly, layout.givens);
    expect(state['0,0']).toBe(layout.givens['0,0']);
    expect(isSolved(state, compiled)).toBe(true);
  });

  it('wall at col 2 splits row 0 into two horizontal segments', () => {
    const layout = createEmptyLayout(5);
    layout.verticalWalls[0][2] = true;
    const { segments } = buildHorizontalSegments(layout);
    const row0 = segments.filter((s) => s.cells[0]?.row === 0);
    expect(row0).toHaveLength(2);
    expect(row0[0].length).toBe(2);
    expect(row0[1].length).toBe(3);
  });

  it('removing user cell value omits key from sanitized progress', () => {
    const layout = createEmptyLayout(3);
    const compiled = compilePuzzle(layout);
    const withVal = sanitizeUserValuesOnly({ '0,0': 2, '0,1': 1 }, compiled);
    const cleared = sanitizeUserValuesOnly({ '0,1': 1 }, compiled);
    expect(withVal['0,0']).toBe(2);
    expect(cleared['0,0']).toBeUndefined();
  });

  it('given value passes isValueConsistentInState', () => {
    const layout = createEmptyLayout(3);
    layout.givens = { '0,0': 1 };
    const compiled = compilePuzzle(layout);
    const meta = getCellMeta(compiled, '0,0')!;
    expect(isValueConsistentInState({ '0,0': 1 }, meta, 1, compiled)).toBe(true);
    expect(isValueConsistentInState({ '0,0': 2 }, meta, 2, compiled)).toBe(false);
  });
});
