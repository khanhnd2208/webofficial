'use client';

import { withBasePath } from '@/features/board-game-shared/lib/basePath';
import type { TestCommand, TestGame, TestRoomEnvelope } from './types';

export const TEST_VIEWER_TOKEN = 'admin-test-viewer';
const rooms = new Map<string, TestRoomEnvelope>();
const pending = new Map<string, Promise<unknown>>();
const listeners = new Set<(room: TestRoomEnvelope) => void>();
export function subscribeTestRoom(listener: (room: TestRoomEnvelope) => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}
export function publishTestRoom(room: TestRoomEnvelope) {
	const key = `${room.game}/${room.state.code}`;
	if ((rooms.get(key)?.version ?? -1) > room.version) return;
	room = { ...room, receivedAt: Date.now() };
	rooms.set(key, room);
	listeners.forEach((listener) => listener(room));
}
export const testCommandPending = (game: TestGame, code: string) => pending.has(`${game}/${code}`);
export async function readAdminTestRoom(game: TestGame, code: string) {
	const room = await testRequest<TestRoomEnvelope>(
		`/api/admin/board-game/test-rooms/${game}/${code}`,
	);
	publishTestRoom(room);
	return room;
}
export async function sendAdminTestCommand<T = TestRoomEnvelope>(
	game: TestGame,
	code: string,
	command: TestCommand,
): Promise<T> {
	const key = `${game}/${code}`;
	const seatAtClick = rooms.get(key)?.controlledSeatId;
	const operation = (pending.get(key) ?? Promise.resolve())
		.catch(() => undefined)
		.then(async () => {
			try {
				const room = rooms.get(key) ?? (await readAdminTestRoom(game, code));
				if (seatAtClick && room.controlledSeatId !== seatAtClick)
					throw Object.assign(new Error('TEST_STATE_CONFLICT'), { code: 'TEST_STATE_CONFLICT' });
				const result = await testRequest<TestRoomEnvelope | { closed: boolean }>(
					`/api/admin/board-game/test-rooms/${key}/commands`,
					{
						method: 'POST',
						body: JSON.stringify({
							command,
							requestId: crypto.randomUUID(),
							expectedVersion: room.version,
							controlledSeatId: room.controlledSeatId,
						}),
					},
				);
				if ('state' in result) publishTestRoom(result);
				else rooms.delete(key);
				return result as T;
			} catch (error) {
				await readAdminTestRoom(game, code).catch(() => undefined);
				throw error;
			}
		});
	pending.set(key, operation);
	try {
		return await operation;
	} finally {
		if (pending.get(key) === operation) pending.delete(key);
	}
}
export async function testRequest<T>(url: string, init?: RequestInit): Promise<T> {
	const response = await fetch(withBasePath(url), {
		...init,
		headers: { 'Content-Type': 'application/json', ...init?.headers },
	});
	const body = (await response.json()) as { ok: boolean; data?: T; error?: string; code?: string };
	if (!response.ok || !body.ok)
		throw Object.assign(new Error(body.code ?? body.error ?? 'Test action failed'), {
			code: body.code,
		});
	return body.data as T;
}
