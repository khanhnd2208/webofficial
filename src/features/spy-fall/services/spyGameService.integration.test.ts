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

async function startAndOpenVote(table: Table) {
	await startGame(table.code, table.host);
	for (const token of table.tokens) await confirmMemorized(table.code, token);
	const state = await hostAdvancePhase(table.code, table.host);
	expect(state.phase).toBe('vote');
	return rolesOf(table.code);
}

/** Every living player votes for `target`; the target votes for `fallback`. */
async function everyoneVotes(table: Table, target: string, fallback: string) {
	const state = await getScopedState(table.code, table.host);
	const living = state.players.filter((p) => !p.isEliminated).map((p) => p.token);
	let last = state;
	for (const voter of living) {
		last = await submitVote(table.code, voter, voter === target ? fallback : target);
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

		const tie = async () => {
			await submitVote(table.code, a, b);
			await submitVote(table.code, b, a);
			await submitVote(table.code, c, a);
			return submitVote(table.code, d, b);
		};

		const revote = await tie();
		expect(revote.phase).toBe('vote');
		expect(revote.isRevote).toBe(true);
		expect(revote.voteCandidates.sort()).toEqual([a, b].sort());

		const state = await tie();
		expect(state.phase).toBe('result');
		expect(state.result?.winningSide).toBe('antagonist');
		expect(state.result?.endReason).toBe('no-elimination');
	});

	it('the host locking an empty ballot box hands the win to the spy', async () => {
		const table = await openTable(4);
		await startAndOpenVote(table);

		const state = await hostAdvancePhase(table.code, table.host);

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

		const discussion = await hostAdvancePhase(table.code, table.host);
		expect(discussion.phase).toBe('discussion');
		expect(discussion.round).toBe(2);
		await hostAdvancePhase(table.code, table.host);

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
		await hostAdvancePhase(table.code, table.host);
		await hostAdvancePhase(table.code, table.host);
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
			await hostAdvancePhase(table.code, table.host);
			await hostAdvancePhase(table.code, table.host);
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
			await hostAdvancePhase(table.code, table.host);
			await hostAdvancePhase(table.code, table.host);
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
