import mongoose, { type HydratedDocument } from 'mongoose';
import { customAlphabet } from 'nanoid';

import {
	SPY_DISCONNECT_THRESHOLD_MS,
	SPY_HOST_HANDOFF_MS,
	SPY_MAX_PLAYERS,
	SPY_MAX_ROOM_NAME_LENGTH,
	SPY_MIN_PLAYERS,
	SPY_PHASES,
	SPY_PLAYER_TOKEN_LENGTH,
	SPY_RECENT_WORD_PAIRS,
	SPY_ROOM_CODE_LENGTH,
	isSpyCount,
	minPlayersForSpies,
	normalizeExcludedTags,
	normalizeSpyCount,
	type SpyCount,
} from '@/features/spy-fall/config/spyGame';
import { AppError } from '@/features/spy-fall/lib/appError';
import { assignRoles, pickFirstSpeaker } from '@/features/spy-fall/lib/spy/roleAssignment';
import {
	allPlayersMemorized,
	computePhaseAdvance,
	type PhasePlayer,
} from '@/features/spy-fall/lib/spy/phaseMachine';
import {
	filterWordPairs,
	pickWordPair,
	resolveWordPairForGame,
	wordBankFor,
} from '@/features/spy-fall/lib/spy/wordBank';
import { resolveRoundVote } from '@/features/spy-fall/lib/spy/voteResolver';
import {
	checkOutcome,
	resolveVoteOutcome,
	type GameOutcome,
} from '@/features/spy-fall/lib/spy/winConditions';
import { normalizePlayerName } from '@/features/spy-fall/lib/spy/playerName';
import dbConnect from '@/features/spy-fall/lib/dbConnect';
import SpyGame, { type ISpyGame, type ISpyPlayer } from '@/features/spy-fall/models/SpyGame';
import type {
	CreateRoomInput,
	EliminationLogEntry,
	GamePhase,
	PlayerRole,
	PublicRoomListItemDTO,
	RoomStateDTO,
	UpdateSettingsInput,
} from '@/features/spy-fall/types/spyGame';

const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', SPY_ROOM_CODE_LENGTH);
const generateToken = customAlphabet(
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	SPY_PLAYER_TOKEN_LENGTH,
);

const VALID_PHASES = new Set<string>(SPY_PHASES);

type GameDoc = HydratedDocument<ISpyGame>;

const MAX_SAVE_ATTEMPTS = 3;

/**
 * Array edits by index (lastSeenAt, voteToken, ...) are version-checked by Mongoose,
 * so a join or kick landing at the same moment makes the save fail. Reload and try again.
 */
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

function findPlayer(game: GameDoc, token: string): ISpyPlayer | undefined {
	return game.players.find((p) => p.token === token);
}

function assertPlayer(game: GameDoc, token: string): ISpyPlayer {
	const player = findPlayer(game, token);
	if (!player) throw new AppError('PLAYER_NOT_FOUND', 404);
	return player;
}

function assertUniquePlayerName(game: GameDoc, name: string, excludeToken?: string): void {
	const normalized = name.toLowerCase();
	const duplicate = game.players.some(
		(p) => p.token !== excludeToken && p.name.toLowerCase() === normalized,
	);
	if (duplicate) throw new AppError('NAME_TAKEN', 400);
}

function isInGamePhase(phase: GamePhase): boolean {
	return phase !== 'lobby';
}

function livingPlayers(game: GameDoc): ISpyPlayer[] {
	return game.players.filter((p) => !p.isEliminated);
}

function phasePlayers(game: GameDoc): PhasePlayer[] {
	return game.players.map((p) => ({
		token: p.token,
		hasMemorizedRole: p.hasMemorizedRole,
	}));
}

function clearVotes(game: GameDoc): void {
	for (const player of game.players) {
		player.voteToken = undefined;
	}
}

function updateConnectionStatus(game: GameDoc, at: Date): void {
	const threshold = at.getTime() - SPY_DISCONNECT_THRESHOLD_MS;
	for (const p of game.players) {
		p.connected = p.lastSeenAt.getTime() >= threshold;
	}
}

/**
 * Hand the room to a connected player once the host has been gone for a while.
 * Persisted, so the new host's controls pass the server's host checks.
 */
