import { describe, expect, it } from 'vitest';

import SpyGame from '@/features/spy-fall/models/SpyGame';
import {
	confirmMemorized,
	createRoom,
	getScopedState,
	hostAdvancePhase,
	joinRoom,
	leaveRoom,
	startGame,
	submitVote,
	updateSettings,
} from '@/features/spy-fall/services/spyGameService';
import type { PlayerRole } from '@/features/spy-fall/types/spyGame';

interface Table {
	code: string;
	host: string;
	tokens: string[];
}

async function openTable(
	playerCount: number,
	settings: { spyCount?: number; revealRoles?: boolean } = {},
): Promise<Table> {
	const created = await createRoom({ name: 'Test room', hostName: 'P0', ...settings });
	const host = created.self!.token;
	const tokens = [host];
	for (let i = 1; i < playerCount; i++) {
		const joined = await joinRoom(created.code, `P${i}`);
		tokens.push(joined.playerToken);
	}
	return { code: created.code, host, tokens };
}

async function rolesOf(code: string): Promise<Map<string, PlayerRole>> {
	const game = await SpyGame.findOne({ code }).lean();
	return new Map(game!.players.map((p) => [p.token, p.role!]));
}

async function idsByToken(code: string): Promise<Map<string, string>> {
	const game = await SpyGame.findOne({ code }).lean();
	return new Map(game!.players.map((p) => [p.token, p.id]));
}

/** Advance using the phase the server is actually in, the way a fresh screen would. */
async function advance(code: string, token: string) {
	const state = await getScopedState(code, token);
	return hostAdvancePhase(code, token, {
		phase: state.phase,
		round: state.round,
		isRevote: state.isRevote,
	});
}

async function startAndOpenVote(table: Table) {
	await startGame(table.code, table.host);
	for (const token of table.tokens) await confirmMemorized(table.code, token);
	const state = await advance(table.code, table.host);
	expect(state.phase).toBe('vote');
	return rolesOf(table.code);
}

/** Every living player votes for `target`; the target votes for `fallback`. Both arguments are auth tokens. */
async function everyoneVotes(table: Table, target: string, fallback: string) {
	const ids = await idsByToken(table.code);
	const state = await getScopedState(table.code, table.host);
	const living = new Set(state.players.filter((p) => !p.isEliminated).map((p) => p.id));
	const targetId = ids.get(target)!;
	const fallbackId = ids.get(fallback)!;
	let last = state;
	for (const voter of table.tokens) {
		const voterId = ids.get(voter);
		if (!voterId || !living.has(voterId)) continue;
		last = await submitVote(table.code, voter, voter === target ? fallbackId : targetId);
	}
	return last;
}

function byRole(roles: Map<string, PlayerRole>, role: PlayerRole): string[] {
	return [...roles].filter(([, r]) => r === role).map(([token]) => token);
}

describe('Spy Fall — one spy', () => {
	it('civilians win when the single vote catches the spy', async () => {
		const table = await openTable(5);
		const roles = await startAndOpenVote(table);
		const [spy] = byRole(roles, 'spy');
		const [civilian] = byRole(roles, 'civilian');

		const state = await everyoneVotes(table, spy!, civilian!);

		expect(state.phase).toBe('result');
		expect(state.result?.winningSide).toBe('civilian');
		expect(state.result?.endReason).toBe('all-spies-caught');
		expect(state.result?.eliminationLog).toHaveLength(1);
	});

	it('the spy wins at once when the vote eliminates a civilian', async () => {
		const table = await openTable(6);
		const roles = await startAndOpenVote(table);
		const [spy] = byRole(roles, 'spy');
		const [civilian] = byRole(roles, 'civilian');

		const state = await everyoneVotes(table, civilian!, spy!);

		expect(state.phase).toBe('result');
		expect(state.result?.winningSide).toBe('antagonist');
		expect(state.result?.endReason).toBe('wrong-vote');
	});

	it('a tie gets one revote, and a second tie hands the win to the spy', async () => {
		const table = await openTable(4);
		await startAndOpenVote(table);
		const [a, b, c, d] = table.tokens as [string, string, string, string];
		const ids = await idsByToken(table.code);

		const tie = async () => {
			await submitVote(table.code, a, ids.get(b)!);
			await submitVote(table.code, b, ids.get(a)!);
			await submitVote(table.code, c, ids.get(a)!);
			return submitVote(table.code, d, ids.get(b)!);
		};

		const revote = await tie();
		expect(revote.phase).toBe('vote');
		expect(revote.isRevote).toBe(true);
		expect(revote.voteCandidates.sort()).toEqual([ids.get(a)!, ids.get(b)!].sort());

		const state = await tie();
		expect(state.phase).toBe('result');
		expect(state.result?.winningSide).toBe('antagonist');
		expect(state.result?.endReason).toBe('no-elimination');
	});

	it('the host locking an empty ballot box hands the win to the spy', async () => {
		const table = await openTable(4);
		await startAndOpenVote(table);

		const state = await advance(table.code, table.host);

		expect(state.phase).toBe('result');
		expect(state.result?.endReason).toBe('no-elimination');
	});
});

