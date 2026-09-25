'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { WEREWOLF_POLL_INTERVAL_MS } from '@/features/werewolf/config/roles';
import { fetchRoomState, patchWerewolfAction, postWerewolfAction } from '@/features/werewolf/lib/api';
import { storePlayerToken } from '@/features/werewolf/lib/clientToken';
import type { RoleCount, RoomStateDTO } from '@/features/werewolf/types';

interface Options {
	code: string;
	playerToken: string | null;
	onTokenReceived?: (token: string) => void;
}

export function useWerewolfRoom({ code, playerToken, onTokenReceived }: Options) {
	const t = useT();
	const [state, setState] = useState<RoomStateDTO | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [errorCode, setErrorCode] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const tokenRef = useRef(playerToken);

	const refresh = useCallback(async () => {
		const requestToken = tokenRef.current;
		try {
			const data = await fetchRoomState(code, requestToken);
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
	}, [code, t]);

	// Track the viewer's token and re-read as soon as it changes, so a dropped poll is replaced right away.
	useEffect(() => {
		tokenRef.current = playerToken;
		if (playerToken) void refresh();
	}, [playerToken, refresh]);

	useEffect(() => {
		void refresh();
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
	}, [refresh]);

	const action = useCallback(
		async <T,>(fn: () => Promise<T>): Promise<T> => {
			const result = await fn();
			await refresh();
			return result;
		},
		[refresh],
	);

	const join = useCallback(
		(name: string, existingToken?: string) =>
			action(async () => {
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
		[action, code, onTokenReceived],
	);
	const setRoles = useCallback(
		(roleCounts: RoleCount[]) =>
			patchWerewolfAction<RoomStateDTO>(`/api/ma-soi/rooms/${code}/roles`, {
				token: tokenRef.current,
				roleCounts,
			}),
		[code],
	);
	const deal = useCallback(
		() => action(() => postWerewolfAction<RoomStateDTO>(`/api/ma-soi/rooms/${code}/deal`, { token: tokenRef.current })),
		[action, code],
	);
	const lobby = useCallback(
		() => action(() => postWerewolfAction<RoomStateDTO>(`/api/ma-soi/rooms/${code}/lobby`, { token: tokenRef.current })),
		[action, code],
	);
	const viewed = useCallback(
		() => postWerewolfAction<RoomStateDTO>(`/api/ma-soi/rooms/${code}/viewed`, { token: tokenRef.current }),
		[code],
	);
	const kick = useCallback(
		(targetToken: string) =>
			action(() =>
				postWerewolfAction<RoomStateDTO>(`/api/ma-soi/rooms/${code}/kick`, {
					token: tokenRef.current,
					targetToken,
				}),
			),
		[action, code],
	);
	const leave = useCallback(
		() => postWerewolfAction<{ roomClosed: boolean }>(`/api/ma-soi/rooms/${code}/leave`, { token: tokenRef.current }),
		[code],
	);

	const api = { join, setRoles, deal, lobby, viewed, kick, leave };

	return { state, error, errorCode, loading, refresh, api };
}
