import { type HydratedDocument } from 'mongoose';
import { customAlphabet } from 'nanoid';

import {
	SPY_DISCONNECT_THRESHOLD_MS,
	SPY_MAX_PLAYER_NAME_LENGTH,
	SPY_MAX_PLAYERS,
	SPY_MAX_ROOM_NAME_LENGTH,
	SPY_MIN_PLAYERS,
	SPY_PLAYER_TOKEN_LENGTH,
	SPY_RECENT_WORD_PAIRS,
	SPY_ROOM_CODE_LENGTH,
	getRoleDistribution,
} from '@/config/spyGame';
import { AppError } from '@/lib/appError';
import { assignRoles } from '@/lib/spy/roleAssignment';
import {
	allPlayersMemorized,
	allPlayersSpoken,
	computePhaseAdvance,
	startMrWhiteGuessPhase,
	startResultPhase,
	startRunoffPhase,
	startVotePhase,
	type PhaseContext,
} from '@/lib/spy/phaseMachine';
import { pickWordPair, resolveWordPairForGame } from '@/lib/spy/wordBank';
import {
	resolveElimination,
	resolveRunoffVote,
	type VoteBallot,
	type RunoffBallot,
} from '@/lib/spy/voteResolver';
import {
	determineWinner,
	isMrWhiteGuessMeaningful,
	shouldMrWhiteGuess,
} from '@/lib/spy/winConditions';
import { normalizePlayerName } from '@/lib/spy/playerName';
import dbConnect from '@/lib/dbConnect';
import SpyGame, { type ISpyGame, type ISpyPlayer } from '@/models/SpyGame';
import type {
	CreateRoomInput,
	GamePhase,
	MrWhiteResultInput,
	PublicRoomListItemDTO,
	RoomStateDTO,
	RunoffVoteInput,
	UpdateSettingsInput,
	VoteInput,
	WinningSide,
} from '@/types/spyGame';

const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', SPY_ROOM_CODE_LENGTH);
const generateToken = customAlphabet(
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	SPY_PLAYER_TOKEN_LENGTH,
);

type GameDoc = HydratedDocument<ISpyGame>;

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

function getSuspicionCounts(players: ISpyPlayer[]): Map<string, number> {
	const counts = new Map<string, number>();
	for (const p of players) {
		counts.set(p.token, 0);
	}
	for (const p of players) {
		for (const token of p.publicSuspectTokens ?? []) {
			if (counts.has(token)) {
				counts.set(token, (counts.get(token) ?? 0) + 1);
			}
		}
	}
	return counts;
}

function updateConnectionStatus(game: GameDoc, at: Date): void {
	const threshold = at.getTime() - SPY_DISCONNECT_THRESHOLD_MS;
	for (const p of game.players) {
		p.connected = p.lastSeenAt.getTime() >= threshold;
	}
}

function migrateHostIfNeeded(game: GameDoc): void {
	const host = findPlayer(game, game.hostToken);
	if (host?.connected) return;

	const replacement = game.players.find((p) => p.connected && p.token !== game.hostToken);
	if (replacement) {
		game.hostToken = replacement.token;
	}
}

/** Nested schema paths can remain as {} after save — strip them for a clean lobby. */
async function unsetResetArtifacts(code: string): Promise<void> {
	// Guard with phase: 'lobby' so a stale poll cannot wipe wordPair after startGame.
	await SpyGame.updateOne(
		{ code: code.toUpperCase(), phase: 'lobby' },
		{
			$unset: {
				wordPair: 1,
				startedAt: 1,
				phaseEndsAt: 1,
				runoff: 1,
				debug: 1,
			},
		},
	);
}

function getConfirmerToken(game: GameDoc): string | undefined {
	const host = findPlayer(game, game.hostToken);
	const mrWhiteToken = game.mrWhite.token;
	if (host?.connected && host.token !== mrWhiteToken) return game.hostToken;
	return game.players.find((p) => p.connected && p.token !== mrWhiteToken)?.token;
}