function migrateHostIfNeeded(game: GameDoc, at: Date): boolean {
	const host = findPlayer(game, game.hostToken);
	if (host && host.lastSeenAt.getTime() >= at.getTime() - SPY_HOST_HANDOFF_MS) return false;
	const connectedSince = at.getTime() - SPY_DISCONNECT_THRESHOLD_MS;
	const replacement = game.players.find(
		(p) => p.token !== game.hostToken && p.lastSeenAt.getTime() >= connectedSince,
	);
	if (!replacement) return false;
	game.hostToken = replacement.token;
	return true;
}

function everyLivingPlayerVoted(game: GameDoc): boolean {
	const living = livingPlayers(game);
	return living.length > 0 && living.every((p) => Boolean(p.voteToken));
}

async function unsetResetArtifacts(code: string): Promise<void> {
	await SpyGame.updateOne(
		{ code: code.toUpperCase(), phase: 'lobby' },
		{ $unset: { wordPair: 1, startedAt: 1, firstSpeakerToken: 1 } },
	);
}

function blankPlayer(token: string, name: string, at: Date): ISpyPlayer {
	return {
		token,
		name,
		avatarSeed: token.slice(0, 8),
		connected: true,
		lastSeenAt: at,
		hasMemorizedRole: false,
		isEliminated: false,
	};
}

function resetGameToLobby(game: GameDoc): void {
	game.phase = 'lobby';
	game.startedAt = undefined;
	game.wordPair = undefined;
	game.eliminatedTokens = [];
	game.round = 1;
	game.firstSpeakerToken = undefined;
	game.voteCandidates = [];
	game.isRevote = false;
	game.eliminationLog = [];
	game.result = {};

	for (const p of game.players) {
		p.role = undefined;
		p.keyword = undefined;
		p.hasMemorizedRole = false;
		p.voteToken = undefined;
		p.isEliminated = false;
	}
}

function applyLazyPhaseAdvance(game: GameDoc): boolean {
	const advance = computePhaseAdvance({ phase: game.phase, players: phasePlayers(game) });
	if (!advance) return false;
	game.phase = advance.nextPhase;
	return true;
}

function votePool(game: GameDoc): string[] {
	if (game.voteCandidates.length > 0) return game.voteCandidates;
	return livingPlayers(game).map((p) => p.token);
}

function finalizeResult(game: GameDoc, outcome: GameOutcome, at: Date): void {
	game.result.winningSide = outcome.winningSide;
	game.result.endReason = outcome.reason;
	game.result.revealedAt = at;
	if (game.startedAt) {
		game.result.durationSeconds = Math.round((at.getTime() - game.startedAt.getTime()) / 1000);
	}
	game.phase = 'result';
}

function outcomePlayers(game: GameDoc) {
	return game.players
		.filter((p) => p.role)
		.map((p) => ({ role: p.role!, isEliminated: p.isEliminated }));
}

function resolveVote(game: GameDoc, at: Date): void {
	const candidates = votePool(game);
	const ballots = livingPlayers(game).map((p) => ({
		voterToken: p.token,
		targetToken: p.voteToken ?? null,
	}));
	const resolution = resolveRoundVote(ballots, candidates);

	if (resolution.eliminated == null && resolution.topTokens.length > 1 && !game.isRevote) {
		game.voteCandidates = resolution.topTokens;
		game.isRevote = true;
		clearVotes(game);
		game.phase = 'vote';
		return;
	}

	const eliminatedToken = resolution.eliminated;
	const eliminated = eliminatedToken ? findPlayer(game, eliminatedToken) : undefined;
	if (eliminated) {
		eliminated.isEliminated = true;
		if (!game.eliminatedTokens.includes(eliminated.token)) {
			game.eliminatedTokens.push(eliminated.token);
		}
	}

	const entry: EliminationLogEntry = {
		round: game.round,
		token: eliminatedToken,
		...(eliminated?.role ? { role: eliminated.role } : {}),
		tally: resolution.tally,
		wasRevote: game.isRevote,
	};
	game.eliminationLog.push(entry);
	clearVotes(game);
	game.voteCandidates = [];
	game.isRevote = false;

	// Every vote must catch a Spy: a miss ends the game, a catch with Spies left means one more round.
	const outcome = resolveVoteOutcome(eliminated?.role ?? null, outcomePlayers(game));
	if (outcome) {
		finalizeResult(game, outcome, at);
		return;
	}
	game.phase = 'reveal';
}

