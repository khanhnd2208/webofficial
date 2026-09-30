import { gameNow, gameRandom } from '@/features/board-game-test/runtime';
import mongoose, { type HydratedDocument } from 'mongoose';
import { customAlphabet } from 'nanoid';

import {
	MAX_PLAYERS,
	MIN_PLAYERS,
	PLAYER_TOKEN_LENGTH,
	ROOM_CODE_LENGTH,
	WEREWOLF_DISCONNECT_THRESHOLD_MS,
	getSuggestedRoleSet,
} from '@/features/werewolf/config/roles';
import { dealRoles, validateRoleCounts } from '@/features/werewolf/lib/deal';
import { GameError } from '@/features/board-game-shared/lib/gameError';
import dbConnect from '@/lib/dbConnect';
import { normalizePlayerName } from '@/features/board-game-shared/lib/playerName';
import WerewolfRoom, {
	type IWerewolfPlayer,
	type IWerewolfRoom,
} from '@/features/werewolf/models/WerewolfRoom';
import type {
	RoleCount,
	RoomStateDTO,
	WerewolfPlayerRecord,
	WerewolfPlayerView,
	WerewolfRoomSnapshot,
} from '@/features/werewolf/types';

const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', ROOM_CODE_LENGTH);
const generateToken = customAlphabet(
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	PLAYER_TOKEN_LENGTH,
);

type RoomDoc = HydratedDocument<IWerewolfRoom>;

const MAX_SAVE_ATTEMPTS = 3;

/**
 * Array edits by index (roleId, viewedAt, leftAt) are version-checked by Mongoose,
 * so a join landing at the same moment makes the save fail. Reload and try again.
 */
async function withVersionRetry<T>(run: () => Promise<T>): Promise<T> {
	for (let attempt = 1; ; attempt++) {
		try {
			return await run();
		} catch (error) {
			if (!(error instanceof mongoose.Error.VersionError) || attempt >= MAX_SAVE_ATTEMPTS)
				throw error;
		}
	}
}

function now(): Date {
	return gameNow();
}

function findPlayer(
	room: { players: IWerewolfPlayer[] },
	token: string,
): IWerewolfPlayer | undefined {
	return room.players.find((player) => player.token === token);
}

function assertHost(room: { hostToken: string }, token: string): void {
	if (room.hostToken !== token) throw new GameError('HOST_ONLY', 403);
}

function snapshotFromDoc(room: IWerewolfRoom): WerewolfRoomSnapshot {
	return {
		code: room.code,
		hostToken: room.hostToken,
		hostName: room.hostName,
		hostLastSeenAt: room.hostLastSeenAt,
		phase: room.phase,
		version: room.version,
		dealRound: room.dealRound,
		roleCounts: room.roleCounts.map((entry) => ({ roleId: entry.roleId, count: entry.count })),
		isTestRoom: Boolean(room.adminTest?.ownerUserId),
		players: room.players.map((player) => ({
			token: player.token,
			name: player.name,
			avatarSeed: player.avatarSeed,
			joinedAt: player.joinedAt,
			lastSeenAt: player.lastSeenAt,
			roleId: player.roleId ?? null,
			viewedAt: player.viewedAt ?? null,
			leftAt: player.leftAt ?? null,
			isBot: player.isBot === true,
		})),
	};
}

function isConnected(lastSeenAt: Date, at: Date): boolean {
	return lastSeenAt.getTime() >= at.getTime() - WEREWOLF_DISCONNECT_THRESHOLD_MS;
}

function activePlayers<T extends { leftAt: Date | null }>(players: T[]): T[] {
	return players.filter((player) => player.leftAt == null);
}

export function toRoomStateDTO(
	room: WerewolfRoomSnapshot,
	viewerToken: string | null,
	at: Date = new Date(),
): RoomStateDTO {
	const isHost = viewerToken != null && viewerToken === room.hostToken;
	const selfPlayer = viewerToken
		? room.players.find((player) => player.token === viewerToken)
		: undefined;

	const players: WerewolfPlayerView[] = room.players.map((player) => {
		const view: WerewolfPlayerView = {
			token: player.token,
			name: player.name,
			avatarSeed: player.avatarSeed,
			connected: room.isTestRoom && player.isBot ? true : isConnected(player.lastSeenAt, at),
			viewed: player.viewedAt != null,
			left: player.leftAt != null,
		};
		if (isHost) view.roleId = player.roleId;
		return view;
	});

	return {
		code: room.code,
		phase: room.phase,
		version: room.version,
		dealRound: room.dealRound,
		serverNow: at.toISOString(),
		isHost,
		hostName: room.hostName,
		hostConnected: isConnected(room.hostLastSeenAt, at),
		playerCount: activePlayers(room.players).length,
		maxPlayers: MAX_PLAYERS,
		roleCounts: isHost ? room.roleCounts.map((entry) => ({ ...entry })) : [],
		players,
		self: selfPlayer
			? {
					token: selfPlayer.token,
					name: selfPlayer.name,
					avatarSeed: selfPlayer.avatarSeed,
					viewed: selfPlayer.viewedAt != null,
					left: selfPlayer.leftAt != null,
					roleId: selfPlayer.roleId,
				}
			: null,
	};
}

