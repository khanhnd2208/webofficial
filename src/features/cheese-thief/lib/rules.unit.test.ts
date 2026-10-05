import { describe, expect, it } from 'vitest';

import {
	CHEESE_HOUR_MS,
	CHEESE_INTRO_MS,
	CHEESE_OUTRO_MS,
	maxFollowersFor,
	nightTiming,
	presetFor,
} from '@/features/cheese-thief/config/cheeseThief';
import {
	CHEESE_VOICE_CLIPS,
	narrationKey,
	nightCues,
	nightEndsAt,
	segmentAt,
} from '@/features/cheese-thief/lib/nightSchedule';
import { projectRoom, type ProjectRoom } from '@/features/cheese-thief/lib/projectRoom';
import {
	canPeek,
	deal,
	decideOutcome,
	resolveSecret,
	resolveVote,
	secretCardFor,
	secretJobFor,
	sharedChoiceCount,
	theftHourOf,
	wakeHoursOf,
	type Seat,
} from '@/features/cheese-thief/lib/rules';

const timing = { introMs: CHEESE_INTRO_MS, hourMs: CHEESE_HOUR_MS, outroMs: CHEESE_OUTRO_MS };

function seat(partial: Seat): Seat {
	return partial;
}

describe('Cheese Thief presets', () => {
	it('keeps the thief side a minority at every table size', () => {
		expect([4, 5, 6, 7, 8, 9, 10, 11, 12].map(maxFollowersFor)).toEqual([
			0, 1, 1, 2, 2, 3, 3, 4, 4,
		]);
	});

	it('uses the boxed defaults, and the thief now names every follower', () => {
		expect(presetFor(4)).toMatchObject({
			peek: false,
			followerMode: 'none',
			followerPickCount: 0,
		});
		expect(presetFor(5)).toMatchObject({
			followerMode: 'pick',
			followerPickCount: 1,
			peek: true,
			followersKnowThief: true,
			followersKnowEachOther: false,
		});
		expect(presetFor(6)).toMatchObject({
			followerMode: 'pick',
			followerPickCount: 1,
			followersKnowThief: true,
		});
		expect(presetFor(7)).toMatchObject({
			followerPickCount: 2,
			followersKnowThief: false,
			followersKnowEachOther: true,
		});
		expect(presetFor(8)).toMatchObject({
			followerPickCount: 2,
			followersKnowThief: true,
			followersKnowEachOther: true,
		});
		expect(presetFor(9)).toMatchObject({
			followerPickCount: 2,
			followersKnowThief: true,
			followersKnowEachOther: true,
		});
		expect(presetFor(12)).toMatchObject({
			followerPickCount: 3,
			followersKnowThief: true,
			thiefKnowsFollowers: true,
		});
		expect(sharedChoiceCount(presetFor(7))).toBe(2);
		expect(sharedChoiceCount(presetFor(4))).toBe(1);
		expect(sharedChoiceCount(presetFor(5))).toBe(1);
	});

	it('lets the host override follower count and what they learn', () => {
		const none = presetFor(8, { count: 0 });
		expect(none).toMatchObject({ followerMode: 'none', followerPickCount: 0 });
		expect(sharedChoiceCount(none)).toBe(1);

		const four = presetFor(12, { count: 4, knowledge: 'team' });
		expect(four).toMatchObject({
			followerMode: 'pick',
			followerPickCount: 4,
			followersKnowThief: false,
			followersKnowEachOther: true,
			thiefKnowsFollowers: true,
		});
		expect(sharedChoiceCount(four)).toBe(4);

		expect(presetFor(6, { count: 1, knowledge: 'team' })).toMatchObject({
			followersKnowThief: false,
			followersKnowEachOther: false,
			thiefKnowsFollowers: true,
		});
		expect(presetFor(8, { count: 2, knowledge: 'team' })).toMatchObject({
			followersKnowThief: false,
			followersKnowEachOther: true,
		});
		expect(presetFor(8, { count: 9 }).followerPickCount).toBe(2);
	});

	it('seats every table from 4 to 12 with one number each', () => {
		expect(() => presetFor(3)).toThrow(/4–12/);
		expect(() => presetFor(13)).toThrow(/4–12/);
		expect(presetFor(9)).toMatchObject({
			followerMode: 'pick',
			followerPickCount: 2,
			followersKnowThief: true,
			followersKnowEachOther: true,
		});
		for (const count of [4, 10, 11, 12]) {
			expect(presetFor(count)).toMatchObject({
				peek: count > 4,
				followerPickCount: count === 4 ? 0 : 3,
				thiefKnowsFollowers: count > 4,
			});
		}
		expect(presetFor(4).followerMode).toBe('none');
	});

	it('deals one thief, optional scapegoat, and legal dice', () => {
		for (let n = 4; n <= 12; n++) {
			const { seats } = deal(
				Array.from({ length: n }, (_, i) => `p${i}`),
				true,
				Math.random,
			);
			expect(seats.filter((s) => s.role === 'thief')).toHaveLength(1);
			expect(seats.filter((s) => s.role === 'scapegoat')).toHaveLength(n >= 6 ? 1 : 0);
			expect(seats.every((s) => s.dice.length === 1)).toBe(true);
			expect(seats.every((s) => s.dice.every((die) => die >= 1 && die <= 6))).toBe(true);
		}
	});
});

