"use client";
/* ════════════════════════════════════════════════════════════════════════
   usePracticeSession.ts — Practice session lifecycle manager
   
   Polls for content updates from Admin while a session is active.
   Does NOT force-refresh during practice. Defers update UI until after
   the session ends, then shows a gentle toast notification.
   ════════════════════════════════════════════════════════════════════════ */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { VocabSetDTO } from '@/types/vocab';

interface UsePracticeSessionOptions {
setId: string;
initialSet: VocabSetDTO;
/** Polling interval in ms (default: 30s) */
pollInterval?: number;
/** Callback to show a toast notification */
onUpdateAvailable?: () => void;
}

export function usePracticeSession({
	setId,
	initialSet,
	pollInterval = 30_000,
	onUpdateAvailable,
}: UsePracticeSessionOptions) {
	const [currentSet, setCurrentSet] = useState<VocabSetDTO>(initialSet);
	const [isSessionActive, setIsSessionActive] = useState(false);
	const [hasPendingUpdate, setHasPendingUpdate] = useState(false);
	const pendingSetRef = useRef<VocabSetDTO | null>(null);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const pollForUpdates = useCallback(async () => {
		try {
			const res = await fetch(`/api/vocab-sets/${setId}`);
			if (!res.ok) return;
			const data = await res.json() as { data?: { set?: VocabSetDTO } };
			const updated = data?.data?.set;
			if (!updated) return;

			// Check if data actually changed (compare updatedAt)
			if (updated.updatedAt !== currentSet.updatedAt) {
				if (isSessionActive) {
					// Don't disrupt the session — queue the update
pendingSetRef.current = updated;
					setHasPendingUpdate(true);
				} else {
					setCurrentSet(updated);
				}
			}
		} catch {
			// Network error — ignore silently during practice
		}
	}, [setId, currentSet.updatedAt, isSessionActive]);

	useEffect(() => {
		intervalRef.current = setInterval(pollForUpdates, pollInterval);
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [pollForUpdates, pollInterval]);

	const startSession = useCallback(() => {
		setIsSessionActive(true);
	}, []);

	const endSession = useCallback(() => {
		setIsSessionActive(false);
		// Apply any pending update after session ends
		if (hasPendingUpdate && pendingSetRef.current) {
			setCurrentSet(pendingSetRef.current);
			pendingSetRef.current = null;
			setHasPendingUpdate(false);
			onUpdateAvailable?.();
		}
	}, [hasPendingUpdate, onUpdateAvailable]);

	return {
		currentSet,
		isSessionActive,
		hasPendingUpdate,
		startSession,
		endSession,
	};
}
