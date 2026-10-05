import { afterEach, describe, expect, it } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

import SpyGame from '@/features/spy-fall/models/SpyGame';
import CheeseRoom from '@/features/cheese-thief/models/CheeseThiefRoom';
import WerewolfRoom from '@/features/werewolf/models/WerewolfRoom';
import {
	createRoom as createPublicSpyRoom,
	listPublicRooms as listSpyPublicRooms,
} from '@/features/spy-fall/services/spyGameService';
import {
	createRoom as createPublicCheeseRoom,
	listPublicRooms as listCheesePublicRooms,
} from '@/features/cheese-thief/services/cheeseThiefService';
import { commandTestRoom, createTestRoom, readTestRoom } from './service';
import type { TestRoomEnvelope } from './types';
import { withPublicRoomGuard } from '@/features/board-game-shared/lib/apiUtils';

afterEach(async () => {
	await Promise.all([
		SpyGame.deleteMany({}),
		CheeseRoom.deleteMany({}),
		WerewolfRoom.deleteMany({}),
	]);
});

describe('admin board game test rooms', () => {
	it('keeps Spy Fall private and returns the selected bot player view', async () => {
		const created = (await createTestRoom('admin-a', {
			game: 'spy-fall',
			hostName: 'Admin',
			playerCount: 4,
			seed: 'spy-case',
		})) as TestRoomEnvelope;
		const code = created.state.code;

		await expect(readTestRoom('admin-b', 'spy-fall', code)).rejects.toThrow();
		const botId = (created.state.players as unknown as { id: string; name: string }[]).find(
			(player) => player.name === 'Bot 1',
		)!.id;
		const changed = (await commandTestRoom('admin-a', 'spy-fall', code, {
			kind: 'set-seat',
			seatId: botId,
		})) as TestRoomEnvelope;

		expect(changed.controlledSeatId).toBe(botId);
		expect(changed.state.self?.name).toBe('Bot 1');
		expect(changed.state.isHost).toBe(false);
		const persisted = await SpyGame.findOne({ code }).lean();
		expect(JSON.stringify(changed)).not.toContain(persisted!.hostToken);
	});

	it('routes Cheese Thief actions through the controlled seat', async () => {
		const created = (await createTestRoom('admin-a', {
			game: 'cheese-thief',
			hostName: 'Admin',
			playerCount: 4,
			seed: 'cheese-case',
		})) as TestRoomEnvelope;
		const botId = (created.state.players as unknown as { id: string; name: string }[]).find(
			(player) => player.name === 'Bot 1',
		)!.id;
		const changed = (await commandTestRoom('admin-a', 'cheese-thief', created.state.code, {
			kind: 'set-seat',
			seatId: botId,
		})) as TestRoomEnvelope;

		expect(changed.state.self?.name).toBe('Bot 1');
		expect(changed.state.isHost).toBe(false);
		const persisted = await CheeseRoom.findOne({ code: created.state.code }).lean();
		expect(JSON.stringify(changed)).not.toContain(persisted!.hostToken);
	});

	it('supports the Ma Sói host and bot seat identities without returning auth tokens', async () => {
		const created = (await createTestRoom('admin-a', {
			game: 'ma-soi',
			hostName: 'Admin',
			playerCount: 5,
			seed: 'wolf-case',
		})) as TestRoomEnvelope;
		const code = created.state.code;
		const changed = (await commandTestRoom('admin-a', 'ma-soi', code, {
			kind: 'set-seat',
			seatId: 'bot-1',
		})) as TestRoomEnvelope;

		expect(changed.controlledSeatId).toBe('bot-1');
		expect(changed.state.self?.name).toBe('Bot 1');
		expect(changed.state.isHost).toBe(false);
		const persisted = await WerewolfRoom.findOne({ code }).lean();
		expect(JSON.stringify(changed)).not.toContain(persisted!.hostToken);
	});

	it('keeps ordinary rooms in public lobbies and omits admin test rooms', async () => {
		const publicSpy = await createPublicSpyRoom({
			name: 'Public Spy',
			hostName: 'Host',
			maxPlayers: 5,
			isPublic: true,
		});
		const testSpy = await createTestRoom('admin-a', {
			game: 'spy-fall',
			hostName: 'Admin',
			playerCount: 4,
		});
		await SpyGame.updateOne({ code: testSpy.state.code }, { $set: { isPublic: true } });
		const spyRooms = await listSpyPublicRooms();
		expect(spyRooms.some((room) => room.code === publicSpy.code)).toBe(true);
		expect(spyRooms.some((room) => room.code === testSpy.state.code)).toBe(false);
		const publicEndpoint = withPublicRoomGuard(SpyGame, async () =>
			NextResponse.json({ ok: true }),
		);
		const request = new NextRequest('http://localhost/api/spy/rooms/' + publicSpy.code + '/state');
		const regularResponse = await publicEndpoint(request, {
			params: Promise.resolve({ code: publicSpy.code }),
		});
		const testResponse = await publicEndpoint(request, {
			params: Promise.resolve({ code: testSpy.state.code }),
		});
		expect(regularResponse.status).toBe(200);
		expect(testResponse.status).toBe(404);

		const publicCheese = await createPublicCheeseRoom({
			name: 'Public Cheese',
			hostName: 'Host',
			maxPlayers: 4,
			isPublic: true,
		});
		const testCheese = await createTestRoom('admin-a', {
			game: 'cheese-thief',
			hostName: 'Admin',
			playerCount: 4,
		});
		await CheeseRoom.updateOne({ code: testCheese.state.code }, { $set: { isPublic: true } });
		const cheeseRooms = await listCheesePublicRooms();
		expect(cheeseRooms.some((room) => room.code === publicCheese.code)).toBe(true);
		expect(cheeseRooms.some((room) => room.code === testCheese.state.code)).toBe(false);
	});
});

