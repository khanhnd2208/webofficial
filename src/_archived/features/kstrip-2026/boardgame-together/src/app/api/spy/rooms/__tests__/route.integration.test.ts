import { beforeEach, describe, expect, it } from 'vitest';

import { GET as listRoomsGET, POST as createRoomPOST } from '@/app/api/spy/rooms/route';
import { POST as joinPOST } from '@/app/api/spy/rooms/[code]/join/route';
import { POST as leavePOST } from '@/app/api/spy/rooms/[code]/leave/route';
import { PATCH as renamePATCH } from '@/app/api/spy/rooms/[code]/rename/route';
import { POST as readyPOST } from '@/app/api/spy/rooms/[code]/ready/route';
import { GET as stateGET } from '@/app/api/spy/rooms/[code]/state/route';
import { POST as startPOST } from '@/app/api/spy/rooms/[code]/start/route';
import { POST as nextPOST } from '@/app/api/spy/rooms/[code]/next/route';
import { POST as restartPOST } from '@/app/api/spy/rooms/[code]/restart/route';
import { POST as votePOST } from '@/app/api/spy/rooms/[code]/vote/route';
import SpyGame from '@/models/SpyGame';
import { invokeRoute, parseJson } from '@/test/helpers/apiRoute';
import { SpyGameHelper } from '@/test/helpers/spyGameHelper';
import { joinRoom, leaveRoom, renamePlayer, setReady } from '@/services/spyGameService';
import type { RoomStateDTO } from '@/types/spyGame';

