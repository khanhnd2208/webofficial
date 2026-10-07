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
	revote,
	startGame,
	startVote,
	submitSecret,
	submitVote,
	updateSettings,
} from '@/features/cheese-thief/services/cheeseThiefService';
import type { CheeseRole } from '@/features/cheese-thief/lib/rules';

interface Table {
	code: string;
	host: string;
	tokens: string[];
}

async function openTable(
	playerCount: number,
	options: { scapegoat?: boolean } = {},
): Promise<Table> {
	const created = await createRoom({
		name: 'Bàn phô mai',
		hostName: 'P0',
		scapegoat: options.scapegoat,
		maxPlayers: playerCount,
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

async function rewind(code: string, field: 'nightStartedAt', msAgo: number) {
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
			(await CheeseThiefRoom.findOne({ code: table.code }).lean())!.players.map((player) => [
				player.token,
				player.id,
			]),
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

		const roster = (await getScopedState(table.code, table.host)).players;
		const stored = (await CheeseThiefRoom.findOne({ code: table.code }).lean())!;
		const thiefToken = stored.players.find((player) => player.role === 'thief')!.token;
		const others = roster.filter(
			(player) => player.id !== stored.players.find((p) => p.token === thiefToken)!.id,
		);
		await submitSecret(table.code, thiefToken, [others[0]!.id, others[1]!.id]);
		for (const token of table.tokens) {
			if (token === thiefToken) continue;
			const mine = stored.players.find((player) => player.token === token)!.id;
			const picks = roster
				.filter((player) => player.id !== mine)
				.slice(0, 2)
				.map((player) => player.id);
			await submitSecret(table.code, token, picks);
		}
		const follower = await getScopedState(
			table.code,
			stored.players.find((player) => player.id === others[0]!.id)!.token,
		);
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
			await confirmMemorized(table.code, player.token);
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

	it('sends a room left on the cheese check or on night 2 back to the lobby', async () => {
		const stuck = await openTable(5);
		await CheeseThiefRoom.collection.updateOne(
			{ code: stuck.code },
			{ $set: { phase: 'cheese-check', nightNumber: 1 } },
		);
		expect((await getScopedState(stuck.code, stuck.host)).phase).toBe('lobby');

		const second = await openTable(5);
		await startGame(second.code, second.host);
		await CheeseThiefRoom.collection.updateOne(
			{ code: second.code },
			{ $set: { phase: 'night', nightNumber: 2, theftNight: 1, mode: 'two-night' } },
		);
		const lobby = await getScopedState(second.code, second.host);
		expect(lobby.phase).toBe('lobby');
		expect(lobby.self?.role).toBeUndefined();
		const cleared = await CheeseThiefRoom.collection.findOne({ code: second.code });
		expect(cleared).not.toHaveProperty('nightNumber');
		expect(cleared).not.toHaveProperty('theftNight');
		expect(cleared).not.toHaveProperty('mode');

		const dealt = await startGame(second.code, second.host);
		expect(dealt.phase).toBe('deal');
		expect((await getScopedState(second.code, second.host)).phase).toBe('deal');
	});

	it('sends a four-player round that still has two numbers back to the lobby once', async () => {
		const table = await openTable(4);
		await startGame(table.code, table.host);
		await CheeseThiefRoom.collection.updateOne(
			{ code: table.code },
			{ $set: { 'players.$[].dice': [2, 5] } },
		);

		const lobby = await getScopedState(table.code, table.host);
		expect(lobby.phase).toBe('lobby');
		expect(lobby.self?.role).toBeUndefined();

		const dealt = await startGame(table.code, table.host);
		expect(dealt.phase).toBe('deal');
		expect(dealt.self?.wakeHours).toHaveLength(1);
		expect((await getScopedState(table.code, table.host)).phase).toBe('deal');
	});

	it('tells only the viewer that their secret picks are in', async () => {
		const table = await openTable(5);
		const secret = await reachSecret(table);
		expect(secret.self?.hasChosenSecret).toBe(false);
		const others = secret.players
			.filter((player) => player.id !== secret.self?.id)
			.map((player) => player.id);
		const mine = await submitSecret(
			table.code,
			table.host,
			others.slice(0, secret.choiceCount ?? 1),
		);
		expect(mine.self?.hasChosenSecret).toBe(true);
		expect(JSON.stringify(mine.players)).not.toContain('hasChosen');
		const neighbour = await getScopedState(table.code, table.tokens[1]!);
		expect(neighbour.self?.hasChosenSecret).toBe(false);
	});

	it('keeps the host through a long day talk, but hands off a silent host in the lobby', async () => {
		const table = await openTable(5);
		await reachSecret(table);
		await finishSecret(table);
		for (const token of table.tokens) await markSecretSeen(table.code, token);
		await CheeseThiefRoom.updateOne(
			{ code: table.code },
			{ $set: { 'players.0.lastSeenAt': new Date(Date.now() - 5 * 60_000) } },
		);
		const day = await getScopedState(table.code, table.tokens[1]!);
		expect(day.phase).toBe('day');
		expect(day.players[0]?.isHost).toBe(true);

		const lobbyTable = await openTable(4);
		await CheeseThiefRoom.updateOne(
			{ code: lobbyTable.code },
			{ $set: { 'players.0.lastSeenAt': new Date(Date.now() - 2 * 60_000) } },
		);
		const lobby = await getScopedState(lobbyTable.code, lobbyTable.tokens[1]!);
		expect(lobby.isHost).toBe(true);
	});

	it('lets the host set the hour length in the lobby, and the night runs on it', async () => {
		const table = await openTable(5);
		await expect(updateSettings(table.code, table.tokens[1]!, { hourSeconds: 20 })).rejects.toThrow(
			'HOST_ONLY',
		);
		await expect(updateSettings(table.code, table.host, { hourSeconds: 6 })).rejects.toThrow(
			'HOUR_SECONDS_INVALID',
		);
		await expect(updateSettings(table.code, table.host, { hourSeconds: 31 })).rejects.toThrow(
			'HOUR_SECONDS_INVALID',
		);
		const lobby = await updateSettings(table.code, table.host, { hourSeconds: 20 });
		expect(lobby.hourSeconds).toBe(20);

		await startGame(table.code, table.host);
		await expect(updateSettings(table.code, table.host, { hourSeconds: 10 })).rejects.toThrow(
			'ROOM_OR_PHASE_INVALID',
		);
		for (const token of table.tokens) await confirmMemorized(table.code, token);
		await beginNight(table.code, table.host);
		// 8s intro + 6 × 20s + 6s outro = 134s; the default 10s hour would already be over at 80s.
		await rewind(table.code, 'nightStartedAt', 80_000);
		const still = await getScopedState(table.code, table.host);
		expect(still.phase).toBe('night');
		expect(still.hourSeconds).toBe(20);
		await rewind(table.code, 'nightStartedAt', 135_000);
		expect((await getScopedState(table.code, table.host)).phase).toBe('secret');
	});

	it('rejects a table outside 4 to 12', async () => {
		await expect(
			createRoom({ name: 'Bàn phô mai', hostName: 'P0', maxPlayers: 3 }),
		).rejects.toThrow('MAX_PLAYERS_INVALID');
		await expect(
			createRoom({ name: 'Bàn phô mai', hostName: 'P0', maxPlayers: 13 }),
		).rejects.toThrow('MAX_PLAYERS_INVALID');
	});

	it('starts only a full table, clamps followers when the table shrinks, and resets to the default', async () => {
		const created = await createRoom({ name: 'Bàn phô mai', hostName: 'P0', maxPlayers: 6 });
		const host = created.self!.token;
		await expect(startGame(created.code, host)).rejects.toThrow('TABLE_NOT_FULL');
		await expect(updateSettings(created.code, host, { followerCount: 2 })).rejects.toThrow(
			'FOLLOWERS_INVALID',
		);

		const wide = await updateSettings(created.code, host, { maxPlayers: 8, followerCount: 2 });
		expect(wide.followers.count).toBe(2);
		const shrunk = await updateSettings(created.code, host, { maxPlayers: 6 });
		expect(shrunk.maxPlayers).toBe(6);
		expect(shrunk.followers.count).toBe(1);

		const custom = await updateSettings(created.code, host, {
			followerCount: 0,
			followerKnowledge: 'team',
		});
		expect(custom.followers).toMatchObject({ count: 0, customized: true, defaultCount: 1 });
		const reset = await updateSettings(created.code, host, {
			followerCount: null,
			followerKnowledge: null,
		});
		expect(reset.followers).toMatchObject({ count: 1, knowledge: 'all', customized: false });
	});

	it('plays a 12-player one-night table whose four followers do not learn the thief', async () => {
		const table = await openTable(12);
		await expect(joinRoom(table.code, 'P12')).rejects.toThrow('ROOM_FULL');
		const lobby = await updateSettings(table.code, table.host, {
			followerCount: 4,
			followerKnowledge: 'team',
		});
		expect(lobby.followers).toMatchObject({
			count: 4,
			knowledge: 'team',
			max: 4,
			customized: true,
		});

		await startGame(table.code, table.host);
		for (const token of table.tokens) await confirmMemorized(table.code, token);
		await beginNight(table.code, table.host);
		await rewind(table.code, 'nightStartedAt', 80_000);
		const secret = await getScopedState(table.code, table.host);
		expect(secret.phase).toBe('secret');
		expect(secret.choiceCount).toBe(4);

		const stored = (await CheeseThiefRoom.findOne({ code: table.code }).lean())!;
		const thief = stored.players.find((player) => player.role === 'thief')!;
		const others = stored.players.filter((player) => player.id !== thief.id);
		await submitSecret(
			table.code,
			thief.token,
			others.slice(0, 4).map((player) => player.id),
		);
		for (const player of stored.players) {
			if (player.token === thief.token) continue;
			const picks = stored.players
				.filter((other) => other.id !== player.id)
				.slice(0, 4)
				.map((other) => other.id);
			await submitSecret(table.code, player.token, picks);
		}
		const follower = await getScopedState(table.code, others[0]!.token);
		expect(follower.phase).toBe('secret-result');
		expect(follower.self?.secretCard?.recruited?.thiefName).toBeNull();
		expect(follower.self?.secretCard?.recruited?.allyNames).toHaveLength(3);
		expect(follower.self?.secretCard?.recruited?.allyNames).not.toContain(thief.name);
	});

	it("waits for every Done however long it takes, and keeps a lone sleepyhead's peek", async () => {
		const table = await openTable(10);
		await startGame(table.code, table.host);
		const dealt = (await CheeseThiefRoom.findOne({ code: table.code }))!;
		const lone = dealt.players.find((player) => player.role !== 'thief')!;
		// Everyone else shares hours 1–5, so only the lone seat wakes at 6.
		dealt.players.forEach((player, index) => {
			player.dice = player.id === lone.id ? [6] : [1 + (index % 5)];
		});
		await dealt.save();
		for (const token of table.tokens) await confirmMemorized(table.code, token);
		await beginNight(table.code, table.host);
		await rewind(table.code, 'nightStartedAt', 200_000);
		const secret = await getScopedState(table.code, lone.token);
		expect(secret.phase).toBe('secret');
		expect(secret.choiceCount).toBe(3);
		expect(secret.self?.secretJob).toEqual({ followers: 0, peek: true });

		const target = dealt.players.find((player) => player.id !== lone.id)!;
		const drafted = await submitSecret(table.code, lone.token, [target.id], { draft: true });
		expect(drafted.self?.hasChosenSecret).toBe(false);
		await expect(submitSecret(table.code, lone.token, [target.id])).rejects.toMatchObject({
			code: 'PICK_COUNT',
		});

		// Full drafts from everyone never end the step; only Done does, and there is no clock.
		const picksOf = (id: string) =>
			dealt.players
				.filter((other) => other.id !== id)
				.slice(0, 3)
				.map((other) => other.id);
		for (const player of dealt.players) {
			if (player.id === lone.id) continue;
			await submitSecret(table.code, player.token, picksOf(player.id), { draft: true });
		}
		await submitSecret(
			table.code,
			lone.token,
			[target.id, ...picksOf(lone.id).filter((id) => id !== target.id)].slice(0, 3),
		);
		expect((await getScopedState(table.code, lone.token)).phase).toBe('secret');

		const lastSeat = dealt.players.filter((player) => player.id !== lone.id);
		for (const player of lastSeat.slice(0, -1))
			await submitSecret(table.code, player.token, picksOf(player.id));
		expect((await getScopedState(table.code, lone.token)).phase).toBe('secret');

		const last = lastSeat.at(-1)!;
		await submitSecret(table.code, last.token, picksOf(last.id));
		const result = await getScopedState(table.code, lone.token);
		expect(result.phase).toBe('secret-result');
		expect(result.self?.secretCard?.peek).toEqual({ name: target.name, hours: [...target.dice] });
	});

	it('at 4 players reveals the thief’s only wake hour', async () => {
		const table = await openTable(4);
		await startGame(table.code, table.host);
		const dealt = (await CheeseThiefRoom.findOne({ code: table.code }))!;
		const thief = dealt.players.find((player) => player.role === 'thief')!;
		thief.dice = [5];
		await dealt.save();
		for (const player of dealt.players) await confirmMemorized(table.code, player.token);
		await beginNight(table.code, table.host);
		await rewind(table.code, 'nightStartedAt', 200_000);
		expect((await getScopedState(table.code, table.host)).phase).toBe('secret');
		await finishSecret(table);
		for (const token of table.tokens) await markSecretSeen(table.code, token);
		await startVote(table.code, table.host);
		const innocent = dealt.players.find((player) => player.id !== thief.id)!;
		let reveal = await getScopedState(table.code, table.host);
		for (const player of dealt.players) {
			const target = player.id === innocent.id ? thief.id : innocent.id;
			reveal = await submitVote(table.code, player.token, target);
		}
		expect(reveal.phase).toBe('reveal');
		expect(reveal.theftHour).toBe(5);
	});
});
