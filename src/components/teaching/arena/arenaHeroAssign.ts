import { shuffle, type RandomSource } from '@/features/teaching/domain/recallArena';

/**
 * Hand heroes out at random but evenly: with 30 students and 10 heroes every
 * hero plays exactly 3 students; when the split is uneven, no hero has more
 * than one student above another. Earlier picks are kept where they still
 * fit, so a student added mid-game does not reshuffle everyone else.
 */
export function balanceHeroes(
	playerIds: readonly string[],
	heroIds: readonly string[],
	previous: Readonly<Record<string, string>> = {},
	random: RandomSource = Math.random,
): Record<string, string> {
	const result: Record<string, string> = {};
	if (heroIds.length === 0) return result;
	const players = [...new Set(playerIds)];
	const base = Math.floor(players.length / heroIds.length);
	let extras = players.length % heroIds.length;
	const counts = new Map(heroIds.map((id) => [id, 0]));
	const waiting: string[] = [];

	for (const id of shuffle(players, random)) {
		const hero = previous[id];
		const count = hero === undefined ? undefined : counts.get(hero);
		if (hero !== undefined && count !== undefined && count < base) {
			counts.set(hero, count + 1);
			result[id] = hero;
		} else if (hero !== undefined && count === base && extras > 0) {
			extras -= 1;
			counts.set(hero, count + 1);
			result[id] = hero;
		} else {
			waiting.push(id);
		}
	}

	for (const id of waiting) {
		const fewest = Math.min(...counts.values());
		const open = heroIds.filter((hero) => counts.get(hero) === fewest);
		const hero = open[Math.floor(random() * open.length)] ?? open[0]!;
		counts.set(hero, fewest + 1);
		result[id] = hero;
	}
	return result;
}
