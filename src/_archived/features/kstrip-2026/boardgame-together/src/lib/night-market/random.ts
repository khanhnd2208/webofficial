export function hashSeed(input: string): number {
	let hash = 2166136261;
	for (let index = 0; index < input.length; index += 1) {
		hash ^= input.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}

export function seededRandom(seed: string): () => number {
	let value = hashSeed(seed) || 1;
	return () => {
		value += 0x6d2b79f5;
		let next = value;
		next = Math.imul(next ^ (next >>> 15), next | 1);
		next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
		return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
	};
}

export function shuffleSeeded<T>(items: T[], seed: string): T[] {
	const output = [...items];
	const random = seededRandom(seed);
	for (let index = output.length - 1; index > 0; index -= 1) {
		const target = Math.floor(random() * (index + 1));
		[output[index], output[target]] = [output[target], output[index]];
	}
	return output;
}