function beginNextRound(game: GameDoc): void {
	game.round += 1;
	game.firstSpeakerToken = pickFirstSpeaker(
		game.players.map((p) => ({ token: p.token, role: p.role, isEliminated: p.isEliminated })),
	);
	game.voteCandidates = [];
	game.isRevote = false;
	clearVotes(game);
	game.phase = 'discussion';
}

function showRole(role: PlayerRole | undefined, eliminated: boolean, phase: GamePhase): boolean {
	if (!role) return false;
	return eliminated || phase === 'result';
}

/** A player always learns their own role at the end, and during play only when the room reveals roles. */
function showOwnRole(game: GameDoc): boolean {
	if (game.phase === 'result') return true;
	return Boolean(game.revealRoles) && isInGamePhase(game.phase);
}

function spiesCaught(game: GameDoc): number {
	return (game.eliminationLog ?? []).filter((entry) => entry.role === 'spy').length;
}

function assertSpyCountFitsRoom(spyCount: SpyCount, maxPlayers: number): void {
	const min = minPlayersForSpies(spyCount);
	if (maxPlayers < min) throw new AppError('SPY_COUNT_NEEDS_ROOM', 400, { min, spies: spyCount });
}

function parseSpyCount(value: unknown): SpyCount {
	if (!isSpyCount(value)) throw new AppError('SPY_COUNT_INVALID', 400);
	return value;
}

function assertMaxPlayers(maxPlayers: unknown): asserts maxPlayers is number {
	if (
		typeof maxPlayers !== 'number' ||
		!Number.isInteger(maxPlayers) ||
		maxPlayers < SPY_MIN_PLAYERS ||
		maxPlayers > SPY_MAX_PLAYERS
	) {
		throw new AppError('MAX_PLAYERS_INVALID', 400, { min: SPY_MIN_PLAYERS, max: SPY_MAX_PLAYERS });
	}
}

function toPublicRoomDTO(game: GameDoc): PublicRoomListItemDTO {
	return {
		code: game.code,
		name: game.name,
		playerCount: game.players.length,
		maxPlayers: game.maxPlayers,
		topic: game.topic,
		status: isInGamePhase(game.phase) ? 'playing' : 'waiting',
	};
}

function toRoomStateDTO(game: GameDoc, viewerToken: string | null, at: Date): RoomStateDTO {
	updateConnectionStatus(game, at);

	const viewer = viewerToken ? findPlayer(game, viewerToken) : undefined;
	const revealAll = game.phase === 'result';
	const lastRound = game.eliminationLog.at(-1);

	const players = game.players.map((p) => ({
		token: p.token,
		name: p.name,
		avatarSeed: p.avatarSeed,
		connected: p.connected,
		hasMemorizedRole: p.hasMemorizedRole,
		isHost: p.token === game.hostToken,
		isEliminated: p.isEliminated,
		...(game.phase === 'vote' ? { hasVoted: Boolean(p.voteToken) } : {}),
		...(showRole(p.role, p.isEliminated, game.phase) ? { role: p.role } : {}),
	}));

	const speaker = game.firstSpeakerToken
		? game.players.find((p) => p.token === game.firstSpeakerToken)
		: undefined;


	const dto: RoomStateDTO = {
		code: game.code,
		name: game.name,
		phase: game.phase,
		version: game.version,
		serverNow: at.toISOString(),
		isHost: viewerToken === game.hostToken,
		isPublic: game.isPublic,
		maxPlayers: game.maxPlayers,
		topic: game.topic,
		excludedTags: normalizeExcludedTags(game.excludedTags),
		playtestMode: Boolean(game.playtestMode),
		spyCount: normalizeSpyCount(game.spyCount),
		revealRoles: Boolean(game.revealRoles),
		spiesCaught: spiesCaught(game),
		round: game.round ?? 1,
		playerCount: game.players.length,
		players,
		voteCandidates: game.voteCandidates ?? [],
		isRevote: Boolean(game.isRevote),
		self: viewer
			? {
					token: viewer.token,
					name: viewer.name,
					avatarSeed: viewer.avatarSeed,
					connected: viewer.connected,
					hasMemorizedRole: viewer.hasMemorizedRole,
					isHost: viewer.token === game.hostToken,
					isEliminated: viewer.isEliminated,
					...(viewer.role && showOwnRole(game) ? { role: viewer.role } : {}),
					keyword: viewer.keyword ?? null,
					voteToken: viewer.voteToken ?? null,
					...(game.phase === 'vote' ? { hasVoted: Boolean(viewer.voteToken) } : {}),
				}
			: null,
	};

	if (speaker) {
		dto.firstSpeaker = { token: speaker.token, name: speaker.name };
	}
	if (lastRound) dto.lastRound = lastRound;

	if (revealAll && game.wordPair && game.result.winningSide) {
		dto.result = {
			winningSide: game.result.winningSide,
			...(game.result.endReason ? { endReason: game.result.endReason } : {}),
			civilianWord: game.wordPair.civilianWord,
			spyWord: game.wordPair.spyWord,
			eliminationLog: game.eliminationLog ?? [],
			durationSeconds: game.result.durationSeconds ?? 0,
		};
		dto.wordPair = game.wordPair;
	}


	return dto;
}

