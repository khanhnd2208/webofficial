import mongoose, { type HydratedDocument } from 'mongoose';
import { customAlphabet } from 'nanoid';

import {
	CHEESE_DISCONNECT_THRESHOLD_MS,
	CHEESE_HOST_HANDOFF_MS,
	CHEESE_HOUR_MS,
	CHEESE_INTRO_MS,
	CHEESE_MAX_PLAYERS,
	CHEESE_MAX_ROOM_NAME_LENGTH,
	CHEESE_MIN_PLAYERS,
	CHEESE_OUTRO_MS,
	CHEESE_PHASES,
	CHEESE_PLAYER_ID_LENGTH,
	CHEESE_PLAYER_TOKEN_LENGTH,
	CHEESE_ROOM_CODE_LENGTH,
	CHEESE_SECRET_MAX_MS,
	CHEESE_SECRET_MIN_MS,
	presetFor,
	type CheesePhase,
	type TablePreset,
} from '@/features/cheese-thief/config/cheeseThief';
import { AppError } from '@/features/spy-fall/lib/appError';
import dbConnect from '@/features/spy-fall/lib/dbConnect';
import { normalizePlayerName } from '@/features/spy-fall/lib/spy/playerName';
import { nightEndsAt } from '@/features/cheese-thief/lib/nightSchedule';
import { projectRoom, type ProjectPlayer, type ProjectRoom } from '@/features/cheese-thief/lib/projectRoom';
import {
	deal,
	decideOutcome,
	resolveSecret,
	resolveVoteOrRunoff,
	sharedChoiceCount,
	type ResolvedSecret,
	type Seat,
} from '@/features/cheese-thief/lib/rules';
import CheeseThiefRoom, {
	type ICheesePlayer,
	type ICheeseRoom,
} from '@/features/cheese-thief/models/CheeseThiefRoom';
import type {
	CreateRoomInput,
	PublicRoomListItemDTO,
	RoomStateDTO,
	UpdateSettingsInput,
} from '@/features/cheese-thief/types';

const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', CHEESE_ROOM_CODE_LENGTH);
const generateToken = customAlphabet(
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	CHEESE_PLAYER_TOKEN_LENGTH,
);
const generatePlayerId = customAlphabet(
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	CHEESE_PLAYER_ID_LENGTH,
);

const NIGHT_TIMING = { introMs: CHEESE_INTRO_MS, hourMs: CHEESE_HOUR_MS, outroMs: CHEESE_OUTRO_MS };
const VALID_PHASES = new Set<string>(CHEESE_PHASES);
const MAX_SAVE_ATTEMPTS = 3;

type RoomDoc = HydratedDocument<ICheeseRoom>;

async function withVersionRetry<T>(run: () => Promise<T>): Promise<T> {
	for (let attempt = 1; ; attempt++) {
		try {
			return await run();
		} catch (error) {
			if (!(error instanceof mongoose.Error.VersionError) || attempt >= MAX_SAVE_ATTEMPTS) throw error;
		}
	}
}

function now(): Date {
	return new Date();
}

function findPlayer(game: RoomDoc, token: string): ICheesePlayer | undefined {
	return game.players.find((player) => player.token === token);
}

function findPlayerById(game: RoomDoc, id: string): ICheesePlayer | undefined {
	return game.players.find((player) => player.id === id);
}

function assertPlayer(game: RoomDoc, token: string): ICheesePlayer {
	const player = findPlayer(game, token);
	if (!player) throw new AppError('PLAYER_NOT_FOUND', 404);
	return player;
}

function assertHost(game: RoomDoc, token: string): void {
	if (game.hostToken !== token) throw new AppError('HOST_ONLY', 403);
}

function blankPlayer(token: string, name: string, at: Date): ICheesePlayer {
	const id = generatePlayerId();
	return {
		token,
		id,
		name,
		avatarSeed: id,
		connected: true,
		lastSeenAt: at,
		dice: [],
		hasMemorizedRole: false,
		secretPicks: [],
		hasSeenSecret: false,
	};
}

