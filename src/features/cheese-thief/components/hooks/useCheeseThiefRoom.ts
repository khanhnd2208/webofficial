'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { CHEESE_POLL_INTERVAL_MS } from '@/features/cheese-thief/config/cheeseThief';
import { fetchRoomState, patchCheeseAction, postCheeseAction } from '@/features/cheese-thief/lib/api';
import { storePlayerToken } from '@/features/cheese-thief/lib/clientToken';
import type { RoomStateDTO, UpdateSettingsInput } from '@/features/cheese-thief/types';
import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';

interface Options {
	code: string;
	playerToken: string | null;
	onTokenReceived?: (token: string) => void;
}

export function useCheeseThiefRoom({ code, playerToken, onTokenReceived }: Options) {
	const t = useT();
	const [state, setState] = useState<RoomStateDTO | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [fetchedAt, setFetchedAt] = useState<number>(() => Date.now());
	const wakeLockRef = useRef<WakeLockSentinel | null>(null);
	const tokenRef = useRef(playerToken);

	const refresh = useCallback(async () => {
		const requestToken = tokenRef.current;
		try {
			const data = await fetchRoomState(code, requestToken);
			if (requestToken !== tokenRef.current) return;
			setState((prev) => (prev && data.version < prev.version ? prev : data));
			setFetchedAt(Date.now());
			setError(null);
		} catch (caught) {
			if (requestToken !== tokenRef.current) return;
			setError(caught instanceof Error ? caught.message : t('common.connectionLost'));
		}
		setLoading(false);
	}, [code, t]);

	useEffect(() => {
		tokenRef.current = playerToken;
		if (playerToken) void refresh();
	}, [playerToken, refresh]);

	useEffect(() => {
		void refresh();
		const interval = setInterval(() => {
			if (document.hidden) return;
			void refresh();
		}, CHEESE_POLL_INTERVAL_MS);
		const onVisible = () => void refresh();
		document.addEventListener('visibilitychange', onVisible);
		return () => {
			clearInterval(interval);
			document.removeEventListener('visibilitychange', onVisible);
		};
	}, [refresh]);

	useEffect(() => {
		const phase = state?.phase;
		// The host keeps polling through the day talk too, so the host seat does not drift to another phone.
		const hostHolds = Boolean(
			state?.isHost && (phase === 'night' || phase === 'cheese-check' || phase === 'day' || phase === 'tie'),
		);
		const tableLooking = phase === 'deal' || phase === 'secret' || phase === 'secret-result' || phase === 'vote';
		const needsLock = hostHolds || tableLooking;

		async function acquire() {
			try {
				if (needsLock && 'wakeLock' in navigator) {
					wakeLockRef.current = await navigator.wakeLock.request('screen');
				}
			} catch {
				// The table can live without a wake lock.
			}
		}

		void acquire();
		return () => {
			void wakeLockRef.current?.release();
			wakeLockRef.current = null;
		};
	}, [state?.phase, state?.isHost]);

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
				const data = await postCheeseAction<{ state: RoomStateDTO; playerToken: string }>(
					`/api/cheese-thief/rooms/${code}/join`,
					{ name, playerToken: existingToken },
				);
				storePlayerToken(code, data.playerToken);
				tokenRef.current = data.playerToken;
				onTokenReceived?.(data.playerToken);
				setState(data.state);
				setFetchedAt(Date.now());
				return data;
			}),
		settings: (input: UpdateSettingsInput) =>
			action(() =>
				patchCheeseAction<RoomStateDTO>(`/api/cheese-thief/rooms/${code}/settings`, {
					token: tokenRef.current,
					...input,
				}),
			),
		start: () =>
			action(() => postCheeseAction<RoomStateDTO>(`/api/cheese-thief/rooms/${code}/start`, { token: tokenRef.current })),
		memorized: (chosenHour?: number) =>
			action(() =>
				postCheeseAction<RoomStateDTO>(`/api/cheese-thief/rooms/${code}/memorized`, {
					token: tokenRef.current,
					...(chosenHour !== undefined ? { chosenHour } : {}),
				}),
			),
		beginNight: () =>
			action(() =>
				postCheeseAction<RoomStateDTO>(`/api/cheese-thief/rooms/${code}/begin-night`, { token: tokenRef.current }),
			),
		secret: (picks: string[]) =>
			action(() =>
				postCheeseAction<RoomStateDTO>(`/api/cheese-thief/rooms/${code}/secret`, {
					token: tokenRef.current,
					picks,
				}),
			),
		/** Saves the selection as it stands, so running out of time keeps the first slots. */
		secretDraft: (picks: string[]) =>
			postCheeseAction<RoomStateDTO>(`/api/cheese-thief/rooms/${code}/secret`, {
				token: tokenRef.current,
				picks,
				draft: true,
			}),
		seen: () =>
			action(() => postCheeseAction<RoomStateDTO>(`/api/cheese-thief/rooms/${code}/seen`, { token: tokenRef.current })),
		startVote: () =>
			action(() =>
				postCheeseAction<RoomStateDTO>(`/api/cheese-thief/rooms/${code}/start-vote`, { token: tokenRef.current }),
			),
		vote: (targetId: string) =>
			action(() =>
				postCheeseAction<RoomStateDTO>(`/api/cheese-thief/rooms/${code}/vote`, {
					token: tokenRef.current,
					targetId,
				}),
			),
		cheese: (present: boolean) =>
			action(() =>
				postCheeseAction<RoomStateDTO>(`/api/cheese-thief/rooms/${code}/cheese`, {
					token: tokenRef.current,
					present,
				}),
			),
		revote: () =>
			action(() => postCheeseAction<RoomStateDTO>(`/api/cheese-thief/rooms/${code}/revote`, { token: tokenRef.current })),
		playAgain: () =>
			action(() =>
				postCheeseAction<RoomStateDTO>(`/api/cheese-thief/rooms/${code}/play-again`, { token: tokenRef.current }),
			),
		kick: (targetId: string) =>
			action(() =>
				postCheeseAction<RoomStateDTO>(`/api/cheese-thief/rooms/${code}/kick`, {
					token: tokenRef.current,
					targetId,
				}),
			),
		leave: () =>
			postCheeseAction<{ roomClosed: boolean }>(`/api/cheese-thief/rooms/${code}/leave`, {
				token: tokenRef.current,
			}),
	};

	return { state, error, loading, fetchedAt, refresh, api };
}
