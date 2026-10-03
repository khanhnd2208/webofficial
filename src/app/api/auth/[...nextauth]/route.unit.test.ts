import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const authPost = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth', () => ({ GET: vi.fn(), POST: authPost }));
const destination = 'http://localhost:3100/dang-nhap?from=%2Fkhoa-hoc&chon=1';
function request(callbackUrl = destination) {
	return new NextRequest('http://localhost:3100/api/auth/signout', {
		method: 'POST',
		body: new URLSearchParams({ csrfToken: 'test', callbackUrl }),
	});
}
beforeEach(() => {
	authPost.mockReset();
});

describe('native sign-out redirect', () => {
	it('keeps the local origin and account-switch destination, preserving cookie deletion', async () => {
		authPost.mockResolvedValue(
			new Response(null, {
				status: 302,
				headers: {
					location: 'https://toiladuykhanh.com/',
					'set-cookie': 'authjs.session-token=; Max-Age=0; Path=/',
				},
			}),
		);
		const response = await POST(request());
		expect(response.headers.get('location')).toBe(destination);
		expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
	});
	it('keeps CSRF failures intact', async () => {
		authPost.mockResolvedValue(
			new Response(null, { status: 302, headers: { location: '/dang-nhap?error=MissingCSRF' } }),
		);
		expect((await POST(request())).headers.get('location')).toBe('/dang-nhap?error=MissingCSRF');
	});
	it('does not introduce an external redirect', async () => {
		authPost.mockResolvedValue(new Response(null, { status: 302, headers: { location: '/' } }));
		expect((await POST(request('https://evil.example/dang-nhap'))).headers.get('location')).toBe(
			'/',
		);
	});
});
