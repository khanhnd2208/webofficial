'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useLocale, useT } from '@/components/i18n/LocaleProvider';
import { SPY_POLL_INTERVAL_MS } from '@/config/spyGame';
import { fetchRoomState, patchSpyAction, postSpyAction } from '@/lib/spy/api';
import { storePlayerToken } from '@/lib/spy/clientToken';
import type { RoomStateDTO, UpdateSettingsInput, VoteInput } from '@/types/spyGame';

interface UseSpyRoomOptions {
	code: string;
	playerToken: string | null;
	onTokenReceived?: (token: string) => void;
}

export function useSpyRoom({ code, playerToken, onTokenReceived }: UseSpyRoomOptions) {
	const t = useT();
	const { locale } = useLocale();
	const localeRef = useRef(locale);
	localeRef.current = locale;
	const [state, setState] = useState<RoomStateDTO | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const wakeLockRef = useRef<WakeLockSentinel | null>(null);
	const tokenRef = useRef(playerToken);
	tokenRef.current = playerToken;

	const refresh = useCallback(async () => {
		try {
			const data = await fetchRoomState(code, tokenRef.current);
			setState(data);
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : t('common.connectionLost'));
		} finally {
			setLoading(false);
		}
	}, [code, t]);

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
		const needsLock = phase === 'discussion' || phase === 'vote' || phase === 'runoff';

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
				onTokenReceived?.(data.playerToken);
				setState(data.state);
				return data;
			}),
		setReady: (ready: boolean) =>
			action(() =>
				postSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/ready`, {
					token: tokenRef.current,
					ready,
				}),
			),
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
		spoke: () =>
			action(() =>
				postSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/spoke`, {
					token: tokenRef.current,
				}),
			),
		hostMarkSpoke: (targetToken: string, spoken: boolean) =>
			action(() =>
				postSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/spoke`, {
					token: tokenRef.current,
					targetToken,
					spoken,
				}),
			),
		suspect: (suspectTokens: string[] | null) =>
			action(() =>
				postSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/suspect`, {
					token: tokenRef.current,
					suspectTokens,
				}),
			),
		vote: (input: VoteInput) =>
			action(() =>
				postSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/vote`, {
					token: tokenRef.current,
					...input,
				}),
			),
		runoffVote: (choices: string[]) =>
			action(() =>
				postSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/runoff-vote`, {
					token: tokenRef.current,
					choices,
				}),
			),
		mrWhiteResult: (guessResult: 'correct' | 'incorrect') =>
			action(() =>
				postSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/mrwhite-result`, {
					token: tokenRef.current,
					guessResult,
				}),
			),
		settings: (input: UpdateSettingsInput) =>
			action(() =>
				patchSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/settings`, {
					token: tokenRef.current,
					...input,
				}),
			),
		next: () =>
			action(() =>
				postSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/next`, {
					token: tokenRef.current,
				}),
			),
		revealWords: () =>
			action(() =>
				postSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/reveal-words`, {
					token: tokenRef.current,
				}),
			),
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
		kick: (targetToken: string) =>
			action(() =>
				postSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/kick`, {
					token: tokenRef.current,
					targetToken,
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
