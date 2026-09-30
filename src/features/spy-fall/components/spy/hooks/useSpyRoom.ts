'use client';
import { useTestRoom } from '@/features/board-game-test/context';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useLocale, useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import { SPY_POLL_INTERVAL_MS } from '@/features/spy-fall/config/spyGame';
import { fetchRoomState, patchSpyAction, postSpyAction } from '@/features/spy-fall/lib/spy/api';
import { storePlayerToken } from '@/features/board-game-shared/lib/clientToken';
import type {
	PhaseCursor,
	RoomStateDTO,
	UpdateSettingsInput,
} from '@/features/spy-fall/types/spyGame';
import {
	readAdminTestRoom,
	sendAdminTestCommand,
	TEST_VIEWER_TOKEN,
} from '@/features/board-game-test/clientApi';

interface UseSpyRoomOptions {
	code: string;
	playerToken: string | null;
	adminTest?: boolean;
	onTokenReceived?: (token: string) => void;
}

export function useSpyRoom({
	code,
	playerToken,
	onTokenReceived,
	adminTest = false,
}: UseSpyRoomOptions) {
	const testRoom = useTestRoom();
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
		if (adminTest) {
			setLoading(false);
			return;
		}
		const requestToken = tokenRef.current;
		try {
			const data = adminTest
				? ((await readAdminTestRoom('spy-fall', code)).state as RoomStateDTO)
				: await fetchRoomState(code, requestToken);
			// A poll sent before join (or before the stored token loaded) describes a different viewer.
			if (requestToken !== tokenRef.current) return;
			setState((prev) => (prev && data.version < prev.version ? prev : data));
			setError(null);
		} catch (e) {
			if (requestToken !== tokenRef.current) return;
			setError(e instanceof Error ? e.message : t('common.connectionLost'));
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
		}, SPY_POLL_INTERVAL_MS);

		const onVisible = () => void refresh();
		document.addEventListener('visibilitychange', onVisible);
		return () => {
			clearInterval(interval);
			document.removeEventListener('visibilitychange', onVisible);
		};
	}, [refresh, scheduleRefresh]);

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
		async <T>(fn: () => Promise<T>): Promise<T> => {
			const result = await fn();
			await refresh();
			return result;
		},
		[refresh],
	);

	const api = {
		join: (name: string, existingToken?: string) =>
			action(async () => {
				if (adminTest)
					return {
						state: (await readAdminTestRoom('spy-fall', code)).state as RoomStateDTO,
						playerToken: TEST_VIEWER_TOKEN,
					};
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
				adminTest
					? (sendAdminTestCommand('spy-fall', code, {
							kind: 'start',
							locale: localeRef.current,
						}) as Promise<RoomStateDTO>)
					: postSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/start`, {
							token: tokenRef.current,
							locale: localeRef.current,
						}),
			),
		memorized: () =>
			action(() =>
				adminTest
					? (sendAdminTestCommand('spy-fall', code, { kind: 'remember' }) as Promise<RoomStateDTO>)
					: postSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/memorized`, {
							token: tokenRef.current,
						}),
			),
		vote: (targetId: string | null) =>
			action(() =>
				adminTest
					? (sendAdminTestCommand('spy-fall', code, {
							kind: 'vote',
							playerId: 'controlled',
							targetId: targetId ?? '',
						}) as Promise<RoomStateDTO>)
					: postSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/vote`, {
							token: tokenRef.current,
							targetId,
						}),
			),
		settings: (input: UpdateSettingsInput) =>
			action(() =>
				adminTest
					? (sendAdminTestCommand('spy-fall', code, {
							kind: 'settings',
							settings: input,
						}) as Promise<RoomStateDTO>)
					: patchSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/settings`, {
							token: tokenRef.current,
							...input,
						}),
			),
		next: (from: PhaseCursor) =>
			action(async () => {
				if (adminTest)
					return sendAdminTestCommand('spy-fall', code, { kind: 'next' }) as Promise<RoomStateDTO>;
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
				adminTest
					? (sendAdminTestCommand('spy-fall', code, {
							kind: 'reset',
							sameSeed: false,
						}) as Promise<RoomStateDTO>)
					: postSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/play-again`, {
							token: tokenRef.current,
						}),
			),
		restart: () =>
			action(() =>
				adminTest
					? (sendAdminTestCommand('spy-fall', code, {
							kind: 'reset',
							sameSeed: true,
						}) as Promise<RoomStateDTO>)
					: postSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/restart`, {
							token: tokenRef.current,
						}),
			),
		rename: (name: string) =>
			action(() =>
				adminTest
					? (sendAdminTestCommand('spy-fall', code, {
							kind: 'rename',
							name,
						}) as Promise<RoomStateDTO>)
					: patchSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/rename`, {
							token: tokenRef.current,
							name,
						}),
			),
		kick: (targetId: string) =>
			action(() =>
				adminTest
					? (sendAdminTestCommand('spy-fall', code, {
							kind: 'kick',
							playerId: targetId,
						}) as Promise<RoomStateDTO>)
					: postSpyAction<RoomStateDTO>(`/api/spy/rooms/${code}/kick`, {
							token: tokenRef.current,
							targetId,
						}),
			),
		leave: () =>
			adminTest
				? Promise.resolve({ roomClosed: false })
				: postSpyAction<{ roomClosed: boolean }>(`/api/spy/rooms/${code}/leave`, {
						token: tokenRef.current,
					}),
	};

	return {
		state: testRoom ? (testRoom.state as RoomStateDTO) : state,
		error,
		loading: testRoom ? false : loading,
		refresh,
		api,
	};
}
