import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRecallTracker } from './recallTracker';
import type { RecallHeartbeatInput } from '@/features/active-recall/analytics/contracts';

describe('anonymous Recall browser tracker', () => {
	const sessionId = '10000000-0000-4000-8000-000000000000';
	const clientId = '20000000-0000-4000-8000-000000000000';
	const visitId = '30000000-0000-4000-8000-000000000000';
	let tracker: ReturnType<typeof createRecallTracker>;
	let focused: boolean;
	let visible: boolean;
	let calls: { path: string; body: Record<string, unknown> }[];
	let failHeartbeat: boolean;
	let excluded: boolean;
	let grant: boolean;
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-10-03T10:00:00Z'));
		focused = true;
		visible = true;
		calls = [];
		failHeartbeat = false;
		excluded = false;
		grant = true;
		vi.spyOn(document, 'hasFocus').mockImplementation(() => focused);
		vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() =>
			visible ? 'visible' : 'hidden',
		);
		vi.stubGlobal(
			'fetch',
			vi.fn(async (path: string, options: RequestInit) => {
				const body = JSON.parse(String(options.body));
				calls.push({ path, body });
				if (path.endsWith('/begin'))
					return {
						ok: true,
						status: 200,
						json: async () => ({
							data: excluded
								? { excluded: true }
								: { sessionId, visitId: body.visitId, lastSequence: -1, leaseGranted: grant },
						}),
					};
				if (failHeartbeat) throw new Error('offline');
				return {
					ok: true,
					status: 200,
					json: async () => ({
						data: {
							accepted: true,
							lastSequence: body.sequence,
							leaseGranted: grant && body.active && !body.releaseLease,
						},
					}),
				};
			}),
		);
	});
	afterEach(() => {
		tracker?.stop();
		vi.useRealTimers();
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});
	async function start() {
		tracker = createRecallTracker('deck', 'class-link', clientId, visitId);
		await vi.advanceTimersByTimeAsync(0);
	}
	function beats() {
		return calls
			.filter((x) => x.path.endsWith('/heartbeat'))
			.map((x) => x.body as unknown as RecallHeartbeatInput);
	}
	it('opens with class context and never counts passive viewing as study', async () => {
		await start();
		await vi.advanceTimersByTimeAsync(60_000);
		expect(calls[0].body).toMatchObject({ deckId: 'deck', classSlug: 'class-link', visitId });
		expect(beats().every((x) => x.seconds === 0 && x.interactions === 0)).toBe(true);
	});
	it('sends initial engagement immediately before counting active time', async () => {
		await start();
		tracker.study(true);
		await vi.advanceTimersByTimeAsync(0);
		expect(beats()[0]).toMatchObject({
			sequence: 0,
			seconds: 0,
			interactions: 1,
			answerReveals: 1,
		});
		await vi.advanceTimersByTimeAsync(60_000);
		expect(beats().reduce((n, x) => n + x.seconds, 0)).toBe(60);
	});
	it('keeps batches of study actions separate across Vietnam midnight', async () => {
		vi.setSystemTime(new Date('2026-10-02T16:59:40Z'));
		await start();
		tracker.study();
		await vi.advanceTimersByTimeAsync(0);
		tracker.study(true);
		await vi.advanceTimersByTimeAsync(30_000);
		tracker.study();
		await vi.advanceTimersByTimeAsync(30_000);
		expect(
			beats()
				.filter((row) => row.interactions)
				.map((row) => row.interactionDay),
		).toEqual(['2026-10-02', '2026-10-02', '2026-10-03']);
	});
	it('pauses on blur, releases timer ownership and resumes on focus', async () => {
		await start();
		tracker.study();
		await vi.advanceTimersByTimeAsync(0);
		await vi.advanceTimersByTimeAsync(20_000);
		focused = false;
		window.dispatchEvent(new Event('blur'));
		await vi.advanceTimersByTimeAsync(0);
		expect(beats().at(-1)).toMatchObject({ seconds: 20, releaseLease: true, active: false });
		await vi.advanceTimersByTimeAsync(40_000);
		expect(beats().reduce((n, x) => n + x.seconds, 0)).toBe(20);
		focused = true;
		window.dispatchEvent(new Event('focus'));
		await vi.advanceTimersByTimeAsync(0);
		window.dispatchEvent(new Event('pointerdown'));
		await vi.advanceTimersByTimeAsync(60_000);
		expect(beats().reduce((n, x) => n + x.seconds, 0)).toBe(80);
	});
	it('pauses hidden documents and resumes without touching browser storage', async () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('blocked');
		});
		await start();
		tracker.study();
		await vi.advanceTimersByTimeAsync(0);
		await vi.advanceTimersByTimeAsync(10_000);
		visible = false;
		document.dispatchEvent(new Event('visibilitychange'));
		await vi.advanceTimersByTimeAsync(70_000);
		expect(beats().reduce((n, x) => n + x.seconds, 0)).toBe(10);
	});
	it('stops after five minutes without input and does not create idle sessions', async () => {
		await start();
		tracker.study();
		await vi.advanceTimersByTimeAsync(0);
		await vi.advanceTimersByTimeAsync(6 * 60_000);
		const count = calls.filter((x) => x.path.endsWith('/begin')).length;
		const time = beats().reduce((n, x) => n + x.seconds, 0);
		expect(time).toBeGreaterThan(290);
		expect(time).toBeLessThanOrEqual(300);
		await vi.advanceTimersByTimeAsync(30 * 60_000);
		expect(calls.filter((x) => x.path.endsWith('/begin'))).toHaveLength(count);
		expect(beats().reduce((n, x) => n + x.seconds, 0)).toBe(time);
	});
	it('retries exactly the same sequence after a network failure', async () => {
		await start();
		failHeartbeat = true;
		tracker.study(true);
		await vi.advanceTimersByTimeAsync(0);
		failHeartbeat = false;
		await vi.advanceTimersByTimeAsync(60_000);
		expect(beats()[1]).toEqual(beats()[0]);
		expect(beats().at(-1)?.sequence).toBe(1);
	});
	it('does not collect when the server excludes the administrator', async () => {
		excluded = true;
		await start();
		tracker.study(true);
		await vi.advanceTimersByTimeAsync(120_000);
		tracker.stop();
		expect(beats()).toHaveLength(0);
	});
	it('cannot accumulate time while another tab owns the lease', async () => {
		grant = false;
		await start();
		tracker.study(true);
		await vi.advanceTimersByTimeAsync(60_000);
		expect(beats().every((x) => x.seconds === 0)).toBe(true);
	});
	it('cleans up timers and sends the final batch on unmount', async () => {
		await start();
		tracker.study();
		await vi.advanceTimersByTimeAsync(0);
		await vi.advanceTimersByTimeAsync(15_000);
		tracker.stop();
		await vi.advanceTimersByTimeAsync(0);
		expect(beats().at(-1)).toMatchObject({ seconds: 15, releaseLease: true });
		const count = calls.length;
		await vi.advanceTimersByTimeAsync(120_000);
		expect(calls).toHaveLength(count);
	});
	it('sends an action queued while focus is reacquiring timer ownership', async () => {
		await start();
		focused = false;
		window.dispatchEvent(new Event('blur'));
		await vi.advanceTimersByTimeAsync(0);
		const original = globalThis.fetch;
		let resolveBegin: ((value: unknown) => void) | undefined;
		vi.stubGlobal(
			'fetch',
			vi.fn((path: string, options: RequestInit) => {
				if (path.endsWith('/begin'))
					return new Promise((resolve) => {
						resolveBegin = resolve;
					});
				return original(path, options);
			}),
		);
		focused = true;
		window.dispatchEvent(new Event('focus'));
		tracker.study(false);
		resolveBegin!({
			ok: true,
			status: 200,
			json: async () => ({ data: { sessionId, visitId, lastSequence: -1, leaseGranted: true } }),
		});
		await vi.advanceTimersByTimeAsync(0);
		expect(beats().at(-1)).toMatchObject({ interactions: 1, answerReveals: 0 });
	});
});
