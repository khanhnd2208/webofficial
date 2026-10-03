import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as beginRoute } from './begin/route';
import { POST as heartbeatRoute } from './heartbeat/route';
import { GET as reportRoute } from '@/app/api/admin/active-recall/analytics/route';

const context = { params: Promise.resolve({}) };
const begin = (request: NextRequest) => beginRoute(request, context);
const heartbeat = (request: NextRequest) => heartbeatRoute(request, context);
const report = (request: NextRequest) => reportRoute(request, context);

const mocks = vi.hoisted(() => ({
	user: vi.fn(),
	jar: { get: vi.fn(), set: vi.fn() },
	limiter: vi.fn(),
	begin: vi.fn(),
	beat: vi.fn(),
	report: vi.fn(),
	hash: vi.fn(),
}));
vi.mock('next/headers', () => ({ cookies: async () => mocks.jar }));
vi.mock('@/lib/apiAuth', () => ({ getApiUser: mocks.user }));
vi.mock('@/lib/inquiryRateLimit', () => ({ assertScopedRateLimit: mocks.limiter }));
vi.mock('@/features/active-recall/analytics/collection', () => ({
	beginRecallStudy: mocks.begin,
	heartbeatRecallStudy: mocks.beat,
	recallVisitorHash: mocks.hash,
}));
vi.mock('@/features/active-recall/analytics/report', () => ({ getRecallReport: mocks.report }));
const input = { deckId: 'deck', visitId: randomUUID(), clientId: randomUUID(), claimLease: true };
function request(path: string, body: unknown, origin = 'http://localhost:3000') {
	return new NextRequest(`http://localhost:3000/api/active-recall/study/${path}`, {
		method: 'POST',
		headers: { origin, 'content-type': 'application/json' },
		body: JSON.stringify(body),
	});
}
beforeEach(() => {
	vi.clearAllMocks();
	mocks.user.mockResolvedValue(null);
	mocks.jar.get.mockReturnValue(undefined);
	mocks.hash.mockReturnValue('hashed-cookie');
	mocks.begin.mockResolvedValue({
		sessionId: randomUUID(),
		visitId: input.visitId,
		lastSequence: -1,
		leaseGranted: true,
	});
	mocks.beat.mockResolvedValue({ accepted: true, leaseGranted: true, lastSequence: 0 });
	mocks.report.mockResolvedValue({});
});
describe('Recall telemetry route boundaries', () => {
	it('creates a first-party HttpOnly cookie for anonymous study and hashes ownership', async () => {
		const r = await begin(request('begin', input));
		expect(r.status).toBe(200);
		expect(mocks.jar.set).toHaveBeenCalledWith(
			'recall_visitor',
			expect.any(String),
			expect.objectContaining({ httpOnly: true, sameSite: 'lax', maxAge: 31536000, path: '/' }),
		);
		expect(mocks.begin).toHaveBeenCalledWith('hashed-cookie', input);
		expect(r.headers.get('cache-control')).toBe('no-store');
	});
	it('reuses the browser cookie and excludes administrators without writing analytics', async () => {
		mocks.jar.get.mockReturnValue({ value: randomUUID() });
		await begin(request('begin', input));
		expect(mocks.jar.set).not.toHaveBeenCalled();
		mocks.user.mockResolvedValue({ id: 'admin', role: 'admin' });
		mocks.begin.mockClear();
		const r = await begin(request('begin', input));
		expect((await r.json()).data).toEqual({ excluded: true });
		expect(mocks.begin).not.toHaveBeenCalled();
	});
	it('rejects cross-origin, malformed and oversized writes before persistence', async () => {
		expect((await begin(request('begin', input, 'https://foreign.example'))).status).toBe(403);
		expect((await begin(request('begin', { ...input, deckId: '' }))).status).toBe(400);
		expect((await begin(request('begin', { ...input, padding: 'x'.repeat(5000) }))).status).toBe(
			413,
		);
		expect(mocks.begin).not.toHaveBeenCalled();
	});
	it('cannot submit time without a valid ownership cookie', async () => {
		const data = {
			sessionId: randomUUID(),
			visitId: input.visitId,
			clientId: input.clientId,
			sequence: 0,
			seconds: 0,
			interactions: 1,
			answerReveals: 1,
			activityAgeSeconds: 0,
			active: true,
			releaseLease: false,
		};
		expect((await heartbeat(request('heartbeat', data))).status).toBe(403);
		mocks.jar.get.mockReturnValue({ value: randomUUID() });
		expect((await heartbeat(request('heartbeat', data))).status).toBe(200);
		expect(mocks.beat).toHaveBeenCalledWith('hashed-cookie', data);
		expect((await heartbeat(request('heartbeat', { ...data, seconds: 76 }))).status).toBe(400);
		expect((await heartbeat(request('heartbeat', { ...data, answerReveals: 2 }))).status).toBe(400);
	});
	it('requires admin authorization for reports and validates date ranges', async () => {
		const req = () => new NextRequest('http://localhost:3000/api/admin/active-recall/analytics');
		expect((await report(req())).status).toBe(401);
		mocks.user.mockResolvedValue({ role: 'student' });
		expect((await report(req())).status).toBe(403);
		mocks.user.mockResolvedValue({ role: 'admin' });
		expect((await report(req())).status).toBe(200);
		expect(
			(
				await report(
					new NextRequest('http://localhost:3000/api/admin/active-recall/analytics?start=invalid'),
				)
			).status,
		).toBe(400);
	});
});
