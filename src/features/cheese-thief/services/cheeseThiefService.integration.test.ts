import { describe, expect, it } from 'vitest';

import CheeseThiefRoom from '@/features/cheese-thief/models/CheeseThiefRoom';
import {
	beginNight,
	confirmMemorized,
	createRoom,
	getScopedState,
	joinRoom,
	markSecretSeen,
	playAgain,
	reportCheese,
	revote,
	startGame,
	startVote,
	submitSecret,
	submitVote,
} from '@/features/cheese-thief/services/cheeseThiefService';
import type { CheeseRole } from '@/features/cheese-thief/lib/rules';

interface Table {
	code: string;
	host: string;
	tokens: string[];
}

async function openTable(
	playerCount: number,
	options: { scapegoat?: boolean; mode?: 'classic' | 'two-night' } = {},
): Promise<Table> {
	const created = await createRoom({
		name: 'Bàn phô mai',
		hostName: 'P0',
		scapegoat: options.scapegoat,
		mode: options.mode,
	});
	const host = created.self!.token;
	const tokens = [host];
	for (let i = 1; i < playerCount; i++) {
		const joined = await joinRoom(created.code, `P${i}`);
		tokens.push(joined.playerToken);
	}
	return { code: created.code, host, tokens };
}

async function rolesOf(code: string): Promise<Map<string, CheeseRole>> {
	const game = await CheeseThiefRoom.findOne({ code }).lean();
	return new Map(game!.players.map((player) => [player.token, player.role!]));
}

async function rewind(code: string, field: 'nightStartedAt' | 'secretStartedAt', msAgo: number) {
	await CheeseThiefRoom.updateOne({ code }, { $set: { [field]: new Date(Date.now() - msAgo) } });
}

async function reachSecret(table: Table) {
	await startGame(table.code, table.host);
	for (const token of table.tokens) await confirmMemorized(table.code, token);
	await beginNight(table.code, table.host);
	await rewind(table.code, 'nightStartedAt', 80_000);
	const secret = await getScopedState(table.code, table.host);
	expect(secret.phase).toBe('secret');
	expect(secret.players.every((player) => player.role === undefined)).toBe(true);
	expect(secret.self?.role).toBeUndefined();
	expect(JSON.stringify(secret.players)).not.toContain('hasChosen');
	return secret;
}

async function finishSecret(table: Table) {
	await rewind(table.code, 'secretStartedAt', 20_000);
	const state = await getScopedState(table.code, table.host);
	const choiceCount = state.choiceCount ?? 1;
	const ids = state.players.map((player) => player.id);
	let last = state;
	for (const token of table.tokens) {
		const mine = (await getScopedState(table.code, token)).self!.id;
		const picks = ids.filter((id) => id !== mine).slice(0, choiceCount);
		last = await submitSecret(table.code, token, picks);
	}
	if (last.phase !== 'secret-result') {
		last = await getScopedState(table.code, table.host);
	}
	expect(last.phase).toBe('secret-result');
	return last;
}