function touchViewer(room: RoomDoc, token: string | null, at: Date): void {
	if (!token) return;
	if (room.hostToken === token) {
		room.hostLastSeenAt = at;
		return;
	}
	const player = findPlayer(room, token);
	if (player) player.lastSeenAt = at;
}

async function loadRoom(code: string): Promise<RoomDoc> {
	await dbConnect();
	const room = (await WerewolfRoom.findOne({ code: code.toUpperCase() })) as RoomDoc | null;
	if (!room) throw new GameError('ROOM_NOT_FOUND', 404);
	return room;
}

async function mutateRoom(
	code: string,
	viewerToken: string,
	mutator: (room: RoomDoc) => void | Promise<void>,
): Promise<RoomStateDTO> {
	return withVersionRetry(async () => {
		const at = now();
		const room = await loadRoom(code);
		await mutator(room);
		room.version += 1;
		touchViewer(room, viewerToken, at);
		await room.save();
		return toRoomStateDTO(snapshotFromDoc(room), viewerToken, at);
	});
}

function assertUniqueName(room: RoomDoc, name: string): void {
	const normalized = name.toLowerCase();
	if (room.hostName.toLowerCase() === normalized) throw new GameError('NAME_TAKEN', 400);
	if (room.players.some((player) => player.name.toLowerCase() === normalized)) {
		throw new GameError('NAME_TAKEN', 400);
	}
}

function blankPlayer(token: string, name: string, at: Date): WerewolfPlayerRecord {
	return {
		token,
		name,
		avatarSeed: token.slice(0, 8),
		joinedAt: at,
		lastSeenAt: at,
		roleId: null,
		viewedAt: null,
		leftAt: null,
	};
}

function departPlayer(room: RoomDoc, token: string): void {
	const player = findPlayer(room, token);
	if (!player) throw new GameError('PLAYER_NOT_FOUND', 404);
	if (room.phase === 'dealt') {
		player.leftAt = player.leftAt ?? now();
		return;
	}
	const index = room.players.findIndex((entry) => entry.token === token);
	if (index >= 0) room.players.splice(index, 1);
}

function clearAssignments(room: RoomDoc): void {
	for (const player of room.players) {
		player.roleId = null;
		player.viewedAt = null;
	}
}

export async function createRoom(
	hostNameInput: string,
	testOwnerId?: string,
): Promise<{ state: RoomStateDTO; hostToken: string }> {
	const hostName = normalizePlayerName(hostNameInput);
	if (!hostName) throw new GameError('PLAYER_NAME_REQUIRED', 400);

	await dbConnect();
	const hostToken = generateToken();
	let code = generateCode();
	for (let attempt = 0; attempt < 10; attempt++) {
		const exists = await WerewolfRoom.findOne({ code }).select('_id').lean();
		if (!exists) break;
		code = generateCode();
		if (attempt === 9) throw new GameError('INTERNAL', 500);
	}

	const at = now();
	const room = await WerewolfRoom.create({
		...(testOwnerId ? { adminTest: { ownerUserId: testOwnerId } } : {}),
		code,
		hostToken,
		hostName,
		hostLastSeenAt: at,
		phase: 'lobby',
		version: 0,
		dealRound: 0,
		roleCounts: getSuggestedRoleSet(MIN_PLAYERS),
		players: [],
	});

	return {
		state: toRoomStateDTO(snapshotFromDoc(room), hostToken, at),
		hostToken,
	};
}

export async function joinRoom(
	code: string,
	nameInput: string,
	existingToken?: string,
): Promise<{ state: RoomStateDTO; playerToken: string }> {
	const name = normalizePlayerName(nameInput);
	if (!name) throw new GameError('PLAYER_NAME_REQUIRED', 400);

	return withVersionRetry(async () => {
		const room = await loadRoom(code);
		const at = now();

		if (existingToken && existingToken === room.hostToken) {
			room.hostLastSeenAt = at;
			room.version += 1;
			await room.save();
			return {
				state: toRoomStateDTO(snapshotFromDoc(room), existingToken, at),
				playerToken: existingToken,
			};
		}

		if (existingToken) {
			const existing = findPlayer(room, existingToken);
			if (existing) {
				existing.lastSeenAt = at;
				room.version += 1;
				await room.save();
				return {
					state: toRoomStateDTO(snapshotFromDoc(room), existingToken, at),
					playerToken: existingToken,
				};
			}
		}

		if (room.phase !== 'lobby') throw new GameError('GAME_IN_PROGRESS', 400);
		if (activePlayers(room.players).length >= MAX_PLAYERS) throw new GameError('ROOM_FULL', 400);
		assertUniqueName(room, name);

		const playerToken = generateToken();
		room.players.push(blankPlayer(playerToken, name, at));
		room.version += 1;
		await room.save();
		return { state: toRoomStateDTO(snapshotFromDoc(room), playerToken, at), playerToken };
	});
}

