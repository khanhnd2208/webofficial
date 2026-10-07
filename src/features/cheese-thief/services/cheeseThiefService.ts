import { gameNow, gameRandom } from '@/features/board-game-test/runtime';
import { type HydratedDocument } from 'mongoose';
import { customAlphabet } from 'nanoid';

import {
	CHEESE_DISCONNECT_THRESHOLD_MS,
	CHEESE_HOST_HANDOFF_MS,
	CHEESE_HOUR_SECONDS_DEFAULT,
	CHEESE_MIN_PLAYERS,
	CHEESE_PHASES,
	CHEESE_PLAYER_ID_LENGTH,
	CHEESE_PLAYER_TOKEN_LENGTH,
	CHEESE_ROOM_CODE_LENGTH,
	CHEESE_ROUND_HOST_HANDOFF_MS,
	CHEESE_TABLE_SIZE_DEFAULT,
	isFollowerCountAllowed,
	isFollowerKnows,
	isPlayerCountAllowed,
	maxFollowersFor,
	nightTiming,
	presetFor,
	type CheesePhase,
	type FollowerSettings,
	type TablePreset,
} from '@/features/cheese-thief/config/cheeseThief';
import { GameError } from '@/features/board-game-shared/lib/gameError';
import {
	assertHourSeconds,
	assertRoomName,
	assertTableSize,
	followerSettingsOf,
} from '@/features/cheese-thief/services/cheeseRoomRules';
import { withVersionRetry } from '@/features/board-game-shared/lib/versionRetry';
import dbConnect from '@/lib/dbConnect';
import { normalizePlayerName } from '@/features/board-game-shared/lib/playerName';
import { nightEndsAt } from '@/features/cheese-thief/lib/nightSchedule';
import {
	projectRoom,
	type ProjectPlayer,
	type ProjectRoom,
} from '@/features/cheese-thief/lib/projectRoom';
import {
	deal,
	decideOutcome,
	resolveSecret,
	resolveVote,
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

const VALID_PHASES = new Set<string>(CHEESE_PHASES);

type RoomDoc = HydratedDocument<ICheeseRoom>;

function now(): Date {
	return gameNow();
}

function findPlayer(game: RoomDoc, token: string): ICheesePlayer | undefined {
	return game.players.find((player) => player.token === token);
}

function findPlayerById(game: RoomDoc, id: string): ICheesePlayer | undefined {
	return game.players.find((player) => player.id === id);
}

function assertPlayer(game: RoomDoc, token: string): ICheesePlayer {
	const player = findPlayer(game, token);
	if (!player) throw new GameError('PLAYER_NOT_FOUND', 404);
	return player;
}

function assertHost(game: RoomDoc, token: string): void {
	if (game.hostToken !== token) throw new GameError('HOST_ONLY', 403);
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
		secretConfirmed: false,
		hasSeenSecret: false,
	};
}

function applyFollowerInput(
	game: RoomDoc,
	input: {
		followerCount?: number | null;
		followerKnowledge?: FollowerSettings['knowledge'] | null;
	},
	size: number,
): void {
	const max = maxFollowersFor(size);
	if (input.followerCount === null) {
		game.set('followerCount', undefined);
	} else if (input.followerCount !== undefined) {
		if (!isFollowerCountAllowed(input.followerCount, size)) {
			throw new GameError('FOLLOWERS_INVALID', 400, { max });
		}
		game.followerCount = input.followerCount;
	} else if (typeof game.followerCount === 'number' && game.followerCount > max) {
		game.followerCount = max;
	}

	if (input.followerKnowledge === null) {
		game.set('followerKnowledge', undefined);
	} else if (input.followerKnowledge !== undefined) {
		if (!isFollowerKnows(input.followerKnowledge)) {
			throw new GameError('FOLLOWERS_INVALID', 400, { max });
		}
		game.followerKnowledge = input.followerKnowledge;
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
	}));
}

function tablePreset(game: RoomDoc): TablePreset {
	return presetFor(game.players.length, followerSettingsOf(game));
}

function isRecentlySeen(player: ICheesePlayer, at: Date): boolean {
	return player.lastSeenAt.getTime() >= at.getTime() - CHEESE_DISCONNECT_THRESHOLD_MS;
}

