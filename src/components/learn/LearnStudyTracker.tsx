'use client';

import { useEffect, useRef } from 'react';

type State = { sessionId: string; sequence: number; touchedAt: number };
type Chunk = {
	sequence: number;
	seconds: number;
	sectionId: string | null;
	active: boolean;
	releaseLease: boolean;
};
const HEARTBEAT_MS = 60_000;
const IDLE_MS = 5 * 60_000;
const SESSION_GAP_MS = 30 * 60_000;

function readState(key: string): State {
	try {
		const parsed = JSON.parse(sessionStorage.getItem(key) ?? 'null') as State | null;
		if (
			parsed &&
			/^[\da-f-]{36}$/i.test(parsed.sessionId) &&
			Number.isSafeInteger(parsed.sequence) &&
			Date.now() - parsed.touchedAt < SESSION_GAP_MS
		)
			return parsed;
	} catch {
		/* Storage may be disabled. */
	}
	return { sessionId: crypto.randomUUID(), sequence: -1, touchedAt: Date.now() };
}

export default function LearnStudyTracker({
	courseSlug,
	sectionId,
	userId,
}: {
	courseSlug: string;
	sectionId: string | null;
	userId: string;
}) {
	const changeSection = useRef<((section: string | null) => void) | null>(null);
	const initialSection = useRef(sectionId);
	useEffect(() => {
		const key = 'learn-study:' + userId + ':' + courseSlug;
		const state = readState(key);
		// A duplicated tab copies sessionStorage, but must never share timer ownership.
		const clientId = crypto.randomUUID();
		let section = initialSection.current;
		let disposed = false;
		let ready = false;
		let leaseGranted = false;
		let beginning = false;
		let sending = false;
		let disabled = false;
		let lastTick = performance.now();
		let lastInteraction = Date.now();
		let lastBeginAt = 0;
		let lastFlushAt = Date.now();
		let seconds = 0;
		const queue: Chunk[] = [];
		const visible = () => document.visibilityState === 'visible' && document.hasFocus();
		const active = () => visible() && Date.now() - lastInteraction < IDLE_MS;
		const save = () => {
			try {
				sessionStorage.setItem(key, JSON.stringify(state));
			} catch {
				/* Best effort. */
			}
		};
		const sample = () => {
			const now = performance.now();
			if (leaseGranted && active() && section)
				seconds += Math.max(0, Math.min(2, (now - lastTick) / 1000));
			lastTick = now;
		};
		const drain = async () => {
			if (sending || beginning || !ready || !queue.length || disabled) return;
			sending = true;
			try {
				while (queue.length) {
					const chunk = queue[0];
					const response = await fetch('/api/learn/study/heartbeat', {
						method: 'POST',
						credentials: 'same-origin',
						keepalive: true,
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify({ ...chunk, sessionId: state.sessionId, clientId }),
					});
					if (response.status === 401 || response.status === 403) disabled = true;
					if (response.status === 409) ready = false;
					if (!response.ok) {
						if (response.status >= 400 && response.status < 500) {
							queue.length = 0;
							seconds = 0;
							leaseGranted = false;
						}
						return;
					}
					const envelope = (await response.json()) as { data?: { accepted: boolean } };
					queue.shift();
					if (!envelope.data?.accepted) {
						leaseGranted = false;
						seconds = 0;
						queue.length = 0;
						return;
					}
				}
			} catch {
				/* Retry the exact same sequence after a lost response. */
			} finally {
				sending = false;
			}
		};
		const flush = (releaseLease = false) => {
			sample();
			if (ready && leaseGranted) {
				// Capture the section before navigation, even with a request in flight.
				queue.push({
					sequence: ++state.sequence,
					seconds: Math.min(75, Math.floor(seconds)),
					sectionId: section,
					active: active(),
					releaseLease,
				});
				seconds = 0;
				state.touchedAt = Date.now();
				save();
			}
			if (releaseLease) leaseGranted = false;
			lastFlushAt = Date.now();
			void drain();
		};
		const begin = async (initial = false) => {
			if (disposed || disabled || beginning || sending || queue.length || (!initial && !active()))
				return;
			beginning = true;
			lastBeginAt = Date.now();
			try {
				const response = await fetch('/api/learn/study/begin', {
					method: 'POST',
					credentials: 'same-origin',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						sessionId: state.sessionId,
						courseSlug,
						clientId,
						claimLease: active(),
					}),
				});
				if (response.status === 401 || response.status === 403) disabled = true;
				if (!response.ok) return;
				const { data } = (await response.json()) as {
					data: { sessionId: string; leaseGranted: boolean; lastSequence: number };
				};
				state.sessionId = data.sessionId;
				state.sequence = Math.max(state.sequence, data.lastSequence);
				state.touchedAt = Date.now();
				save();
				ready = true;
				leaseGranted = data.leaseGranted;
				lastTick = performance.now();
			} catch {
				/* Analytics must not interrupt the lesson. */
			} finally {
				beginning = false;
				if (leaseGranted && (disposed || !active())) flush(true);
			}
		};
		const interact = () => {
			lastInteraction = Date.now();
			if (!leaseGranted && Date.now() - lastBeginAt >= 5_000) void begin();
		};
		const pause = () => flush(true);
		const resume = () => {
			lastInteraction = Date.now();
			lastTick = performance.now();
			if (!leaseGranted) void begin();
		};
		const visibility = () => (document.visibilityState === 'hidden' ? pause() : resume());
		changeSection.current = (next) => {
			if (section !== next) {
				flush();
				section = next;
				lastInteraction = Date.now();
			}
		};
		void begin(true);
		const interval = window.setInterval(() => {
			sample();
			if (leaseGranted && !active()) flush(true);
			else if (leaseGranted && Date.now() - lastFlushAt >= HEARTBEAT_MS) flush();
			if (queue.length && Date.now() - lastFlushAt >= HEARTBEAT_MS) {
				lastFlushAt = Date.now();
				void drain();
			}
			if (!leaseGranted && active() && Date.now() - lastBeginAt >= 5_000) void begin();
		}, 1000);
		window.addEventListener('pointerdown', interact, { passive: true });
		window.addEventListener('keydown', interact);
		// Reader panes scroll independently: capture their scroll events too.
		window.addEventListener('scroll', interact, { passive: true, capture: true });
		document.addEventListener('visibilitychange', visibility);
		window.addEventListener('pagehide', pause);
		window.addEventListener('blur', pause);
		window.addEventListener('focus', resume);
		window.addEventListener('pageshow', resume);
		return () => {
			flush(true);
			disposed = true;
			changeSection.current = null;
			window.clearInterval(interval);
			window.removeEventListener('pointerdown', interact);
			window.removeEventListener('keydown', interact);
			window.removeEventListener('scroll', interact, true);
			document.removeEventListener('visibilitychange', visibility);
			window.removeEventListener('pagehide', pause);
			window.removeEventListener('blur', pause);
			window.removeEventListener('focus', resume);
			window.removeEventListener('pageshow', resume);
		};
	}, [courseSlug, userId]);

	useEffect(() => {
		changeSection.current?.(sectionId);
	}, [sectionId, courseSlug, userId]);
	return null;
}