function buildPhaseContext(game: GameDoc, at: Date): PhaseContext {
	return {
		phase: game.phase,
		playerCount: game.players.length,
		players: game.players.map((p) => ({
			token: p.token,
			hasMemorizedRole: p.hasMemorizedRole,
			hasSpoken: p.hasSpoken,
			voteConfirmed: p.voteConfirmed,
			connected: p.connected,
		})),
		allSpoken: allPlayersSpoken(
			game.players.map((p) => ({
				token: p.token,
				hasMemorizedRole: p.hasMemorizedRole,
				hasSpoken: p.hasSpoken,
				voteConfirmed: p.voteConfirmed,
				connected: p.connected,
			})),
		),
		hasRunoff: Boolean(game.runoff?.candidateTokens?.length),
		needsMrWhiteGuess: shouldMrWhiteGuess(
			game.eliminatedTokens,
			game.players.filter((p) => p.role).map((p) => ({ token: p.token, role: p.role! })),
			Boolean(game.hideRoles),
		),
		voteLocked: game.phase !== 'vote' && game.phase !== 'runoff',
		now: at,
	};
}

function tallyVotes(game: GameDoc, at: Date): void {
	const dist = getRoleDistribution(game.players.length, Boolean(game.hideRoles));

	if (game.phase === 'runoff' && game.runoff) {
		const runoffBallots: RunoffBallot[] = game.players.map((p) => ({
			voterToken: p.token,
			choices: p.runoffChoices,
		}));
		const runoffResult = resolveRunoffVote(
			runoffBallots,
			game.runoff.candidateTokens,
			game.runoff.slotsRemaining,
		);
		if (!game.debug) game.debug = { tieBreakTrace: [] };
		game.debug.tieBreakTrace = [
			...(game.debug.tieBreakTrace ?? []),
			...runoffResult.trace,
		];
		game.eliminatedTokens = [
			...game.runoff.primarySelectedTokens,
			...runoffResult.selected,
		].slice(0, dist.eliminationCount);
		game.runoff = undefined;
	} else {
		const candidates = game.players.map((p) => p.token);
		const ballots: VoteBallot[] = game.players.map((p) => ({
			voterToken: p.token,
			vote1Token: p.vote1Token,
			vote2Token: p.vote2Token,
		}));

		const resolution = resolveElimination(
			ballots,
			null,
			candidates,
			dist.eliminationCount,
		);

		if (!game.debug) game.debug = { tieBreakTrace: [] };
		game.debug.tieBreakTrace = resolution.trace;
		game.debug.voteTotals = resolution.tallies;

		if (resolution.needsRunoff) {
			game.runoff = {
				candidateTokens: resolution.runoffCandidates ?? [],
				slotsRemaining: resolution.slotsRemaining ?? 1,
				primarySelectedTokens: resolution.selected,
				primaryVoteSnapshot: resolution.tallies,
			};
			game.players.forEach((p) => {
				p.runoffChoices = [];
			});
			const advance = startRunoffPhase();
			game.phase = advance.nextPhase;
			game.phaseEndsAt = undefined;
			return;
		}

		game.eliminatedTokens = resolution.selected.slice(0, dist.eliminationCount);
	}
	game.players.forEach((p) => {
		p.isEliminated = game.eliminatedTokens.includes(p.token);
	});

	const mrWhitePlayer = game.players.find((p) => p.role === 'mrwhite');
	if (mrWhitePlayer) {
		game.mrWhite.token = mrWhitePlayer.token;
	}

	const needsGuess = shouldMrWhiteGuess(
		game.eliminatedTokens,
		game.players.filter((p) => p.role).map((p) => ({ token: p.token, role: p.role! })),
		Boolean(game.hideRoles),
	);

	if (needsGuess) {
		game.mrWhite.guessResult = 'pending';
		const advance = startMrWhiteGuessPhase();
		game.phase = advance.nextPhase;
		game.phaseEndsAt = undefined;
	} else {
		finalizeResult(game, at);
	}
}

function finalizeResult(game: GameDoc, at: Date): void {
	const win = determineWinner({
		playerCount: game.players.length,
		eliminatedTokens: game.eliminatedTokens,
		players: game.players.filter((p) => p.role).map((p) => ({ token: p.token, role: p.role! })),
		mrWhiteGuessResult: game.mrWhite.guessResult,
		hideRoles: Boolean(game.hideRoles),
	});

	game.result.winningSide = win.winningSide;
	game.result.revealedAt = at;
	if (game.startedAt) {
		game.result.durationSeconds = Math.round((at.getTime() - game.startedAt.getTime()) / 1000);
	}

	const advance = startResultPhase();
	game.phase = advance.nextPhase;
	game.phaseEndsAt = undefined;
}

