import { act, fireEvent, render, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LearnStudyTracker from './LearnStudyTracker';

describe('course timer lifecycle', () => {
	let focus = true;
	let visibility = 'visible';
	const requests: Array<{ url: string; body: Record<string, unknown> }> = [];
	let holdHeartbeat: (() => Promise<Response>) | null = null;
	const ok = (data: unknown) => new Response(JSON.stringify({ ok: true, data }), { status: 200 });
	beforeEach(() => {
		vi.useFakeTimers();
		sessionStorage.clear();
		requests.length = 0;
		focus = true;
		visibility = 'visible';
		holdHeartbeat = null;
		vi.spyOn(document, 'hasFocus').mockImplementation(() => focus);
		vi.spyOn(document, 'visibilityState', 'get').mockImplementation(
			() => visibility as DocumentVisibilityState,
		);
		vi.stubGlobal(
			'fetch',
			vi.fn(async (url: string, init: RequestInit) => {
				const body = JSON.parse(String(init.body));
				requests.push({ url, body });
				if (url.endsWith('/begin'))
					return ok({ sessionId: body.sessionId, leaseGranted: body.claimLease, lastSequence: -1 });
				if (holdHeartbeat) return holdHeartbeat();
				return ok({ accepted: true });
			}),
		);
	});
	afterEach(async () => {
		await act(async () => cleanup());
		vi.useRealTimers();
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});
	const props = { userId: 'student-a', courseSlug: 'hrm', sectionId: 'hrm-section-1' };
	async function mount() {
		let view!: ReturnType<typeof render>;
		await act(async () => {
			view = render(<LearnStudyTracker {...props} />);
		});
		return view;
	}
	async function advance(ms: number) {
		await act(async () => {
			await vi.advanceTimersByTimeAsync(ms);
		});
	}
	const beats = () => requests.filter((r) => r.url.endsWith('/heartbeat')).map((r) => r.body);

	it('sends section time about once a minute and sends no study time on the overview', async () => {
		const view = await mount();
		await advance(60_000);
		expect(beats()[0]).toMatchObject({ seconds: 60, sectionId: props.sectionId });
		await act(async () => {
			view.rerender(<LearnStudyTracker {...props} sectionId={null} />);
		});
		await advance(60_000);
		expect(beats().at(-1)?.seconds).toBe(0);
	});
	it('releases on hidden and never reacquires or renews in the background', async () => {
		await mount();
		await advance(20_000);
		await act(async () => {
			visibility = 'hidden';
			focus = false;
			fireEvent(document, new Event('visibilitychange'));
		});
		expect(beats().at(-1)).toMatchObject({ seconds: 20, releaseLease: true });
		const count = requests.length;
		await advance(180_000);
		expect(requests).toHaveLength(count);
		await act(async () => {
			visibility = 'visible';
			focus = true;
			fireEvent(window, new Event('focus'));
		});
		await advance(60_000);
		expect(beats().at(-1)?.seconds).toBeLessThanOrEqual(60);
	});
	it('stops after five idle minutes and resumes on a scroll inside the reading pane', async () => {
		await mount();
		await advance(310_000);
		expect(beats().at(-1)?.releaseLease).toBe(true);
		const count = requests.length;
		await advance(60_000);
		expect(requests).toHaveLength(count);
		const pane = document.createElement('div');
		document.body.append(pane);
		await act(async () => {
			fireEvent.scroll(pane);
		});
		expect(requests.at(-1)?.url).toContain('/begin');
		pane.remove();
	});
	it('keeps old-section seconds attached to that section while a request is in flight', async () => {
		const view = await mount();
		let release!: (r: Response) => void;
		holdHeartbeat = () =>
			new Promise((resolve) => {
				release = resolve;
			});
		await advance(60_000);
		await advance(10_000);
		await act(async () => {
			view.rerender(<LearnStudyTracker {...props} sectionId="hrm-section-2" />);
		});
		holdHeartbeat = null;
		await act(async () => {
			release(ok({ accepted: true }));
		});
		expect(beats()[1]).toMatchObject({ seconds: 10, sectionId: 'hrm-section-1' });
		await advance(60_000);
		expect(beats().at(-1)?.sectionId).toBe('hrm-section-2');
	});
	it('retries a lost response using the same idempotency sequence', async () => {
		await mount();
		holdHeartbeat = async () => {
			throw new Error('offline');
		};
		await advance(60_000);
		const first = beats()[0];
		holdHeartbeat = null;
		await advance(60_000);
		expect(beats()[1]).toEqual(first);
	});
	it('uses a separate saved session after the signed-in account changes', async () => {
		const view = await mount();
		const first = requests[0].body.sessionId;
		await act(async () => {
			view.rerender(<LearnStudyTracker {...props} userId="student-b" />);
		});
		const begins = requests.filter((r) => r.url.endsWith('/begin'));
		expect(begins.at(-1)?.body.sessionId).not.toBe(first);
	});
});
