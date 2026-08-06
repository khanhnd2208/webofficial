/**
 * Balanced random sampler for MCQ pools.
 * Allocates count across topics (largest remainder), then across difficulty
 * within each topic; falls back to remaining pool when a stratum is short.
 */

export interface SampleableQuestion {
	id: string;
	topic: string;
	difficulty: number;
}

function shuffleInPlace<T>(items: T[], random: () => number = Math.random): T[] {
	for (let i = items.length - 1; i > 0; i -= 1) {
		const j = Math.floor(random() * (i + 1));
		const tmp = items[i]!;
		items[i] = items[j]!;
		items[j] = tmp;
	}
	return items;
}

/** Largest-remainder allocation of `total` across `keys` (as equal as possible). */
export function allocateEvenly(keys: string[], total: number): Map<string, number> {
	const result = new Map<string, number>();
	if (keys.length === 0 || total <= 0) return result;

	const base = Math.floor(total / keys.length);
	let remainder = total % keys.length;
	for (const key of keys) {
		const extra = remainder > 0 ? 1 : 0;
		if (remainder > 0) remainder -= 1;
		result.set(key, base + extra);
	}
	return result;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
	const map = new Map<string, T[]>();
	for (const item of items) {
		const key = keyFn(item);
		const bucket = map.get(key);
		if (bucket) bucket.push(item);
		else map.set(key, [item]);
	}
	return map;
}

function takeRandom<T>(pool: T[], n: number, random: () => number): { taken: T[]; rest: T[] } {
	if (n <= 0 || pool.length === 0) return { taken: [], rest: [...pool] };
	const shuffled = shuffleInPlace([...pool], random);
	const taken = shuffled.slice(0, Math.min(n, shuffled.length));
	const takenSet = new Set(taken);
	const rest = shuffled.filter((item) => !takenSet.has(item));
	return { taken, rest };
}

/**
 * Sample up to `count` questions with even topic distribution, then even
 * difficulty distribution within each topic. Shortfalls spill to leftover pool.
 */
export function sampleBalancedQuestions<T extends SampleableQuestion>(
	pool: T[],
	count: number,
	random: () => number = Math.random,
): T[] {
	if (count <= 0 || pool.length === 0) return [];
	const target = Math.min(count, pool.length);

	const byTopic = groupBy(pool, (q) => q.topic);
	const topicKeys = shuffleInPlace([...byTopic.keys()], random);
	const topicAlloc = allocateEvenly(topicKeys, target);

	const selected: T[] = [];
	const leftover: T[] = [];

	for (const topic of topicKeys) {
		const topicPool = byTopic.get(topic) ?? [];
		const want = topicAlloc.get(topic) ?? 0;
		const byDiff = groupBy(topicPool, (q) => String(q.difficulty));
		const diffKeys = shuffleInPlace([...byDiff.keys()], random);
		const diffAlloc = allocateEvenly(diffKeys, want);

		const topicLeftover: T[] = [];
		let got = 0;

		for (const diff of diffKeys) {
			const diffPool = byDiff.get(diff) ?? [];
			const need = diffAlloc.get(diff) ?? 0;
			const { taken, rest } = takeRandom(diffPool, need, random);
			selected.push(...taken);
			got += taken.length;
			topicLeftover.push(...rest);
			if (taken.length < need) {
				// shortfall stays in topicLeftover for same-topic fill, then global
			}
		}

		const topicShort = want - got;
		if (topicShort > 0 && topicLeftover.length > 0) {
			const { taken, rest } = takeRandom(topicLeftover, topicShort, random);
			selected.push(...taken);
			leftover.push(...rest);
		} else {
			leftover.push(...topicLeftover);
		}
	}

	if (selected.length < target && leftover.length > 0) {
		const { taken } = takeRandom(leftover, target - selected.length, random);
		selected.push(...taken);
	}

	return shuffleInPlace(selected.slice(0, target), random);
}
