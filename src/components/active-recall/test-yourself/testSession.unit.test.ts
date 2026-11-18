import { describe, expect, it } from 'vitest';

import {
	bossHp,
	createTestSession,
	currentCard,
	isFinished,
	markAgain,
	markKnown,
	skipCard,
} from './testSession';

/** Deterministic "random": always the lowest pick, so shuffles keep order. */
const low = () => 0;
const high = () => 0.999;

describe('test yourself session', () => {
	it('asks every unique card once and starts at full boss HP', () => {
		const session = createTestSession(['a', 'b', 'a', 'c'], low);
		expect(session.total).toBe(3);
		expect([...session.queue].sort()).toEqual(['a', 'b', 'c']);
		expect(bossHp(session)).toBe(3);
		expect(session.asked).toBe(1);
	});

	it('removes a known card for good and costs the boss one HP', () => {
		let session = createTestSession(['a', 'b'], low);
		const first = currentCard(session)!;
		session = markKnown(session);
		expect(session.queue).not.toContain(first);
		expect(session.known).toEqual([first]);
		expect(bossHp(session)).toBe(1);
		session = markKnown(session);
		expect(isFinished(session)).toBe(true);
		expect(bossHp(session)).toBe(0);
	});

	it('puts an "again" card back later, never as the very next question', () => {
		let session = createTestSession(['a', 'b', 'c'], low);
		const first = currentCard(session)!;
		session = markAgain(session, low);
		expect(currentCard(session)).not.toBe(first);
		expect(session.queue).toHaveLength(3);
		expect(session.queue.indexOf(first)).toBe(1);
		expect(session.again[first]).toBe(1);

		const later = markAgain(createTestSession(['a', 'b', 'c'], low), high);
		expect(later.queue.at(-1)).toBe(first);
	});

	it('asks the last remaining "again" card straight away', () => {
		const session = markAgain(createTestSession(['solo'], low), high);
		expect(session.queue).toEqual(['solo']);
		expect(session.again.solo).toBe(1);
		expect(bossHp(session)).toBe(1);
	});

	it('sends a skipped card to the back without changing the boss HP', () => {
		let session = createTestSession(['a', 'b', 'c'], low);
		const first = currentCard(session)!;
		session = skipCard(session);
		expect(session.queue.at(-1)).toBe(first);
		expect(bossHp(session)).toBe(3);
		expect(session.asked).toBe(2);
	});

	it('ignores actions once the queue is empty', () => {
		const done = markKnown(createTestSession(['a'], low));
		expect(markKnown(done)).toBe(done);
		expect(markAgain(done)).toBe(done);
		expect(skipCard(done)).toBe(done);
	});
});