describe('Spy Fall — two spies', () => {
	it('catching the first spy earns a final guess, and catching the second wins', async () => {
		const table = await openTable(6, { spyCount: 2 });
		const roles = await startAndOpenVote(table);
		const [spy1, spy2] = byRole(roles, 'spy');
		const [civilian] = byRole(roles, 'civilian');
		expect(byRole(roles, 'spy')).toHaveLength(2);

		const reveal = await everyoneVotes(table, spy1!, civilian!);
		expect(reveal.phase).toBe('reveal');
		expect(reveal.spiesCaught).toBe(1);
		expect(reveal.lastRound?.role).toBe('spy');

		const discussion = await advance(table.code, table.host);
		expect(discussion.phase).toBe('discussion');
		expect(discussion.round).toBe(2);
		await advance(table.code, table.host);

		const state = await everyoneVotes(table, spy2!, civilian!);
		expect(state.phase).toBe('result');
		expect(state.result?.winningSide).toBe('civilian');
		expect(state.result?.endReason).toBe('all-spies-caught');
		expect(state.result?.eliminationLog.map((e) => e.role)).toEqual(['spy', 'spy']);
	});

	it('a miss on the first vote ends the game for the spies', async () => {
		const table = await openTable(6, { spyCount: 2 });
		const roles = await startAndOpenVote(table);
		const [spy] = byRole(roles, 'spy');
		const [civilian] = byRole(roles, 'civilian');

		const state = await everyoneVotes(table, civilian!, spy!);

		expect(state.phase).toBe('result');
		expect(state.result?.winningSide).toBe('antagonist');
		expect(state.result?.endReason).toBe('wrong-vote');
	});

	it('a miss on the final guess ends the game for the spies', async () => {
		const table = await openTable(5, { spyCount: 2 });
		const roles = await startAndOpenVote(table);
		const [spy1, spy2] = byRole(roles, 'spy');
		const [civilian] = byRole(roles, 'civilian');

		await everyoneVotes(table, spy1!, civilian!);
		await advance(table.code, table.host);
		await advance(table.code, table.host);
		const state = await everyoneVotes(table, civilian!, spy2!);

		expect(state.phase).toBe('result');
		expect(state.result?.winningSide).toBe('antagonist');
		expect(state.result?.endReason).toBe('wrong-vote');
	});

	it('the last hidden spy leaving hands the win to the civilians', async () => {
		const table = await openTable(6, { spyCount: 2 });
		const roles = await startAndOpenVote(table);
		const [spy1, spy2] = byRole(roles, 'spy');
		const [civilian] = byRole(roles, 'civilian');

		await everyoneVotes(table, spy1!, civilian!);
		await leaveRoom(table.code, spy2!);

		const state = await getScopedState(table.code, civilian!);
		expect(state.phase).toBe('result');
		expect(state.result?.winningSide).toBe('civilian');
		expect(state.result?.endReason).toBe('spies-gone');
	});
});

describe('Spy Fall — three spies', () => {
	it('every catch earns another guess until all three are caught', async () => {
		const table = await openTable(7, { spyCount: 3 });
		const roles = await startAndOpenVote(table);
		const spies = byRole(roles, 'spy');
		const [civilian] = byRole(roles, 'civilian');
		expect(spies).toHaveLength(3);

		for (const [index, spy] of spies.slice(0, 2).entries()) {
			const reveal = await everyoneVotes(table, spy, civilian!);
			expect(reveal.phase).toBe('reveal');
			expect(reveal.spiesCaught).toBe(index + 1);
			await advance(table.code, table.host);
			await advance(table.code, table.host);
		}

		const state = await everyoneVotes(table, spies[2]!, civilian!);
		expect(state.phase).toBe('result');
		expect(state.result?.winningSide).toBe('civilian');
		expect(state.result?.endReason).toBe('all-spies-caught');
		expect(state.result?.eliminationLog.map((e) => e.role)).toEqual(['spy', 'spy', 'spy']);
	});

	it('a miss after two catches still ends the game for the spies', async () => {
		const table = await openTable(7, { spyCount: 3 });
		const roles = await startAndOpenVote(table);
		const spies = byRole(roles, 'spy');
		const [civilian] = byRole(roles, 'civilian');

		for (const spy of spies.slice(0, 2)) {
			await everyoneVotes(table, spy, civilian!);
			await advance(table.code, table.host);
			await advance(table.code, table.host);
		}
		const state = await everyoneVotes(table, civilian!, spies[2]!);

		expect(state.phase).toBe('result');
		expect(state.result?.winningSide).toBe('antagonist');
		expect(state.result?.endReason).toBe('wrong-vote');
	});
});