function updateConnectionStatus(game: RoomDoc, at: Date): void {
	for (const player of game.players) {
		const botSeat =
			game.adminTest?.ownerUserId &&
			(player.token !== game.hostToken || game.adminTest.controlledSeatId !== 'admin');
		player.connected = botSeat || player.isBot ? true : isRecentlySeen(player, at);
	}
}

function migrateHostIfNeeded(game: RoomDoc, at: Date): boolean {
	const host = findPlayer(game, game.hostToken);
	const handoffMs = game.phase === 'lobby' ? CHEESE_HOST_HANDOFF_MS : CHEESE_ROUND_HOST_HANDOFF_MS;
	if (host && host.lastSeenAt.getTime() >= at.getTime() - handoffMs) return false;
	const replacement = game.players.find(
		(player) => player.token !== game.hostToken && !player.isBot && isRecentlySeen(player, at),
	);
	if (!replacement) return false;
	game.hostToken = replacement.token;
	return true;
}

/** Fields removed from the schema. `set` alone does not mark them, so save would leave them in Mongo. */
const LEGACY_ROUND_FIELDS = ['nightNumber', 'theftNight', 'mode'] as const;

function clearLegacyTwoNight(game: RoomDoc): boolean {
	if (VALID_PHASES.has(game.phase) && game.$locals.legacyTwoNight !== true) return false;
	resetToLobby(game);
	for (const field of LEGACY_ROUND_FIELDS) {
		game.set(field, undefined, { strict: false });
		game.markModified(field);
	}
	game.$locals.legacyTwoNight = false;
	return true;
}

