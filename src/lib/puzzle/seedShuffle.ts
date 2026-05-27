/**
 * Deterministic shuffle for reproducible puzzle generation (e.g. per dateKey).
 */
function hashSeedKey(seedKey: string): number {
  let h = 2166136261;
  for (let i = 0; i < seedKey.length; i++) {
    h ^= seedKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function deterministicShuffle<T>(items: readonly T[], seedKey: string): T[] {
  const arr = [...items];
  let state = hashSeedKey(seedKey) || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    const j = state % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
