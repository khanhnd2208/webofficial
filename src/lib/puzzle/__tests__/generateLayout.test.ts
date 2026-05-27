import { describe, expect, it } from 'vitest';
import { generateLocalWallLayout } from '@/lib/puzzle/generateLayout';
import { detectFullCross } from '@/lib/puzzle/layoutBoxiness';
import { assessLayoutQuality } from '@/lib/puzzle/layoutQuality';

describe('generateLayout', () => {
  it('generates 6x6 daily without full cross', () => {
    const gen = generateLocalWallLayout({
      size: 6,
      difficulty: 'MEDIUM',
      seed: 'test-6x6',
      maxAttempts: 200,
    });
    expect(gen).not.toBeNull();
    expect(detectFullCross(gen!.layout)).toBe(false);
    expect(
      assessLayoutQuality(gen!.layout, undefined, {
        puzzleKind: 'DAILY',
        difficulty: 'MEDIUM',
      }).ok,
    ).toBe(true);
  });

  it('generates 8x8 daily without full cross', () => {
    const gen = generateLocalWallLayout({
      size: 8,
      difficulty: 'HARD',
      seed: 'test-8x8',
      maxAttempts: 400,
    });
    expect(gen).not.toBeNull();
    expect(detectFullCross(gen!.layout)).toBe(false);
  });
});
