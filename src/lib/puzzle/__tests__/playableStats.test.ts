import { describe, expect, it } from 'vitest';
import { createEmptyLayout } from '@/lib/puzzle/layoutUtils';
import { compilePuzzle } from '@/lib/puzzle/compiler';
import { countEmptyPlayableCells } from '@/lib/puzzle/playableStats';

describe('countEmptyPlayableCells', () => {
  it('counts playable cells without a value', () => {
    const layout = createEmptyLayout(3);
    const compiled = compilePuzzle(layout);
    expect(countEmptyPlayableCells({}, compiled)).toBe(9);
    expect(countEmptyPlayableCells({ '0,0': 1 }, compiled)).toBe(8);
  });
});