describe('Spy Fall — players leaving', () => {
	it('the spy leaving while words are being read hands the win to the civilians', async () => {
		const table = await openTable(4);
		await startGame(table.code, table.host);
		const roles = await rolesOf(table.code);
		const [spy] = byRole(roles, 'spy');
		const [civilian] = byRole(roles, 'civilian');

		await leaveRoom(table.code, spy!);

		const state = await getScopedState(table.code, civilian!);
		expect(state.phase).toBe('result');
		expect(state.result?.winningSide).toBe('civilian');
		expect(state.result?.endReason).toBe('spies-gone');
	});

	it('civilians leaving until they cannot outvote the spy hands the win to the spy', async () => {
		const table = await openTable(4);
		const roles = await startAndOpenVote(table);
		const [spy] = byRole(roles, 'spy');
		const [civ1, civ2, civ3] = byRole(roles, 'civilian');

		await leaveRoom(table.code, civ1!);
		expect((await getScopedState(table.code, spy!)).phase).toBe('vote');
		await leaveRoom(table.code, civ2!);

		const state = await getScopedState(table.code, civ3!);
		expect(state.phase).toBe('result');
		expect(state.result?.winningSide).toBe('antagonist');
		expect(state.result?.endReason).toBe('outnumbered');
	});
});

describe('Spy Fall — settings', () => {
	it('defaults to one spy with hidden roles', async () => {
		const table = await openTable(4);
		const state = await getScopedState(table.code, table.host);
		expect(state.spyCount).toBe(1);
		expect(state.revealRoles).toBe(false);
	});

	it('rejects two spies in a room capped below the minimum', async () => {
		const table = await openTable(4);
		await updateSettings(table.code, table.host, { maxPlayers: 4 });
		await expect(updateSettings(table.code, table.host, { spyCount: 2 })).rejects.toMatchObject({
			code: 'SPY_COUNT_NEEDS_ROOM',
		});
		await expect(updateSettings(table.code, table.host, { spyCount: 4 })).rejects.toMatchObject({
			code: 'SPY_COUNT_INVALID',
		});
	});

	it('will not lower the room cap below what two spies need', async () => {
		const table = await openTable(4, { spyCount: 2 });
		await expect(updateSettings(table.code, table.host, { maxPlayers: 4 })).rejects.toMatchObject({
			code: 'SPY_COUNT_NEEDS_ROOM',
		});
	});

	it('needs five players to start with two spies', async () => {
		const table = await openTable(4, { spyCount: 2 });
		await expect(startGame(table.code, table.host)).rejects.toMatchObject({
			code: 'NEED_MIN_PLAYERS_FOR_SPIES',
			params: { min: 5, spies: 2 },
		});
	});

	it('needs seven players to start with three spies', async () => {
		const table = await openTable(6, { spyCount: 3 });
		await expect(startGame(table.code, table.host)).rejects.toMatchObject({
			code: 'NEED_MIN_PLAYERS_FOR_SPIES',
			params: { min: 7, spies: 3 },
		});
	});

	it('lets the host pick the spy count when creating the room', async () => {
		const table = await openTable(1, { spyCount: 3 });
		const state = await getScopedState(table.code, table.host);
		expect(state.spyCount).toBe(3);
	});

	it('keeps each role hidden from its owner by default', async () => {
		const table = await openTable(4);
		await startGame(table.code, table.host);
		for (const token of table.tokens) {
			const state = await getScopedState(table.code, token);
			expect(state.self?.keyword).toBeTruthy();
			expect(state.self?.role).toBeUndefined();
		}
	});

	it('rejects an empty room name instead of failing inside the database', async () => {
		const table = await openTable(4);
		await expect(updateSettings(table.code, table.host, { name: '   ' })).rejects.toMatchObject({
			code: 'ROOM_NAME_REQUIRED',
		});
		const state = await getScopedState(table.code, table.host);
		expect(state.name).toBe('Test room');
	});

	it('will not shrink the room below the players already inside', async () => {
		const table = await openTable(6);
		await expect(updateSettings(table.code, table.host, { maxPlayers: 5 })).rejects.toMatchObject({
			code: 'MAX_PLAYERS_INVALID',
			params: { min: 6, max: 12 },
		});
	});

	it('tells each player only their own role when roles are revealed', async () => {
		const table = await openTable(5, { spyCount: 2 });
		await updateSettings(table.code, table.host, { revealRoles: true });
		await startGame(table.code, table.host);
		const roles = await rolesOf(table.code);

		for (const token of table.tokens) {
			const state = await getScopedState(table.code, token);
			expect(state.revealRoles).toBe(true);
			expect(state.self?.role).toBe(roles.get(token));
			expect(state.players.every((p) => p.role === undefined)).toBe(true);
		}
	});
});

