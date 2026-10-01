/**
 * Bots in real rooms. An admin who hosts a room can fill empty seats with bots in the lobby; each
 * bot is an ordinary player (it joined like anyone else) flagged `isBot`, so the services keep it
 * connected and never hand it the host role. Bots only do what every player must do on their own
 * phone (confirm a role, pick a secret, vote); everything that moves the game forward stays with
 * the human host.
 */
import type { Model } from 'mongoose';

import { GameError } from '@/features/board-game-shared/lib/gameError';
import CheeseRoom from '@/features/cheese-thief/models/CheeseThiefRoom';
import * as cheese from '@/features/cheese-thief/services/cheeseThiefService';
import SpyGame from '@/features/spy-fall/models/SpyGame';
import * as spy from '@/features/spy-fall/services/spyGameService';
import WerewolfRoom from '@/features/werewolf/models/WerewolfRoom';
import * as werewolf from '@/features/werewolf/services/werewolfService';
import dbConnect from '@/lib/dbConnect';

import { type LiveBotGame } from './types';

export { isLiveBotGame, type LiveBotGame } from './types';

const BOT_NAMES = [
	'Bot An',
	'Bot Bình',
	'Bot Chi',
	'Bot Dũng',
	'Bot Hà',
	'Bot Khoa',
	'Bot Linh',
	'Bot Minh',
	'Bot Nam',
	'Bot Oanh',
	'Bot Phúc',
	'Bot Quân',
	'Bot Sơn',
	'Bot Trang',
	'Bot Uyên',
	'Bot Vy',
];

/** A bot waits this long between moves in one room, so people can watch the table change. */
export const BOT_STEP_MS = 1_200;
const lastStepAt = new Map<string, number>();

type BotSeat = {
	token: string;
	id?: string;
	name: string;
	isBot?: boolean;
	hasMemorizedRole?: boolean;
	isEliminated?: boolean;
	voteToken?: string;
	dice?: number[];
	secretConfirmed?: boolean;
	hasSeenSecret?: boolean;
	voteId?: string;
	viewedAt?: Date | null;
	leftAt?: Date | null;
};

type RawRoom = {
	code: string;
	phase: string;
	hostToken: string;
	players: BotSeat[];
	choiceCount?: number;
	voteCandidateIds?: string[];
	adminTest?: { ownerUserId?: string };
};

function modelFor(game: LiveBotGame): Model<unknown> {
	if (game === 'spy-fall') return SpyGame as unknown as Model<unknown>;
	if (game === 'cheese-thief') return CheeseRoom as unknown as Model<unknown>;
	return WerewolfRoom as unknown as Model<unknown>;
}

async function readRoom(game: LiveBotGame, code: string): Promise<RawRoom | null> {
	await dbConnect();
	return (await modelFor(game)
		.findOne({ code: code.toUpperCase() })
		.lean()) as unknown as RawRoom | null;
}

function pick<T>(items: T[], random: () => number): T | undefined {
	return items.length ? items[Math.floor(random() * items.length)] : undefined;
}

/** Seat one more bot. Only the host may do it, only in the lobby, never in an admin test room. */
export async function addLiveBot(game: LiveBotGame, code: string, hostToken: string) {
	const room = await readRoom(game, code);
	if (!room) throw new GameError('ROOM_NOT_FOUND', 404);
	if (room.adminTest?.ownerUserId) throw new GameError('TEST_ROOM_PRIVATE', 404);
	if (room.hostToken !== hostToken) throw new GameError('HOST_ONLY', 403);
	if (room.phase !== 'lobby') throw new GameError('BOT_LOBBY_ONLY', 400);

	const taken = new Set(room.players.map((player) => player.name.toLowerCase()));
	const name =
		BOT_NAMES.find((candidate) => !taken.has(candidate.toLowerCase())) ??
		`Bot ${room.players.length + 1}`;

	const joined =
		game === 'spy-fall'
			? await spy.joinRoom(code, name)
			: game === 'cheese-thief'
				? await cheese.joinRoom(code, name)
				: await werewolf.joinRoom(code, name);
	await modelFor(game).updateOne(
		{ code: code.toUpperCase(), 'players.token': joined.playerToken },
		{ $set: { 'players.$.isBot': true } },
	);
	return name;
}