function assertRoomName(name: string | undefined): string {
	const trimmed = name?.trim() ?? '';
	if (!trimmed) throw new AppError('ROOM_NAME_REQUIRED', 400);
	if (trimmed.length > CHEESE_MAX_ROOM_NAME_LENGTH) {
		throw new AppError('ROOM_NAME_TOO_LONG', 400, { max: CHEESE_MAX_ROOM_NAME_LENGTH });
	}
	return trimmed;
}

function assertMaxPlayers(maxPlayers: unknown): asserts maxPlayers is number {
	if (
		typeof maxPlayers !== 'number' ||
		!Number.isInteger(maxPlayers) ||
		maxPlayers < CHEESE_MIN_PLAYERS ||
		maxPlayers > CHEESE_MAX_PLAYERS
	) {
		throw new AppError('MAX_PLAYERS_INVALID', 400, { min: CHEESE_MIN_PLAYERS, max: CHEESE_MAX_PLAYERS });
	}
}

function mapRecord(value: ICheeseRoom['peekByPlayer'] | undefined): Record<string, string> {
	if (!value) return {};
	if (value instanceof Map) return Object.fromEntries(value.entries());
	return { ...value };
}

function seatsOf(game: RoomDoc): Seat[] {
	return game.players.map((player) => ({
		id: player.id,
		role: player.role ?? 'sleepyhead',
		dice: player.dice ?? [],
		...(player.chosenHour !== undefined ? { chosenHour: player.chosenHour } : {}),
	}));
}

function tablePreset(game: RoomDoc): TablePreset {
	return presetFor(game.players.length);
}

function isRecentlySeen(player: ICheesePlayer, at: Date): boolean {
	return player.lastSeenAt.getTime() >= at.getTime() - CHEESE_DISCONNECT_THRESHOLD_MS;
}

function updateConnectionStatus(game: RoomDoc, at: Date): void {
	for (const player of game.players) {
		player.connected = isRecentlySeen(player, at);
	}
}

function migrateHostIfNeeded(game: RoomDoc, at: Date): boolean {
	const host = findPlayer(game, game.hostToken);
	if (host && host.lastSeenAt.getTime() >= at.getTime() - CHEESE_HOST_HANDOFF_MS) return false;
	const replacement = game.players.find((player) => player.token !== game.hostToken && isRecentlySeen(player, at));
	if (!replacement) return false;
	game.hostToken = replacement.token;
	return true;
}

function resetToLobby(game: RoomDoc): void {
	game.phase = 'lobby';
	game.nightStartedAt = undefined;
	game.secretStartedAt = undefined;
	game.dayStartedAt = undefined;
	game.choiceCount = 1;
	game.isRunoff = false;
	game.voteCandidateIds = [];
	game.flippedIds = [];
	game.followerIds = [];
	game.peekByPlayer = {};
	game.hunchByPlayer = {};
	game.winner = undefined;
	for (const player of game.players) {
		player.role = undefined;
		player.dice = [];
		player.chosenHour = undefined;
		player.hasMemorizedRole = false;
		player.secretPicks = [];
		player.hasSeenSecret = false;
		player.voteId = undefined;
	}
}

function resolvedOf(game: RoomDoc): ResolvedSecret {
	return {
		followerIds: game.followerIds ?? [],
		peekByPlayer: mapRecord(game.peekByPlayer),
		hunchByPlayer: mapRecord(game.hunchByPlayer),
	};
}

function applySecretResolution(game: RoomDoc): void {
	const preset = tablePreset(game);
	const picks: Record<string, string[]> = {};
	for (const player of game.players) picks[player.id] = player.secretPicks ?? [];
	const resolved = resolveSecret(seatsOf(game), preset, picks, Math.random);
	game.followerIds = resolved.followerIds;
	game.peekByPlayer = resolved.peekByPlayer;
	game.hunchByPlayer = resolved.hunchByPlayer;
	game.phase = 'secret-result';
	game.secretStartedAt = undefined;
	for (const player of game.players) player.hasSeenSecret = false;
}