async function loadAndAdvance(
	code: string,
	viewerToken: string | null,
): Promise<{ game: GameDoc; dto: RoomStateDTO }> {
	await dbConnect();
	return withVersionRetry(async () => {
		const at = now();

		let game = (await SpyGame.findOne({ code: code.toUpperCase() })) as GameDoc | null;
		if (!game) throw new AppError('ROOM_NOT_FOUND', 404);

		if (!VALID_PHASES.has(game.phase)) {
			resetGameToLobby(game);
			game.version += 1;
			await game.save();
		}

		if (viewerToken) {
			const player = findPlayer(game, viewerToken);
			if (player) {
				player.lastSeenAt = at;
				player.connected = true;
			}
		}

		let changed = applyLazyPhaseAdvance(game);
		// Two last ballots saved at the same moment each see the other missing; settle it here.
		if (game.phase === 'vote' && everyLivingPlayerVoted(game)) {
			resolveVote(game, at);
			changed = true;
		}
		if (migrateHostIfNeeded(game, at)) changed = true;

		if (changed || viewerToken) {
			if (changed) game.version += 1;
			await game.save();
		}

		if (game.phase === 'lobby') {
			await unsetResetArtifacts(code);
		}

		game = (await SpyGame.findOne({ code: code.toUpperCase() })) as GameDoc;
		return { game, dto: toRoomStateDTO(game, viewerToken, at) };
	});
}

async function mutateGame(
	code: string,
	playerToken: string,
	mutator: (game: GameDoc) => void | Promise<void>,
	expectedPhase?: GamePhase,
): Promise<RoomStateDTO> {
	await dbConnect();
	return withVersionRetry(async () => {
		const at = now();
		const game = (await SpyGame.findOne({
			code: code.toUpperCase(),
			...(expectedPhase ? { phase: expectedPhase } : {}),
		})) as GameDoc | null;

		if (!game) throw new AppError('ROOM_OR_PHASE_INVALID', 404);
		if (!VALID_PHASES.has(game.phase)) {
			resetGameToLobby(game);
		}

		assertPlayer(game, playerToken);
		await mutator(game);
		applyLazyPhaseAdvance(game);

		game.version += 1;
		await game.save();

		const refreshed = (await SpyGame.findOne({ code: code.toUpperCase() })) as GameDoc;
		return toRoomStateDTO(refreshed, playerToken, at);
	});
}

