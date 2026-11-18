/**
 * One "Test yourself" run: the boss asks the cards in `queue` order, head first.
 *
 * - "Đã hiểu" (known): the card leaves the run for good and the boss loses 1 HP.
 * - "Kiểm tra lại sau" (again): the card goes back to a random later spot.
 * - "Tiếp" (next): the card goes to the back of the queue.
 *
 * The boss falls when every card is known. All functions are pure.
 */

export type TestSession = {
	queue: string[];
	known: string[];
	/** How many times each card was sent back with "again". */
	again: Record<string, number>;
	/** Questions asked so far, including repeats. */
	asked: number;
	total: number;
};

export type Random = () => number;

export function shuffleIds(ids: readonly string[], random: Random = Math.random) {
	const next = [...ids];
	for (let index = next.length - 1; index > 0; index -= 1) {
		const swap = Math.floor(random() * (index + 1));
		[next[index], next[swap]] = [next[swap]!, next[index]!];
	}
	return next;
}

export function createTestSession(
	ids: readonly string[],
	random: Random = Math.random,
): TestSession {
	const unique = [...new Set(ids)];
	return {
		queue: shuffleIds(unique, random),
		known: [],
		again: {},
		asked: unique.length ? 1 : 0,
		total: unique.length,
	};
}

export function currentCard(session: TestSession) {
	return session.queue[0] ?? null;
}

export function isFinished(session: TestSession) {
	return session.queue.length === 0;
}

export function bossHp(session: TestSession) {
	return session.total - session.known.length;
}

function advanced(session: TestSession, queue: string[]): TestSession {
	return { ...session, queue, asked: queue.length ? session.asked + 1 : session.asked };
}

export function markKnown(session: TestSession): TestSession {
	const head = currentCard(session);
	if (!head) return session;
	return { ...advanced(session, session.queue.slice(1)), known: [...session.known, head] };
}

/**
 * Put the card back at a random spot. With other cards left it never comes
 * straight back: at least one other question is asked in between.
 */
export function markAgain(session: TestSession, random: Random = Math.random): TestSession {
	const head = currentCard(session);
	if (!head) return session;
	const rest = session.queue.slice(1);
	const min = Math.min(1, rest.length);
	const at = min + Math.floor(random() * (rest.length - min + 1));
	const queue = [...rest.slice(0, at), head, ...rest.slice(at)];
	return {
		...advanced(session, queue),
		again: { ...session.again, [head]: (session.again[head] ?? 0) + 1 },
	};
}

export function skipCard(session: TestSession): TestSession {
	const head = currentCard(session);
	if (!head) return session;
	return advanced(session, [...session.queue.slice(1), head]);
}
