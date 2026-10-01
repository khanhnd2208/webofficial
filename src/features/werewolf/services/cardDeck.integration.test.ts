import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { PATCH } from '@/app/api/ma-soi/rooms/[code]/roles/route';
import WerewolfRoom from '@/features/werewolf/models/WerewolfRoom';
import {
	backToLobby,
	createRoom,
	deal,
	getScopedState,
	joinRoom,
	setRoleCounts,
} from './werewolfService';
import { commandTestRoom, createTestRoom } from '@/features/board-game-test/service';

function patch(code: string, body: object) {
	return PATCH(
		new NextRequest(`http://localhost/api/ma-soi/rooms/${code}/roles`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		}),
		{ params: Promise.resolve({ code }) },
	);
}

describe('room card artwork', () => {
	it('persists a host selection for all players through dealing, reload and lobby return', async () => {
		const { state, hostToken } = await createRoom('Host');
		expect(state.cardDeck).toBe('classic');
		const code = state.code;
		const players = [];
		for (let i = 0; i < 5; i++) players.push(await joinRoom(code, `Player ${i}`));
		const response = await patch(code, { token: hostToken, cardDeck: 'van-son-2026' });
		expect(response.status).toBe(200);
		expect((await response.json()).data.roleCounts).toEqual(state.roleCounts);
		// A role-count-only save must not overwrite the selected artwork.
		await setRoleCounts(code, hostToken, state.roleCounts);
		await deal(code, hostToken, () => 0.5);
		for (const player of players) {
			const view = await getScopedState(code, player.playerToken);
			expect(view.cardDeck).toBe('van-son-2026');
			expect(view.self?.roleId).toBeTruthy();
			expect(view.players.every((p) => p.roleId === undefined)).toBe(true);
			expect(view.roleCounts).toEqual([]);
		}
		expect((await backToLobby(code, hostToken)).cardDeck).toBe('van-son-2026');
		await patch(code, { token: hostToken, cardDeck: 'classic' });
		expect((await getScopedState(code, players[0]!.playerToken)).cardDeck).toBe('classic');
	});

	it('rejects guests, invalid artwork and changing artwork after the deal', async () => {
		const { state, hostToken } = await createRoom('Host');
		const code = state.code;
		const player = await joinRoom(code, 'Player');
		expect(
			(await patch(code, { token: player.playerToken, cardDeck: 'van-son-2026' })).status,
		).toBe(403);
		expect((await patch(code, { cardDeck: 'van-son-2026' })).status).toBe(400);
		for (const cardDeck of ['unknown', '../secret', null, 42]) {
			const res = await patch(code, { token: hostToken, cardDeck });
			expect(res.status).toBe(400);
			expect((await res.json()).code).toBe('INVALID_CARD_DECK');
		}
		expect((await getScopedState(code, hostToken)).cardDeck).toBe('classic');
		for (let i = 0; i < 4; i++) await joinRoom(code, `Extra ${i}`);
		await deal(code, hostToken);
		const res = await patch(code, { token: hostToken, cardDeck: 'van-son-2026' });
		expect(res.status).toBe(400);
		expect((await res.json()).code).toBe('NOT_LOBBY');
	});

	it('keeps rooms created before this feature on classic artwork', async () => {
		const { state, hostToken } = await createRoom('Host');
		await WerewolfRoom.collection.updateOne({ code: state.code }, { $unset: { cardDeck: '' } });
		expect((await getScopedState(state.code, hostToken)).cardDeck).toBe('classic');
	});

	it('supports artwork selection in admin test rooms using the same guards', async () => {
		const room = await createTestRoom('admin-deck', {
			game: 'ma-soi',
			hostName: 'Admin',
			playerCount: 5,
			seed: 'deck',
		});
		const updated = await commandTestRoom('admin-deck', 'ma-soi', room.state.code, {
			kind: 'roles',
			cardDeck: 'van-son-2026',
		});
		expect(updated).toHaveProperty('state.cardDeck', 'van-son-2026');
	});
});