function settleVote(game: RoomDoc): void {
	const ballots = game.players
		.filter((player) => player.voteId)
		.map((player) => ({ voterId: player.id, targetId: player.voteId! }));
	const resolution = resolveVoteOrRunoff(ballots, game.isRunoff, game.voteCandidateIds ?? []);
	if (resolution.kind === 'runoff') {
		game.isRunoff = true;
		game.voteCandidateIds = resolution.candidateIds;
		game.phase = 'vote';
		for (const player of game.players) player.voteId = undefined;
		return;
	}
	game.flippedIds = resolution.flippedIds;
	game.winner = decideOutcome(resolution.flippedIds, seatsOf(game));
	game.phase = 'reveal';
}

function advanceClock(game: RoomDoc, at: Date): boolean {
	if (game.phase === 'night' && game.nightStartedAt) {
		if (at.getTime() >= nightEndsAt(game.nightStartedAt.getTime(), NIGHT_TIMING)) {
			game.phase = 'secret';
			game.secretStartedAt = at;
			game.choiceCount = sharedChoiceCount(tablePreset(game));
			for (const player of game.players) player.secretPicks = [];
			return true;
		}
	}

	if (game.phase === 'secret' && game.secretStartedAt) {
		const elapsed = at.getTime() - game.secretStartedAt.getTime();
		const choiceCount = game.choiceCount || sharedChoiceCount(tablePreset(game));
		const everyoneChose = game.players.every((player) => (player.secretPicks ?? []).length === choiceCount);
		const timedOut = elapsed >= CHEESE_SECRET_MAX_MS;
		const minElapsed = elapsed >= CHEESE_SECRET_MIN_MS;
		if (timedOut || (everyoneChose && minElapsed)) {
			applySecretResolution(game);
			return true;
		}
	}

	if (game.phase === 'secret-result' && game.players.length > 0 && game.players.every((player) => player.hasSeenSecret)) {
		game.phase = 'day';
		game.dayStartedAt = at;
		return true;
	}

	if (game.phase === 'vote' && game.players.every((player) => Boolean(player.voteId))) {
		settleVote(game);
		return true;
	}

	return false;
}

function toProjectRoom(game: RoomDoc): ProjectRoom {
	const players: ProjectPlayer[] = game.players.map((player) => ({
		token: player.token,
		id: player.id,
		name: player.name,
		avatarSeed: player.avatarSeed,
		connected: player.connected,
		...(player.role ? { role: player.role } : {}),
		dice: player.dice ?? [],
		...(player.chosenHour !== undefined ? { chosenHour: player.chosenHour } : {}),
		hasMemorizedRole: player.hasMemorizedRole,
		hasSeenSecret: player.hasSeenSecret,
		...(player.voteId ? { voteId: player.voteId } : {}),
	}));

	const inRound = game.phase !== 'lobby';
	return {
		code: game.code,
		name: game.name,
		phase: game.phase,
		version: game.version,
		isPublic: game.isPublic,
		maxPlayers: game.maxPlayers,
		scapegoatEnabled: game.scapegoatEnabled,
		hostToken: game.hostToken,
		...(game.nightStartedAt ? { nightStartedAt: game.nightStartedAt } : {}),
		...(game.dayStartedAt ? { dayStartedAt: game.dayStartedAt } : {}),
		choiceCount: game.choiceCount || 1,
		isRunoff: Boolean(game.isRunoff),
		voteCandidateIds: game.voteCandidateIds ?? [],
		flippedIds: game.flippedIds ?? [],
		followerIds: game.followerIds ?? [],
		...(game.winner ? { winner: game.winner } : {}),
		...(inRound ? { preset: presetFor(game.players.length), resolved: resolvedOf(game) } : {}),
		players,
	};
}

function toRoomStateDTO(game: RoomDoc, viewerToken: string | null, at: Date): RoomStateDTO {
	updateConnectionStatus(game, at);
	return projectRoom(toProjectRoom(game), viewerToken, at);
}

