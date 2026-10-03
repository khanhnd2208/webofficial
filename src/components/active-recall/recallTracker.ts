import {
	RECALL_HEARTBEAT_MS,
	RECALL_IDLE_MS,
	type RecallBeginResult,
	type RecallHeartbeatInput,
	type RecallHeartbeatResult,
} from '@/features/active-recall/analytics/contracts';

/** Best-effort telemetry. No offline event log or learning contents leave the player. */
export function createRecallTracker(
	deckId: string,
	classSlug: string | undefined,
	clientId: string,
	initialVisitId: string,
) {
	let visitId = initialVisitId;
	let sessionId = '';
	let sequence = -1;
	let owns = false;
	let stopped = false;
	let excluded = false;
	let beginning = false;
	let restartBegin = false;
	let sending = false;
	let engaged = false;
	let lastActivity = 0;
	let lastTick = performance.now();
	let seconds = 0;
	let interactions = 0;
	let reveals = 0;
	let startBarrier = false;
	const queue: RecallHeartbeatInput[] = [];
	const visible = () => document.visibilityState === 'visible' && document.hasFocus();
	const active = () => visible() && engaged && Date.now() - lastActivity < RECALL_IDLE_MS;
	const sample = () => {
		const now = performance.now();
		if (owns && active() && !startBarrier)
			seconds += Math.max(0, Math.min(2, (now - lastTick) / 1000));
		lastTick = now;
	};
	async function post(path: string, data: unknown) {
		return fetch('/api/active-recall/study/' + path, {
			method: 'POST',
			credentials: 'same-origin',
			keepalive: true,
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(data),
		});
	}
	async function begin() {
		if (beginning || excluded || stopped) return;
		beginning = true;
		try {
			const response = await post('begin', {
				deckId,
				classSlug,
				clientId,
				visitId,
				claimLease: visible(),
			});
			if (response.status === 409) {
				restartBegin = true;
				visitId = crypto.randomUUID();
				sessionId = '';
				sequence = -1;
				queue.length = 0;
				seconds = 0;
				engaged = interactions > 0;
				startBarrier = engaged;
				owns = false;
				return;
			}
			if (!response.ok) return;
			const body = (await response.json()) as { data: RecallBeginResult & { excluded?: boolean } };
			if (body.data.excluded) {
				excluded = true;
				owns = false;
				return;
			}
			sessionId = body.data.sessionId;
			sequence = Math.max(sequence, body.data.lastSequence);
			owns = body.data.leaseGranted;
			lastTick = performance.now();
		} catch {
			/* Collection must never block study. */
		} finally {
			beginning = false;
			if (sessionId && (stopped || interactions)) flush(stopped);
			if (sessionId && queue.length) void drain();
			if (restartBegin) {
				restartBegin = false;
				if (!stopped) void begin();
			}
		}
	}
	async function drain() {
		if (sending || beginning || !sessionId || excluded || !queue.length) return;
		sending = true;
		try {
			while (queue.length) {
				const chunk = queue[0];
				const response = await post('heartbeat', chunk);
				if (response.status === 409) {
					// Drop stale timing, retain the latest qualifying action for the fresh session.
					interactions = Math.min(
						120,
						interactions + queue.reduce((sum, row) => sum + row.interactions, 0),
					);
					reveals = Math.min(
						interactions,
						reveals + queue.reduce((sum, row) => sum + row.answerReveals, 0),
					);
					queue.length = 0;
					visitId = crypto.randomUUID();
					sessionId = '';
					sequence = -1;
					seconds = 0;
					owns = false;
					engaged = interactions > 0;
					startBarrier = engaged;
					break;
				}
				if (!response.ok) {
					if (response.status === 403 || response.status === 404) {
						excluded = true;
						queue.length = 0;
						owns = false;
					}
					break;
				}
				const body = (await response.json()) as {
					data: RecallHeartbeatResult & { excluded?: boolean };
				};
				queue.shift();
				if (body.data.excluded) {
					excluded = true;
					owns = false;
					queue.length = 0;
					break;
				}
				owns = body.data.leaseGranted;
				if (chunk.interactions) startBarrier = false;
			}
		} catch {
			/* The same sequence is retried on the next flush. */
		} finally {
			sending = false;
			if (!sessionId && !stopped && visible()) void begin();
		}
	}
	function flush(release = false) {
		sample();
		if (excluded) return;
		if (!sessionId) {
			if (!stopped) void begin();
			return;
		}
		if (queue.length < 5) {
			const count = Math.min(75, Math.floor(seconds));
			queue.push({
				sessionId,
				visitId,
				clientId,
				sequence: ++sequence,
				seconds: count,
				interactions,
				answerReveals: reveals,
				activityAgeSeconds: Math.min(
					86_400,
					Math.max(0, Math.floor((Date.now() - lastActivity) / 1000)),
				),
				active: active() && !release,
				releaseLease: release || !active(),
			});
			seconds -= count;
			interactions = 0;
			reveals = 0;
		} else {
			// Bound memory and elapsed time during a long outage.
			seconds = Math.min(seconds, 75);
		}
		if (release) owns = false;
		void drain();
	}
	function touch() {
		sample();
		if (engaged) lastActivity = Date.now();
	}
	function stateChanged() {
		sample();
		if (!visible()) flush(true);
		else if (!excluded && (!owns || !sessionId)) void begin();
	}
	const listeners: [EventTarget, string, EventListener][] = [
		[window, 'pointerdown', touch],
		[window, 'keydown', touch],
		[window, 'scroll', touch],
		[window, 'focus', stateChanged],
		[window, 'blur', stateChanged],
		[document, 'visibilitychange', stateChanged],
		[window, 'pagehide', () => flush(true)],
	];
	listeners.forEach(([target, event, listener]) => target.addEventListener(event, listener, true));
	const tick = window.setInterval(() => {
		sample();
		if (owns && !active() && engaged) flush(true);
	}, 1000);
	const heartbeat = window.setInterval(() => {
		if (!stopped && (owns || active() || queue.length)) {
			if (!owns && active()) void begin();
			flush();
		}
	}, RECALL_HEARTBEAT_MS);
	void begin();
	return {
		study(answerReveal = false) {
			if (excluded || stopped) return;
			sample();
			if (!engaged) {
				startBarrier = true;
				seconds = 0;
			}
			engaged = true;
			lastActivity = Date.now();
			interactions = Math.min(120, interactions + 1);
			if (answerReveal) reveals = Math.min(interactions, reveals + 1);
			// Persist the first engagement before accumulating time.
			if (startBarrier || !sessionId) flush();
		},
		stop() {
			sample();
			stopped = true;
			flush(true);
			window.clearInterval(tick);
			window.clearInterval(heartbeat);
			listeners.forEach(([target, event, listener]) =>
				target.removeEventListener(event, listener, true),
			);
		},
	};
}