describe('wake hours, witnesses, peek', () => {
	const five = presetFor(5);

	const seats: Seat[] = [
		seat({ id: 'thief', role: 'thief', dice: [2] }),
		seat({ id: 'a', role: 'sleepyhead', dice: [2] }),
		seat({ id: 'b', role: 'sleepyhead', dice: [2] }),
		seat({ id: 'c', role: 'sleepyhead', dice: [5] }),
		seat({ id: 'd', role: 'sleepyhead', dice: [5] }),
	];

	it('the thief takes the cheese at their earliest hour and names a follower from the whole table', () => {
		expect(theftHourOf(seats[0]!)).toBe(2);
		expect(secretJobFor(seats[0]!, seats, five)).toEqual({
			followers: { count: 1, pool: ['a', 'b', 'c', 'd'] },
			peek: false,
		});
	});

	it('a sleepyhead awake alone may peek; the thief and a witnessed sleepyhead may not', () => {
		expect(canPeek(seats[0]!, seats, five)).toBe(false);
		expect(canPeek(seats[1]!, seats, five)).toBe(false);
		const alone = [seats[0]!, seats[1]!, seat({ id: 'solo', role: 'sleepyhead', dice: [6] })];
		expect(canPeek(alone[2]!, alone, five)).toBe(true);
		expect(canPeek(alone[2]!, alone, presetFor(4))).toBe(false);
	});

	it('gives four players one number, and nobody there can peek', () => {
		const four = presetFor(4);
		const thief = seat({ id: 'thief', role: 'thief', dice: [5] });
		const mouse = seat({ id: 'mouse', role: 'sleepyhead', dice: [2] });
		expect(wakeHoursOf(thief)).toEqual([5]);
		expect(theftHourOf(thief)).toBe(5);
		expect(wakeHoursOf(mouse)).toEqual([2]);
		expect(canPeek(mouse, [thief, mouse], four)).toBe(false);
		expect(canPeek(thief, [thief, mouse], four)).toBe(false);
		expect(sharedChoiceCount(four)).toBe(Math.max(1, four.followerPickCount));
	});

	it('a scapegoat awake alone peeks, as a Sleepyhead does', () => {
		const seats6: Seat[] = [
			seat({ id: 'thief', role: 'thief', dice: [1] }),
			seat({ id: 'goat', role: 'scapegoat', dice: [6] }),
		];
		expect(canPeek(seats6[1]!, seats6, presetFor(6))).toBe(true);
		expect(canPeek(seats6[0]!, seats6, presetFor(6))).toBe(false);
	});
});

