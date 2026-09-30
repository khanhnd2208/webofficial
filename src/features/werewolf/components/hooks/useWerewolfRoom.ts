'use client';
import { useTestRoom } from '@/features/board-game-test/context';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import { WEREWOLF_POLL_INTERVAL_MS } from '@/features/werewolf/config/roles';
import {
	fetchRoomState,
	patchWerewolfAction,
	postWerewolfAction,
} from '@/features/werewolf/lib/api';
import { storePlayerToken } from '@/features/werewolf/lib/clientToken';
import type { RoleCount, RoomStateDTO } from '@/features/werewolf/types';
import {
	readAdminTestRoom,
	sendAdminTestCommand,
	TEST_VIEWER_TOKEN,
} from '@/features/board-game-test/clientApi';

interface Options {
	code: string;
	playerToken: string | null;
	onTokenReceived?: (token: string) => void;
	adminTest?: boolean;
}

export function useWerewolfRoom({
	code,
	playerToken,
	onTokenReceived,
	adminTest = false,
}: Options) {
	const testRoom = useTestRoom();
	const t = useT();
	const [state, setState] = useState<RoomStateDTO | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [errorCode, setErrorCode] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const tokenRef = useRef(playerToken);

	const refresh = useCallback(async () => {
		if (adminTest) {
			setLoading(false);
			return;
		}
		const requestToken = tokenRef.current;
		try {
			const data = adminTest
				? ((await readAdminTestRoom('ma-soi', code)).state as RoomStateDTO)
				: await fetchRoomState(code, requestToken);
			// A poll sent before join (or before the stored token loaded) describes a different viewer.
			if (requestToken !== tokenRef.current) return;
			setState((prev) => (prev && data.version < prev.version ? prev : data));
			setError(null);
			setErrorCode(null);
		} catch (e) {
			if (requestToken !== tokenRef.current) return;
			setError(e instanceof Error ? e.message : t('common.unknownError'));
			setErrorCode(e instanceof Error && 'code' in e ? String((e as { code: string }).code) : null);
		}
		setLoading(false);
	}, [adminTest, code, t]);
	const scheduleRefresh = useCallback(() => queueMicrotask(() => void refresh()), [refresh]);

	// Track the viewer's token and re-read as soon as it changes, so a dropped poll is replaced right away.
	useEffect(() => {
		tokenRef.current = playerToken;
		if (playerToken) scheduleRefresh();
	}, [playerToken, scheduleRefresh]);

	useEffect(() => {
		scheduleRefresh();
		const interval = setInterval(() => {
			if (document.hidden) return;
			void refresh();
		}, WEREWOLF_POLL_INTERVAL_MS);
		const onVisible = () => void refresh();
		document.addEventListener('visibilitychange', onVisible);
		return () => {
			clearInterval(interval);
			document.removeEventListener('visibilitychange', onVisible);
		};
	}, [refresh, scheduleRefresh]);

	const action = useCallback(
		async <T>(fn: () => Promise<T>): Promise<T> => {
			const result = await fn();
			await refresh();
			return result;
		},
		[refresh],
	);

	const join = useCallback(
		(name: string, existingToken?: string) =>
			action(async () => {
				if (adminTest)
					return {
						state: (await readAdminTestRoom('ma-soi', code)).state as RoomStateDTO,
						playerToken: TEST_VIEWER_TOKEN,
					};
				const data = await postWerewolfAction<{ state: RoomStateDTO; playerToken: string }>(
					`/api/ma-soi/rooms/${code}/join`,
					{ name, playerToken: existingToken },
				);
				storePlayerToken(code, data.playerToken);
				tokenRef.current = data.playerToken;
				onTokenReceived?.(data.playerToken);
				setState(data.state);
				return data;
			}),
		[action, adminTest, code, onTokenReceived],
	);
	const setRoles = useCallback(
		(roleCounts: RoleCount[]) =>
			adminTest
				? (sendAdminTestCommand('ma-soi', code, {
						kind: 'roles',
						roleCounts,
					}) as Promise<RoomStateDTO>)
				: patchWerewolfAction<RoomStateDTO>(`/api/ma-soi/rooms/${code}/roles`, {
						token: tokenRef.current,
						roleCounts,
					}),
		[adminTest, code],
	);
	const deal = useCallback(
		() =>
			action(() =>
				adminTest
					? (sendAdminTestCommand('ma-soi', code, { kind: 'start' }) as Promise<RoomStateDTO>)
					: postWerewolfAction<RoomStateDTO>(`/api/ma-soi/rooms/${code}/deal`, {
							token: tokenRef.current,
						}),
			),
		[action, adminTest, code],
	);
	const lobby = useCallback(
		() =>
			action(() =>
				adminTest
					? (sendAdminTestCommand('ma-soi', code, { kind: 'lobby' }) as Promise<RoomStateDTO>)
					: postWerewolfAction<RoomStateDTO>(`/api/ma-soi/rooms/${code}/lobby`, {
							token: tokenRef.current,
						}),
			),
		[action, adminTest, code],
	);
	const viewed = useCallback(
		() =>
			adminTest
				? (sendAdminTestCommand('ma-soi', code, { kind: 'viewed' }) as Promise<RoomStateDTO>)
				: postWerewolfAction<RoomStateDTO>(`/api/ma-soi/rooms/${code}/viewed`, {
						token: tokenRef.current,
					}),
		[adminTest, code],
	);
	const kick = useCallback(
		(targetToken: string) =>
			adminTest
				? (sendAdminTestCommand('ma-soi', code, {
						kind: 'kick',
						playerId: targetToken,
					}) as Promise<RoomStateDTO>)
				: action(() =>
						postWerewolfAction<RoomStateDTO>(`/api/ma-soi/rooms/${code}/kick`, {
							token: tokenRef.current,
							targetToken,
						}),
					),
		[action, adminTest, code],
	);
	const leave = useCallback(
		() =>
			adminTest
				? Promise.resolve({ roomClosed: false })
				: postWerewolfAction<{ roomClosed: boolean }>(`/api/ma-soi/rooms/${code}/leave`, {
						token: tokenRef.current,
					}),
		[adminTest, code],
	);

	const api = { join, setRoles, deal, lobby, viewed, kick, leave };

	return {
		state: testRoom ? (testRoom.state as RoomStateDTO) : state,
		error,
		errorCode,
		loading: testRoom ? false : loading,
		refresh,
		api,
	};
}
