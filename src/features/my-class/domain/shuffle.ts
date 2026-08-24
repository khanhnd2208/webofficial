/** Deterministic shuffle so a learner's question/option order survives refresh. */

export function hashSeed(input: string): number {
	let hash = 2166136261;
	for (let index = 0; index < input.length; index += 1) {
		hash ^= input.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}

export function mulberry32(seed: number): () => number {
	let state = seed;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
	const next = mulberry32(hashSeed(seed));
	const copy = [...items];
	for (let index = copy.length - 1; index > 0; index -= 1) {
		const swap = Math.floor(next() * (index + 1));
		const current = copy[index]!;
		copy[index] = copy[swap]!;
		copy[swap] = current;
	}
	return copy;
}

export const POSITION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

export function positionLabel(index: number): string {
	return POSITION_LABELS[index] ?? String(index + 1);
}
