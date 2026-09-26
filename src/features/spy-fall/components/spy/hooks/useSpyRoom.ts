'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useLocale, useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { SPY_POLL_INTERVAL_MS } from '@/features/spy-fall/config/spyGame';
import { fetchRoomState, patchSpyAction, postSpyAction } from '@/features/spy-fall/lib/spy/api';
import { storePlayerToken } from '@/features/spy-fall/lib/spy/clientToken';
import type { PhaseCursor, RoomStateDTO, UpdateSettingsInput } from '@/features/spy-fall/types/spyGame';

interface UseSpyRoomOptions {
	code: string;
	playerToken: string | null;
	onTokenReceived?: (token: string) => void;
}

export function useSpyRoom({ code, playerToken, onTokenReceived }: UseSpyRoomOptions) {
	const t = useT();
	const { locale } = useLocale();
	const localeRef = useRef(locale);
	useEffect(() => {
		localeRef.current = locale;
	}, [locale]);
	const [state, setState] = useState<RoomStateDTO | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const wakeLockRef = useRef<WakeLockSentinel | null>(null);
	const tokenRef = useRef(playerToken);

	const refresh = useCallback(async () => {
		const requestToken = tokenRef.current;
		try {
			const data = await fetchRoomState(code, requestToken);
			// A poll sent before join (or before the stored token loaded) describes a different viewer.
			if (requestToken !== tokenRef.current) return;
			setState((prev) => (prev && data.version < prev.version ? prev : data));
			setError(null);
		} catch (e) {
			if (requestToken !== tokenRef.current) return;
			setError(e instanceof Error ? e.message : t('common.connectionLost'));
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
		}, SPY_POLL_INTERVAL_MS);

		const onVisible = () => void refresh();
		document.addEventListener('visibilitychange', onVisible);
		return () => {
			clearInterval(interval);
			document.removeEventListener('visibilitychange', onVisible);
		};
	}, [refresh]);

	// Screen wake lock during discussion/vote
	useEffect(() => {
		const phase = state?.phase;
		const needsLock = phase === 'discussion' || phase === 'vote' || phase === 'reveal';

		async function acquire() {
			try {
				if (needsLock && 'wakeLock' in navigator) {
					wakeLockRef.current = await navigator.wakeLock.request('screen');
				}
			} catch {
				// unsupported or denied
			}
		}

		void acquire();
		return () => {
			void wakeLockRef.current?.release();
			wakeLockRef.current = null;
		};
	}, [state?.phase]);

	const action = useCallback(
		async <T,>(fn: () => Promise<T>): Promise<T> => {
			const result = await fn();
			await refresh();
			return result;
		},
		[refresh],
	);

	const api = {
		join: (name: string, existingToken?: string) =>
			action(async () => {
				const data = await postSpyAction<{ state: RoomStateDTO; playerToken: string }>(
					`/api/spy/rooms/${code}/join`,
					{ name, playerToken: existingToken },
				);
				storePlayerToken(code, data.playerToken);
				tokenRef.current = data.playerToken;
				onTokenReceived?.(data.playerToken);
				setState(data.state);
				return data;
			}),
		start: () =>
			action(() =>
				postSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/start`, {
					token: tokenRef.current,
					locale: localeRef.current,
				}),
			),
		memorized: () =>
			action(() =>
				postSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/memorized`, {
					token: tokenRef.current,
				}),
			),
		vote: (targetId: string | null) =>
			action(() =>
				postSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/vote`, {
					token: tokenRef.current,
					targetId,
				}),
			),
		settings: (input: UpdateSettingsInput) =>
			action(() =>
				patchSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/settings`, {
					token: tokenRef.current,
					...input,
				}),
			),
		next: (from: PhaseCursor) =>
			action(async () => {
				try {
					return await postSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/next`, {
						token: tokenRef.current,
						from,
					});
				} catch (error) {
					await refresh();
					throw error;
				}
			}),
		playAgain: () =>
			action(() =>
				postSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/play-again`, {
					token: tokenRef.current,
				}),
			),
		restart: () =>
			action(() =>
				postSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/restart`, {
					token: tokenRef.current,
				}),
			),
		rename: (name: string) =>
			action(() =>
				patchSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/rename`, {
					token: tokenRef.current,
					name,
				}),
			),
		kick: (targetId: string) =>
			action(() =>
				postSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/kick`, {
					token: tokenRef.current,
					targetId,
				}),
			),
		leave: () =>
			postSpyAction<{ roomClosed: boolean }>(`/api/spy/rooms/${code}/leave`, {
				token: tokenRef.current,
			}),
	};

	return {
		state,
		error,
		loading,
		refresh,
		api,
	};
}
