import { applyWerewolfCommand } from './werewolfCommands';
import { randomInt, randomUUID } from 'node:crypto';
import type { Model } from 'mongoose';
import { AppError } from '@/lib/appError';
import { GameError } from '@/features/board-game-shared/lib/gameError';
import dbConnect from '@/lib/dbConnect';
import { gameNow, withTestEnvironment } from './runtime';

import {
	createRoom as createSpy,
	joinRoom as joinSpy,
	getScopedState as getSpy,
	readTestState as readSpy,
	startGame as startSpy,
	confirmMemorized as memorizeSpy,
	submitVote as voteSpy,
	hostAdvancePhase,
	updateSettings as updateSpySettings,
	kickPlayer as kickSpy,
	renamePlayer as renameSpy,
} from '@/features/spy-fall/services/spyGameService';
import SpyGame from '@/features/spy-fall/models/SpyGame';
import {
	createRoom as createCheese,
	joinRoom as joinCheese,
	getScopedState as getCheese,
	readTestState as readCheese,
	startGame as startCheese,
	confirmMemorized as memorizeCheese,
	beginNight,
	reportCheese,
	submitVote as voteCheese,
	startVote,
	revote,
	updateSettings as updateCheeseSettings,
	kickPlayer as kickCheese,
} from '@/features/cheese-thief/services/cheeseThiefService';
import CheeseRoom from '@/features/cheese-thief/models/CheeseThiefRoom';
import {
	createRoom as createWerewolf,
	joinRoom as joinWerewolf,
	getScopedState as getWerewolf,
	readTestState as readWerewolf,
	setRoleCounts,
	deal,
	markViewed,
	kickPlayer as kickWerewolf,
} from '@/features/werewolf/services/werewolfService';
import WerewolfRoom from '@/features/werewolf/models/WerewolfRoom';
import { getSuggestedRoleSet } from '@/features/werewolf/config/roles';
import {
	CHEESE_HOUR_SECONDS_DEFAULT,
	nightDurationMs,
	nightTiming,
} from '@/features/cheese-thief/config/cheeseThief';
import type {
	CreateTestRoomInput,
	TestCommand,
	TestGame,
	TestRoomEnvelope,
	TestCommandCursor,
} from './types';
import { minPlayersForSpies } from '@/features/spy-fall/config/spyGame';

interface TestPlayer {
	token: string;
	name: string;
	id?: string;
	isBot?: boolean;
	role?: string;
	roleId?: string | null;
	keyword?: string;
	isEliminated?: boolean;
	hasMemorizedRole?: boolean;
	viewedAt?: Date | null;
	dice?: number[];
	dice2?: number[];
	secretPicks: string[];
	hasSeenSecret?: boolean;
	voteId?: string;
	voteToken?: string;
}

interface TestRoomDoc {
	code: string;
	hostToken: string;
	phase: string;
	players: TestPlayer[];
	wordPair?: unknown;
	winner?: unknown;
	result?: unknown;
	nightStartedAt?: Date;
	secretStartedAt?: Date;
	adminTest: {
		ownerUserId: string;
		seed: string;
		running: boolean;
		randomState: number;
		initialConfig: Record<string, unknown>;
		log: string[];
		controlledSeatId?: string;
		hostPhaseAt?: Date;
		pausedNightElapsedMs?: number;
		pausedSecretElapsedMs?: number;
		lastTickAt?: Date;
		clockMs?: number;
		commandVersion?: number;
		requestIds?: string[];
		lockId?: string;
		lockUntil?: Date;
	};
	nightNumber?: number;
	hourSeconds?: number;
	save(): Promise<unknown>;
}

function seedNumber(seed: string) {
	let value = 2166136261;
	for (const char of seed) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
	return value >>> 0 || 1;
}

function seededRandom(room: TestRoomDoc) {
	return () => {
		let value = room.adminTest.randomState >>> 0;
		value = (value + 0x6d2b79f5) >>> 0;
		let next = value;
		next = Math.imul(next ^ (next >>> 15), next | 1);
		next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
		room.adminTest.randomState = value;
		return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
	};
}

async function rawRoom(game: TestGame, code: string, ownerId: string): Promise<TestRoomDoc> {
	assertGame(game);
	await dbConnect();
	const filter = { code: code.toUpperCase(), 'adminTest.ownerUserId': ownerId };
	const room =
		game === 'spy-fall'
			? await SpyGame.findOne(filter)
			: game === 'cheese-thief'
				? await CheeseRoom.findOne(filter)
				: await WerewolfRoom.findOne(filter);
	if (!room) throw new AppError('Test room not found', 404, 'TEST_ROOM_NOT_FOUND');
	return room as unknown as TestRoomDoc;
}