function resetToLobby(game: RoomDoc): void {
	game.phase = 'lobby';
	game.nightStartedAt = undefined;
	game.dayStartedAt = undefined;
	game.choiceCount = 1;
	game.voteRound = 0;
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
		player.hasMemorizedRole = false;
		player.secretPicks = [];
		player.secretConfirmed = false;
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

function applySecretResolution(game: RoomDoc, random: () => number = gameRandom): void {
	const preset = tablePreset(game);
	const picks: Record<string, string[]> = {};
	for (const player of game.players) picks[player.id] = player.secretPicks ?? [];
	const resolved = resolveSecret(seatsOf(game), preset, picks, random);
	game.followerIds = resolved.followerIds;
	game.peekByPlayer = resolved.peekByPlayer;
	game.hunchByPlayer = resolved.hunchByPlayer;
	game.phase = 'secret-result';
	for (const player of game.players) player.hasSeenSecret = false;
}

function settleVote(game: RoomDoc): void {
	const ballots = game.players
		.filter((player) => player.voteId)
		.map((player) => ({ voterId: player.id, targetId: player.voteId! }));
	const resolution = resolveVote(ballots, game.voteCandidateIds ?? []);
	if (resolution.kind === 'tie') {
		game.isRunoff = true;
		game.voteCandidateIds = resolution.candidateIds;
		game.phase = 'tie';
		for (const player of game.players) player.voteId = undefined;
		return;
	}
	game.flippedIds = resolution.flippedIds;
	game.winner = decideOutcome(resolution.flippedIds, seatsOf(game));
	game.phase = 'reveal';
}

function enterSecret(game: RoomDoc): void {
	game.phase = 'secret';
	game.choiceCount = sharedChoiceCount(tablePreset(game));
	for (const player of game.players) {
		player.secretPicks = [];
		player.secretConfirmed = false;
	}
}

function advanceClock(game: RoomDoc, at: Date, random: () => number = gameRandom): boolean {
	if (game.phase === 'night' && game.nightStartedAt) {
		if (at.getTime() >= nightEndsAt(game.nightStartedAt.getTime(), nightTiming(game.hourSeconds))) {
			enterSecret(game);
			return true;
		}
	}

	// No clock: the table takes as long as it needs, and moves on once every phone has pressed Done.
	if (game.phase === 'secret') {
		const choiceCount = game.choiceCount || sharedChoiceCount(tablePreset(game));
		const everyoneChose = game.players.every(
			(player) => player.secretConfirmed && (player.secretPicks ?? []).length === choiceCount,
		);
		if (everyoneChose) {
			applySecretResolution(game, random);
			return true;
		}
	}

	if (
		game.phase === 'secret-result' &&
		game.players.length > 0 &&
		game.players.every((player) => player.hasSeenSecret)
	) {
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
		...(player.isBot ? { isBot: true } : {}),
		...(player.role ? { role: player.role } : {}),
		dice: player.dice ?? [],
		hasMemorizedRole: player.hasMemorizedRole,
		hasChosenSecret: Boolean(player.secretConfirmed),
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
		...(typeof game.followerCount === 'number' ? { followerCount: game.followerCount } : {}),
		...(isFollowerKnows(game.followerKnowledge)
			? { followerKnowledge: game.followerKnowledge }
			: {}),
		hourSeconds: game.hourSeconds ?? CHEESE_HOUR_SECONDS_DEFAULT,
		voteRound: game.voteRound ?? 0,
		hostToken: game.hostToken,
		...(game.nightStartedAt ? { nightStartedAt: game.nightStartedAt } : {}),
		...(game.dayStartedAt ? { dayStartedAt: game.dayStartedAt } : {}),
		choiceCount: game.choiceCount || 1,
		isRunoff: Boolean(game.isRunoff),
		voteCandidateIds: game.voteCandidateIds ?? [],
		flippedIds: game.flippedIds ?? [],
		followerIds: game.followerIds ?? [],
		...(game.winner ? { winner: game.winner } : {}),
		...(inRound ? { preset: tablePreset(game), resolved: resolvedOf(game) } : {}),
		players,
	};
}

function toRoomStateDTO(game: RoomDoc, viewerToken: string | null, at: Date): RoomStateDTO {
	updateConnectionStatus(game, at);
	return projectRoom(toProjectRoom(game), viewerToken, at);
}

async function loadAndAdvance(
	code: string,
	viewerToken: string | null,
	random: () => number = gameRandom,
): Promise<RoomStateDTO> {
	await dbConnect();
	return withVersionRetry(async () => {
		const at = now();
		const game = (await CheeseThiefRoom.findOne({ code: code.toUpperCase() })) as RoomDoc | null;
		if (!game) throw new GameError('ROOM_NOT_FOUND', 404);

		let changed = false;
		if (clearLegacyTwoNight(game)) changed = true;

		if (viewerToken) {
			const player = findPlayer(game, viewerToken);
			if (player) {
				player.lastSeenAt = at;
				player.connected = true;
				changed = true;
			}
		}

		if (advanceClock(game, at, random)) changed = true;
		if (!game.adminTest?.ownerUserId && migrateHostIfNeeded(game, at)) changed = true;

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
		if (!game) throw new GameError('ROOM_OR_PHASE_INVALID', 404);
		clearLegacyTwoNight(game);
		assertPlayer(game, playerToken);
		mutator(game, at);
		advanceClock(game, at);
		game.version += 1;
		await game.save();
		const fresh = (await CheeseThiefRoom.findOne({ code: code.toUpperCase() })) as RoomDoc;
		return toRoomStateDTO(fresh, playerToken, at);
	});
}

export async function createRoom(
	input: CreateRoomInput,
	testOwnerId?: string,
): Promise<RoomStateDTO> {
	const hostName = normalizePlayerName(input.hostName ?? '');
	if (!hostName) throw new GameError('PLAYER_NAME_REQUIRED', 400);
	const roomName = assertRoomName(input.name);
	const maxPlayers = input.maxPlayers ?? CHEESE_TABLE_SIZE_DEFAULT;
	assertTableSize(maxPlayers, 1);
	const hourSeconds = input.hourSeconds ?? CHEESE_HOUR_SECONDS_DEFAULT;
	assertHourSeconds(hourSeconds);
	if (input.followerCount != null && !isFollowerCountAllowed(input.followerCount, maxPlayers)) {
		throw new GameError('FOLLOWERS_INVALID', 400, { max: maxFollowersFor(maxPlayers) });
	}
	if (input.followerKnowledge != null && !isFollowerKnows(input.followerKnowledge)) {
		throw new GameError('FOLLOWERS_INVALID', 400, { max: maxFollowersFor(maxPlayers) });
	}

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
		...(testOwnerId ? { adminTest: { ownerUserId: testOwnerId } } : {}),
		code,
		name: roomName,
		isPublic: input.isPublic !== false,
		maxPlayers,
		scapegoatEnabled: input.scapegoat === true,
		...(typeof input.followerCount === 'number' ? { followerCount: input.followerCount } : {}),
		...(isFollowerKnows(input.followerKnowledge)
			? { followerKnowledge: input.followerKnowledge }
			: {}),
		hourSeconds,
		voteRound: 0,
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
	const games = (await CheeseThiefRoom.find({
		isPublic: true,
		phase: 'lobby',
		'adminTest.ownerUserId': { $exists: false },
	})
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
	if (!normalizedName) throw new GameError('PLAYER_NAME_REQUIRED', 400);

	await dbConnect();
	return withVersionRetry(async () => {
		const game = (await CheeseThiefRoom.findOne({ code: code.toUpperCase() })) as RoomDoc | null;
		if (!game) throw new GameError('ROOM_NOT_FOUND', 404);
		if (game.phase !== 'lobby') throw new GameError('GAME_IN_PROGRESS', 400);

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

		if (game.players.length >= game.maxPlayers) throw new GameError('ROOM_FULL', 400);
		if (game.players.some((player) => player.name.toLowerCase() === normalizedName.toLowerCase())) {
			throw new GameError('NAME_TAKEN', 400);
		}

		const playerToken = generateToken();
		const at = now();
		game.players.push(blankPlayer(playerToken, normalizedName, at));
		game.version += 1;
		await game.save();
		return { state: toRoomStateDTO(game, playerToken, at), playerToken };
	});
}

export async function getScopedState(
	code: string,
	playerToken: string | null,
	random: () => number = gameRandom,
): Promise<RoomStateDTO> {
	return loadAndAdvance(code, playerToken, random);
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
		const nextSize = input.maxPlayers !== undefined ? input.maxPlayers : game.maxPlayers;
		assertTableSize(nextSize, game.players.length);
		applyFollowerInput(game, input, nextSize);
		game.maxPlayers = nextSize;
		if (input.scapegoat !== undefined) game.scapegoatEnabled = Boolean(input.scapegoat);
		if (input.hourSeconds !== undefined) {
			assertHourSeconds(input.hourSeconds);
			game.hourSeconds = input.hourSeconds;
		}
	});
}