async function loadAndAdvance(code: string, viewerToken: string | null): Promise<RoomStateDTO> {
	await dbConnect();
	return withVersionRetry(async () => {
		const at = now();
		const game = (await CheeseThiefRoom.findOne({ code: code.toUpperCase() })) as RoomDoc | null;
		if (!game) throw new AppError('ROOM_NOT_FOUND', 404);

		let changed = false;
		if (!VALID_PHASES.has(game.phase)) {
			resetToLobby(game);
			changed = true;
		}

		if (viewerToken) {
			const player = findPlayer(game, viewerToken);
			if (player) {
				player.lastSeenAt = at;
				player.connected = true;
				changed = true;
			}
		}

		if (advanceClock(game, at)) changed = true;
		if (migrateHostIfNeeded(game, at)) changed = true;

		if (changed) {
			game.version += 1;
			await game.save();
		}

		const fresh = (await CheeseThiefRoom.findOne({ code: code.toUpperCase() })) as RoomDoc;
		return toRoomStateDTO(fresh, viewerToken, at);
	});
}

async function mutateGame(
	code: string,
	playerToken: string,
	expectedPhase: CheesePhase | undefined,
	mutator: (game: RoomDoc, at: Date) => void,
): Promise<RoomStateDTO> {
	await dbConnect();
	return withVersionRetry(async () => {
		const at = now();
		const game = (await CheeseThiefRoom.findOne({
			code: code.toUpperCase(),
			...(expectedPhase ? { phase: expectedPhase } : {}),
		})) as RoomDoc | null;
		if (!game) throw new AppError('ROOM_OR_PHASE_INVALID', 404);
		if (!VALID_PHASES.has(game.phase)) resetToLobby(game);
		assertPlayer(game, playerToken);
		mutator(game, at);
		advanceClock(game, at);
		game.version += 1;
		await game.save();
		const fresh = (await CheeseThiefRoom.findOne({ code: code.toUpperCase() })) as RoomDoc;
		return toRoomStateDTO(fresh, playerToken, at);
	});
}

export async function createRoom(input: CreateRoomInput): Promise<RoomStateDTO> {
	const hostName = normalizePlayerName(input.hostName ?? '');
	if (!hostName) throw new AppError('PLAYER_NAME_REQUIRED', 400);
	const roomName = assertRoomName(input.name);
	const maxPlayers = input.maxPlayers ?? CHEESE_MAX_PLAYERS;
	assertMaxPlayers(maxPlayers);

	await dbConnect();
	const hostToken = generateToken();
	let code = generateCode();
	for (let i = 0; i < 10; i++) {
		const exists = await CheeseThiefRoom.findOne({ code }).select('_id').lean();
		if (!exists) break;
		code = generateCode();
	}

	const at = now();
	const game = await CheeseThiefRoom.create({
		code,
		name: roomName,
		isPublic: input.isPublic !== false,
		maxPlayers,
		scapegoatEnabled: input.scapegoat === true,
		hostToken,
		phase: 'lobby',
		version: 0,
		players: [blankPlayer(hostToken, hostName, at)],
		choiceCount: 1,
		isRunoff: false,
		voteCandidateIds: [],
		flippedIds: [],
		followerIds: [],
		peekByPlayer: {},
		hunchByPlayer: {},
	});

	return toRoomStateDTO(game as RoomDoc, hostToken, at);
}

export async function listPublicRooms(): Promise<PublicRoomListItemDTO[]> {
	await dbConnect();
	const games = (await CheeseThiefRoom.find({ isPublic: true, phase: 'lobby' })
		.sort({ updatedAt: -1 })
		.limit(50)
		.lean()) as ICheeseRoom[];
	return games.map((game) => ({
		code: game.code,
		name: game.name,
		playerCount: game.players.length,
		maxPlayers: game.maxPlayers,
		status: 'waiting' as const,
	}));
}