export async function createRoom(input: CreateRoomInput): Promise<RoomStateDTO> {
	const hostName = normalizePlayerName(input.hostName ?? '');
	if (!hostName) throw new AppError('PLAYER_NAME_REQUIRED', 400);
	if (!input.name?.trim()) throw new AppError('ROOM_NAME_REQUIRED', 400);
	if (input.name.length > SPY_MAX_ROOM_NAME_LENGTH) {
		throw new AppError('ROOM_NAME_TOO_LONG', 400, { max: SPY_MAX_ROOM_NAME_LENGTH });
	}

	const maxPlayers = input.maxPlayers ?? SPY_MAX_PLAYERS;
	assertMaxPlayers(maxPlayers);
	const spyCount = input.spyCount === undefined ? normalizeSpyCount(undefined) : parseSpyCount(input.spyCount);
	assertSpyCountFitsRoom(spyCount, maxPlayers);

	await dbConnect();
	const hostToken = generateToken();
	let code = generateCode();

	for (let i = 0; i < 10; i++) {
		const exists = await SpyGame.findOne({ code }).select('_id').lean();
		if (!exists) break;
		code = generateCode();
	}

	const at = now();
	const game = await SpyGame.create({
		code,
		name: input.name.trim(),
		isPublic: Boolean(input.isPublic),
		maxPlayers,
		topic: input.topic ?? 'any',
		excludedTags: normalizeExcludedTags(input.excludedTags),
		playtestMode: input.playtestMode ?? false,
		spyCount,
		revealRoles: input.revealRoles === true,
		hostToken,
		phase: 'lobby',
		version: 0,
		round: 1,
		voteCandidates: [],
		isRevote: false,
		eliminationLog: [],
		recentWordPairIds: [],
		players: [blankPlayer(hostToken, hostName, at)],
		eliminatedTokens: [],
		result: {},
	});

	return toRoomStateDTO(game as GameDoc, hostToken, at);
}