// These tests use MongoMemoryServer from setup.integration.ts, never a live room.
import type { TestCommand, TestGame } from './types';
import type { RoomStateDTO as SpyState } from '@/features/spy-fall/types/spyGame';
import type { RoomStateDTO as CheeseState } from '@/features/cheese-thief/types';
const owner = 'flow-admin';
async function act(room: TestRoomEnvelope, command: TestCommand) {
	return (await commandTestRoom(owner, room.game, room.state.code, command)) as TestRoomEnvelope;
}
async function make(game: TestGame, count = 6, extra = {}) {
	return createTestRoom(owner, {
		game,
		hostName: 'Host',
		playerCount: count,
		seed: 'flow-seed',
		...extra,
	});
}
async function steps(room: TestRoomEnvelope, count: number) {
	for (let i = 0; i < count; i++) room = await act(room, { kind: 'step' });
	return room;
}

describe('real game logic with controlled seats', () => {
	it('plays Spy Fall to a result, keeps the controlled seat manual and repeats the seeded deal', async () => {
		let room = await make('spy-fall', 4);
		room = await act(room, { kind: 'start' });
		const first = await SpyGame.findOne({ code: room.state.code }).lean();
		room = await steps(room, 5);
		expect(room.state.phase).toBe('role-reveal');
		expect((room.state as SpyState).self?.hasMemorizedRole).toBe(false);
		room = await act(room, { kind: 'remember' });
		expect(room.state.phase).toBe('discussion');
		room = await act(room, { kind: 'next' });
		const spy = first!.players.find((p) => p.role === 'spy')!;
		for (const p of first!.players)
			room = await act(room, {
				kind: 'vote',
				playerId: p.id,
				targetId: p.id === spy.id ? first!.players.find((p) => p.id !== spy.id)!.id : spy.id,
			});
		expect(room.state.phase).toBe('result');
		room = await act(room, { kind: 'reset', sameSeed: true });
		room = await act(room, { kind: 'start' });
		const second = await SpyGame.findOne({ code: room.state.code }).lean();
		expect(second!.players.map((p) => [p.role, p.keyword])).toEqual(
			first!.players.map((p) => [p.role, p.keyword]),
		);
		expect(
			second!.players.every((p) => !p.voteToken && !p.hasMemorizedRole && !p.isEliminated),
		).toBe(true);
	});

	it('uses only runoff candidates and survives two consecutive Spy Fall ties', async () => {
		let room = await make('spy-fall', 4);
		room = await act(room, { kind: 'start' });
		room = await steps(room, 3);
		room = await act(room, { kind: 'remember' });
		room = await act(room, { kind: 'next' });
		const players = (room.state as SpyState).players;
		const ballot = [1, 0, 0, 1];
		for (let i = 0; i < 4; i++)
			room = await act(room, {
				kind: 'vote',
				playerId: players[i].id,
				targetId: players[ballot[i]].id,
			});
		expect((room.state as SpyState).isRevote).toBe(true);
		room = await steps(room, 3);
		const persisted = await SpyGame.findOne({ code: room.state.code }).lean();
		expect(
			persisted!.players
				.filter((p) => p.voteToken)
				.every((p) => persisted!.voteCandidates.includes(p.voteToken!)),
		).toBe(true);
		for (let i = 0; i < 4 && room.state.phase === 'vote'; i++)
			room = await act(room, {
				kind: 'vote',
				playerId: players[i].id,
				targetId: players[ballot[i]].id,
			});
		expect(room.state.phase).not.toBe('vote');
	});

	it.each([4, 6] as const)('plays Cheese with %i players to a result', async (count) => {
		let room = await make('cheese-thief', count, {
			startingSeat: 'player',
			scapegoat: count >= 6,
		});
		room = await act(room, { kind: 'step' });
		expect(room.state.phase).toBe('deal');
		room = await steps(room, count + 1);
		expect((room.state as CheeseState).self?.hasMemorizedRole).toBe(false);
		room = await act(room, { kind: 'remember' });
		room = await act(room, { kind: 'step' });
		expect(room.state.phase).toBe('night');
		room = await act(room, { kind: 'run', running: false });
		const before = await CheeseRoom.findOne({ code: room.state.code }).lean();
		await new Promise((resolve) => setTimeout(resolve, 20));
		await readTestRoom(owner, room.game, room.state.code);
		const after = await CheeseRoom.findOne({ code: room.state.code }).lean();
		expect(after!.updatedAt).toEqual(before!.updatedAt);
		expect(after!.nightStartedAt).toEqual(before!.nightStartedAt);
		room = await act(room, { kind: 'skip-time' });
		expect(room.state.phase).toBe('secret');
		const state = room.state as CheeseState;
		room = await act(room, {
			kind: 'secret',
			picks: state.players
				.filter((p) => p.id !== state.self!.id)
				.slice(0, state.choiceCount)
				.map((p) => p.id),
		});
		room = await steps(room, count);
		room = await act(room, { kind: 'skip-time' });
		expect(room.state.phase).toBe('secret-result');
		room = await steps(room, count);
		room = await act(room, { kind: 'seen' });
		expect(room.state.phase).toBe('day');
		room = await act(room, { kind: 'set-seat', seatId: 'admin' });
		room = await act(room, { kind: 'start-vote' });
		const voters = (room.state as CheeseState).players;
		for (let i = 0; i < count; i++)
			room = await act(room, {
				kind: 'vote',
				playerId: voters[i].id,
				targetId: voters[i === 0 ? 1 : 0].id,
			});
		expect(room.state.phase).toBe('reveal');
	});

	it('Ma Sói host bot deals but leaves the selected player card for the user', async () => {
		let room = await make('ma-soi', 5, { startingSeat: 'player' });
		room = await steps(room, 7);
		expect(room.state.phase).toBe('dealt');
		expect(room.state.self && 'viewed' in room.state.self && room.state.self.viewed).toBe(false);
		room = await act(room, { kind: 'viewed' });
		room = await act(room, { kind: 'set-seat', seatId: 'host' });
		expect(room.state.isHost).toBe(true);
		expect(room.state.players.every((p) => 'viewed' in p && p.viewed)).toBe(true);
		room = await act(room, { kind: 'lobby' });
		expect(room.state.phase).toBe('lobby');
	});

	it('rejects stale concurrent commands and does not apply a request twice', async () => {
		let room = await make('spy-fall', 4);
		const cursor = {
			requestId: crypto.randomUUID(),
			expectedVersion: room.version,
			controlledSeatId: room.controlledSeatId,
		};
		const secondCursor = { ...cursor, requestId: crypto.randomUUID() };
		const results = await Promise.allSettled([
			commandTestRoom(owner, room.game, room.state.code, { kind: 'start' }, cursor),
			commandTestRoom(owner, room.game, room.state.code, { kind: 'start' }, secondCursor),
		]);
		expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
		room = await readTestRoom(owner, room.game, room.state.code);
		const version = room.version;
		await commandTestRoom(
			owner,
			room.game,
			room.state.code,
			{ kind: 'start' },
			results[0].status === 'fulfilled' ? cursor : secondCursor,
		);
		expect((await readTestRoom(owner, room.game, room.state.code)).version).toBe(version);
		await expect(
			commandTestRoom(
				owner,
				room.game,
				room.state.code,
				{ kind: 'step' },
				{ ...cursor, requestId: crypto.randomUUID() },
			),
		).rejects.toMatchObject({ code: 'TEST_STATE_CONFLICT' });
	});

	it('freezes after a disconnected tab and preserves selected-seat permissions', async () => {
		let room = await make('spy-fall', 4, { startingSeat: 'player' });
		await expect(act(room, { kind: 'start' })).rejects.toMatchObject({
			code: 'HOST_ONLY',
			status: 403,
		});
		await SpyGame.updateOne(
			{ code: room.state.code },
			{
				$set: { 'adminTest.running': true, 'adminTest.lastTickAt': new Date(Date.now() - 20_000) },
			},
		);
		room = await act(room, { kind: 'tick' });
		expect(room.running).toBe(false);
		expect(room.state.phase).toBe('lobby');
	});
});

