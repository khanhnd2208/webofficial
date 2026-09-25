import { describe, expect, it } from 'vitest';

import { toRoomStateDTO } from '@/features/werewolf/services/werewolfService';
import type { WerewolfRoomSnapshot } from '@/features/werewolf/types';

const at = new Date('2026-09-25T12:00:00.000Z');

function room(): WerewolfRoomSnapshot {
	return {
		code: 'ABCDEF',
		hostToken: 'host-token',
		hostName: 'Quản trò',
		hostLastSeenAt: at,
		phase: 'dealt',
		version: 3,
		dealRound: 1,
		roleCounts: [
			{ roleId: 'werewolf', count: 1 },
			{ roleId: 'villager', count: 4 },
		],
		players: [
			{
				token: 'p1',
				name: 'An',
				avatarSeed: 'p1seed00',
				joinedAt: at,
				lastSeenAt: at,
				roleId: 'werewolf',
				viewedAt: at,
				leftAt: null,
			},
			{
				token: 'p2',
				name: 'Bình',
				avatarSeed: 'p2seed00',
				joinedAt: at,
				lastSeenAt: at,
				roleId: 'villager',
				viewedAt: null,
				leftAt: null,
			},
		],
	};
}

describe('toRoomStateDTO', () => {
	it('hides other players’ roles from a player', () => {
		const dto = toRoomStateDTO(room(), 'p1', at);
		expect(dto.isHost).toBe(false);
		expect(dto.self?.roleId).toBe('werewolf');
		expect(dto.players.every((player) => player.roleId === undefined)).toBe(true);
		expect(dto.roleCounts).toEqual([]);
	});

	it('gives the host every assigned role', () => {
		const dto = toRoomStateDTO(room(), 'host-token', at);
		expect(dto.isHost).toBe(true);
		expect(dto.self).toBeNull();
		expect(dto.players.map((player) => player.roleId)).toEqual(['werewolf', 'villager']);
		expect(dto.players[0]?.viewed).toBe(true);
		expect(dto.players[1]?.viewed).toBe(false);
	});

	it('keeps a departed player’s role on the host board only', () => {
		const snapshot = room();
		snapshot.players[1]!.leftAt = at;
		const host = toRoomStateDTO(snapshot, 'host-token', at);
		expect(host.players[1]?.left).toBe(true);
		expect(host.players[1]?.roleId).toBe('villager');
		expect(host.playerCount).toBe(1);

		const other = toRoomStateDTO(snapshot, 'p1', at);
		expect(other.players[1]?.roleId).toBeUndefined();
		expect(other.players[1]?.left).toBe(true);
		expect(other.self?.left).toBe(false);
	});

	it('shows no roles to a stranger', () => {
		const dto = toRoomStateDTO(room(), 'someone-else', at);
		expect(dto.isHost).toBe(false);
		expect(dto.self).toBeNull();
		expect(dto.players.every((player) => player.roleId === undefined)).toBe(true);
		expect(JSON.stringify(dto)).not.toContain('werewolf');
	});
});