export async function listPublicRooms(): Promise<PublicRoomListItemDTO[]> {
	await dbConnect();
	const games = (await SpyGame.find({ isPublic: true, phase: 'lobby' })
		.sort({ updatedAt: -1 })
		.limit(50)
		.lean()) as GameDoc[];
	return games.map(toPublicRoomDTO);
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
		const game = (await SpyGame.findOne({ code: code.toUpperCase() })) as GameDoc | null;
		if (!game) throw new AppError('ROOM_NOT_FOUND', 404);
		if (isInGamePhase(game.phase)) throw new AppError('GAME_IN_PROGRESS', 400);

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
		if (game.players.some((p) => p.name.toLowerCase() === normalizedName.toLowerCase())) {
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
	const { dto } = await loadAndAdvance(code, playerToken);
	return dto;
}

export async function startGame(
	code: string,
	playerToken: string,
	locale: 'vi' | 'en' = 'vi',
): Promise<RoomStateDTO> {
	return mutateGame(code, playerToken, (game) => {
		if (game.hostToken !== playerToken) throw new AppError('HOST_ONLY_START', 403);
		if (game.phase !== 'lobby') throw new AppError('GAME_ALREADY_STARTED', 400);
		const spyCount = normalizeSpyCount(game.spyCount);
		const minPlayers = minPlayersForSpies(spyCount);
		if (game.players.length < minPlayers) {
			throw spyCount === 1
				? new AppError('NEED_MIN_PLAYERS', 400, { min: minPlayers })
				: new AppError('NEED_MIN_PLAYERS_FOR_SPIES', 400, { min: minPlayers, spies: spyCount });
		}

		const topic = game.topic === 'any' ? undefined : game.topic;
		const excludedTags = normalizeExcludedTags(game.excludedTags);
		if (filterWordPairs(topic, wordBankFor(locale), excludedTags).length === 0) {
			throw new AppError('NO_WORD_PAIRS', 400);
		}

		const pair = pickWordPair({
			topic,
			excludedTags,
			recentIds: game.recentWordPairIds,
			locale,
		});

		game.wordPair = resolveWordPairForGame(pair);
		game.recentWordPairIds = [pair.id, ...game.recentWordPairIds].slice(0, SPY_RECENT_WORD_PAIRS);

		const assigned = assignRoles(
			game.players.map((p) => ({ token: p.token, name: p.name })),
			game.wordPair,
			Math.random,
			spyCount,
		);

		for (const a of assigned) {
			const p = assertPlayer(game, a.token);
			p.role = a.role;
			p.keyword = a.keyword;
			p.hasMemorizedRole = false;
			p.voteToken = undefined;
			p.isEliminated = false;
		}

		game.phase = 'role-reveal';
		game.startedAt = now();
		game.round = 1;
		game.eliminatedTokens = [];
		game.eliminationLog = [];
		game.voteCandidates = [];
		game.isRevote = false;
		game.firstSpeakerToken = pickFirstSpeaker(
			assigned.map((p) => ({ token: p.token, role: p.role, isEliminated: false })),
		);
		game.result = {};
	});
}

export async function confirmMemorized(code: string, playerToken: string): Promise<RoomStateDTO> {
	return mutateGame(
		code,
		playerToken,
		(game) => {
			if (game.phase !== 'role-reveal') throw new AppError('NOT_ROLE_REVEAL', 400);
			assertPlayer(game, playerToken).hasMemorizedRole = true;
			if (allPlayersMemorized(phasePlayers(game))) {
				game.phase = 'discussion';
			}
		},
		'role-reveal',
	);
}

export async function submitVote(
	code: string,
	playerToken: string,
	targetToken: string | null,
): Promise<RoomStateDTO> {
	return mutateGame(
		code,
		playerToken,
		(game) => {
			if (game.phase !== 'vote') throw new AppError('NOT_VOTE', 400);
			const player = assertPlayer(game, playerToken);
			if (player.isEliminated) throw new AppError('VOTE_ELIMINATED', 400);

			if (!targetToken) {
				player.voteToken = undefined;
				return;
			}

			if (targetToken === playerToken) throw new AppError('VOTE_SELF', 400);
			const target = assertPlayer(game, targetToken);
			if (target.isEliminated) throw new AppError('VOTE_NOT_CANDIDATE', 400);
			const pool = votePool(game);
			if (!pool.includes(targetToken)) throw new AppError('VOTE_NOT_CANDIDATE', 400);

			player.voteToken = targetToken;

			const living = livingPlayers(game);
			if (living.every((p) => Boolean(p.voteToken))) {
				resolveVote(game, now());
			}
		},
		'vote',
	);
}

export async function updateSettings(
	code: string,
	playerToken: string,
	input: UpdateSettingsInput,
): Promise<RoomStateDTO> {
	return mutateGame(code, playerToken, (game) => {
		if (game.hostToken !== playerToken) throw new AppError('HOST_ONLY_SETTINGS', 403);
		if (game.phase !== 'lobby') throw new AppError('SETTINGS_LOBBY_ONLY', 400);

		const maxPlayers = input.maxPlayers ?? game.maxPlayers;
		assertMaxPlayers(maxPlayers);
		const spyCount =
			input.spyCount === undefined ? normalizeSpyCount(game.spyCount) : parseSpyCount(input.spyCount);
		assertSpyCountFitsRoom(spyCount, maxPlayers);

		if (input.name !== undefined) game.name = input.name.trim();
		if (input.isPublic !== undefined) game.isPublic = input.isPublic;
		game.maxPlayers = maxPlayers;
		game.spyCount = spyCount;
		if (input.revealRoles !== undefined) game.revealRoles = input.revealRoles === true;
		if (input.topic !== undefined) game.topic = input.topic;
		if (input.excludedTags !== undefined) {
			game.excludedTags = normalizeExcludedTags(input.excludedTags);
		}
		if (input.playtestMode !== undefined) game.playtestMode = input.playtestMode;
	});
}

export async function hostAdvancePhase(code: string, hostToken: string): Promise<RoomStateDTO> {
	return mutateGame(code, hostToken, (game) => {
		if (game.hostToken !== hostToken) throw new AppError('HOST_ONLY', 403);
		const at = now();

		if (game.phase === 'role-reveal') {
			for (const p of game.players) p.hasMemorizedRole = true;
			return;
		}
		if (game.phase === 'discussion') {
			game.voteCandidates = [];
			game.isRevote = false;
			clearVotes(game);
			game.phase = 'vote';
			return;
		}
		if (game.phase === 'vote') {
			resolveVote(game, at);
			return;
		}
		if (game.phase === 'reveal') {
			beginNextRound(game);
			return;
		}
		throw new AppError('CANNOT_ADVANCE', 400);
	});
}

export async function playAgain(code: string, hostToken: string): Promise<RoomStateDTO> {
	await mutateGame(
		code,
		hostToken,
		(game) => {
			if (game.hostToken !== hostToken) throw new AppError('HOST_ONLY_PLAY_AGAIN', 403);
			if (game.phase !== 'result') throw new AppError('PLAY_AGAIN_RESULT_ONLY', 400);
			resetGameToLobby(game);
		},
		'result',
	);
	await unsetResetArtifacts(code);
	return getScopedState(code, hostToken);
}

export async function restartRoom(code: string, hostToken: string): Promise<RoomStateDTO> {
	await mutateGame(code, hostToken, (game) => {
		if (game.hostToken !== hostToken) throw new AppError('HOST_ONLY_RESTART', 403);
		if (game.phase === 'lobby') throw new AppError('RESTART_NOT_LOBBY', 400);
		resetGameToLobby(game);
	});
	await unsetResetArtifacts(code);
	return getScopedState(code, hostToken);
}

export async function kickPlayer(
	code: string,
	hostToken: string,
	targetToken: string,
): Promise<RoomStateDTO> {
	return mutateGame(
		code,
		hostToken,
		(game) => {
			if (game.hostToken !== hostToken) throw new AppError('HOST_ONLY', 403);
			if (game.phase !== 'lobby') throw new AppError('KICK_LOBBY_ONLY', 400);
			if (targetToken === hostToken) throw new AppError('CANNOT_KICK_SELF', 400);
			assertPlayer(game, targetToken);
			game.players = game.players.filter((p) => p.token !== targetToken);
		},
		'lobby',
	);
}

export async function renamePlayer(
	code: string,
	playerToken: string,
	name: string,
): Promise<RoomStateDTO> {
	const normalizedName = normalizePlayerName(name);
	if (!normalizedName) throw new AppError('PLAYER_NAME_REQUIRED', 400);

	return mutateGame(code, playerToken, (game) => {
		if (game.phase !== 'lobby') throw new AppError('RENAME_LOBBY_ONLY', 400);
		const player = assertPlayer(game, playerToken);
		if (player.name === normalizedName) return;
		assertUniquePlayerName(game, normalizedName, playerToken);
		player.name = normalizedName;
	});
}

/**
 * Keep a running game consistent when someone leaves: drop them from the ballot,
 * pick a new first speaker if needed, and end the game if the numbers decide it.
 */
function settleAfterLeave(game: GameDoc, leftToken: string, at: Date): void {
	game.voteCandidates = game.voteCandidates.filter((token) => token !== leftToken);
	if (game.isRevote && game.voteCandidates.length < 2) {
		game.voteCandidates = [];
		game.isRevote = false;
	}
	for (const player of game.players) {
		if (player.voteToken === leftToken) player.voteToken = undefined;
	}
	if (game.firstSpeakerToken === leftToken && livingPlayers(game).length > 0) {
		game.firstSpeakerToken = pickFirstSpeaker(
			game.players.map((p) => ({ token: p.token, role: p.role, isEliminated: p.isEliminated })),
		);
	}
	if (game.phase === 'role-reveal') {
		applyLazyPhaseAdvance(game);
	}
	if (game.phase === 'role-reveal' || game.players.length < 2) return;

	const outcome = checkOutcome(outcomePlayers(game));
	if (outcome) {
		finalizeResult(game, outcome, at);
		return;
	}
	if (game.phase === 'vote' && livingPlayers(game).every((p) => Boolean(p.voteToken))) {
		resolveVote(game, at);
	}
}

export async function leaveRoom(
	code: string,
	playerToken: string,
): Promise<{ roomClosed: boolean }> {
	await dbConnect();
	return withVersionRetry(async () => {
		const at = now();
		const game = (await SpyGame.findOne({ code: code.toUpperCase() })) as GameDoc | null;
		if (!game) throw new AppError('ROOM_NOT_FOUND', 404);

		assertPlayer(game, playerToken);
		const wasHost = game.hostToken === playerToken;
		game.players = game.players.filter((p) => p.token !== playerToken);

		if (game.players.length === 0) {
			await SpyGame.deleteOne({ code: game.code });
			return { roomClosed: true };
		}

		if (wasHost) {
			const replacement = game.players.find((p) => p.connected) ?? game.players[0]!;
			game.hostToken = replacement.token;
		}

		if (game.phase !== 'lobby' && game.phase !== 'result') {
			settleAfterLeave(game, playerToken, at);
		}

		game.version += 1;
		await game.save();
		return { roomClosed: false };
	});
}