function applyLazyPhaseAdvance(game: GameDoc, at: Date): boolean {
	const ctx = buildPhaseContext(game, at);
	const advance = computePhaseAdvance(ctx);
	if (!advance) return false;

	game.phase = advance.nextPhase;
	game.phaseEndsAt = undefined;
	return true;
}

function toPublicRoomDTO(game: GameDoc): PublicRoomListItemDTO {
	return {
		code: game.code,
		name: game.name,
		playerCount: game.players.length,
		maxPlayers: game.maxPlayers,
		topic: game.topic,
		difficulty: game.difficulty,
		status: isInGamePhase(game.phase) ? 'playing' : 'waiting',
	};
}

function toRoomStateDTO(game: GameDoc, viewerToken: string | null, at: Date): RoomStateDTO {
	updateConnectionStatus(game, at);
	migrateHostIfNeeded(game);

	const suspicionCounts = getSuspicionCounts(game.players);
	const viewer = viewerToken ? findPlayer(game, viewerToken) : undefined;
	const voteTotalsMap = new Map(
		(game.debug?.voteTotals ?? []).map((t) => [t.token, t.totalVotes]),
	);

	const players = game.players.map((p) => ({
		token: p.token,
		name: p.name,
		avatarSeed: p.avatarSeed,
		connected: p.connected,
		isReady: p.isReady,
		hasMemorizedRole: p.hasMemorizedRole,
		hasSpoken: p.hasSpoken,
		suspicionCount: suspicionCounts.get(p.token) ?? 0,
		isHost: p.token === game.hostToken,
		isEliminated: p.isEliminated,
		...(game.phase === 'vote' || game.phase === 'runoff'
			? { voteConfirmed: p.voteConfirmed }
			: {}),
		...(game.phase === 'result'
			? {
					role: p.role,
					votesReceived: voteTotalsMap.get(p.token) ?? 0,
				}
			: {}),
	}));

	const confirmer = getConfirmerToken(game);
	const hideRoles = Boolean(game.hideRoles);
	const revealSelfRole = !hideRoles || game.phase === 'result';

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
		difficulty: game.difficulty,
		showQuestionHints: game.showQuestionHints,
		hideRoles,
		playtestMode: Boolean(game.playtestMode),
		playerCount: game.players.length,
		players,
		self: viewer
			? {
					token: viewer.token,
					name: viewer.name,
					avatarSeed: viewer.avatarSeed,
					connected: viewer.connected,
					isReady: viewer.isReady,
					hasMemorizedRole: viewer.hasMemorizedRole,
					hasSpoken: viewer.hasSpoken,
					suspicionCount: suspicionCounts.get(viewer.token) ?? 0,
					isHost: viewer.token === game.hostToken,
					isEliminated: viewer.isEliminated,
					...(revealSelfRole ? { role: viewer.role } : {}),
					keyword: viewer.keyword ?? null,
					teammateName: revealSelfRole ? (viewer.teammateName ?? null) : null,
					publicSuspectTokens: viewer.publicSuspectTokens ?? [],
					vote1Token: viewer.vote1Token ?? null,
					vote2Token: viewer.vote2Token ?? null,
					voteConfirmed: viewer.voteConfirmed,
					runoffChoices: viewer.runoffChoices ?? [],
				}
			: null,
	};

	if (game.phase === 'result' && game.wordPair) {
		dto.result = {
			winningSide: game.result.winningSide!,
			eliminatedTokens: game.eliminatedTokens,
			wordsRevealed: game.wordsRevealed,
			mrWhiteGuessResult: game.mrWhite.guessResult,
			durationSeconds: game.result.durationSeconds ?? 0,
			...(game.wordsRevealed
				? {
						civilianWord: game.wordPair.civilianWord,
						spyWord: game.wordPair.spyWord,
					}
				: {}),
		};
	}

	if (game.runoff && game.phase === 'runoff') {
		dto.runoff = {
			candidateTokens: game.runoff.candidateTokens,
			slotsRemaining: game.runoff.slotsRemaining,
		};
	}

	if (game.phase === 'mrwhite-guess') {
		const mw = game.players.find((p) => p.role === 'mrwhite');
		dto.mrWhite = {
			token: game.mrWhite.token ?? null,
			playerName: mw?.name ?? null,
			guessResult: game.mrWhite.guessResult,
			canConfirm: viewerToken === confirmer,
		};
	}

	if (game.playtestMode && viewerToken === game.hostToken && game.debug) {
		dto.debug = game.debug.tieBreakTrace;
	}

	if (game.phase === 'vote' && game.players.length >= SPY_MIN_PLAYERS) {
		dto.votesRequired = getRoleDistribution(
			game.players.length,
			Boolean(game.hideRoles),
		).eliminationCount;
	}

	if (game.phase === 'discussion' && game.players.length >= SPY_MIN_PLAYERS) {
		dto.suspectsRequired = getRoleDistribution(
			game.players.length,
			Boolean(game.hideRoles),
		).eliminationCount;
	}

	return dto;
}

