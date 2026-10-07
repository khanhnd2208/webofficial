import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	publishTestRoom,
	readAdminTestRoom,
	sendAdminTestCommand,
	testCommandPending,
} from './clientApi';
import type { TestRoomEnvelope } from './types';

// Transport tests need only the room identity; the full DTO is owned by the services.
function room(code: string, version = 0, controlledSeatId = 'admin') {
	return {
		game: 'cheese-thief',
		state: { code },
		version,
		controlledSeatId,
	} as TestRoomEnvelope;
}
const response = (data: TestRoomEnvelope) => Response.json({ ok: true, data });
function deferred() {
	let resolve!: (value: Response) => void;
	const promise = new Promise<Response>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}

afterEach(() => vi.unstubAllGlobals());

describe('test-room request ordering', () => {
	it('waits for an in-flight command before a hydration or polling read', async () => {
		const code = 'QUEUED';
		publishTestRoom(room(code));
		const command = deferred();
		const fetch = vi
			.fn()
			.mockReturnValueOnce(command.promise)
			.mockResolvedValue(response(room(code, 1)));
		vi.stubGlobal('fetch', fetch);
		const writing = sendAdminTestCommand('cheese-thief', code, { kind: 'start' });
		await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
		const reading = readAdminTestRoom('cheese-thief', code);
		await Promise.resolve();
		expect(fetch).toHaveBeenCalledTimes(1);
		expect(testCommandPending('cheese-thief', code)).toBe(true);
		command.resolve(response(room(code, 1)));
		await writing;
		expect((await reading).version).toBe(1);
		expect(fetch.mock.calls.map(([url]) => url)).toEqual([
			`/api/admin/board-game/test-rooms/cheese-thief/${code}/commands`,
			`/api/admin/board-game/test-rooms/cheese-thief/${code}`,
		]);
		expect(testCommandPending('cheese-thief', code)).toBe(false);
	});

	it('uses the fresh version when a command follows an in-flight read', async () => {
		const code = 'FRESH';
		publishTestRoom(room(code));
		const read = deferred();
		const fetch = vi
			.fn()
			.mockReturnValueOnce(read.promise)
			.mockResolvedValue(response(room(code, 8)));
		vi.stubGlobal('fetch', fetch);
		const reading = readAdminTestRoom('cheese-thief', code);
		await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
		const writing = sendAdminTestCommand('cheese-thief', code, { kind: 'start' });
		await Promise.resolve();
		expect(fetch).toHaveBeenCalledTimes(1);
		read.resolve(response(room(code, 7)));
		await reading;
		await writing;
		expect(JSON.parse(fetch.mock.calls[1][1].body).expectedVersion).toBe(7);
	});

	it('loads a missing room inside the command without waiting on its own queue', async () => {
		const code = 'UNCACHED';
		const fetch = vi
			.fn()
			.mockResolvedValueOnce(response(room(code)))
			.mockResolvedValue(response(room(code, 1)));
		vi.stubGlobal('fetch', fetch);
		await expect(
			sendAdminTestCommand('cheese-thief', code, { kind: 'start' }),
		).resolves.toMatchObject({ version: 1 });
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it('recovers the current version after a failed command without replaying the command', async () => {
		const code = 'RECOVER';
		publishTestRoom(room(code));
		const fetch = vi
			.fn()
			.mockResolvedValueOnce(
				Response.json({ ok: false, code: 'TEST_STATE_CONFLICT' }, { status: 409 }),
			)
			.mockResolvedValueOnce(response(room(code, 2)))
			.mockResolvedValueOnce(response(room(code, 3)));
		vi.stubGlobal('fetch', fetch);
		await expect(sendAdminTestCommand('cheese-thief', code, { kind: 'start' })).rejects.toThrow(
			'TEST_STATE_CONFLICT',
		);
		await sendAdminTestCommand('cheese-thief', code, { kind: 'remember' });
		expect(fetch).toHaveBeenCalledTimes(3);
		expect(JSON.parse(fetch.mock.calls[2][1].body).expectedVersion).toBe(2);
	});

	it('still rejects queued actions intended for a seat that changed before they ran', async () => {
		const code = 'SEAT';
		publishTestRoom(room(code));
		const command = deferred();
		const fetch = vi
			.fn()
			.mockReturnValueOnce(command.promise)
			.mockResolvedValue(response(room(code, 1, 'bot-1')));
		vi.stubGlobal('fetch', fetch);
		const switching = sendAdminTestCommand('cheese-thief', code, {
			kind: 'set-seat',
			seatId: 'bot-1',
		});
		await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
		const stale = sendAdminTestCommand('cheese-thief', code, { kind: 'remember' });
		const rejected = expect(stale).rejects.toThrow('TEST_STATE_CONFLICT');
		command.resolve(response(room(code, 1, 'bot-1')));
		await switching;
		await rejected;
		expect(fetch).toHaveBeenCalledTimes(2);
		expect(fetch.mock.calls[1][1]?.method).not.toBe('POST');
	});
});
