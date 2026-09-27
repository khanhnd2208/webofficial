import { describe, expect, it } from 'vitest';

import {
	CHEESE_HOUR_MS,
	CHEESE_INTRO_MS,
	CHEESE_OUTRO_MS,
	PRESETS,
	presetFor,
} from '@/features/cheese-thief/config/cheeseThief';
import { nightEndsAt, segmentAt } from '@/features/cheese-thief/lib/nightSchedule';
import { projectRoom, type ProjectRoom } from '@/features/cheese-thief/lib/projectRoom';
import {
	canPeek,
	deal,
	decideOutcome,
	resolveSecret,
	resolveVoteOrRunoff,
	secretCardFor,
	secretTaskFor,
	sharedChoiceCount,
	theftHourOf,
	wakeHoursOf,
	witnessesOf,
	type Seat,
} from '@/features/cheese-thief/lib/rules';

const timing = { introMs: CHEESE_INTRO_MS, hourMs: CHEESE_HOUR_MS, outroMs: CHEESE_OUTRO_MS };

function seat(partial: Seat): Seat {
	return partial;
}

describe('Cheese Thief presets', () => {
	it('covers 4–8 players with the English follower rules', () => {
		expect(presetFor(4)).toMatchObject({ dicePerPlayer: 2, peek: false, followerMode: 'none' });
		expect(presetFor(5)).toMatchObject({ followerMode: 'witness', peek: true, followersKnowThief: true });
		expect(presetFor(6)).toMatchObject({ followerMode: 'pick', followerPickCount: 1, followersKnowThief: true });
		expect(presetFor(7)).toMatchObject({
			followerPickCount: 2,
			followersKnowThief: false,
			followersKnowEachOther: true,
		});
		expect(presetFor(8)).toMatchObject({
			followerPickCount: 2,
			followersKnowThief: true,
			followersKnowEachOther: false,
		});
		expect(sharedChoiceCount(PRESETS[7])).toBe(2);
		expect(sharedChoiceCount(PRESETS[4])).toBe(1);
		expect(sharedChoiceCount(PRESETS[5])).toBe(1);
	});

	it('deals one thief, optional scapegoat, and legal dice', () => {
		for (let n = 4; n <= 8; n++) {
			const { seats, preset } = deal(
				Array.from({ length: n }, (_, i) => `p${i}`),
				true,
				Math.random,
			);
			expect(seats.filter((s) => s.role === 'thief')).toHaveLength(1);
			expect(seats.filter((s) => s.role === 'scapegoat')).toHaveLength(n >= 6 ? 1 : 0);
			expect(seats.every((s) => s.dice.length === preset.dicePerPlayer)).toBe(true);
			expect(seats.every((s) => s.dice.every((die) => die >= 1 && die <= 6))).toBe(true);
		}
	});
});

