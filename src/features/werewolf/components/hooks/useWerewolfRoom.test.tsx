import { act, renderHook, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { RoomStateDTO } from '@/features/werewolf/types';

const fetchRoomState = vi.fn();
const postWerewolfAction = vi.fn();

vi.mock('@/features/werewolf/lib/api', () => ({
	fetchRoomState: (...args: unknown[]) => fetchRoomState(...args),
	postWerewolfAction: (...args: unknown[]) => postWerewolfAction(...args),
	patchWerewolfAction: vi.fn(),
}));

vi.mock('@/features/board-game-shared/components/i18n/LocaleProvider', () => {
	const t = (key: string) => key;
	return { useT: () => t };
});

import { useWerewolfRoom } from '@/features/werewolf/components/hooks/useWerewolfRoom';

/** Wires the token the way WerewolfRoomClient does. */
function useRoomWithToken(initialToken: string | null) {
	const [token, setToken] = useState(initialToken);
	return useWerewolfRoom({ code: 'ABC234', playerToken: token, onTokenReceived: setToken });
}

function roomState(version: number, selfToken: string | null): RoomStateDTO {
	return {
		code: 'ABC234',
		phase: 'lobby',
		version,
		dealRound: 0,
		serverNow: new Date(0).toISOString(),
		isHost: false,
		hostName: 'Host',
		hostConnected: true,
		playerCount: selfToken ? 1 : 0,
		maxPlayers: 20,
		roleCounts: [],
		players: [],
		self: selfToken
			? {
					token: selfToken,
					name: 'An',
					avatarSeed: 'seed',
					viewed: false,
					left: false,
					roleId: null,
				}
			: null,
	};
}

afterEach(() => {
	fetchRoomState.mockReset();
	postWerewolfAction.mockReset();
	localStorage.clear();
});

describe('useWerewolfRoom', () => {
	it('ignores a tokenless poll that lands after the join', async () => {
		let resolveStale: (state: RoomStateDTO) => void = () => undefined;
		fetchRoomState.mockImplementationOnce(
			() => new Promise<RoomStateDTO>((resolve) => (resolveStale = resolve)),
		);
		fetchRoomState.mockImplementation(async (_code: string, token: string | null) =>
			roomState(2, token),
		);
		postWerewolfAction.mockResolvedValue({ state: roomState(2, 'tok-1'), playerToken: 'tok-1' });

		const { result } = renderHook(() => useRoomWithToken(null));

		await act(async () => {
			await result.current.api.join('An');
		});
		expect(result.current.state?.self?.token).toBe('tok-1');

		await act(async () => {
			resolveStale(roomState(1, null));
		});
		await waitFor(() => expect(result.current.state?.self?.token).toBe('tok-1'));
	});

	it('keeps the newer state when an older response arrives late', async () => {
		let resolveOld: (state: RoomStateDTO) => void = () => undefined;
		fetchRoomState.mockResolvedValue(roomState(5, 'tok-1'));
		const { result } = renderHook(() => useRoomWithToken('tok-1'));
		await waitFor(() => expect(result.current.state?.version).toBe(5));

		fetchRoomState.mockImplementationOnce(
			() => new Promise<RoomStateDTO>((resolve) => (resolveOld = resolve)),
		);
		fetchRoomState.mockResolvedValueOnce(roomState(7, 'tok-1'));
		await act(async () => {
			void result.current.refresh();
			await result.current.refresh();
		});
		expect(result.current.state?.version).toBe(7);

		await act(async () => {
			resolveOld(roomState(6, 'tok-1'));
		});
		expect(result.current.state?.version).toBe(7);
	});
});