describe('additional game branches', () => {
	it('finds all three spies in consecutive rounds', async () => {
		let room = await make('spy-fall', 7, { spyCount: 3 });
		room = await act(room, { kind: 'start' });
		room = await steps(room, 6);
		room = await act(room, { kind: 'remember' });
		for (let round = 0; round < 3; round++) {
			room = await act(room, { kind: 'next' });
			const doc = await SpyGame.findOne({ code: room.state.code }).lean();
			const living = doc!.players.filter((p) => !p.isEliminated);
			const spy = living.find((p) => p.role === 'spy')!;
			for (const voter of living)
				room = await act(room, {
					kind: 'vote',
					playerId: voter.id,
					targetId: voter.id === spy.id ? living.find((p) => p.id !== spy.id)!.id : spy.id,
				});
			if (round < 2) {
				expect(room.state.phase).toBe('reveal');
				room = await act(room, { kind: 'next' });
			}
		}
		expect(room.state.phase).toBe('result');
		expect((await SpyGame.findOne({ code: room.state.code }).lean())!.result.winningSide).toBe(
			'civilian',
		);
	});

	it('preserves Ma Sói public identities after removing a lobby player', async () => {
		let room = await make('ma-soi', 6);
		room = await act(room, { kind: 'kick', playerId: 'bot-2' });
		room = await act(room, { kind: 'set-seat', seatId: 'bot-3' });
		expect(room.state.self?.name).toBe('Bot 3');
		expect(JSON.stringify(room)).not.toContain('roleId":"');
	});

	it('host bot starts Cheese runoff; vote bots keep to the remaining candidates', async () => {
		let room = await make('cheese-thief', 4, { startingSeat: 'player' });
		// Set up a tied vote using the normal game path, then exercise the runner.
		room = await act(room, { kind: 'step' });
		room = await steps(room, 3);
		room = await act(room, { kind: 'remember' });
		room = await act(room, { kind: 'step' });
		room = await act(room, { kind: 'skip-time' });
		room = await act(room, { kind: 'skip-time' });
		room = await steps(room, 3);
		room = await act(room, { kind: 'seen' });
		room = await act(room, { kind: 'set-seat', seatId: 'admin' });
		room = await act(room, { kind: 'start-vote' });
		const players = (room.state as CheeseState).players;
		for (const [i, target] of [1, 0, 0, 1].entries())
			room = await act(room, {
				kind: 'vote',
				playerId: players[i].id,
				targetId: players[target].id,
			});
		expect(room.state.phase).toBe('tie');
		room = await act(room, { kind: 'set-seat', seatId: players[1].id });
		room = await act(room, { kind: 'step' });
		expect(room.state.phase).toBe('vote');
		room = await steps(room, 3);
		const doc = await CheeseRoom.findOne({ code: room.state.code }).lean();
		expect(
			doc!.players.filter((p) => p.voteId).every((p) => doc!.voteCandidateIds.includes(p.voteId!)),
		).toBe(true);
	});
});