function assertGame(game: string): asserts game is TestGame {
	if (!['spy-fall', 'cheese-thief', 'ma-soi'].includes(game))
		throw new AppError('Invalid game', 400, 'INVALID_GAME');
}

async function updateRoom<T>(
	model: Model<T>,
	filter: Record<string, unknown>,
	update: Record<string, unknown>,
) {
	return model.findOneAndUpdate(filter as never, update, {
		returnDocument: 'after',
		timestamps: false,
	});
}

function updateTestRoom(
	game: TestGame,
	filter: Record<string, unknown>,
	update: Record<string, unknown>,
) {
	if (game === 'spy-fall') return updateRoom(SpyGame, filter, update);
	if (game === 'cheese-thief') return updateRoom(CheeseRoom, filter, update);
	return updateRoom(WerewolfRoom, filter, update);
}

function idle(room: TestRoomDoc) {
	return Boolean(
		room.adminTest.running &&
		room.adminTest.lastTickAt &&
		Date.now() - room.adminTest.lastTickAt.getTime() > 5_000,
	);
}

function botList(game: TestGame, raw: TestRoomDoc) {
	return raw.players
		.filter((player) => player.isBot)
		.map((player, index) => ({
			id: game === 'ma-soi' ? wolfSeatId(raw, player.token) : (player.id ?? `bot-${index + 1}`),
			name: player.name,
		}));
}

function wolfSeatId(raw: TestRoomDoc, token: string) {
	const seats = raw.adminTest.initialConfig.seats as string[] | undefined;
	return `bot-${(seats ?? raw.players.map((p) => p.token)).indexOf(token) + 1}`;
}

function tokenForSeat(game: TestGame, raw: TestRoomDoc, seatId: string) {
	if (seatId === 'host' || seatId === 'admin') return raw.hostToken;
	if (game === 'ma-soi' && seatId.startsWith('bot-')) {
		const index = Number(seatId.slice(4)) - 1;
		const seats = raw.adminTest.initialConfig.seats as string[] | undefined;
		const token = seats
			? raw.players.find((p) => p.token === seats[index])?.token
			: raw.players[index]?.token;
		if (!token) throw new AppError('Invalid seat', 400, 'INVALID_SEAT');
		return token;
	}
	const token = raw.players.find((player) => player.id === seatId)?.token;
	if (!token) throw new AppError('Invalid seat', 400, 'INVALID_SEAT');
	return token;
}

async function stateFor(game: TestGame, code: string, raw: TestRoomDoc) {
	const controlledSeatId = raw.adminTest.controlledSeatId ?? (game === 'ma-soi' ? 'host' : 'admin');
	const token = tokenForSeat(game, raw, controlledSeatId);
	const clockMs = raw.adminTest.clockMs ?? Date.now();
	const state = await withTestEnvironment(clockMs, seededRandom(raw), () =>
		game === 'spy-fall'
			? readSpy(code, token)
			: game === 'cheese-thief'
				? readCheese(code, token)
				: readWerewolf(code, token),
	);
	const safeState: Record<string, unknown> = {
		...state,
		hostConnected: true,
		self: state.self
			? {
					...state.self,
					...(game === 'ma-soi' ? { avatarSeed: controlledSeatId } : {}),
					token: game === 'ma-soi' ? controlledSeatId : '',
				}
			: null,
	};
	const statePlayers = state.players as unknown as Array<Record<string, unknown> & { id?: string }>;
	if (game === 'ma-soi')
		safeState.players = statePlayers.map((player) => ({
			...player,
			token: wolfSeatId(raw, String(player.token)),
			avatarSeed: wolfSeatId(raw, String(player.token)),
			connected: true,
			isBot: String(player.token) !== token,
		}));
	else
		safeState.players = statePlayers.map((player) => ({
			...player,
			connected: true,
			isBot: raw.players.find((entry) => entry.id === player.id)?.token !== token,
		}));
	return {
		game,
		state: safeState,
		bots: botList(game, raw),
		seed: raw.adminTest.seed,
		running: raw.adminTest.running && !idle(raw),
		log: raw.adminTest.log ?? [],
		controlledSeatId,
		version: raw.adminTest.commandVersion ?? 0,
		clockMs,
	} as unknown as TestRoomEnvelope;
}