async function loadAndAdvance(code: string, viewerToken: string | null): Promise<{ game: GameDoc; dto: RoomStateDTO }> {
	await dbConnect();
	const at = now();

	let game = (await SpyGame.findOne({ code: code.toUpperCase() })) as GameDoc | null;
	if (!game) throw new AppError('ROOM_NOT_FOUND', 404);

	if (viewerToken) {
		const player = findPlayer(game, viewerToken);
		if (player) {
			player.lastSeenAt = at;
			player.connected = true;
		}
	}

	const changed = applyLazyPhaseAdvance(game, at);
	if (changed) {
		game.version += 1;
		await game.save();
	} else if (viewerToken) {
		await game.save();
	}

	// Full-document saves can rehydrate empty nested paths after a reset $unset.
	if (game.phase === 'lobby') {
		await unsetResetArtifacts(code);
	}

	game = (await SpyGame.findOne({ code: code.toUpperCase() })) as GameDoc;
	return { game, dto: toRoomStateDTO(game, viewerToken, at) };
}

async function mutateGame(
	code: string,
	playerToken: string,
	mutator: (game: GameDoc) => void | Promise<void>,
	expectedPhase?: GamePhase,
): Promise<RoomStateDTO> {
	await dbConnect();
	const at = now();
	const game = (await SpyGame.findOne({
		code: code.toUpperCase(),
		...(expectedPhase ? { phase: expectedPhase } : {}),
	})) as GameDoc | null;

	if (!game) throw new AppError('ROOM_OR_PHASE_INVALID', 404);

	assertPlayer(game, playerToken);
	await mutator(game);

	applyLazyPhaseAdvance(game, at);

	game.version += 1;
	await game.save();

	const refreshed = (await SpyGame.findOne({ code: code.toUpperCase() })) as GameDoc;
	return toRoomStateDTO(refreshed, playerToken, at);
}

// ─── Public API ────────────────────────────────────────────────────────────────