async function stepSpy(room: RawRoom, bots: BotSeat[], random: () => number): Promise<boolean> {
	const { code } = room;
	const waiting = bots.find((bot) => !bot.hasMemorizedRole);
	if (room.phase === 'role-reveal' && waiting) {
		await spy.confirmMemorized(code, waiting.token);
		return true;
	}
	if (room.phase !== 'vote') return false;
	const voter = bots.find((bot) => !bot.isEliminated && !bot.voteToken);
	if (!voter) return false;
	const state = await spy.getScopedState(code, voter.token);
	const self = state.self?.id;
	const candidates = state.players.filter(
		(player) =>
			!player.isEliminated &&
			player.id !== self &&
			(!state.voteCandidates.length || state.voteCandidates.includes(player.id)),
	);
	const target = pick(candidates, random);
	if (!target) return false;
	await spy.submitVote(code, voter.token, target.id);
	return true;
}

async function stepCheese(room: RawRoom, bots: BotSeat[], random: () => number): Promise<boolean> {
	const { code, phase } = room;
	if (phase === 'deal') {
		const bot = bots.find((entry) => !entry.hasMemorizedRole);
		if (!bot) return false;
		const hour = bot.dice?.length === 2 ? pick(bot.dice, random) : undefined;
		await cheese.confirmMemorized(code, bot.token, hour);
		return true;
	}
	if (phase === 'secret') {
		const bot = bots.find((entry) => !entry.secretConfirmed);
		if (!bot) return false;
		const others = room.players.filter((entry) => entry.id !== bot.id).map((entry) => entry.id!);
		const picks: string[] = [];
		while (picks.length < (room.choiceCount || 1) && others.length) {
			picks.push(others.splice(Math.floor(random() * others.length), 1)[0]!);
		}
		await cheese.submitSecret(code, bot.token, picks);
		return true;
	}
	if (phase === 'secret-result') {
		const bot = bots.find((entry) => !entry.hasSeenSecret);
		if (!bot) return false;
		await cheese.markSecretSeen(code, bot.token);
		return true;
	}
	if (phase === 'vote') {
		const bot = bots.find((entry) => !entry.voteId);
		const target = bot
			? pick(
					(room.voteCandidateIds ?? []).filter((id) => id !== bot.id),
					random,
				)
			: undefined;
		if (!bot || !target) return false;
		await cheese.submitVote(code, bot.token, target);
		return true;
	}
	return false;
}

async function stepWerewolf(room: RawRoom, bots: BotSeat[]): Promise<boolean> {
	if (room.phase !== 'dealt') return false;
	const bot = bots.find((entry) => !entry.viewedAt && !entry.leftAt);
	if (!bot) return false;
	await werewolf.markViewed(room.code, bot.token);
	return true;
}

/**
 * Let one bot in this room make its next move, if any bot is waiting and the room has been quiet
 * for BOT_STEP_MS. Called on every state poll, so the table moves while people watch; a move that
 * lost a race with a phase change is simply dropped.
 */
export async function stepLiveBots(
	game: LiveBotGame,
	code: string,
	options: { now?: number; random?: () => number } = {},
): Promise<boolean> {
	const at = options.now ?? Date.now();
	const key = `${game}:${code.toUpperCase()}`;
	if (at - (lastStepAt.get(key) ?? 0) < BOT_STEP_MS) return false;

	const room = await readRoom(game, code);
	if (!room || room.adminTest?.ownerUserId) return false;
	const bots = room.players.filter((player) => player.isBot);
	if (!bots.length) return false;

	lastStepAt.set(key, at);
	const random = options.random ?? Math.random;
	try {
		if (game === 'spy-fall') return await stepSpy(room, bots, random);
		if (game === 'cheese-thief') return await stepCheese(room, bots, random);
		return await stepWerewolf(room, bots);
	} catch (error) {
		if (error instanceof GameError) return false;
		throw error;
	}
}

/** For tests: forget the pacing so the next call may act at once. */
export function resetLiveBotPacing(): void {
	lastStepAt.clear();
}
