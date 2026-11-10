import { describe, expect, it } from 'vitest';

import {
	drawCard,
	drawFromBag,
	isInRoom,
	keepHigherCp,
	matchesGroupFilter,
	pickDefaultArenaSession,
	returnToBag,
	vietnamTodayIso,
	type ArenaSessionCandidate,
} from './recallArena';

/** Deterministic random: always takes the first slot when shuffling. */
const zero = () => 0;

describe('isInRoom', () => {
	it('counts present, late and make-up students as in the room', () => {
		expect(isInRoom('PRESENT')).toBe(true);
		expect(isInRoom('LATE')).toBe(true);
		expect(isInRoom('MAKEUP')).toBe(true);
	});

	it('leaves absent and unmarked students out', () => {
		expect(isInRoom('ABSENT_UNEXCUSED')).toBe(false);
		expect(isInRoom('ABSENT_EXCUSED')).toBe(false);
		expect(isInRoom(null)).toBe(false);
		expect(isInRoom(undefined)).toBe(false);
	});
});

describe('matchesGroupFilter', () => {
	it('takes everyone for ALL, including students without a group', () => {
		expect(matchesGroupFilter(null, 'ALL')).toBe(true);
		expect(matchesGroupFilter('SUPPORT', 'ALL')).toBe(true);
	});

	it('takes only the chosen group otherwise', () => {
		expect(matchesGroupFilter('CHALLENGE', 'CHALLENGE')).toBe(true);
		expect(matchesGroupFilter('SUPPORT', 'CHALLENGE')).toBe(false);
		expect(matchesGroupFilter(null, 'SUPPORT')).toBe(false);
	});
});

describe('keepHigherCp', () => {
	it('raises the mark when the award is higher', () => {
		expect(keepHigherCp(0, 1)).toBe(1);
		expect(keepHigherCp(0.5, 2)).toBe(2);
	});

	it('never lowers a mark the lecturer already gave', () => {
		expect(keepHigherCp(2, 0.5)).toBe(2);
		expect(keepHigherCp(1, 1)).toBe(1);
	});
});

describe('drawFromBag', () => {
	it('calls everyone once before anyone twice', () => {
		const eligible = ['a', 'b', 'c'];
		let bag: string[] = [];
		let last: string | null = null;
		const picked: string[] = [];
		for (let turn = 0; turn < 3; turn += 1) {
			const result = drawFromBag(bag, eligible, last, Math.random);
			picked.push(result.picked!);
			bag = result.bag;
			last = result.picked;
		}
		expect([...picked].sort()).toEqual(['a', 'b', 'c']);
	});

	it('refills when the bag is empty and avoids the same student twice in a row', () => {
		const result = drawFromBag([], ['a', 'b'], 'b', () => 0.99);
		expect(result.refilled).toBe(true);
		expect(result.picked).toBe('a');
	});

	it('drops ids that are no longer eligible', () => {
		const result = drawFromBag(['gone', 'b'], ['a', 'b'], null, zero);
		expect(result.picked).toBe('b');
		expect(result.bag).toEqual([]);
	});

	it('returns nobody when nobody is eligible', () => {
		expect(drawFromBag(['a'], [], null).picked).toBeNull();
	});

	it('can repeat the only student in the room', () => {
		expect(drawFromBag([], ['solo'], 'solo').picked).toBe('solo');
	});
});

describe('returnToBag', () => {
	it('puts the student at the end of the waiting line', () => {
		expect(returnToBag(['b', 'c'], ['a', 'b', 'c'], 'a')).toEqual(['b', 'c', 'a']);
	});

	it('refills with everyone else first when the bag is empty, so the next draw is someone else', () => {
		const bag = returnToBag([], ['a', 'b', 'c'], 'c');
		expect(bag.at(-1)).toBe('c');
		expect([...bag.slice(0, -1)].sort()).toEqual(['a', 'b']);
		expect(drawFromBag(bag, ['a', 'b', 'c'], 'c').picked).not.toBe('c');
	});

	it('does not duplicate the student or keep ids that left', () => {
		expect(returnToBag(['a', 'gone', 'b'], ['a', 'b'], 'a')).toEqual(['b', 'a']);
	});
});

describe('drawCard', () => {
	it('does not repeat a card until the deck runs out', () => {
		let used: string[] = [];
		const seen = new Set<string>();
		for (let turn = 0; turn < 3; turn += 1) {
			const result = drawCard(['x', 'y', 'z'], used);
			seen.add(result.cardId!);
			used = result.used;
		}
		expect(seen.size).toBe(3);
	});

	it('starts over once every card was asked', () => {
		const result = drawCard(['x', 'y'], ['x', 'y'], zero);
		expect(result.cardId).toBe('x');
		expect(result.used).toEqual(['x']);
	});

	it('returns no card for an empty deck', () => {
		expect(drawCard([], ['x']).cardId).toBeNull();
	});
});

describe('pickDefaultArenaSession', () => {
	const session = (overrides: Partial<ArenaSessionCandidate>): ArenaSessionCandidate => ({
		id: 's',
		weekNumber: 1,
		heldOn: null,
		isCancelled: false,
		attendanceOpen: false,
		attendanceTakenAt: null,
		...overrides,
	});

	it("prefers today's class", () => {
		const picked = pickDefaultArenaSession(
			[
				session({ id: 'open', weekNumber: 3, attendanceOpen: true }),
				session({ id: 'today', weekNumber: 4, heldOn: '2026-11-10' }),
			],
			'2026-11-10',
		);
		expect(picked?.id).toBe('today');
	});

	it('falls back to the open week, then the latest taken week', () => {
		expect(
			pickDefaultArenaSession(
				[
					session({ id: 'w1', attendanceTakenAt: 'x' }),
					session({ id: 'w2', attendanceOpen: true }),
				],
				'2026-11-10',
			)?.id,
		).toBe('w2');
		expect(
			pickDefaultArenaSession(
				[
					session({ id: 'w1', weekNumber: 1, attendanceTakenAt: 'x' }),
					session({ id: 'w5', weekNumber: 5, attendanceTakenAt: 'x' }),
					session({ id: 'w6', weekNumber: 6 }),
				],
				'2026-11-10',
			)?.id,
		).toBe('w5');
	});

	it('skips cancelled weeks', () => {
		expect(
			pickDefaultArenaSession(
				[session({ id: 'gone', heldOn: '2026-11-10', isCancelled: true })],
				'2026-11-10',
			),
		).toBeNull();
	});
});

describe('vietnamTodayIso', () => {
	it('uses Vietnam time, not UTC', () => {
		expect(vietnamTodayIso(new Date('2026-11-09T18:30:00.000Z'))).toBe('2026-11-10');
	});
});
