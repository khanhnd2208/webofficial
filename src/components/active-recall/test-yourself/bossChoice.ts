import { ARENA_BOSSES, type ArenaBoss } from '@/components/teaching/arena/arenaBosses';

/** The custom-designed bosses only (the illustrated sheets), not the generic defaults. */
export const TEST_BOSSES = ARENA_BOSSES.filter((boss) => boss.art.kind === 'sheet');

/** "A different boss each run" — the default until the learner picks one. */
export const RANDOM_BOSS = 'random';

const KEY = 'active-recall:test-boss';
const EVENT = 'active-recall-test-boss';

/** The learner's boss choice on this browser: a boss id or `RANDOM_BOSS`. */
export function readBossChoice(): string {
	try {
		const stored = window.localStorage.getItem(KEY);
		return stored && TEST_BOSSES.some((boss) => boss.id === stored) ? stored : RANDOM_BOSS;
	} catch {
		return RANDOM_BOSS;
	}
}

export function writeBossChoice(choice: string) {
	try {
		if (choice === RANDOM_BOSS) window.localStorage.removeItem(KEY);
		else window.localStorage.setItem(KEY, choice);
	} catch {
		// Private mode: the choice lasts for this page only.
	}
	window.dispatchEvent(new Event(EVENT));
}

export function subscribeBossChoice(callback: () => void) {
	window.addEventListener(EVENT, callback);
	window.addEventListener('storage', callback);
	return () => {
		window.removeEventListener(EVENT, callback);
		window.removeEventListener('storage', callback);
	};
}

/** The boss for a new run: the chosen one, or a random one other than the last. */
export function bossForRun(choice: string, previousId?: string): ArenaBoss {
	const chosen = TEST_BOSSES.find((boss) => boss.id === choice);
	if (chosen) return chosen;
	const pool = TEST_BOSSES.filter((boss) => boss.id !== previousId);
	return pool[Math.floor(Math.random() * pool.length)] ?? TEST_BOSSES[0]!;
}