describe('wake hours, witnesses, peek', () => {
	const five = PRESETS[5];

	const seats: Seat[] = [
		seat({ id: 'thief', role: 'thief', dice: [2] }),
		seat({ id: 'a', role: 'sleepyhead', dice: [2] }),
		seat({ id: 'b', role: 'sleepyhead', dice: [2] }),
		seat({ id: 'c', role: 'sleepyhead', dice: [5] }),
		seat({ id: 'd', role: 'sleepyhead', dice: [5] }),
	];

	it('the thief takes the cheese at their earliest hour, and only witnesses of that hour count', () => {
		expect(witnessesOf(seats, five).map((s) => s.id).sort()).toEqual(['a', 'b']);
		expect(secretTaskFor(seats[0]!, seats, five)).toMatchObject({
			kind: 'followers',
			count: 1,
			pool: ['a', 'b'],
		});
	});

	it('a sleepyhead awake alone may peek; the thief and a witnessed sleepyhead may not', () => {
		expect(canPeek(seats[0]!, seats, five)).toBe(false);
		expect(canPeek(seats[1]!, seats, five)).toBe(false);
		const alone = [seats[0]!, seats[1]!, seat({ id: 'solo', role: 'sleepyhead', dice: [6] })];
		expect(canPeek(alone[2]!, alone, five)).toBe(true);
		expect(canPeek(alone[2]!, alone, PRESETS[4])).toBe(false);
	});

	it('at 4 players the thief wakes at both dice and a sleepyhead wakes at the one they chose', () => {
		const four = PRESETS[4];
		const thief = seat({ id: 'thief', role: 'thief', dice: [5, 2], chosenHour: 5 });
		const mouse = seat({ id: 'mouse', role: 'sleepyhead', dice: [5, 2], chosenHour: 2 });
		expect(wakeHoursOf(thief, 2)).toEqual([2, 5]);
		expect(theftHourOf(thief, 2)).toBe(2);
		expect(wakeHoursOf(mouse, 2)).toEqual([2]);
		expect(canPeek(mouse, [thief, mouse], four)).toBe(false);
	});

	it('a scapegoat awake alone does not peek', () => {
		const seats6: Seat[] = [
			seat({ id: 'thief', role: 'thief', dice: [1] }),
			seat({ id: 'goat', role: 'scapegoat', dice: [6] }),
		];
		expect(canPeek(seats6[1]!, seats6, PRESETS[6])).toBe(false);
	});
});

describe('secret resolution', () => {
	it('auto-assigns the only witness and lets an alone sleepyhead peek', () => {
		const seats: Seat[] = [
			seat({ id: 'thief', role: 'thief', dice: [3] }),
			seat({ id: 'wit', role: 'sleepyhead', dice: [3] }),
			seat({ id: 'solo', role: 'sleepyhead', dice: [1] }),
			seat({ id: 'other', role: 'sleepyhead', dice: [4] }),
			seat({ id: 'last', role: 'sleepyhead', dice: [4] }),
		];
		const resolved = resolveSecret(
			seats,
			PRESETS[5],
			{ solo: ['thief'], other: ['wit'], last: ['wit'], thief: ['wit'], wit: ['thief'] },
			() => 0,
		);
		expect(resolved.followerIds).toEqual(['wit']);
		expect(resolved.peekByPlayer.solo).toBe('thief');
		expect(resolved.hunchByPlayer.thief).toBe('wit');
		const names = new Map(seats.map((s) => [s.id, s.id]));
		expect(secretCardFor('wit', seats, names, PRESETS[5], resolved).recruited?.thiefName).toBe('thief');
		expect(secretCardFor('solo', seats, names, PRESETS[5], resolved).peek).toEqual({
			name: 'thief',
			hours: [3],
		});
	});

	it('at 7 players followers learn each other and not the thief', () => {
		const seats: Seat[] = [
			seat({ id: 'thief', role: 'thief', dice: [1] }),
			...['a', 'b', 'c', 'd', 'e', 'f'].map((id) => seat({ id, role: 'sleepyhead' as const, dice: [2] })),
		];
		const resolved = resolveSecret(
			seats,
			PRESETS[7],
			{ thief: ['a', 'b'], a: ['thief', 'c'], b: ['thief', 'c'], c: ['thief', 'd'], d: ['x', 'thief'], e: ['thief', 'a'], f: ['thief', 'a'] },
			() => 0,
		);
		expect(resolved.followerIds).toEqual(['a', 'b']);
		const names = new Map(seats.map((s) => [s.id, s.id]));
		const ally = secretCardFor('a', seats, names, PRESETS[7], resolved);
		expect(ally.recruited).toEqual({ thiefName: null, allyNames: ['b'] });
		expect(secretCardFor('thief', seats, names, PRESETS[7], resolved).allies).toEqual(['a', 'b']);
		expect(sharedChoiceCount(PRESETS[7])).toBe(2);
	});

	it('at 8 players followers learn the thief', () => {
		const seats: Seat[] = [
			seat({ id: 'thief', role: 'thief', dice: [1] }),
			...['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) =>
				seat({ id, role: 'sleepyhead' as const, dice: [4] }),
			),
		];
		const resolved = resolveSecret(seats, PRESETS[8], { thief: ['a', 'b'] }, () => 0);
		const names = new Map([['thief', 'Khánh'], ['a', 'Linh'], ['b', 'Minh']]);
		expect(secretCardFor('a', seats, names, PRESETS[8], resolved).recruited).toEqual({
			thiefName: 'Khánh',
			allyNames: [],
		});
	});

	it('a missed follower pick is filled at random and a missed peek is dropped', () => {
		const seats: Seat[] = [
			seat({ id: 'thief', role: 'thief', dice: [1] }),
			seat({ id: 'a', role: 'sleepyhead', dice: [6] }),
			seat({ id: 'b', role: 'sleepyhead', dice: [6] }),
			seat({ id: 'c', role: 'sleepyhead', dice: [2] }),
			seat({ id: 'd', role: 'sleepyhead', dice: [2] }),
			seat({ id: 'e', role: 'sleepyhead', dice: [3] }),
		];
		const resolved = resolveSecret(seats, PRESETS[6], {}, () => 0);
		expect(resolved.followerIds).toEqual(['a']);
		expect(resolved.peekByPlayer).toEqual({});
	});

	it('recruiting the scapegoat still leaves them a scapegoat for the win check', () => {
		const seats: Seat[] = [
			seat({ id: 'thief', role: 'thief', dice: [1] }),
			seat({ id: 'goat', role: 'scapegoat', dice: [2] }),
			seat({ id: 'a', role: 'sleepyhead', dice: [3] }),
			seat({ id: 'b', role: 'sleepyhead', dice: [4] }),
			seat({ id: 'c', role: 'sleepyhead', dice: [5] }),
			seat({ id: 'd', role: 'sleepyhead', dice: [6] }),
		];
		const resolved = resolveSecret(seats, PRESETS[6], { thief: ['goat'] }, () => 0);
		expect(resolved.followerIds).toEqual(['goat']);
		expect(decideOutcome(['goat'], seats)).toBe('scapegoat');
		expect(decideOutcome(['thief'], seats)).toBe('sleepyheads');
		expect(decideOutcome(['a'], seats)).toBe('thief');
	});
});