describe('secret resolution', () => {
	it('at 5 players the thief picks the follower, and an alone sleepyhead may peek', () => {
		const seats: Seat[] = [
			seat({ id: 'thief', role: 'thief', dice: [3] }),
			seat({ id: 'wit', role: 'sleepyhead', dice: [3] }),
			seat({ id: 'solo', role: 'sleepyhead', dice: [1] }),
			seat({ id: 'other', role: 'sleepyhead', dice: [4] }),
			seat({ id: 'last', role: 'sleepyhead', dice: [4] }),
		];
		const resolved = resolveSecret(
			seats,
			presetFor(5),
			{ solo: ['thief'], other: ['wit'], last: ['wit'], thief: ['wit'], wit: ['thief'] },
			() => 0,
		);
		expect(resolved.followerIds).toEqual(['wit']);
		expect(resolved.peekByPlayer.solo).toBe('thief');
		expect(resolved.hunchByPlayer.thief).toBeUndefined();
		const names = new Map(seats.map((s) => [s.id, s.id]));
		expect(secretCardFor('wit', seats, names, presetFor(5), resolved).recruited).toEqual({
			thiefName: 'thief',
			allyNames: [],
		});
		expect(secretCardFor('solo', seats, names, presetFor(5), resolved).peek).toEqual({
			name: 'thief',
			hours: [3],
		});
	});

	it('at 7 players followers learn each other and not the thief', () => {
		const seats: Seat[] = [
			seat({ id: 'thief', role: 'thief', dice: [1] }),
			...['a', 'b', 'c', 'd', 'e', 'f'].map((id) =>
				seat({ id, role: 'sleepyhead' as const, dice: [2] }),
			),
		];
		const resolved = resolveSecret(
			seats,
			presetFor(7),
			{
				thief: ['a', 'b'],
				a: ['thief', 'c'],
				b: ['thief', 'c'],
				c: ['thief', 'd'],
				d: ['x', 'thief'],
				e: ['thief', 'a'],
				f: ['thief', 'a'],
			},
			() => 0,
		);
		expect(resolved.followerIds).toEqual(['a', 'b']);
		const names = new Map(seats.map((s) => [s.id, s.id]));
		const ally = secretCardFor('a', seats, names, presetFor(7), resolved);
		expect(ally.recruited).toEqual({ thiefName: null, allyNames: ['b'] });
		expect(secretCardFor('thief', seats, names, presetFor(7), resolved).allies).toEqual(['a', 'b']);
		expect(sharedChoiceCount(presetFor(7))).toBe(2);
	});

	it('at 8 players followers learn the thief and each other', () => {
		const seats: Seat[] = [
			seat({ id: 'thief', role: 'thief', dice: [1] }),
			...['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) =>
				seat({ id, role: 'sleepyhead' as const, dice: [4] }),
			),
		];
		const resolved = resolveSecret(seats, presetFor(8), { thief: ['a', 'b'] }, () => 0);
		const names = new Map([
			['thief', 'Khánh'],
			['a', 'Linh'],
			['b', 'Minh'],
		]);
		expect(secretCardFor('a', seats, names, presetFor(8), resolved).recruited).toEqual({
			thiefName: 'Khánh',
			allyNames: ['Minh'],
		});
	});

	it('hides the thief from one follower on team knowledge, and from two who still know each other', () => {
		const one: Seat[] = [
			seat({ id: 'thief', role: 'thief', dice: [1] }),
			...['a', 'b', 'c', 'd', 'e'].map((id) =>
				seat({ id, role: 'sleepyhead' as const, dice: [2] }),
			),
		];
		const blind = presetFor(6, { count: 1, knowledge: 'team' });
		const picked = resolveSecret(one, blind, { thief: ['a'] }, () => 0);
		expect(
			secretCardFor('a', one, new Map(one.map((s) => [s.id, s.id])), blind, picked).recruited,
		).toEqual({
			thiefName: null,
			allyNames: [],
		});

		const two: Seat[] = [
			seat({ id: 'thief', role: 'thief', dice: [1] }),
			...['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) =>
				seat({ id, role: 'sleepyhead' as const, dice: [2] }),
			),
		];
		const team = presetFor(8, { count: 2, knowledge: 'team' });
		const paired = resolveSecret(two, team, { thief: ['a', 'b'] }, () => 0);
		expect(
			secretCardFor('a', two, new Map(two.map((s) => [s.id, s.id])), team, paired).recruited,
		).toEqual({
			thiefName: null,
			allyNames: ['b'],
		});
	});

	it('fills all four followers at random when the thief picks nobody', () => {
		const ids = ['thief', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'];
		const seats: Seat[] = ids.map((id) =>
			seat({ id, role: id === 'thief' ? 'thief' : 'sleepyhead', dice: [1] }),
		);
		const preset = presetFor(12, { count: 4, knowledge: 'team' });
		const resolved = resolveSecret(seats, preset, {}, () => 0);
		expect(resolved.followerIds).toEqual(['a', 'b', 'c', 'd']);
		const card = secretCardFor(
			'a',
			seats,
			new Map(seats.map((s) => [s.id, s.id])),
			preset,
			resolved,
		);
		expect(card.recruited?.thiefName).toBeNull();
		expect(card.recruited?.allyNames).toEqual(['b', 'c', 'd']);
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
		const resolved = resolveSecret(seats, presetFor(6), {}, () => 0);
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
		const resolved = resolveSecret(seats, presetFor(6), { thief: ['goat'] }, () => 0);
		expect(resolved.followerIds).toEqual(['goat']);
		expect(decideOutcome(['goat'], seats)).toBe('scapegoat');
		expect(decideOutcome(['thief'], seats)).toBe('sleepyheads');
		expect(decideOutcome(['a'], seats)).toBe('thief');
	});
});

describe('votes', () => {
	it('a tie stays a tie, and a second tie stays inside the same group', () => {
		const ballots = [
			{ voterId: 'a', targetId: 'b' },
			{ voterId: 'b', targetId: 'a' },
			{ voterId: 'c', targetId: 'a' },
			{ voterId: 'd', targetId: 'b' },
		];
		expect(resolveVote(ballots, ['a', 'b', 'c', 'd'])).toEqual({
			kind: 'tie',
			candidateIds: ['a', 'b'],
		});
		expect(resolveVote(ballots, ['a', 'b'])).toEqual({ kind: 'tie', candidateIds: ['a', 'b'] });
	});

	it('a three-way tie can shrink to the two names that stay level', () => {
		const narrowed = resolveVote(
			[
				{ voterId: 'a', targetId: 'b' },
				{ voterId: 'b', targetId: 'a' },
				{ voterId: 'c', targetId: 'a' },
				{ voterId: 'd', targetId: 'b' },
			],
			['a', 'b', 'c'],
		);
		expect(narrowed).toEqual({ kind: 'tie', candidateIds: ['a', 'b'] });
	});

	it('a unique leader is flipped, and the thief among a flipped tie is caught', () => {
		expect(
			resolveVote(
				[
					{ voterId: 'a', targetId: 'thief' },
					{ voterId: 'b', targetId: 'thief' },
					{ voterId: 'thief', targetId: 'a' },
				],
				['a', 'b', 'thief'],
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
			const sleep = segmentAt(start, wakeAt + CHEESE_HOUR_MS - 1, timing);
			expect(wake).toMatchObject({ kind: 'hour-wake', hour });
			expect(sleep).toMatchObject({ kind: 'hour-sleep', hour });
			spans.push(sleep.endsAt - wakeAt);
		}
		expect(new Set(spans)).toEqual(new Set([CHEESE_HOUR_MS]));
		expect(segmentAt(start, start, timing).kind).toBe('intro');
		expect(segmentAt(start, nightEndsAt(start, timing) - 1, timing).kind).toBe('outro');
		expect(segmentAt(start, nightEndsAt(start, timing), timing).kind).toBe('done');
	});

	it('spends a longer host-set hour on open eyes, not on the sleep line', () => {
		const start = 1_000_000;
		const long = nightTiming(24);
		expect(long.hourMs).toBe(24_000);
		const wakeAt = start + long.introMs;
		expect(segmentAt(start, wakeAt, long)).toMatchObject({
			kind: 'hour-wake',
			hour: 1,
			endsAt: wakeAt + 20_000,
		});
		expect(segmentAt(start, wakeAt + 20_000, long)).toMatchObject({
			kind: 'hour-sleep',
			hour: 1,
			endsAt: wakeAt + 24_000,
		});
		expect(nightEndsAt(start, long)).toBe(start + long.introMs + 6 * 24_000 + long.outroMs);

		const short = nightTiming(8);
		expect(segmentAt(start, start + short.introMs + 4_000, short)).toMatchObject({
			kind: 'hour-sleep',
			hour: 1,
		});
	});

	it('falls back to the default hour for an out-of-range value', () => {
		expect(nightTiming(6).hourMs).toBe(CHEESE_HOUR_MS);
		expect(nightTiming(31).hourMs).toBe(CHEESE_HOUR_MS);
		expect(nightTiming(7.5).hourMs).toBe(CHEESE_HOUR_MS);
	});
});

describe('narration', () => {
	const start = 1_000_000;
	const intro = segmentAt(start, start, timing);
	const outro = segmentAt(start, nightEndsAt(start, timing) - 1, timing);

	it('names the night-start and night-end lines', () => {
		expect(narrationKey(intro)).toBe('night-start');
		expect(narrationKey(outro)).toBe('night-end');
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
			preset: presetFor(7),
			resolved: {
				followerIds: ['b', 'c'],
				peekByPlayer: { d: 'a' },
				hunchByPlayer: { e: 'a' },
			},
			players: [
				{
					token: 'tok-a',
					id: 'a',
					name: 'Khánh',
					avatarSeed: 'a',
					connected: true,
					role: 'thief',
					dice: [1],
					hasMemorizedRole: true,
					hasSeenSecret: false,
				},
				{
					token: 'tok-b',
					id: 'b',
					name: 'Linh',
					avatarSeed: 'b',
					connected: true,
					role: 'sleepyhead',
					dice: [4],
					hasMemorizedRole: true,
					hasSeenSecret: false,
				},
				{
					token: 'tok-c',
					id: 'c',
					name: 'Minh',
					avatarSeed: 'c',
					connected: true,
					role: 'sleepyhead',
					dice: [5],
					hasMemorizedRole: false,
					hasSeenSecret: false,
				},
			],
		};
	}

	it('hides every other role, hour, and secret during the secret minute', () => {
		const dto = projectRoom(room('secret'), 'tok-b', new Date('2026-09-27T12:00:00Z'));
		expect(dto.choiceCount).toBe(2);
		expect(
			dto.players.every((player) => player.role === undefined && player.wakeHours === undefined),
		).toBe(true);
		expect(
			dto.players.every(
				(player) => !('hasSecretPicks' in player) && player.hasMemorizedRole === undefined,
			),
		).toBe(true);
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
		expect(dto.theftHour).toBe(1);
		expect(dto.roster?.every((row) => row.wakeHours.length === 1)).toBe(true);
	});

	it('hides roles and jobs through the night', () => {
		const dto = projectRoom({ ...room('night'), nightStartedAt: new Date() }, 'tok-b', new Date());
		const serialized = JSON.stringify(dto);
		expect(serialized).not.toContain('thief');
		expect(serialized).not.toContain('sleepyhead');
		expect(dto.self?.secretJob).toBeUndefined();
		expect(dto.self?.wakeHours).toBeUndefined();
		expect(dto.theftHour).toBeUndefined();
	});

	it('puts the secret job only on the viewer, and one hour on their own deal card', () => {
		const secret = projectRoom(room('secret'), 'tok-b', new Date());
		expect(secret.self?.secretJob).toEqual({ followers: 0, peek: expect.any(Boolean) });
		expect(secret.players.every((player) => !('secretJob' in player))).toBe(true);
		expect(JSON.stringify(secret.players)).not.toContain('secretJob');

		const dealt = projectRoom(room('deal'), 'tok-b', new Date());
		expect(dealt.self?.wakeHours).toEqual([4]);
		expect(JSON.stringify(dealt.players)).not.toContain('wakeHours');
	});

	it('names the theft hour only once the cards are turned', () => {
		const hidden = projectRoom(room('secret'), 'tok-b', new Date());
		expect(hidden.theftHour).toBeUndefined();
		const revealed = projectRoom({ ...room('reveal'), winner: 'thief' }, 'tok-b', new Date());
		expect(revealed.theftHour).toBe(1);
		expect(revealed.roster?.every((row) => row.wakeHours.length === 1)).toBe(true);
	});
});

describe('night track cues', () => {
	it('lays every recorded line on the same clock the host screen shows', () => {
		const timing = nightTiming(14);
		const cues = nightCues(timing);
		expect(cues.map((cue) => cue.clip)).toEqual([
			'night-start',
			...[1, 2, 3, 4, 5, 6].flatMap((hour) => [`wake-${hour}`, 'sleep']),
			'night-end',
		]);
		expect(cues[1]).toEqual({ atMs: 8_000, clip: 'wake-1' });
		expect(cues[2]).toEqual({ atMs: 18_000, clip: 'sleep' });
		expect(cues.at(-1)).toEqual({ atMs: 8_000 + 6 * 14_000, clip: 'night-end' });
		for (const cue of cues) expect(CHEESE_VOICE_CLIPS).toContain(cue.clip);
	});
});