describe('spy rooms API routes', () => {
	beforeEach(async () => {
		await SpyGame.deleteMany({});
	});

	it('POST /api/spy/rooms creates room with 201', async () => {
		const res = await invokeRoute(createRoomPOST, {
			method: 'POST',
			url: 'http://localhost/api/spy/rooms',
			body: { name: 'API Room', hostName: 'Host', isPublic: true },
		});
		expect(res.status).toBe(201);
		const json = await parseJson<{ ok: boolean; data: { state: { code: string }; playerToken: string } }>(
			res,
		);
		expect(json.ok).toBe(true);
		expect(json.data.state.code).toHaveLength(6);
		expect(json.data.playerToken).toBeTruthy();
	});

	it('POST /api/spy/rooms rejects empty hostName', async () => {
		const res = await invokeRoute(createRoomPOST, {
			method: 'POST',
			url: 'http://localhost/api/spy/rooms',
			body: { name: 'Room', hostName: '  ' },
		});
		expect(res.status).toBe(400);
		const json = await parseJson<{ ok: boolean; error: string }>(res);
		expect(json.ok).toBe(false);
	});

	it('GET /api/spy/rooms lists public lobby rooms only', async () => {
		await invokeRoute(createRoomPOST, {
			method: 'POST',
			url: 'http://localhost/api/spy/rooms',
			body: { name: 'Public', hostName: 'Host', isPublic: true },
		});
		await invokeRoute(createRoomPOST, {
			method: 'POST',
			url: 'http://localhost/api/spy/rooms',
			body: { name: 'Private', hostName: 'Host2', isPublic: false },
		});

		const res = await invokeRoute(listRoomsGET, { url: 'http://localhost/api/spy/rooms' });
		expect(res.status).toBe(200);
		const json = await parseJson<{ ok: boolean; data: Array<{ name: string; status: string }> }>(res);
		expect(json.ok).toBe(true);
		expect(json.data.some((r) => r.name === 'Public')).toBe(true);
		expect(json.data.every((r) => r.status === 'waiting')).toBe(true);
		expect(json.data.some((r) => r.name === 'Private')).toBe(false);
	});

	it('GET state returns scoped room state', async () => {
		const createRes = await invokeRoute(createRoomPOST, {
			method: 'POST',
			url: 'http://localhost/api/spy/rooms',
			body: { name: 'State', hostName: 'Host' },
		});
		const created = toData(
			await parseJson<{ ok: boolean; data: { state: { code: string }; playerToken: string } }>(
				createRes,
			),
		);
		const res = await invokeRoute(stateGET, {
			url: `http://localhost/api/spy/rooms/${created.state.code}/state?token=${created.playerToken}`,
			params: { code: created.state.code },
		});
		expect(res.status).toBe(200);
		const json = await parseJson<{ ok: boolean; data: { phase: string } }>(res);
		expect(json.data.phase).toBe('lobby');
	});

	it('GET state 404 for unknown code', async () => {
		const res = await invokeRoute(stateGET, {
			url: 'http://localhost/api/spy/rooms/ZZZZZZ/state',
			params: { code: 'ZZZZZZ' },
		});
		expect(res.status).toBe(404);
	});

	it('POST join rejects duplicate name', async () => {
		const created = toData(
			await parseJson<{ ok: boolean; data: { state: { code: string }; playerToken: string } }>(
				await invokeRoute(createRoomPOST, {
					method: 'POST',
					url: 'http://localhost/api/spy/rooms',
					body: { name: 'Join', hostName: 'Host' },
				}),
			),
		);

		const res = await invokeRoute(joinPOST, {
			method: 'POST',
			url: `http://localhost/api/spy/rooms/${created.state.code}/join`,
			params: { code: created.state.code },
			body: { name: 'Host' },
		});
		expect(res.status).toBe(400);
	});

	it('POST ready without token returns 400', async () => {
		const created = toData(
			await parseJson<{ ok: boolean; data: { state: { code: string }; playerToken: string } }>(
				await invokeRoute(createRoomPOST, {
					method: 'POST',
					url: 'http://localhost/api/spy/rooms',
					body: { name: 'Ready', hostName: 'Host' },
				}),
			),
		);

		const res = await invokeRoute(readyPOST, {
			method: 'POST',
			url: `http://localhost/api/spy/rooms/${created.state.code}/ready`,
			params: { code: created.state.code },
			body: { ready: true },
		});
		expect(res.status).toBe(400);
	});

	it('POST start from non-host returns 403', async () => {
		const created = toData(
			await parseJson<{ ok: boolean; data: { state: { code: string }; playerToken: string } }>(
				await invokeRoute(createRoomPOST, {
					method: 'POST',
					url: 'http://localhost/api/spy/rooms',
					body: { name: 'Start', hostName: 'Host' },
				}),
			),
		);
		const joined = await joinRoom(created.state.code, 'Guest');
		await setReady(created.state.code, created.playerToken, true);
		await setReady(created.state.code, joined.playerToken, true);

		const res = await invokeRoute(startPOST, {
			method: 'POST',
			url: `http://localhost/api/spy/rooms/${created.state.code}/start`,
			params: { code: created.state.code },
			body: { token: joined.playerToken },
		});
		expect(res.status).toBe(403);
	});

	it('POST vote without token returns 400', async () => {
		const created = toData(
			await parseJson<{ ok: boolean; data: { state: { code: string }; playerToken: string } }>(
				await invokeRoute(createRoomPOST, {
					method: 'POST',
					url: 'http://localhost/api/spy/rooms',
					body: { name: 'Vote', hostName: 'Host' },
				}),
			),
		);

		const res = await invokeRoute(votePOST, {
			method: 'POST',
			url: `http://localhost/api/spy/rooms/${created.state.code}/vote`,
			params: { code: created.state.code },
			body: { vote1Token: 'x' },
		});
		expect(res.status).toBe(400);
	});

	it('PATCH rename updates player name in lobby', async () => {
		const created = toData(
			await parseJson<{ ok: boolean; data: { state: { code: string }; playerToken: string } }>(
				await invokeRoute(createRoomPOST, {
					method: 'POST',
					url: 'http://localhost/api/spy/rooms',
					body: { name: 'Rename', hostName: 'Host' },
				}),
			),
		);

		const res = await invokeRoute(renamePATCH, {
			method: 'PATCH',
			url: `http://localhost/api/spy/rooms/${created.state.code}/rename`,
			params: { code: created.state.code },
			body: { token: created.playerToken, name: 'Agent Alpha' },
		});
		expect(res.status).toBe(200);
		const json = await parseJson<{ ok: boolean; data: { self: { name: string } } }>(res);
		expect(json.data.self.name).toBe('Agent Alpha');
	});

	it('PATCH rename rejects duplicate name', async () => {
		const created = toData(
			await parseJson<{ ok: boolean; data: { state: { code: string }; playerToken: string } }>(
				await invokeRoute(createRoomPOST, {
					method: 'POST',
					url: 'http://localhost/api/spy/rooms',
					body: { name: 'DupRename', hostName: 'Host' },
				}),
			),
		);
		const guest = await joinRoom(created.state.code, 'Guest');

		const res = await invokeRoute(renamePATCH, {
			method: 'PATCH',
			url: `http://localhost/api/spy/rooms/${created.state.code}/rename`,
			params: { code: created.state.code },
			body: { token: guest.playerToken, name: 'Host' },
		});
		expect(res.status).toBe(400);
	});

	it('POST leave removes player and transfers host', async () => {
		const created = toData(
			await parseJson<{ ok: boolean; data: { state: { code: string }; playerToken: string } }>(
				await invokeRoute(createRoomPOST, {
					method: 'POST',
					url: 'http://localhost/api/spy/rooms',
					body: { name: 'Leave', hostName: 'Host' },
				}),
			),
		);
		const guest = await joinRoom(created.state.code, 'Guest');

		const leaveRes = await invokeRoute(leavePOST, {
			method: 'POST',
			url: `http://localhost/api/spy/rooms/${created.state.code}/leave`,
			params: { code: created.state.code },
			body: { token: created.playerToken },
		});
		expect(leaveRes.status).toBe(200);
		const leaveJson = await parseJson<{ ok: boolean; data: { roomClosed: boolean } }>(leaveRes);
		expect(leaveJson.data.roomClosed).toBe(false);

		const stateRes = await invokeRoute(stateGET, {
			url: `http://localhost/api/spy/rooms/${created.state.code}/state?token=${guest.playerToken}`,
			params: { code: created.state.code },
		});
		const stateJson = await parseJson<{ ok: boolean; data: { playerCount: number; isHost: boolean } }>(
			stateRes,
		);
		expect(stateJson.data.playerCount).toBe(1);
		expect(stateJson.data.isHost).toBe(true);
	});

	it('POST leave closes room when last player leaves', async () => {
		const created = toData(
			await parseJson<{ ok: boolean; data: { state: { code: string }; playerToken: string } }>(
				await invokeRoute(createRoomPOST, {
					method: 'POST',
					url: 'http://localhost/api/spy/rooms',
					body: { name: 'Solo', hostName: 'Host' },
				}),
			),
		);

		const res = await invokeRoute(leavePOST, {
			method: 'POST',
			url: `http://localhost/api/spy/rooms/${created.state.code}/leave`,
			params: { code: created.state.code },
			body: { token: created.playerToken },
		});
		const json = await parseJson<{ ok: boolean; data: { roomClosed: boolean } }>(res);
		expect(json.data.roomClosed).toBe(true);

		const stateRes = await invokeRoute(stateGET, {
			url: `http://localhost/api/spy/rooms/${created.state.code}/state`,
			params: { code: created.state.code },
		});
		expect(stateRes.status).toBe(404);
	});

	it('leaveRoom service transfers host to remaining player', async () => {
		const created = toData(
			await parseJson<{ ok: boolean; data: { state: { code: string }; playerToken: string } }>(
				await invokeRoute(createRoomPOST, {
					method: 'POST',
					url: 'http://localhost/api/spy/rooms',
					body: { name: 'SvcLeave', hostName: 'Host' },
				}),
			),
		);
		const guest = await joinRoom(created.state.code, 'Guest');
		await leaveRoom(created.state.code, created.playerToken);
		const state = await renamePlayer(created.state.code, guest.playerToken, 'New Guest');
		expect(state.isHost).toBe(true);
		expect(state.self?.name).toBe('New Guest');
	});

	it('POST /next lets host confirm-all from role-reveal', async () => {
		const helper = await SpyGameHelper.create(4);
		await helper.runToRoleReveal();

		const res = await invokeRoute(nextPOST, {
			method: 'POST',
			url: `http://localhost/api/spy/rooms/${helper.code}/next`,
			params: { code: helper.code },
			body: { token: helper.hostToken },
		});
		expect(res.status).toBe(200);
		const json = await parseJson<{ ok: boolean; data: RoomStateDTO }>(res);
		expect(json.data.phase).toBe('opening');
		expect(json.data.players.every((p) => p.hasMemorizedRole)).toBe(true);
	});

	it('POST /next rejects non-host confirm-all', async () => {
		const helper = await SpyGameHelper.create(4);
		await helper.runToRoleReveal();

		const res = await invokeRoute(nextPOST, {
			method: 'POST',
			url: `http://localhost/api/spy/rooms/${helper.code}/next`,
			params: { code: helper.code },
			body: { token: helper.tokens[1] },
		});
		expect(res.status).toBe(403);
	});

	it('POST /restart returns lobby for host and rejects lobby restart', async () => {
		const helper = await SpyGameHelper.create(4);
		await helper.runToOpening();

		const restartRes = await invokeRoute(restartPOST, {
			method: 'POST',
			url: `http://localhost/api/spy/rooms/${helper.code}/restart`,
			params: { code: helper.code },
			body: { token: helper.hostToken },
		});
		expect(restartRes.status).toBe(200);
		const restarted = await parseJson<{ ok: boolean; data: RoomStateDTO }>(restartRes);
		expect(restarted.data.phase).toBe('lobby');
		expect(restarted.data.playerCount).toBe(4);

		const lobbyRes = await invokeRoute(restartPOST, {
			method: 'POST',
			url: `http://localhost/api/spy/rooms/${helper.code}/restart`,
			params: { code: helper.code },
			body: { token: helper.hostToken },
		});
		expect(lobbyRes.status).toBe(400);

		const guestRes = await invokeRoute(restartPOST, {
			method: 'POST',
			url: `http://localhost/api/spy/rooms/${helper.code}/restart`,
			params: { code: helper.code },
			body: { token: helper.tokens[1] },
		});
		// room is lobby so host check or lobby check — guest still forbidden if somehow mid-game;
		// here phase is lobby so 400 from lobby guard after host check... guest hits 403 first if we check host first.
		// After restart we're in lobby; guest calling restart: host check fails with 403.
		expect(guestRes.status).toBe(403);
	});
});

function toData<T>(json: { ok: boolean; data: T }): T {
	return json.data;
}