describe('votes', () => {
	it('a tie opens a runoff, and a second tie flips the whole tied group', () => {
		const first = resolveVoteOrRunoff(
			[
				{ voterId: 'a', targetId: 'b' },
				{ voterId: 'b', targetId: 'a' },
				{ voterId: 'c', targetId: 'a' },
				{ voterId: 'd', targetId: 'b' },
			],
			false,
			['a', 'b', 'c', 'd'],
		);
		expect(first).toEqual({ kind: 'runoff', candidateIds: ['a', 'b'] });
		const second = resolveVoteOrRunoff(
			[
				{ voterId: 'a', targetId: 'b' },
				{ voterId: 'b', targetId: 'a' },
				{ voterId: 'c', targetId: 'a' },
				{ voterId: 'd', targetId: 'b' },
			],
			true,
			['a', 'b'],
		);
		expect(second).toEqual({ kind: 'flip', flippedIds: ['a', 'b'] });
	});

	it('a unique leader is flipped, and the thief among a flipped tie is caught', () => {
		expect(
			resolveVoteOrRunoff(
				[
					{ voterId: 'a', targetId: 'thief' },
					{ voterId: 'b', targetId: 'thief' },
					{ voterId: 'thief', targetId: 'a' },
				],
				false,
				[],
			),
		).toEqual({ kind: 'flip', flippedIds: ['thief'] });
		const seats: Seat[] = [
			seat({ id: 'thief', role: 'thief', dice: [1] }),
			seat({ id: 'a', role: 'sleepyhead', dice: [2] }),
		];
		expect(decideOutcome(['thief', 'a'], seats)).toBe('sleepyheads');
	});
});

