'use client';
import { useCallback, useEffect, useRef } from 'react';
import { createRecallTracker } from './recallTracker';

export function useRecallStudy(deckId: string, classSlug?: string) {
	const tracker = useRef<ReturnType<typeof createRecallTracker> | null>(null);
	const pending = useRef<boolean[]>([]);
	useEffect(() => {
		let instance: ReturnType<typeof createRecallTracker> | null = null;
		// Cancel React StrictMode's discarded mount before it creates a guest cookie.
		const timer = window.setTimeout(() => {
			try {
				instance = createRecallTracker(deckId, classSlug, crypto.randomUUID(), crypto.randomUUID());
				tracker.current = instance;
				pending.current.splice(0).forEach((reveal) => instance?.study(reveal));
			} catch {
				/* Browsers without required APIs still support studying. */
			}
		}, 0);
		return () => {
			window.clearTimeout(timer);
			tracker.current = null;
			pending.current = [];
			instance?.stop();
		};
	}, [deckId, classSlug]);
	return useCallback((answerReveal = false) => {
		if (tracker.current) tracker.current.study(answerReveal);
		else if (pending.current.length < 120) pending.current.push(answerReveal);
	}, []);
}