export async function joinRoom(
	code: string,
	name: string,
	existingToken?: string,
): Promise<{ state: RoomStateDTO; playerToken: string }> {
	const normalizedName = normalizePlayerName(name);
	if (!normalizedName) throw new AppError('PLAYER_NAME_REQUIRED', 400);

	await dbConnect();
	return withVersionRetry(async () => {
		const game = (await CheeseThiefRoom.findOne({ code: code.toUpperCase() })) as RoomDoc | null;
		if (!game) throw new AppError('ROOM_NOT_FOUND', 404);
		if (game.phase !== 'lobby') throw new AppError('GAME_IN_PROGRESS', 400);

		if (existingToken) {
			const existing = findPlayer(game, existingToken);
			if (existing) {
				existing.lastSeenAt = now();
				existing.connected = true;
				game.version += 1;
				await game.save();
				return { state: toRoomStateDTO(game, existingToken, now()), playerToken: existingToken };
			}
		}

		if (game.players.length >= game.maxPlayers) throw new AppError('ROOM_FULL', 400);
		if (game.players.some((player) => player.name.toLowerCase() === normalizedName.toLowerCase())) {
			throw new AppError('NAME_TAKEN', 400);
		}

		const playerToken = generateToken();
		const at = now();
		game.players.push(blankPlayer(playerToken, normalizedName, at));
		game.version += 1;
		await game.save();
		return { state: toRoomStateDTO(game, playerToken, at), playerToken };
	});
}

export async function getScopedState(code: string, playerToken: string | null): Promise<RoomStateDTO> {
	return loadAndAdvance(code, playerToken);
}

export async function updateSettings(
	code: string,
	hostToken: string,
	input: UpdateSettingsInput,
): Promise<RoomStateDTO> {
	return mutateGame(code, hostToken, 'lobby', (game) => {
		assertHost(game, hostToken);
		if (input.name !== undefined) game.name = assertRoomName(input.name);
		if (input.isPublic !== undefined) game.isPublic = Boolean(input.isPublic);
		if (input.maxPlayers !== undefined) {
			assertMaxPlayers(input.maxPlayers);
			if (input.maxPlayers < game.players.length) throw new AppError('MAX_PLAYERS_INVALID', 400, { min: game.players.length, max: CHEESE_MAX_PLAYERS });
			game.maxPlayers = input.maxPlayers;
		}
		if (input.scapegoat !== undefined) game.scapegoatEnabled = Boolean(input.scapegoat);
	});
}

export async function startGame(code: string, hostToken: string): Promise<RoomStateDTO> {
	return mutateGame(code, hostToken, 'lobby', (game) => {
		assertHost(game, hostToken);
		if (game.players.length < CHEESE_MIN_PLAYERS || game.players.length > CHEESE_MAX_PLAYERS) {
			throw new AppError('NEED_MIN_PLAYERS', 400, { min: CHEESE_MIN_PLAYERS });
		}
		const { seats } = deal(
			game.players.map((player) => player.id),
			game.scapegoatEnabled,
			Math.random,
		);
		const byId = new Map(seats.map((seat) => [seat.id, seat]));
		for (const player of game.players) {
			const seat = byId.get(player.id);
			if (!seat) continue;
			player.role = seat.role;
			player.dice = seat.dice;
			player.chosenHour = undefined;
			player.hasMemorizedRole = false;
			player.secretPicks = [];
			player.hasSeenSecret = false;
			player.voteId = undefined;
		}
		game.phase = 'deal';
		game.nightStartedAt = undefined;
		game.secretStartedAt = undefined;
		game.dayStartedAt = undefined;
		game.choiceCount = sharedChoiceCount(presetFor(game.players.length));
		game.isRunoff = false;
		game.voteCandidateIds = [];
		game.flippedIds = [];
		game.followerIds = [];
		game.peekByPlayer = {};
		game.hunchByPlayer = {};
		game.winner = undefined;
	});
}

export async function confirmMemorized(
	code: string,
	playerToken: string,
	chosenHour?: number,
): Promise<RoomStateDTO> {
	return mutateGame(code, playerToken, 'deal', (game) => {
		const player = assertPlayer(game, playerToken);
		const twoDice = (player.dice ?? []).length === 2;
		if (twoDice) {
			if (chosenHour === undefined || !player.dice.includes(chosenHour)) {
				throw new AppError('CHOOSE_HOUR', 400);
			}
			player.chosenHour = chosenHour;
		}
		player.hasMemorizedRole = true;
	});
}