export async function startGame(
	code: string,
	hostToken: string,
	random: () => number = gameRandom,
): Promise<RoomStateDTO> {
	return mutateGame(code, hostToken, 'lobby', (game) => {
		assertHost(game, hostToken);
		if (game.players.length !== game.maxPlayers) {
			throw new GameError('TABLE_NOT_FULL', 400, {
				count: game.players.length,
				size: game.maxPlayers,
			});
		}
		if (!isPlayerCountAllowed(game.players.length)) {
			throw new GameError('NEED_MIN_PLAYERS', 400, { min: CHEESE_MIN_PLAYERS });
		}
		const { seats } = deal(
			game.players.map((player) => player.id),
			game.scapegoatEnabled,
			random,
			followerSettingsOf(game),
		);
		const byId = new Map(seats.map((seat) => [seat.id, seat]));
		for (const player of game.players) {
			const seat = byId.get(player.id);
			if (!seat) continue;
			player.role = seat.role;
			player.dice = seat.dice;
			player.hasMemorizedRole = false;
			player.secretPicks = [];
			player.secretConfirmed = false;
			player.hasSeenSecret = false;
			player.voteId = undefined;
		}
		game.phase = 'deal';
		game.nightStartedAt = undefined;
		game.dayStartedAt = undefined;
		game.choiceCount = sharedChoiceCount(tablePreset(game));
		game.voteRound = 0;
		game.isRunoff = false;
		game.voteCandidateIds = [];
		game.flippedIds = [];
		game.followerIds = [];
		game.peekByPlayer = {};
		game.hunchByPlayer = {};
		game.winner = undefined;
	});
}

export async function confirmMemorized(code: string, playerToken: string): Promise<RoomStateDTO> {
	return mutateGame(code, playerToken, 'deal', (game) => {
		const player = assertPlayer(game, playerToken);
		player.hasMemorizedRole = true;
	});
}

export async function beginNight(code: string, hostToken: string): Promise<RoomStateDTO> {
	return mutateGame(code, hostToken, 'deal', (game, at) => {
		assertHost(game, hostToken);
		if (game.players.some((player) => !player.hasMemorizedRole)) {
			throw new GameError('NEED_ALL_MEMORIZED', 400);
		}
		game.phase = 'night';
		game.nightStartedAt = at;
	});
}

