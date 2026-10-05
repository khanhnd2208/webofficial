import { beforeEach, describe, expect, it } from 'vitest';

import CheeseRoom from '@/features/cheese-thief/models/CheeseThiefRoom';
import * as cheese from '@/features/cheese-thief/services/cheeseThiefService';
import SpyGame from '@/features/spy-fall/models/SpyGame';
import * as spy from '@/features/spy-fall/services/spyGameService';
import WerewolfRoom from '@/features/werewolf/models/WerewolfRoom';
import * as werewolf from '@/features/werewolf/services/werewolfService';

import { addLiveBot, BOT_STEP_MS, resetLiveBotPacing, stepLiveBots } from './liveBots';

const seeded = () => 0.42;

/** Run bot steps, each past the pacing window, until no bot has anything left to do. */
async function settleBots(game: 'spy-fall' | 'cheese-thief' | 'ma-soi', code: string) {
	resetLiveBotPacing();
	let clock = Date.now();
	for (let i = 0; i < 20; i++) {
		clock += BOT_STEP_MS;
		if (!(await stepLiveBots(game, code, { now: clock, random: seeded }))) return;
	}
	throw new Error('bots never settled');
}

async function spyTableWithBots(bots: number) {
	const created = await spy.createRoom({ name: 'Bàn bot', hostName: 'Khánh' });
	const host = created.self!.token;
	for (let i = 0; i < bots; i++) await addLiveBot('spy-fall', created.code, host);
	return { code: created.code, host };
}

beforeEach(() => resetLiveBotPacing());

describe('live bots in a real Spy Fall room', () => {
	it('seats named bots that stay connected and are marked as bots', async () => {
		const { code, host } = await spyTableWithBots(3);
		const state = await spy.getScopedState(code, host);

		const bots = state.players.filter((player) => player.isBot);
		expect(bots.map((bot) => bot.name)).toEqual(['Bot An', 'Bot Bình', 'Bot Chi']);
		expect(bots.every((bot) => bot.connected)).toBe(true);
		expect(state.players.find((player) => player.isHost)?.name).toBe('Khánh');
	});

	it('lets only the host add bots, and only in the lobby', async () => {
		const { code, host } = await spyTableWithBots(3);
		const guest = await spy.joinRoom(code, 'Lan');

		await expect(addLiveBot('spy-fall', code, guest.playerToken)).rejects.toMatchObject({
			code: 'HOST_ONLY',
		});
		await spy.startGame(code, host);
		await expect(addLiveBot('spy-fall', code, host)).rejects.toMatchObject({
			code: 'BOT_LOBBY_ONLY',
		});
	});

	it('bots confirm their roles and vote, while the host runs the game', async () => {
		const { code, host } = await spyTableWithBots(3);
		await spy.startGame(code, host);
		await spy.confirmMemorized(code, host);
		await settleBots('spy-fall', code);

		let state = await spy.getScopedState(code, host);
		expect(state.phase).toBe('discussion');

		state = await spy.hostAdvancePhase(code, host, {
			phase: state.phase,
			round: state.round,
			isRevote: state.isRevote,
		});
		expect(state.phase).toBe('vote');
		await settleBots('spy-fall', code);

		state = await spy.getScopedState(code, host);
		const waiting = state.players.filter((player) => !player.isEliminated && !player.hasVoted);
		expect(waiting.map((player) => player.name)).toEqual(['Khánh']);
	});

	it('never hands the host role to a bot when the host goes quiet', async () => {
		const { code, host } = await spyTableWithBots(3);
		await SpyGame.updateOne(
			{ code, 'players.token': host },
			{ $set: { 'players.$.lastSeenAt': new Date(Date.now() - 10 * 60_000) } },
		);

		const state = await spy.getScopedState(code, null);
		expect(state.players.find((player) => player.isHost)?.name).toBe('Khánh');
	});
});

describe('live bots in a real Ma Sói room', () => {
	it('bots look at their dealt cards on their own', async () => {
		const created = await werewolf.createRoom('Quản trò');
		const host = created.hostToken;
		for (let i = 0; i < 5; i++) await addLiveBot('ma-soi', created.state.code, host);
		await werewolf.deal(created.state.code, host, seeded);

		await settleBots('ma-soi', created.state.code);

		const room = await WerewolfRoom.findOne({ code: created.state.code }).lean();
		expect(room!.players.every((player) => player.isBot && player.viewedAt)).toBe(true);
	});
});

describe('live bots in a real Cheese Thief room', () => {
	async function rewind(code: string, field: 'nightStartedAt' | 'secretStartedAt', msAgo: number) {
		await CheeseRoom.updateOne({ code }, { $set: { [field]: new Date(Date.now() - msAgo) } });
	}

	async function botsWaitingOn(
		code: string,
		field: 'hasMemorizedRole' | 'secretConfirmed' | 'hasSeenSecret' | 'voteId',
	) {
		const room = await CheeseRoom.findOne({ code }).lean();
		return room!.players.filter((player) => player.isBot && !player[field]).map((p) => p.name);
	}

	it('bots play a whole round: read roles, pick secrets, see the result and vote', async () => {
		const created = await cheese.createRoom({
			name: 'Bàn phô mai',
			hostName: 'Khánh',
			maxPlayers: 4,
		});
		const { code } = created;
		const host = created.self!.token;
		for (let i = 0; i < 3; i++) await addLiveBot('cheese-thief', code, host);
		await cheese.startGame(code, host);

		await settleBots('cheese-thief', code);
		expect(await botsWaitingOn(code, 'hasMemorizedRole')).toEqual([]);
		expect((await cheese.getScopedState(code, host)).phase).toBe('deal');

		await cheese.confirmMemorized(code, host);
		await cheese.beginNight(code, host);
		await rewind(code, 'nightStartedAt', 80_000);
		expect((await cheese.getScopedState(code, host)).phase).toBe('secret');

		await rewind(code, 'secretStartedAt', 20_000);
		await settleBots('cheese-thief', code);
		expect(await botsWaitingOn(code, 'secretConfirmed')).toEqual([]);
		const mine = (await cheese.getScopedState(code, host)).self!.id;
		const others = (await CheeseRoom.findOne({ code }).lean())!.players
			.map((player) => player.id)
			.filter((id) => id !== mine);
		const choiceCount = (await cheese.getScopedState(code, host)).choiceCount ?? 1;
		await cheese.submitSecret(code, host, others.slice(0, choiceCount));
		expect((await cheese.getScopedState(code, host)).phase).toBe('secret-result');

		await settleBots('cheese-thief', code);
		expect(await botsWaitingOn(code, 'hasSeenSecret')).toEqual([]);
		await cheese.markSecretSeen(code, host);
		expect((await cheese.getScopedState(code, host)).phase).toBe('day');

		await cheese.startVote(code, host);
		await settleBots('cheese-thief', code);
		expect(await botsWaitingOn(code, 'voteId')).toEqual([]);
	});
});