export async function beginNight(code: string, hostToken: string): Promise<RoomStateDTO> {
	return mutateGame(code, hostToken, 'deal', (game, at) => {
		assertHost(game, hostToken);
		if (game.players.some((player) => !player.hasMemorizedRole)) {
			throw new AppError('NEED_ALL_MEMORIZED', 400);
		}
		if (game.players.some((player) => (player.dice ?? []).length === 2 && player.role !== 'thief' && player.chosenHour === undefined)) {
			throw new AppError('CHOOSE_HOUR', 400);
		}
		game.phase = 'night';
		game.nightStartedAt = at;
	});
}

export async function submitSecret(code: string, playerToken: string, picks: string[]): Promise<RoomStateDTO> {
	return mutateGame(code, playerToken, 'secret', (game) => {
		const player = assertPlayer(game, playerToken);
		const choiceCount = game.choiceCount || sharedChoiceCount(tablePreset(game));
		if (!Array.isArray(picks) || picks.length !== choiceCount) {
			throw new AppError('PICK_COUNT', 400, { count: choiceCount });
		}
		if (new Set(picks).size !== picks.length) throw new AppError('PICK_COUNT', 400, { count: choiceCount });
		const others = new Set(game.players.filter((item) => item.id !== player.id).map((item) => item.id));
		if (picks.some((id) => !others.has(id))) throw new AppError('PICK_UNKNOWN', 400);
		player.secretPicks = picks;
	});
}

export async function markSecretSeen(code: string, playerToken: string): Promise<RoomStateDTO> {
	return mutateGame(code, playerToken, 'secret-result', (game) => {
		assertPlayer(game, playerToken).hasSeenSecret = true;
	});
}

export async function startVote(code: string, hostToken: string): Promise<RoomStateDTO> {
	return mutateGame(code, hostToken, 'day', (game) => {
		assertHost(game, hostToken);
		game.phase = 'vote';
		game.isRunoff = false;
		game.voteCandidateIds = game.players.map((player) => player.id);
		for (const player of game.players) player.voteId = undefined;
	});
}

export async function submitVote(code: string, playerToken: string, targetId: string): Promise<RoomStateDTO> {
	return mutateGame(code, playerToken, 'vote', (game) => {
		const player = assertPlayer(game, playerToken);
		if (!targetId || targetId === player.id) throw new AppError('VOTE_SELF', 400);
		const target = findPlayerById(game, targetId);
		if (!target) throw new AppError('VOTE_NOT_CANDIDATE', 400);
		if (game.isRunoff && !(game.voteCandidateIds ?? []).includes(targetId)) {
			throw new AppError('VOTE_NOT_CANDIDATE', 400);
		}
		player.voteId = targetId;
	});
}

export async function playAgain(code: string, hostToken: string): Promise<RoomStateDTO> {
	return mutateGame(code, hostToken, 'reveal', (game) => {
		assertHost(game, hostToken);
		resetToLobby(game);
	});
}

export async function kickPlayer(code: string, hostToken: string, targetId: string): Promise<RoomStateDTO> {
	return mutateGame(code, hostToken, 'lobby', (game) => {
		assertHost(game, hostToken);
		const target = findPlayerById(game, targetId);
		if (!target) throw new AppError('PLAYER_NOT_FOUND', 404);
		if (target.token === hostToken) throw new AppError('CANNOT_KICK_SELF', 400);
		game.players = game.players.filter((player) => player.id !== targetId);
	});
}

export async function leaveRoom(code: string, playerToken: string): Promise<{ roomClosed: boolean }> {
	await dbConnect();
	return withVersionRetry(async () => {
		const game = (await CheeseThiefRoom.findOne({ code: code.toUpperCase() })) as RoomDoc | null;
		if (!game) throw new AppError('ROOM_NOT_FOUND', 404);
		const player = findPlayer(game, playerToken);
		if (!player) return { roomClosed: false };

		game.players = game.players.filter((item) => item.token !== playerToken);
		if (game.players.length === 0) {
			await game.deleteOne();
			return { roomClosed: true };
		}

		if (game.hostToken === playerToken) {
			const replacement = game.players[0];
			if (replacement) game.hostToken = replacement.token;
		}
		if (game.phase !== 'lobby') resetToLobby(game);
		game.version += 1;
		await game.save();
		return { roomClosed: false };
	});
}