/**
 * `draft` saves an unfinished selection on every tap. Done waits for queued drafts on the
 * client; the secret step ends only after every seat confirms a full selection.
 */
export async function submitSecret(
	code: string,
	playerToken: string,
	picks: string[],
	options: { draft?: boolean } = {},
): Promise<RoomStateDTO> {
	return mutateGame(code, playerToken, 'secret', (game) => {
		const player = assertPlayer(game, playerToken);
		const choiceCount = game.choiceCount || sharedChoiceCount(tablePreset(game));
		const draft = options.draft === true;
		if (
			!Array.isArray(picks) ||
			picks.length > choiceCount ||
			(!draft && picks.length !== choiceCount)
		) {
			throw new GameError('PICK_COUNT', 400, { count: choiceCount });
		}
		if (new Set(picks).size !== picks.length)
			throw new GameError('PICK_COUNT', 400, { count: choiceCount });
		const others = new Set(
			game.players.filter((item) => item.id !== player.id).map((item) => item.id),
		);
		if (picks.some((id) => typeof id !== 'string' || !others.has(id)))
			throw new GameError('PICK_UNKNOWN', 400);
		player.secretPicks = picks;
		player.secretConfirmed = !draft;
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
		game.voteRound = 1;
		game.voteCandidateIds = game.players.map((player) => player.id);
		for (const player of game.players) player.voteId = undefined;
	});
}

export async function submitVote(
	code: string,
	playerToken: string,
	targetId: string,
): Promise<RoomStateDTO> {
	return mutateGame(code, playerToken, 'vote', (game) => {
		const player = assertPlayer(game, playerToken);
		if (!targetId || targetId === player.id) throw new GameError('VOTE_SELF', 400);
		const target = findPlayerById(game, targetId);
		if (!target) throw new GameError('VOTE_NOT_CANDIDATE', 400);
		if (!(game.voteCandidateIds ?? []).includes(targetId)) {
			throw new GameError('VOTE_NOT_CANDIDATE', 400);
		}
		player.voteId = targetId;
	});
}

export async function revote(code: string, hostToken: string): Promise<RoomStateDTO> {
	return mutateGame(code, hostToken, 'tie', (game) => {
		assertHost(game, hostToken);
		game.phase = 'vote';
		game.isRunoff = true;
		game.voteRound = (game.voteRound ?? 0) + 1;
		for (const player of game.players) player.voteId = undefined;
	});
}

export async function playAgain(code: string, hostToken: string): Promise<RoomStateDTO> {
	return mutateGame(code, hostToken, 'reveal', (game) => {
		assertHost(game, hostToken);
		resetToLobby(game);
	});
}

/** Resets a private admin test room from any phase using the normal lobby cleanup rules. */
export async function resetTestRoom(code: string, hostToken: string): Promise<RoomStateDTO> {
	return mutateGame(code, hostToken, undefined, (game) => {
		if (!game.adminTest?.ownerUserId) throw new GameError('ROOM_NOT_FOUND', 404);
		assertHost(game, hostToken);
		resetToLobby(game);
	});
}

export async function kickPlayer(
	code: string,
	hostToken: string,
	targetId: string,
): Promise<RoomStateDTO> {
	return mutateGame(code, hostToken, 'lobby', (game) => {
		assertHost(game, hostToken);
		const target = findPlayerById(game, targetId);
		if (!target) throw new GameError('PLAYER_NOT_FOUND', 404);
		if (target.token === hostToken) throw new GameError('CANNOT_KICK_SELF', 400);
		game.players = game.players.filter((player) => player.id !== targetId);
	});
}

export async function leaveRoom(
	code: string,
	playerToken: string,
): Promise<{ roomClosed: boolean }> {
	await dbConnect();
	return withVersionRetry(async () => {
		const game = (await CheeseThiefRoom.findOne({ code: code.toUpperCase() })) as RoomDoc | null;
		if (!game) throw new GameError('ROOM_NOT_FOUND', 404);
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

/** Projection only: no heartbeat, writes, or phase advancement. */
export async function readTestState(code: string, token: string): Promise<RoomStateDTO> {
	await dbConnect();
	const game = await CheeseThiefRoom.findOne({ code: code.toUpperCase() });
	if (!game) throw new GameError('ROOM_NOT_FOUND', 404);
	return toRoomStateDTO(game, token, now());
}