describe('Spy Fall — secrets and stale screens', () => {
	it('does not put another player’s token in the room state', async () => {
		const table = await openTable(4);
		await startGame(table.code, table.host);
		const viewer = await getScopedState(table.code, table.host);
		const raw = JSON.stringify(viewer);
		for (const other of table.tokens.slice(1)) {
			expect(raw).not.toContain(other);
		}
		expect(viewer.self?.token).toBe(table.host);
		expect(viewer.players.every((p) => !('token' in p) && !('keyword' in p))).toBe(true);

		const game = await SpyGame.findOne({ code: table.code }).lean();
		const other = game!.players.find((p) => p.token !== table.host)!;
		const byPublicId = await getScopedState(table.code, other.id);
		expect(byPublicId.self).toBeNull();
		expect(JSON.stringify(byPublicId)).not.toContain(other.keyword ?? 'missing-keyword');
	});

	it('rejects a host phase move made on a stale screen', async () => {
		const table = await openTable(4);
		await startAndOpenVote(table);
		const shown = await getScopedState(table.code, table.host);
		expect(shown.phase).toBe('vote');
		expect(shown.isRevote).toBe(false);

		const [a, b, c, d] = table.tokens as [string, string, string, string];
		const ids = await idsByToken(table.code);
		await submitVote(table.code, a, ids.get(b)!);
		await submitVote(table.code, b, ids.get(a)!);
		await submitVote(table.code, c, ids.get(a)!);
		await submitVote(table.code, d, ids.get(b)!);

		const revote = await getScopedState(table.code, table.host);
		expect(revote.phase).toBe('vote');
		expect(revote.isRevote).toBe(true);

		await expect(
			hostAdvancePhase(table.code, table.host, {
				phase: shown.phase,
				round: shown.round,
				isRevote: false,
			}),
		).rejects.toMatchObject({ code: 'PHASE_CHANGED', status: 409 });

		const after = await getScopedState(table.code, table.host);
		expect(after.phase).toBe('vote');
		expect(after.isRevote).toBe(true);
	});
});

describe('Spy Fall — a spy leaving mid-game', () => {
	it('drops the remaining-spy count and keeps the leaver’s name', async () => {
		const table = await openTable(6, { spyCount: 2 });
		const roles = await startAndOpenVote(table);
		const [spy] = byRole(roles, 'spy');
		const [civilian] = byRole(roles, 'civilian');
		const spyName = `P${table.tokens.indexOf(spy!)}`;

		await leaveRoom(table.code, spy!);

		const state = await getScopedState(table.code, civilian!);
		expect(state.phase).toBe('vote');
		expect(state.spiesRemaining).toBe(1);
		expect(state.departed).toEqual([expect.objectContaining({ name: spyName, role: 'spy' })]);
		expect(JSON.stringify(state.departed)).not.toContain(spy);
	});

	it('gives the room to a player seen recently when the host leaves', async () => {
		const table = await openTable(4);
		const game = await SpyGame.findOne({ code: table.code });
		const others = game!.players.filter((p) => p.token !== table.host);
		others[0]!.lastSeenAt = new Date(Date.now() - 60_000);
		others[1]!.lastSeenAt = new Date();
		await game!.save();

		await leaveRoom(table.code, table.host);

		const after = await SpyGame.findOne({ code: table.code }).lean();
		expect(after!.hostToken).toBe(others[1]!.token);
	});
});