describe('night clock', () => {
	it('gives every hour the same length, including hours nobody wakes', () => {
		const start = 1_000_000;
		const spans: number[] = [];
		for (const hour of [1, 2, 3, 4, 5, 6]) {
			const wakeAt = start + CHEESE_INTRO_MS + (hour - 1) * CHEESE_HOUR_MS;
			const wake = segmentAt(start, wakeAt, timing);
			const sleep = segmentAt(start, wakeAt + CHEESE_HOUR_MS / 2, timing);
			expect(wake).toMatchObject({ kind: 'hour-wake', hour });
			expect(sleep).toMatchObject({ kind: 'hour-sleep', hour });
			spans.push(sleep.endsAt - wakeAt);
		}
		expect(new Set(spans)).toEqual(new Set([CHEESE_HOUR_MS]));
		expect(segmentAt(start, start, timing).kind).toBe('intro');
		expect(segmentAt(start, nightEndsAt(start, timing) - 1, timing).kind).toBe('outro');
		expect(segmentAt(start, nightEndsAt(start, timing), timing).kind).toBe('done');
	});
});

describe('room projection does not leak', () => {
	function room(phase: ProjectRoom['phase']): ProjectRoom {
		return {
			code: 'ABC',
			name: 'Bàn',
			phase,
			version: 3,
			isPublic: false,
			maxPlayers: 8,
			scapegoatEnabled: false,
			hostToken: 'tok-a',
			choiceCount: 2,
			isRunoff: false,
			voteCandidateIds: [],
			flippedIds: [],
			followerIds: ['b'],
			preset: PRESETS[7],
			resolved: {
				followerIds: ['b', 'c'],
				peekByPlayer: { d: 'a' },
				hunchByPlayer: { e: 'a' },
			},
			players: [
				{ token: 'tok-a', id: 'a', name: 'Khánh', avatarSeed: 'a', connected: true, role: 'thief', dice: [1], hasMemorizedRole: true, hasSeenSecret: false },
				{ token: 'tok-b', id: 'b', name: 'Linh', avatarSeed: 'b', connected: true, role: 'sleepyhead', dice: [4], hasMemorizedRole: true, hasSeenSecret: false },
				{ token: 'tok-c', id: 'c', name: 'Minh', avatarSeed: 'c', connected: true, role: 'sleepyhead', dice: [5], hasMemorizedRole: false, hasSeenSecret: false },
			],
		};
	}

	it('hides every other role, hour, and secret during the secret minute', () => {
		const dto = projectRoom(room('secret'), 'tok-b', new Date('2026-09-27T12:00:00Z'));
		expect(dto.choiceCount).toBe(2);
		expect(dto.players.every((player) => player.role === undefined && player.wakeHours === undefined)).toBe(true);
		expect(dto.players.every((player) => !('hasSecretPicks' in player) && player.hasMemorizedRole === undefined)).toBe(true);
		expect(dto.self?.role).toBeUndefined();
		expect(dto.self?.secretCard).toBeUndefined();
		expect(dto.self?.dice).toBeUndefined();
		const serialized = JSON.stringify(dto);
		expect(serialized).not.toContain('thief');
		expect(serialized).not.toContain('tok-a');
		expect(serialized).not.toContain('sleepyhead');
	});

	it('shows a player only their own card after the secret minute', () => {
		const dto = projectRoom(room('secret-result'), 'tok-b', new Date());
		expect(dto.self?.secretCard?.recruited?.thiefName).toBeNull();
		expect(dto.self?.secretCard?.recruited?.allyNames).toEqual(['Minh']);
		expect(dto.players.every((player) => player.role === undefined)).toBe(true);
		expect(JSON.stringify(dto.players)).not.toContain('peek');
	});

	it('opens the roster only at the reveal', () => {
		const dto = projectRoom(
			{ ...room('reveal'), winner: 'thief', flippedIds: ['e'], followerIds: ['b', 'c'] },
			'tok-b',
			new Date(),
		);
		expect(dto.roster?.map((row) => row.role)).toContain('thief');
		expect(dto.players.find((player) => player.id === 'a')?.wakeHours).toEqual([1]);
	});
});