export async function createRoom(input: CreateRoomInput): Promise<RoomStateDTO> {
	const hostName = normalizePlayerName(input.hostName ?? '');
	if (!hostName) throw new AppError('PLAYER_NAME_REQUIRED', 400);
	if (!input.name?.trim()) throw new AppError('ROOM_NAME_REQUIRED', 400);
	if (input.name.length > SPY_MAX_ROOM_NAME_LENGTH) {
		throw new AppError('ROOM_NAME_TOO_LONG', 400, { max: SPY_MAX_ROOM_NAME_LENGTH });
	}

	const maxPlayers = input.maxPlayers ?? SPY_MAX_PLAYERS;
	if (maxPlayers < SPY_MIN_PLAYERS || maxPlayers > SPY_MAX_PLAYERS) {
		throw new AppError('MAX_PLAYERS_INVALID', 400, { min: SPY_MIN_PLAYERS, max: SPY_MAX_PLAYERS });
	}

	await dbConnect();
	const hostToken = generateToken();
	let code = generateCode();

	for (let i = 0; i < 10; i++) {
		const exists = await SpyGame.findOne({ code }).select('_id').lean();
		if (!exists) break;
		code = generateCode();
	}

	const at = now();
	const hostPlayer: ISpyPlayer = {
		token: hostToken,
		name: hostName,
		avatarSeed: hostToken.slice(0, 8),
		connected: true,
		lastSeenAt: at,
		isReady: false,
		hasMemorizedRole: false,
		hasSpoken: false,
		publicSuspectTokens: [],
		voteConfirmed: false,
		runoffChoices: [],
		isEliminated: false,
	};

	const game = await SpyGame.create({
		code,
		name: input.name.trim(),
		isPublic: Boolean(input.isPublic),
		maxPlayers,
		topic: input.topic ?? 'any',
		difficulty: input.difficulty ?? 'mixed',
		showQuestionHints: input.showQuestionHints ?? true,
		hideRoles: input.hideRoles ?? false,
		playtestMode: input.playtestMode ?? false,
		hostToken,
		phase: 'lobby',
		version: 0,
		recentWordPairIds: [],
		players: [hostPlayer],
		eliminatedTokens: [],
		mrWhite: { guessResult: 'pending' },
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
	const game = (await SpyGame.findOne({ code: code.toUpperCase() })) as GameDoc | null;
	if (!game) throw new AppError('ROOM_NOT_FOUND', 404);

	if (isInGamePhase(game.phase)) {
		throw new AppError('GAME_IN_PROGRESS', 400);
	}

	if (existingToken) {
		const existing = findPlayer(game, existingToken);
		if (existing) {
			existing.lastSeenAt = now();
			existing.connected = true;
			game.version += 1;
			await game.save();
			return {
				state: toRoomStateDTO(game, existingToken, now()),
				playerToken: existingToken,
			};
		}
	}

	if (game.players.length >= game.maxPlayers) {
		throw new AppError('ROOM_FULL', 400);
	}

	const duplicateName = game.players.some(
		(p) => p.name.toLowerCase() === normalizedName.toLowerCase(),
	);
	if (duplicateName) throw new AppError('NAME_TAKEN', 400);

	const playerToken = generateToken();
	const at = now();
	game.players.push({
		token: playerToken,
		name: normalizedName,
		avatarSeed: playerToken.slice(0, 8),
		connected: true,
		lastSeenAt: at,
		isReady: false,
		hasMemorizedRole: false,
		hasSpoken: false,
		publicSuspectTokens: [],
		voteConfirmed: false,
		runoffChoices: [],
		isEliminated: false,
	});
	game.version += 1;
	await game.save();

	return {
		state: toRoomStateDTO(game, playerToken, at),
		playerToken,
	};
}

export async function getScopedState(code: string, playerToken: string | null): Promise<RoomStateDTO> {
	const { dto } = await loadAndAdvance(code, playerToken);
	return dto;
}

export async function setReady(code: string, playerToken: string, ready: boolean): Promise<RoomStateDTO> {
	return mutateGame(code, playerToken, (game) => {
		if (game.phase !== 'lobby') throw new AppError('READY_LOBBY_ONLY', 400);
		const player = assertPlayer(game, playerToken);
		player.isReady = ready;
	});
}

export async function startGame(
	code: string,
	playerToken: string,
	locale: 'vi' | 'en' = 'vi',
): Promise<RoomStateDTO> {
	return mutateGame(code, playerToken, (game) => {
		if (game.hostToken !== playerToken) throw new AppError('HOST_ONLY_START', 403);
		if (game.phase !== 'lobby') throw new AppError('GAME_ALREADY_STARTED', 400);
		if (game.players.length < SPY_MIN_PLAYERS) {
			throw new AppError('NEED_MIN_PLAYERS', 400, { min: SPY_MIN_PLAYERS });
		}
		if (!game.players.every((p) => p.isReady)) {
			throw new AppError('ALL_MUST_READY', 400);
		}
		if (!game.players.every((p) => p.connected)) {
			throw new AppError('ALL_MUST_CONNECTED', 400);
		}

		const pair = pickWordPair({
			topic: game.topic === 'any' ? undefined : game.topic,
			difficulty: game.difficulty,
			recentIds: game.recentWordPairIds,
			locale,
		});

		game.wordPair = resolveWordPairForGame(pair);
		game.recentWordPairIds = [pair.id, ...game.recentWordPairIds].slice(0, SPY_RECENT_WORD_PAIRS);

		const assigned = assignRoles(
			game.players.map((p) => ({ token: p.token, name: p.name })),
			game.wordPair,
			Math.random,
			Boolean(game.hideRoles),
		);

		for (const a of assigned) {
			const p = assertPlayer(game, a.token);
			p.role = a.role;
			p.keyword = a.keyword;
			p.teammateName = a.teammateName;
			p.hasMemorizedRole = false;
			p.hasSpoken = false;
			p.publicSuspectTokens = [];
			p.vote1Token = undefined;
			p.vote2Token = undefined;
			p.voteConfirmed = false;
			p.runoffChoices = [];
			p.isEliminated = false;
			p.isReady = false;
		}

		game.phase = 'role-reveal';
		game.phaseEndsAt = undefined;
		game.startedAt = now();
		game.eliminatedTokens = [];
		game.runoff = undefined;
		game.mrWhite = { guessResult: game.hideRoles ? 'skipped' : 'pending' };
		game.result = {};
		game.debug = { tieBreakTrace: [] };
	});
}

export async function confirmMemorized(code: string, playerToken: string): Promise<RoomStateDTO> {
	return mutateGame(code, playerToken, (game) => {
		if (game.phase !== 'role-reveal') throw new AppError('NOT_ROLE_REVEAL', 400);
		const player = assertPlayer(game, playerToken);
		player.hasMemorizedRole = true;

		if (allPlayersMemorized(game.players.map((p) => ({
			token: p.token,
			hasMemorizedRole: p.hasMemorizedRole,
			hasSpoken: p.hasSpoken,
			voteConfirmed: p.voteConfirmed,
			connected: p.connected,
		})))) {
			game.phase = 'opening';
		}
	}, 'role-reveal');
}

export async function markSpoke(code: string, playerToken: string): Promise<RoomStateDTO> {
	return mutateGame(code, playerToken, (game) => {
		if (game.phase !== 'opening') throw new AppError('NOT_OPENING', 400);
		const player = assertPlayer(game, playerToken);
		player.hasSpoken = true;

		if (allPlayersSpoken(game.players.map((p) => ({
			token: p.token,
			hasMemorizedRole: p.hasMemorizedRole,
			hasSpoken: p.hasSpoken,
			voteConfirmed: p.voteConfirmed,
			connected: p.connected,
		})))) {
			game.phase = 'discussion';
			game.phaseEndsAt = undefined;
		}
	}, 'opening');
}

export async function hostMarkSpoke(
	code: string,
	hostToken: string,
	targetToken: string,
	spoken: boolean,
): Promise<RoomStateDTO> {
	return mutateGame(code, hostToken, (game) => {
		if (game.hostToken !== hostToken) throw new AppError('HOST_ONLY_EDIT', 403);
		if (game.phase !== 'opening') throw new AppError('NOT_OPENING', 400);
		const target = assertPlayer(game, targetToken);
		target.hasSpoken = spoken;
	}, 'opening');
}

export async function setSuspect(
	code: string,
	playerToken: string,
	suspectTokens: string[] | null,
): Promise<RoomStateDTO> {
	return mutateGame(code, playerToken, (game) => {
		if (game.phase !== 'discussion') throw new AppError('SUSPECT_DISCUSSION_ONLY', 400);
		const player = assertPlayer(game, playerToken);
		const suspectsRequired = getRoleDistribution(
			game.players.length,
			Boolean(game.hideRoles),
		).eliminationCount;
		const tokens = suspectTokens ?? [];

		if (tokens.length > suspectsRequired) {
			throw new AppError('SUSPECT_MAX', 400, { max: suspectsRequired });
		}

		const unique = new Set(tokens);
		if (unique.size !== tokens.length) {
			throw new AppError('SUSPECT_DUPLICATE', 400);
		}

		for (const token of tokens) {
			if (token === playerToken) throw new AppError('SUSPECT_SELF', 400);
			assertPlayer(game, token);
		}

		player.publicSuspectTokens = tokens;
	}, 'discussion');
}

export async function submitVote(
	code: string,
	playerToken: string,
	input: VoteInput,
): Promise<RoomStateDTO> {
	return mutateGame(code, playerToken, (game) => {
		if (game.phase !== 'vote') throw new AppError('NOT_VOTE', 400);
		const player = assertPlayer(game, playerToken);
		const votesRequired = getRoleDistribution(
			game.players.length,
			Boolean(game.hideRoles),
		).eliminationCount;

		if (input.vote1Token !== undefined) {
			if (input.vote1Token === playerToken) throw new AppError('VOTE_SELF', 400);
			if (input.vote1Token) assertPlayer(game, input.vote1Token);
			player.vote1Token = input.vote1Token ?? undefined;
		}
		if (votesRequired >= 2 && input.vote2Token !== undefined) {
			if (input.vote2Token === playerToken) throw new AppError('VOTE_SELF', 400);
			if (input.vote2Token) assertPlayer(game, input.vote2Token);
			player.vote2Token = input.vote2Token ?? undefined;
		} else if (votesRequired < 2) {
			player.vote2Token = undefined;
		}
		if (player.vote1Token && player.vote2Token && player.vote1Token === player.vote2Token) {
			throw new AppError('VOTE_DUPLICATE', 400);
		}
		if (input.confirmed) {
			if (votesRequired >= 2 && (!player.vote1Token || !player.vote2Token)) {
				throw new AppError('VOTE_NEED_COUNT', 400, { count: votesRequired });
			}
			if (votesRequired < 2 && !player.vote1Token) {
				throw new AppError('VOTE_NEED_ONE', 400);
			}
			player.voteConfirmed = true;
		}
	}, 'vote');
}

export async function submitRunoffVote(
	code: string,
	playerToken: string,
	input: RunoffVoteInput,
): Promise<RoomStateDTO> {
	return mutateGame(code, playerToken, (game) => {
		if (game.phase !== 'runoff') throw new AppError('NOT_RUNOFF', 400);
		if (!game.runoff) throw new AppError('NO_RUNOFF', 400);

		const player = assertPlayer(game, playerToken);
		const { choices } = input;

		if (choices.includes(playerToken)) throw new AppError('RUNOFF_SELF', 400);
		if (choices.length > game.runoff!.slotsRemaining) {
			throw new AppError('RUNOFF_MAX', 400, { max: game.runoff!.slotsRemaining });
		}
		for (const c of choices) {
			if (!game.runoff!.candidateTokens.includes(c)) {
				throw new AppError('INVALID_CANDIDATE', 400);
			}
		}

		player.runoffChoices = choices;
	}, 'runoff');
}

export async function resolveMrWhite(
	code: string,
	playerToken: string,
	input: MrWhiteResultInput,
): Promise<RoomStateDTO> {
	return mutateGame(code, playerToken, (game) => {
		if (game.phase !== 'mrwhite-guess') throw new AppError('NOT_MRWHITE', 400);

		const confirmer = getConfirmerToken(game);
		if (playerToken !== confirmer) {
			throw new AppError('NO_CONFIRM_PERMISSION', 403);
		}

		game.mrWhite.guessResult = input.guessResult;
		game.mrWhite.confirmerToken = playerToken;

		if (!isMrWhiteGuessMeaningful(
			game.eliminatedTokens,
			game.players.filter((p) => p.role).map((p) => ({ token: p.token, role: p.role! })),
		)) {
			game.mrWhite.guessResult = 'skipped';
		}

		finalizeResult(game, now());
	}, 'mrwhite-guess');
}

export async function updateSettings(
	code: string,
	playerToken: string,
	input: UpdateSettingsInput,
): Promise<RoomStateDTO> {
	return mutateGame(code, playerToken, (game) => {
		if (game.hostToken !== playerToken) throw new AppError('HOST_ONLY_SETTINGS', 403);
		if (game.phase !== 'lobby') throw new AppError('SETTINGS_LOBBY_ONLY', 400);

		if (input.name !== undefined) game.name = input.name.trim();
		if (input.isPublic !== undefined) game.isPublic = input.isPublic;
		if (input.maxPlayers !== undefined) game.maxPlayers = input.maxPlayers;
		if (input.topic !== undefined) game.topic = input.topic;
		if (input.difficulty !== undefined) game.difficulty = input.difficulty;
		if (input.showQuestionHints !== undefined) game.showQuestionHints = input.showQuestionHints;
		if (input.hideRoles !== undefined) game.hideRoles = input.hideRoles;
		if (input.playtestMode !== undefined) game.playtestMode = input.playtestMode;
	});
}

export async function forceAdvanceDiscussion(code: string, playerToken: string): Promise<RoomStateDTO> {
	return mutateGame(code, playerToken, (game) => {
		if (game.hostToken !== playerToken) throw new AppError('HOST_ONLY', 403);
		if (game.phase !== 'discussion') throw new AppError('NOT_DISCUSSION', 400);
		const advance = startVotePhase();
		game.phase = advance.nextPhase;
		game.phaseEndsAt = undefined;
	}, 'discussion');
}

function resetGameToLobby(game: GameDoc): void {
	game.phase = 'lobby';
	game.phaseEndsAt = undefined;
	game.startedAt = undefined;
	game.wordPair = undefined;
	game.eliminatedTokens = [];
	game.runoff = undefined;
	game.mrWhite = { guessResult: 'pending' };
	game.result = {};
	game.wordsRevealed = false;
	game.debug = undefined;

	for (const p of game.players) {
		p.role = undefined;
		p.keyword = undefined;
		p.teammateName = undefined;
		p.hasMemorizedRole = false;
		p.hasSpoken = false;
		p.publicSuspectTokens = [];
		p.vote1Token = undefined;
		p.vote2Token = undefined;
		p.voteConfirmed = false;
		p.runoffChoices = [];
		p.isEliminated = false;
		p.isReady = false;
	}
}

export async function hostAdvancePhase(code: string, hostToken: string): Promise<RoomStateDTO> {
	return mutateGame(code, hostToken, (game) => {
		if (game.hostToken !== hostToken) throw new AppError('HOST_ONLY', 403);

		const at = now();

		if (game.phase === 'role-reveal') {
			for (const p of game.players) {
				p.hasMemorizedRole = true;
			}
		} else if (game.phase === 'opening') {
			for (const p of game.players) {
				p.hasSpoken = true;
			}
		} else if (game.phase === 'discussion') {
			const advance = startVotePhase();
			game.phase = advance.nextPhase;
			game.phaseEndsAt = undefined;
		} else if (game.phase === 'vote' || game.phase === 'runoff') {
			tallyVotes(game, at);
		} else {
			throw new AppError('CANNOT_ADVANCE', 400);
		}
	});
}

export async function revealWords(code: string, hostToken: string): Promise<RoomStateDTO> {
	return mutateGame(code, hostToken, (game) => {
		if (game.hostToken !== hostToken) throw new AppError('HOST_ONLY', 403);
		if (game.phase !== 'result') throw new AppError('REVEAL_RESULT_ONLY', 400);
		if (game.wordsRevealed) return;
		game.wordsRevealed = true;
	}, 'result');
}

export async function playAgain(code: string, hostToken: string): Promise<RoomStateDTO> {
	await mutateGame(code, hostToken, (game) => {
		if (game.hostToken !== hostToken) throw new AppError('HOST_ONLY_PLAY_AGAIN', 403);
		if (game.phase !== 'result') throw new AppError('PLAY_AGAIN_RESULT_ONLY', 400);
		resetGameToLobby(game);
	}, 'result');
	await unsetResetArtifacts(code);
	return getScopedState(code, hostToken);
}

export async function restartRoom(code: string, hostToken: string): Promise<RoomStateDTO> {
	await mutateGame(code, hostToken, (game) => {
		if (game.hostToken !== hostToken) {
			throw new AppError('HOST_ONLY_RESTART', 403);
		}
		if (game.phase === 'lobby') {
			throw new AppError('RESTART_NOT_LOBBY', 400);
		}
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
	return mutateGame(code, hostToken, (game) => {
		if (game.hostToken !== hostToken) throw new AppError('HOST_ONLY', 403);
		if (game.phase !== 'lobby') throw new AppError('KICK_LOBBY_ONLY', 400);
		if (targetToken === hostToken) throw new AppError('CANNOT_KICK_SELF', 400);
		assertPlayer(game, targetToken);
		game.players = game.players.filter((p) => p.token !== targetToken);
	}, 'lobby');
}

export async function renamePlayer(
	code: string,
	playerToken: string,
	name: string,
): Promise<RoomStateDTO> {
	const normalizedName = normalizePlayerName(name);
	if (!normalizedName) throw new AppError('PLAYER_NAME_REQUIRED', 400);

	return mutateGame(code, playerToken, (game) => {
		if (game.phase !== 'lobby') {
			throw new AppError('RENAME_LOBBY_ONLY', 400);
		}
		const player = assertPlayer(game, playerToken);
		if (player.name === normalizedName) return;
		assertUniquePlayerName(game, normalizedName, playerToken);
		player.name = normalizedName;
		player.isReady = false;
	});
}

export async function leaveRoom(
	code: string,
	playerToken: string,
): Promise<{ roomClosed: boolean }> {
	await dbConnect();
	const at = now();
	const game = (await SpyGame.findOne({ code: code.toUpperCase() })) as GameDoc | null;
	if (!game) throw new AppError('ROOM_NOT_FOUND', 404);

	const player = assertPlayer(game, playerToken);
	const wasHost = game.hostToken === playerToken;

	game.players = game.players.filter((p) => p.token !== playerToken);

	if (game.players.length === 0) {
		await SpyGame.deleteOne({ code: game.code });
		return { roomClosed: true };
	}

	if (wasHost) {
		const replacement = game.players.find((p) => p.connected) ?? game.players[0];
		game.hostToken = replacement.token;
	}

	game.version += 1;
	await game.save();

	// Touch remaining players' connection state without viewer token
	toRoomStateDTO(game, null, at);
	return { roomClosed: false };
}