describe('Cheese Thief table', () => {
	it('plays a 5-player round and catches the thief', async () => {
		const table = await openTable(5);
		await reachSecret(table);
		await finishSecret(table);
		for (const token of table.tokens) await markSecretSeen(table.code, token);
		const day = await getScopedState(table.code, table.host);
		expect(day.phase).toBe('day');
		expect(day.self?.role).toBeUndefined();

		await startVote(table.code, table.host);
		const roles = await rolesOf(table.code);
		const thief = [...roles.entries()].find(([, role]) => role === 'thief')![0];
		const ids = new Map(
			((await CheeseThiefRoom.findOne({ code: table.code }).lean())!.players).map((player) => [player.token, player.id]),
		);
		const fallback = table.tokens.find((token) => token !== thief)!;
		let reveal = day;
		for (const token of table.tokens) {
			const target = token === thief ? ids.get(fallback)! : ids.get(thief)!;
			reveal = await submitVote(table.code, token, target);
		}
		expect(reveal.phase).toBe('reveal');
		expect(reveal.winner).toBe('sleepyheads');
		expect(reveal.roster?.find((row) => row.role === 'thief')?.name).toBeTruthy();

		const again = await playAgain(table.code, table.host);
		expect(again.phase).toBe('lobby');
		expect(again.playerCount).toBe(5);
		expect(again.self?.role).toBeUndefined();
	});

	it('plays a 7-player secret minute without telling followers who the thief is', async () => {
		const table = await openTable(7);
		await reachSecret(table);
		const secret = await getScopedState(table.code, table.tokens[1]!);
		expect(secret.choiceCount).toBe(2);
		expect(secret.choiceCount).toBe((await getScopedState(table.code, table.host)).choiceCount);

		await rewind(table.code, 'secretStartedAt', 20_000);
		const roster = (await getScopedState(table.code, table.host)).players;
		const stored = (await CheeseThiefRoom.findOne({ code: table.code }).lean())!;
		const thiefToken = stored.players.find((player) => player.role === 'thief')!.token;
		const others = roster.filter((player) => player.id !== stored.players.find((p) => p.token === thiefToken)!.id);
		await submitSecret(table.code, thiefToken, [others[0]!.id, others[1]!.id]);
		for (const token of table.tokens) {
			if (token === thiefToken) continue;
			const mine = stored.players.find((player) => player.token === token)!.id;
			const picks = roster.filter((player) => player.id !== mine).slice(0, 2).map((player) => player.id);
			await submitSecret(table.code, token, picks);
		}
		const follower = await getScopedState(table.code, stored.players.find((player) => player.id === others[0]!.id)!.token);
		expect(follower.phase).toBe('secret-result');
		expect(follower.self?.secretCard?.recruited?.thiefName).toBeNull();
		expect(follower.self?.secretCard?.recruited?.allyNames).toEqual([others[1]!.name]);
		expect(follower.players.every((player) => player.role === undefined)).toBe(true);
	});

	it('stays in a tie until one name is ahead', async () => {
		const table = await openTable(4);
		await startGame(table.code, table.host);
		const game = await CheeseThiefRoom.findOne({ code: table.code }).lean();
		for (const player of game!.players) {
			const hour = player.dice[0];
			await confirmMemorized(table.code, player.token, hour);
		}
		await beginNight(table.code, table.host);
		await rewind(table.code, 'nightStartedAt', 80_000);
		await getScopedState(table.code, table.host);
		await finishSecret(table);
		for (const token of table.tokens) await markSecretSeen(table.code, token);
		await startVote(table.code, table.host);

		const ids = game!.players.map((player) => player.id);
		const [a, b, c, d] = table.tokens as [string, string, string, string];
		const tie = async () => {
			await submitVote(table.code, a, ids[1]!);
			await submitVote(table.code, b, ids[0]!);
			await submitVote(table.code, c, ids[0]!);
			return submitVote(table.code, d, ids[1]!);
		};
		const firstTie = await tie();
		expect(firstTie.phase).toBe('tie');
		expect(firstTie.voteCandidateIds?.sort()).toEqual([ids[0], ids[1]].sort());

		const again = await revote(table.code, table.host);
		expect(again.phase).toBe('vote');
		expect(again.voteRound).toBe(2);

		const secondTie = await tie();
		expect(secondTie.phase).toBe('tie');
		expect(secondTie.voteCandidateIds?.sort()).toEqual([ids[0], ids[1]].sort());

		await revote(table.code, table.host);
		await submitVote(table.code, a, ids[1]!);
		await submitVote(table.code, b, ids[0]!);
		await submitVote(table.code, c, ids[1]!);
		const reveal = await submitVote(table.code, d, ids[1]!);
		expect(reveal.phase).toBe('reveal');
		expect(reveal.flippedIds).toEqual([ids[1]]);
	});

	it('asks the host about the cheese after Night 1, and skips Night 2 when it is gone', async () => {
		const table = await openTable(5, { mode: 'two-night' });
		await startGame(table.code, table.host);
		for (const token of table.tokens) await confirmMemorized(table.code, token);
		await beginNight(table.code, table.host);
		await rewind(table.code, 'nightStartedAt', 80_000);
		const check = await getScopedState(table.code, table.host);
		expect(check.phase).toBe('cheese-check');
		expect(check.self?.role).toBeUndefined();
		expect(JSON.stringify(check)).not.toContain('secretJob');

		await expect(reportCheese(table.code, table.tokens[1]!, false)).rejects.toThrow('HOST_ONLY');
		const secret = await reportCheese(table.code, table.host, false);
		expect(secret.phase).toBe('secret');
		expect(secret.theftNight).toBe(1);
		expect(secret.choiceCount).toBe(2);
		expect(secret.self?.secretJob).toEqual({ followers: expect.any(Number), peek: expect.any(Boolean) });
	});

	it('starts Night 2 when the cheese is still there', async () => {
		const table = await openTable(6, { mode: 'two-night' });
		await startGame(table.code, table.host);
		for (const token of table.tokens) await confirmMemorized(table.code, token);
		await beginNight(table.code, table.host);
		await rewind(table.code, 'nightStartedAt', 80_000);
		await getScopedState(table.code, table.host);
		const night2 = await reportCheese(table.code, table.host, true);
		expect(night2.phase).toBe('night');
		expect(night2.nightNumber).toBe(2);
		expect(night2.self?.wakeHours).toBeUndefined();

		await rewind(table.code, 'nightStartedAt', 80_000);
		const secret = await getScopedState(table.code, table.host);
		expect(secret.phase).toBe('secret');
		expect(secret.theftNight).toBe(2);
		expect(secret.choiceCount).toBe(2);
	});

	it('refuses Two Nights with four players', async () => {
		const table = await openTable(4, { mode: 'two-night' });
		await expect(startGame(table.code, table.host)).rejects.toThrow('TWO_NIGHT_NEEDS_FIVE');
	});
});