export async function createTestRoom(ownerId: string, input: CreateTestRoomInput) {
	assertGame(input.game);
	if (!Number.isInteger(input.playerCount ?? 6) || ![1, 2, 3].includes(input.spyCount ?? 1))
		throw new AppError('Invalid setup', 400, 'INVALID_SETUP');
	if (!ownerId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
	const playerCount = input.playerCount ?? (input.game === 'ma-soi' ? 6 : 6);
	if (
		input.game === 'spy-fall' &&
		(playerCount < minPlayersForSpies(input.spyCount ?? 1) || playerCount > 12)
	) {
		throw new AppError(
			'Player count is invalid for this Spy Fall setup',
			400,
			'INVALID_PLAYER_COUNT',
		);
	}
	if (
		input.game === 'cheese-thief' &&
		(playerCount < (input.cheeseMode === 'two-night' ? 5 : 4) || playerCount > 12)
	) {
		throw new AppError(
			'Player count is invalid for this Cheese Thief setup',
			400,
			'INVALID_PLAYER_COUNT',
		);
	}
	if (input.game === 'ma-soi' && (playerCount < 5 || playerCount > 20)) {
		throw new AppError('Bot count must be between 5 and 20', 400, 'INVALID_PLAYER_COUNT');
	}
	if (
		input.adminRole === 'scapegoat' &&
		(input.game !== 'cheese-thief' || playerCount < 6 || !input.scapegoat)
	) {
		throw new AppError('Scapegoat is unavailable for this setup', 400, 'INVALID_ROLE');
	}
	if (
		input.adminRole &&
		input.game === 'spy-fall' &&
		!['spy', 'civilian'].includes(input.adminRole)
	) {
		throw new AppError('Invalid Spy Fall role', 400, 'INVALID_ROLE');
	}
	if (
		input.adminRole &&
		input.game === 'cheese-thief' &&
		!['thief', 'sleepyhead', 'scapegoat'].includes(input.adminRole)
	) {
		throw new AppError('Invalid Cheese Thief role', 400, 'INVALID_ROLE');
	}
	const seed = (input.seed?.trim() || `seed-${randomInt(1, 1_000_000)}`).slice(0, 64);
	if (input.game === 'spy-fall') {
		const created = await createSpy(
			{
				name: 'Phòng kiểm thử',
				hostName: input.hostName,
				maxPlayers: playerCount,
				spyCount: input.spyCount ?? 1,
				isPublic: false,
				topic: 'any',
			},
			ownerId,
		);
		for (let i = 1; i < playerCount; i++) await joinSpy(created.code, `Bot ${i}`);
		const room = await SpyGame.findOne({ code: created.code });
		if (!room) throw new Error('TEST_ROOM_NOT_FOUND');
		room.adminTest = {
			ownerUserId: ownerId,
			seed,
			running: true,
			randomState: seedNumber(seed),
			controlledSeatId: input.startingSeat === 'player' ? room.players[1]!.id : 'admin',
			lastTickAt: new Date(),
			clockMs: Date.now(),
			commandVersion: 0,
			initialConfig: {
				game: input.game,
				playerCount,
				spyCount: input.spyCount ?? 1,
				adminRole: input.adminRole,
				locale: input.locale ?? 'vi',
			},
			log: [`Tạo phòng · seed ${seed}`],
		};
		for (const player of room.players) player.isBot = player.token !== room.hostToken;
		await room.save();
		return stateFor(input.game, created.code, room as unknown as TestRoomDoc);
	}
	if (input.game === 'cheese-thief') {
		const created = await createCheese(
			{
				name: 'Phòng kiểm thử',
				hostName: input.hostName,
				maxPlayers: playerCount,
				isPublic: false,
				mode: input.cheeseMode ?? 'classic',
				scapegoat: input.scapegoat ?? false,
				hourSeconds: CHEESE_HOUR_SECONDS_DEFAULT,
			},
			ownerId,
		);
		for (let i = 1; i < playerCount; i++) await joinCheese(created.code, `Bot ${i}`);
		const room = await CheeseRoom.findOne({ code: created.code });
		if (!room) throw new Error('TEST_ROOM_NOT_FOUND');
		room.adminTest = {
			ownerUserId: ownerId,
			seed,
			running: true,
			randomState: seedNumber(seed),
			controlledSeatId: input.startingSeat === 'player' ? room.players[1]!.id : 'admin',
			lastTickAt: new Date(),
			clockMs: Date.now(),
			commandVersion: 0,
			initialConfig: {
				game: input.game,
				playerCount,
				mode: input.cheeseMode ?? 'classic',
				adminRole: input.adminRole,
			},
			log: [`Tạo phòng · seed ${seed}`],
		};
		for (const player of room.players) player.isBot = player.token !== room.hostToken;
		await room.save();
		return stateFor(input.game, created.code, room as unknown as TestRoomDoc);
	}
	const created = await createWerewolf(input.hostName, ownerId);
	for (let i = 0; i < playerCount; i++) await joinWerewolf(created.state.code, `Bot ${i + 1}`);
	await setRoleCounts(created.state.code, created.hostToken, getSuggestedRoleSet(playerCount));
	const room = await WerewolfRoom.findOne({ code: created.state.code });
	if (!room) throw new Error('TEST_ROOM_NOT_FOUND');
	room.adminTest = {
		ownerUserId: ownerId,
		seed,
		running: true,
		randomState: seedNumber(seed),
		controlledSeatId: input.startingSeat === 'player' ? 'bot-1' : 'host',
		lastTickAt: new Date(),
		clockMs: Date.now(),
		commandVersion: 0,
		initialConfig: { game: input.game, playerCount, seats: room.players.map((p) => p.token) },
		log: [`Tạo phòng · seed ${seed}`],
	};
	for (const player of room.players) player.isBot = true;
	await room.save();
	return stateFor(input.game, created.state.code, room as unknown as TestRoomDoc);
}

export async function readTestRoom(ownerId: string, game: TestGame, code: string) {
	const room = await rawRoom(game, code, ownerId);
	if (room.adminTest.lockId && (room.adminTest.lockUntil?.getTime() ?? 0) > Date.now())
		throw new AppError('Room is updating', 409, 'TEST_STATE_CONFLICT');
	return stateFor(game, code, room);
}

export async function inspectTestRoom(ownerId: string, game: TestGame, code: string) {
	const room = await rawRoom(game, code, ownerId);
	return {
		phase: room.phase,
		players: room.players.map((player) => ({
			id: game === 'ma-soi' ? wolfSeatId(room, player.token) : player.id,
			name: player.name,
			isBot: player.isBot === true,
			role: player.role ?? player.roleId ?? null,
			keyword: player.keyword ?? null,
			dice: player.dice ?? [],
			dice2: player.dice2 ?? [],
			hasMemorizedRole: player.hasMemorizedRole ?? player.viewedAt != null,
			vote: player.voteId ? 'Đã bỏ phiếu' : player.voteToken ? 'Đã bỏ phiếu' : 'Chưa bỏ phiếu',
			secretPicks: player.secretPicks ?? [],
		})),
		wordPair: room.wordPair ?? null,
		result: room.winner ?? room.result ?? null,
		seed: room.adminTest!.seed,
	};
}

export async function deleteTestRoom(ownerId: string, game: TestGame, code: string) {
	await rawRoom(game, code, ownerId);
	const filter = { code: code.toUpperCase(), 'adminTest.ownerUserId': ownerId };
	if (game === 'spy-fall') await SpyGame.deleteOne(filter);
	else if (game === 'cheese-thief') await CheeseRoom.deleteOne(filter);
	else await WerewolfRoom.deleteOne(filter);
	return { closed: true };
}

export async function commandTestRoom(
	ownerId: string,
	game: TestGame,
	code: string,
	command: TestCommand,
	cursor?: TestCommandCursor,
) {
	let room = await rawRoom(game, code, ownerId);
	const allowed = {
		'spy-fall': ['start', 'remember', 'next', 'settings', 'kick', 'rename', 'vote'],
		'cheese-thief': [
			'start',
			'remember',
			'seen',
			'settings',
			'secret',
			'start-vote',
			'cheese',
			'revote',
			'next',
			'skip-time',
			'vote',
			'kick',
		],
		'ma-soi': ['start', 'viewed', 'lobby', 'roles', 'kick'],
	};
	if (
		![...allowed[game], 'run', 'set-seat', 'step', 'tick', 'reset', 'close'].includes(command.kind)
	)
		throw new AppError('Invalid game action', 400, 'INVALID_TEST_INPUT');
	if (room.adminTest.lockId && (room.adminTest.lockUntil?.getTime() ?? 0) > Date.now())
		throw new AppError('Room is updating', 409, 'TEST_STATE_CONFLICT');
	const requestId = cursor?.requestId ?? randomUUID();
	const filter = { code: room.code, 'adminTest.ownerUserId': ownerId };
	if (room.adminTest.requestIds?.includes(requestId)) return stateFor(game, code, room);
	if (
		cursor &&
		(cursor.expectedVersion !== (room.adminTest.commandVersion ?? 0) ||
			cursor.controlledSeatId !== room.adminTest.controlledSeatId)
	) {
		throw new AppError('Room changed; refresh and retry', 409, 'TEST_STATE_CONFLICT');
	}
	const lockId = randomUUID();
	const acquired = await updateTestRoom(
		game,
		{
			...filter,
			'adminTest.commandVersion': room.adminTest.commandVersion ?? 0,
			$or: [
				{ 'adminTest.lockId': { $exists: false } },
				{ 'adminTest.lockUntil': { $lt: new Date() } },
			],
		},
		{
			$set: { 'adminTest.lockId': lockId, 'adminTest.lockUntil': new Date(Date.now() + 30_000) },
			$inc: { 'adminTest.commandVersion': 1 },
			$push: { 'adminTest.requestIds': { $each: [requestId], $slice: -100 } },
		},
	);
	if (!acquired) throw new AppError('Room changed; refresh and retry', 409, 'TEST_STATE_CONFLICT');
	room = acquired as unknown as TestRoomDoc;
	try {
		const wasIdle = idle(room);
		if (wasIdle) room.adminTest.running = false;
		if (command.kind === 'tick' && room.adminTest.running) {
			room.adminTest.clockMs =
				(room.adminTest.clockMs ?? Date.now()) +
				Math.max(0, Date.now() - (room.adminTest.lastTickAt?.getTime() ?? Date.now()));
		}
		if (command.kind === 'skip-time' && game === 'cheese-thief') {
			if (room.phase === 'night' && room.nightStartedAt)
				room.adminTest.clockMs =
					room.nightStartedAt.getTime() + nightDurationMs(nightTiming(room.hourSeconds));
			if (room.phase === 'secret' && room.secretStartedAt)
				room.adminTest.clockMs = room.secretStartedAt.getTime() + 61_000;
		}
		room.adminTest.lastTickAt = new Date();
		await room.save();
		return await withTestEnvironment(
			room.adminTest.clockMs ?? Date.now(),
			seededRandom(room),
			async () => {
				if (command.kind === 'tick' && !room.adminTest.running) return stateFor(game, code, room);
				return executeCommand(ownerId, game, code, command, room);
			},
		);
	} catch (error) {
		await updateTestRoom(game, filter, {
			$set: { 'adminTest.running': false },
			$push: {
				'adminTest.log': {
					$each: [
						`Stopped: ${error instanceof GameError || error instanceof AppError ? error.code : 'TEST_ACTION_FAILED'}`,
					],
					$slice: -200,
				},
			},
		});
		if (error instanceof GameError) throw new AppError(error.code, error.status, error.code);
		throw error;
	} finally {
		await updateTestRoom(
			game,
			{ ...filter, 'adminTest.lockId': lockId },
			{ $unset: { 'adminTest.lockId': 1, 'adminTest.lockUntil': 1 } },
		);
	}
}

async function executeCommand(
	ownerId: string,
	game: TestGame,
	code: string,
	command: TestCommand,
	room: TestRoomDoc,
) {
	const phaseBefore = room.phase;
	const hostToken = room.hostToken;
	const controlledToken = tokenForSeat(
		game,
		room,
		room.adminTest!.controlledSeatId ?? (game === 'ma-soi' ? 'host' : 'admin'),
	);
	const log = room.adminTest!.log ?? [];
	if (command.kind === 'run') {
		room.adminTest!.running = command.running;
		room.adminTest!.lastTickAt = command.running ? new Date() : undefined;
		await room.save();
	}
	if (command.kind === 'close') return deleteTestRoom(ownerId, game, code);
	if (command.kind === 'set-seat') {
		const valid =
			(game === 'ma-soi' && command.seatId === 'host') ||
			(game !== 'ma-soi' && command.seatId === 'admin') ||
			(game === 'ma-soi'
				? room.players.some((p) => wolfSeatId(room, p.token) === command.seatId)
				: room.players.some((player) => player.id === command.seatId));
		if (!valid) throw new AppError('Invalid controlled seat', 400, 'INVALID_SEAT');
		room.adminTest!.controlledSeatId = command.seatId;
		room.adminTest!.log = [...log, `Bạn tiếp quản ghế ${command.seatId}`].slice(-200);
		await room.save();
		return stateFor(game, code, room);
	}
	if (
		['start', 'next', 'roles', 'lobby', 'settings', 'kick', 'start-vote', 'revote'].includes(
			command.kind,
		) &&
		controlledToken !== hostToken
	)
		throw new AppError('Host only', 403, 'HOST_ONLY');
	if (command.kind === 'start' && game === 'spy-fall') {
		await startSpy(code, hostToken, command.locale ?? 'vi', seededRandom(room));
		await applySelectedAdminRole(game, code, room);
	}
	if (command.kind === 'start' && game === 'cheese-thief') {
		await startCheese(code, hostToken, seededRandom(room));
		await applySelectedAdminRole(game, code, room);
	}
	if (game === 'ma-soi')
		await applyWerewolfCommand(code, hostToken, controlledToken, command, seededRandom(room));
	if (command.kind === 'remember' && game === 'spy-fall') await memorizeSpy(code, controlledToken);
	if (command.kind === 'remember' && game === 'cheese-thief')
		await memorizeCheese(code, controlledToken, command.chosenHour);
	if (command.kind === 'seen' && game === 'cheese-thief')
		await (
			await import('@/features/cheese-thief/services/cheeseThiefService')
		).markSecretSeen(code, controlledToken);
	if (command.kind === 'settings' && game === 'spy-fall')
		await updateSpySettings(code, hostToken, { ...command.settings, isPublic: false } as Parameters<
			typeof updateSpySettings
		>[2]);
	if (command.kind === 'settings' && game === 'cheese-thief') {
		await updateCheeseSettings(code, hostToken, {
			...command.settings,
			isPublic: false,
		} as Parameters<typeof updateCheeseSettings>[2]);
		const updated = await CheeseRoom.findOne({ code: code.toUpperCase() });
		if (updated) {
			let nextName = 1;
			for (let count = updated.players.length; count < updated.maxPlayers; count++) {
				while (updated.players.some((p) => p.name === `Bot ${nextName}`)) nextName++;
				await joinCheese(code, `Bot ${nextName++}`);
			}
		}
	}
	if (command.kind === 'rename' && game === 'spy-fall')
		await renameSpy(code, controlledToken, command.name);
	if (command.kind === 'kick' && game === 'spy-fall')
		await kickSpy(code, hostToken, command.playerId);
	if (command.kind === 'kick' && game === 'cheese-thief')
		await kickCheese(code, hostToken, command.playerId);
	if (command.kind === 'kick' && game === 'ma-soi') {
		const target = room.players.find((p) => wolfSeatId(room, p.token) === command.playerId);
		if (!target) throw new AppError('Player not found', 404, 'PLAYER_NOT_FOUND');
		await kickWerewolf(code, hostToken, target.token);
	}
	if (command.kind === 'secret' && game === 'cheese-thief')
		await (
			await import('@/features/cheese-thief/services/cheeseThiefService')
		).submitSecret(code, controlledToken, command.picks, { draft: command.draft });
	if (command.kind === 'start-vote' && game === 'cheese-thief') await startVote(code, hostToken);
	if (command.kind === 'cheese' && game === 'cheese-thief')
		await reportCheese(code, hostToken, command.present);
	if (command.kind === 'revote' && game === 'cheese-thief') await revote(code, hostToken);
	if (command.kind === 'vote' && game !== 'ma-soi') {
		const actor =
			command.playerId === 'controlled'
				? room.players.find((player) => player.token === controlledToken)
				: command.playerId === 'admin'
					? room.players.find((player) => player.token === hostToken)
					: room.players.find((player) => player.id === command.playerId);
		if (!actor) throw new AppError('Player not found', 404, 'PLAYER_NOT_FOUND');
		if (game === 'spy-fall') await voteSpy(code, actor.token, command.targetId);
		else await voteCheese(code, actor.token, command.targetId);
	}
	if (command.kind === 'next' && game === 'spy-fall') {
		const state = await getSpy(code, hostToken);
		await hostAdvancePhase(
			code,
			hostToken,
			{ phase: state.phase, round: state.round, isRevote: state.isRevote },
			seededRandom(room),
		);
	}
	if (command.kind === 'next' && game === 'cheese-thief') {
		const state = await getCheese(code, hostToken);
		if (state.phase === 'deal') await beginNight(code, hostToken);
	}
	if (command.kind === 'skip-time' && game === 'cheese-thief')
		await getCheese(code, hostToken, seededRandom(room));
	if (command.kind === 'step' || command.kind === 'tick') {
		await runOneStep(game, code, room);
	}
	if (command.kind === 'reset') {
		if (!command.sameSeed) room.adminTest.seed = `seed-${randomInt(1, 1_000_000)}`;
		room.adminTest.randomState = seedNumber(room.adminTest.seed);
		if (game === 'spy-fall') {
			const state = await getSpy(code, hostToken);
			if (state.phase === 'result') {
				const { playAgain } = await import('@/features/spy-fall/services/spyGameService');
				await playAgain(code, hostToken);
			} else if (state.phase !== 'lobby') {
				const { restartRoom } = await import('@/features/spy-fall/services/spyGameService');
				await restartRoom(code, hostToken);
			}
		} else if (game === 'cheese-thief') {
			const { resetTestRoom } = await import('@/features/cheese-thief/services/cheeseThiefService');
			await resetTestRoom(code, hostToken);
		} else {
			const { backToLobby } = await import('@/features/werewolf/services/werewolfService');
			await backToLobby(code, hostToken);
		}
	}
	const refreshed = await rawRoom(game, code, ownerId);
	if (refreshed.phase !== phaseBefore) {
		refreshed.adminTest!.hostPhaseAt = gameNow();
		log.push(`${phaseBefore} → ${refreshed.phase}`);
	}
	refreshed.adminTest.log = log.slice(-200);
	if (command.kind !== 'run' && command.kind !== 'tick')
		refreshed.adminTest!.log = [
			...log,
			command.kind === 'step'
				? 'Chạy một bước'
				: command.kind === 'next'
					? 'Quản trò chuyển giai đoạn'
					: `Thao tác: ${command.kind}`,
		].slice(-200);
	if (command.kind === 'step' && refreshed.adminTest!.running)
		refreshed.adminTest!.lastTickAt = new Date();
	refreshed.adminTest!.randomState = room.adminTest!.randomState;
	refreshed.adminTest.seed = room.adminTest.seed;
	await refreshed.save();
	return stateFor(game, code, refreshed);
}

async function runOneStep(game: TestGame, code: string, room: TestRoomDoc) {
	const hostControlsRoom =
		tokenForSeat(
			game,
			room,
			room.adminTest.controlledSeatId ?? (game === 'ma-soi' ? 'host' : 'admin'),
		) === room.hostToken;
	const token = room.hostToken;
	if (!hostControlsRoom) {
		if (game === 'spy-fall') {
			const state = await getSpy(code, token);
			if (state.phase === 'lobby') {
				await startSpy(
					code,
					token,
					room.adminTest.initialConfig.locale === 'en' ? 'en' : 'vi',
					seededRandom(room),
				);
				await applySelectedAdminRole(game, code, room);
				return;
			}
			if (state.phase === 'role-reveal') {
				await stepSpy(code, token, room);
				return;
			}
			if (state.phase === 'discussion') {
				const waitingSince = room.adminTest.hostPhaseAt?.getTime() ?? gameNow().getTime();
				if (gameNow().getTime() - waitingSince >= 3_000)
					await hostAdvancePhase(
						code,
						token,
						{ phase: state.phase, round: state.round, isRevote: state.isRevote },
						seededRandom(room),
					);
				return;
			}
			if (state.phase === 'vote') {
				if (state.players.some((player) => !player.isEliminated && !player.hasVoted)) {
					await stepSpy(code, token, room);
					return;
				}
				await hostAdvancePhase(
					code,
					token,
					{ phase: state.phase, round: state.round, isRevote: state.isRevote },
					seededRandom(room),
				);
				return;
			}
			if (state.phase === 'reveal') {
				await hostAdvancePhase(
					code,
					token,
					{ phase: state.phase, round: state.round, isRevote: state.isRevote },
					seededRandom(room),
				);
				return;
			}
		}
		if (game === 'cheese-thief') {
			const state = await getCheese(code, token, seededRandom(room));
			if (state.phase === 'lobby') {
				await startCheese(code, token, seededRandom(room));
				await applySelectedAdminRole(game, code, room);
				return;
			}
			if (state.phase === 'deal') {
				const updated = (await CheeseRoom.findOne({
					code: code.toUpperCase(),
				})) as unknown as TestRoomDoc | null;
				if (updated?.players.some((player) => !player.hasMemorizedRole)) {
					await stepCheese(code, token, room);
					return;
				}
				if (updated?.players.every((player) => player.hasMemorizedRole))
					await beginNight(code, token);
				return;
			}
			if (state.phase === 'day') {
				if (
					gameNow().getTime() - (room.adminTest.hostPhaseAt?.getTime() ?? gameNow().getTime()) >=
					3_000
				)
					await startVote(code, token);
				return;
			}
			if (state.phase === 'tie') {
				await revote(code, token);
				return;
			}
		}
		if (game === 'ma-soi') {
			const state = await getWerewolf(code, token);
			if (state.phase === 'lobby') {
				await deal(code, token, seededRandom(room));
				return;
			}
		}
	}
	if (game === 'spy-fall') await stepSpy(code, token, room);
	if (game === 'ma-soi') await stepWerewolf(code, token);
	if (game === 'cheese-thief') await stepCheese(code, token, room);
}

async function applySelectedAdminRole(game: TestGame, code: string, room: TestRoomDoc) {
	const wanted = room.adminTest.initialConfig.adminRole;
	if (!wanted || game === 'ma-soi') return;
	if (game === 'spy-fall') {
		const stored = await SpyGame.findOne({ code: code.toUpperCase() });
		const admin = stored?.players.find((player) => player.token === stored.hostToken);
		const other = stored?.players.find(
			(player) => player.token !== stored.hostToken && player.role === wanted,
		);
		if (!stored || !admin || !other) return;
		[admin.role, other.role] = [other.role, admin.role];
		[admin.keyword, other.keyword] = [other.keyword, admin.keyword];
		await stored.save();
		return;
	}
	const stored = await CheeseRoom.findOne({ code: code.toUpperCase() });
	const admin = stored?.players.find((player) => player.token === stored.hostToken);
	const other = stored?.players.find(
		(player) => player.token !== stored.hostToken && player.role === wanted,
	);
	if (stored && admin && other) {
		[admin.role, other.role] = [other.role, admin.role];
		await stored.save();
	}
}

async function stepSpy(code: string, hostToken: string, room: TestRoomDoc) {
	const state = await getSpy(code, hostToken);
	const controlledToken = tokenForSeat(
		'spy-fall',
		room,
		room.adminTest.controlledSeatId ?? 'admin',
	);
	const bots = room.players.filter((player) => player.token !== controlledToken);
	if (state.phase === 'role-reveal') {
		const bot = bots.find((player) => !player.hasMemorizedRole);
		if (bot) await memorizeSpy(code, bot.token);
		return;
	}
	if (state.phase === 'vote') {
		const livingBots = bots.filter((bot) => !bot.isEliminated && !bot.voteToken);
		const bot = livingBots[0];
		if (!bot) return;
		const candidates = state.players.filter(
			(player) =>
				!player.isEliminated &&
				player.id !== bot.id &&
				(!state.voteCandidates.length || state.voteCandidates.includes(player.id)),
		);
		if (candidates.length)
			await voteSpy(
				code,
				bot.token,
				candidates[Math.floor(seededRandom(room)() * candidates.length)]!.id,
			);
	}
}

async function stepWerewolf(code: string, hostToken: string) {
	const state = await getWerewolf(code, hostToken);
	if (state.phase === 'lobby') return;
	const room = (await WerewolfRoom.findOne({
		code: code.toUpperCase(),
	})) as unknown as TestRoomDoc | null;
	const controlledId = room?.adminTest?.controlledSeatId ?? 'host';
	const controlledToken = room ? tokenForSeat('ma-soi', room, controlledId) : hostToken;
	const bot = state.players.find(
		(player) => player.token !== controlledToken && !player.viewed && !player.left,
	);
	if (bot) await markViewed(code, bot.token);
}

async function stepCheese(code: string, hostToken: string, raw: TestRoomDoc) {
	const state = await getCheese(code, hostToken, seededRandom(raw));
	const room = await CheeseRoom.findOne({ code: code.toUpperCase() });
	if (!room) return;
	const controlledToken = tokenForSeat(
		'cheese-thief',
		raw,
		raw.adminTest.controlledSeatId ?? 'admin',
	);
	const bots = room.players.filter((player) => player.token !== controlledToken);
	const bot = bots.find((player) => !player.hasMemorizedRole && state.phase === 'deal');
	if (bot) {
		const chosenHour =
			bot.dice?.length === 2
				? bot.dice[Math.floor(seededRandom(raw)() * bot.dice.length)]
				: undefined;
		return memorizeCheese(code, bot.token, chosenHour);
	}
	if (state.phase === 'secret') {
		const player = bots.find((entry) => !entry.secretConfirmed);
		if (!player) return;
		const candidates = state.players.filter((entry) => entry.id !== player.id);
		const choices: string[] = [];
		while (choices.length < (state.choiceCount ?? 1) && candidates.length) {
			const index = Math.floor(seededRandom(raw)() * candidates.length);
			choices.push(candidates.splice(index, 1)[0]!.id);
		}
		if (choices.length === (state.choiceCount ?? 1))
			await (
				await import('@/features/cheese-thief/services/cheeseThiefService')
			).submitSecret(code, player.token, choices);
		return;
	}
	if (state.phase === 'secret-result') {
		const unseen = bots.find((player) => !player.hasSeenSecret);
		if (unseen)
			return (await import('@/features/cheese-thief/services/cheeseThiefService')).markSecretSeen(
				code,
				unseen.token,
			);
	}
	if (state.phase === 'vote') {
		const botVoter = bots.find((player) => !player.voteId);
		if (botVoter && state.voteCandidateIds?.length) {
			const candidates = state.voteCandidateIds.filter((id) => id !== botVoter.id);
			if (candidates.length)
				return voteCheese(
					code,
					botVoter.token,
					candidates[Math.floor(seededRandom(raw)() * candidates.length)]!,
				);
		}
	}
}
