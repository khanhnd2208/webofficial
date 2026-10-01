import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { unstable_doesMiddlewareMatch } from 'next/dist/experimental/testing/server/middleware-testing-utils';

import { isArchivedPublicPath } from '@/config/moduleRegistry';
import { getLockedPublicLearningFeature } from '@/config/publicFeatureAccess';

import { config, proxy } from './proxy';

const ORIGIN = 'https://toiladuykhanh.com';

function request(pathname: string): NextRequest {
	return new NextRequest(new URL(pathname, ORIGIN));
}

function matches(pathname: string): boolean {
	return unstable_doesMiddlewareMatch({ config, url: pathname });
}

function productionFlags(tests: 'true' | 'false', knowledge: 'true' | 'false'): void {
	vi.stubEnv('NODE_ENV', 'production');
	vi.stubEnv('PUBLIC_TESTS_ENABLED', tests);
	vi.stubEnv('PUBLIC_KNOWLEDGE_ENABLED', knowledge);
}

describe('public learning proxy', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it.each([
		'/my-space/tests',
		'/my-space/tests/practice-test/play',
		'/my-space/my-class',
		'/my-space/my-class/hrm-toi-gian/unit-1',
		'/vocabulary',
		'/vocabulary/store',
	])('returns a non-cacheable, non-indexable 404 for archived page %s', async (pathname) => {
		productionFlags('true', 'true');

		expect(matches(pathname)).toBe(true);
		expect(isArchivedPublicPath(pathname)).toBe(true);
		const response = proxy(request(pathname));

		expect(response.status).toBe(404);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
		expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
		expect(await response.text()).toBe('Not Found');
	});

	it.each([
		'/api/myspace-tests',
		'/api/myspace-tests/practice-test/sessions',
		'/api/my-class/courses',
		'/api/my-class/tests/hrm/quiz/submit',
	])('returns the standard feature 404 for archived public API %s', async (pathname) => {
		productionFlags('true', 'true');

		expect(matches(pathname)).toBe(true);
		const response = proxy(request(pathname));

		expect(response.status).toBe(404);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
		expect(response.headers.get('content-type')).toContain('application/json');
		expect(await response.json()).toEqual({
			ok: false,
			error: 'Not found',
			code: 'FEATURE_NOT_AVAILABLE',
		});
	});

	it.each([
		'/api/admin/my-class/courses',
		'/api/admin/myspace-tests',
		'/my-space/active-recall',
		'/api/admin/active-recall',
	])('does not intercept API or unrelated surface %s', (pathname) => {
		productionFlags('false', 'false');

		expect(matches(pathname)).toBe(false);
		expect(getLockedPublicLearningFeature(pathname)).toBeNull();
		expect(isArchivedPublicPath(pathname)).toBe(false);
		expect(proxy(request(pathname)).headers.get('x-middleware-next')).toBe('1');
	});

	it.each([
		'/admin/my-class',
		'/admin/teaching',
		'/messages',
		'/my-space/teaching',
		'/my-space/courses/itm',
		'/khoa-hoc/hrm',
	])('passes signed-in path %s through and hands the pathname to the page', (pathname) => {
		productionFlags('false', 'false');

		expect(matches(pathname)).toBe(true);
		expect(getLockedPublicLearningFeature(pathname)).toBeNull();
		const response = proxy(request(pathname));
		expect(response.headers.get('x-middleware-next')).toBe('1');
		// A request header (not a response one), so layouts can read it with headers().
		expect(response.headers.get('x-middleware-request-x-pathname')).toBe(pathname);
		expect(response.headers.get('x-middleware-override-headers')).toContain('x-pathname');
	});
});