export async function getScopedState(code: string, token: string | null): Promise<RoomStateDTO> {
	const at = now();
	const room = await loadRoom(code);
	if (token && token === room.hostToken) {
		await WerewolfRoom.updateOne(
			{ code: room.code, hostToken: token },
			{ $set: { hostLastSeenAt: at } },
			{ timestamps: true },
		);
		room.hostLastSeenAt = at;
	} else if (token && findPlayer(room, token)) {
		await WerewolfRoom.updateOne(
			{ code: room.code, 'players.token': token },
			{ $set: { 'players.$.lastSeenAt': at } },
			{ timestamps: true },
		);
		const player = findPlayer(room, token);
		if (player) player.lastSeenAt = at;
	}
	return toRoomStateDTO(snapshotFromDoc(room), token, at);
}

export async function setRoleCounts(
	code: string,
	hostToken: string,
	counts: RoleCount[],
): Promise<RoomStateDTO> {
	return mutateRoom(code, hostToken, (room) => {
		assertHost(room, hostToken);
		if (room.phase !== 'lobby') throw new GameError('NOT_LOBBY', 400);
		for (const entry of counts) {
			validateRoleCounts([entry], entry.count);
		}
		room.roleCounts = counts
			.filter((entry) => entry.count > 0)
			.map((entry) => ({ roleId: entry.roleId, count: entry.count }));
	});
}

export async function deal(
	code: string,
	hostToken: string,
	random: () => number = gameRandom,
): Promise<RoomStateDTO> {
	return mutateRoom(code, hostToken, (room) => {
		assertHost(room, hostToken);
		const seated = activePlayers(room.players);
		if (seated.length < MIN_PLAYERS) {
			throw new GameError('NEED_MIN_PLAYERS', 400, { min: MIN_PLAYERS });
		}
		if (seated.length > MAX_PLAYERS) {
			throw new GameError('ROOM_FULL', 400);
		}
		const counts = room.roleCounts.map((entry) => ({ roleId: entry.roleId, count: entry.count }));
		validateRoleCounts(counts, seated.length);
		const assigned = dealRoles(
			seated.map((player) => player.token),
			counts,
			random,
		);
		for (const player of seated) {
			player.roleId = assigned.get(player.token) ?? null;
			player.viewedAt = null;
		}
		room.dealRound += 1;
		room.phase = 'dealt';
	});
}

export async function backToLobby(code: string, hostToken: string): Promise<RoomStateDTO> {
	return mutateRoom(code, hostToken, (room) => {
		assertHost(room, hostToken);
		for (let index = room.players.length - 1; index >= 0; index--) {
			if (room.players[index]?.leftAt) room.players.splice(index, 1);
		}
		clearAssignments(room);
		room.phase = 'lobby';
	});
}

export async function markViewed(code: string, token: string): Promise<RoomStateDTO> {
	return mutateRoom(code, token, (room) => {
		const player = findPlayer(room, token);
		if (!player || player.leftAt) throw new GameError('PLAYER_NOT_FOUND', 404);
		if (room.phase !== 'dealt' || !player.roleId) throw new GameError('NOT_DEALT', 400);
		if (!player.viewedAt) player.viewedAt = now();
	});
}

export async function kickPlayer(
	code: string,
	hostToken: string,
	targetToken: string,
): Promise<RoomStateDTO> {
	return mutateRoom(code, hostToken, (room) => {
		assertHost(room, hostToken);
		if (targetToken === hostToken) throw new GameError('CANNOT_KICK_SELF', 400);
		departPlayer(room, targetToken);
	});
}

export async function leaveRoom(code: string, token: string): Promise<{ roomClosed: boolean }> {
	return withVersionRetry(async () => {
		const room = await loadRoom(code);
		if (room.hostToken === token) {
			await WerewolfRoom.deleteOne({ code: room.code });
			return { roomClosed: true };
		}
		departPlayer(room, token);
		room.version += 1;
		await room.save();
		return { roomClosed: false };
	});
}

/** Projection only: no heartbeat, writes, or phase advancement. */
export async function readTestState(code: string, token: string): Promise<RoomStateDTO> {
	await dbConnect();
	const room = await loadRoom(code);
	return toRoomStateDTO(snapshotFromDoc(room), token, now());
}
