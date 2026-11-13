/**
 * Pure draw maths for the FMT 2026 booth. Every spin draws from what is left
 * in the "bag": each prize weighs its remaining stock, and the "good luck"
 * slot weighs the spins the prizes cannot fill.
 */

export const PRIZE_TIERS = ['common', 'rare', 'epic'] as const;
export type PrizeTier = (typeof PRIZE_TIERS)[number];

export type PoolPrize = {
	id: string;
	remaining: number;
	isActive: boolean;
};

export type PoolInput = {
	totalSpins: number;
	spinsUsed: number;
	prizes: readonly PoolPrize[];
};

export type PoolSummary = {
	prizesLeft: number;
	luckLeft: number;
	spinsLeft: number;
};

/** A drawn slot: a prize id, or null for "good luck". */
export type DrawPick = { prizeId: string | null };

function activeStock(prizes: readonly PoolPrize[]): number {
	return prizes.reduce(
		(sum, prize) => sum + (prize.isActive ? Math.max(0, prize.remaining) : 0),
		0,
	);
}

/**
 * Good-luck slots = planned spins − spins already used − prizes still in the bag.
 * When the planned total is smaller than the stock, there are none and the
 * prizes alone decide when the draw runs out.
 */
export function summarizePool({ totalSpins, spinsUsed, prizes }: PoolInput): PoolSummary {
	const prizesLeft = activeStock(prizes);
	const luckLeft = Math.max(0, totalSpins - spinsUsed - prizesLeft);
	return { prizesLeft, luckLeft, spinsLeft: prizesLeft + luckLeft };
}

/**
 * Pick one slot, weighted by what is left. `randomInt(max)` must return an
 * integer in [0, max); the service passes `crypto.randomInt`.
 * Returns null when the bag is empty.
 */
export function pickFromPool(
	input: PoolInput,
	randomInt: (max: number) => number,
): DrawPick | null {
	const { spinsLeft } = summarizePool(input);
	if (spinsLeft <= 0) return null;

	let ticket = randomInt(spinsLeft);
	for (const prize of input.prizes) {
		if (!prize.isActive || prize.remaining <= 0) continue;
		if (ticket < prize.remaining) return { prizeId: prize.id };
		ticket -= prize.remaining;
	}
	// Every ticket past the prizes lands in a good-luck slot.
	return { prizeId: null };
}

export function isPrizeTier(value: string): value is PrizeTier {
	return (PRIZE_TIERS as readonly string[]).includes(value);
}
