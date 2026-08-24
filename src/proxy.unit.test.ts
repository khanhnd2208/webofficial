import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { unstable_doesMiddlewareMatch } from 'next/dist/experimental/testing/server/middleware-testing-utils';

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
	])('returns a non-cacheable, non-indexable 404 for locked page %s', async (pathname) => {
		productionFlags('false', 'false');

		expect(matches(pathname)).toBe(true);
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
	])('returns the standard feature 404 for locked API %s', async (pathname) => {
		productionFlags('false', 'false');

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
		['/my-space/tests', 'true', 'false'],
		['/api/myspace-tests', 'true', 'false'],
		['/my-space/my-class', 'false', 'true'],
		['/api/my-class/courses', 'false', 'true'],
	] as const)(
		'passes %s through when its production flag is enabled',
		(pathname, tests, knowledge) => {
			productionFlags(tests, knowledge);

			expect(matches(pathname)).toBe(true);
			const response = proxy(request(pathname));

			expect(response.status).toBe(200);
			expect(response.headers.get('x-middleware-next')).toBe('1');
		},
	);

	it.each([
		'/admin/my-class',
		'/api/admin/my-class/courses',
		'/admin/myspace-tests',
		'/api/admin/myspace-tests',
		'/my-space/teaching',
		'/admin/teaching',
		'/my-space/active-recall',
		'/admin/tools/active-recall',
		'/api/admin/active-recall',
	])('does not intercept protected or preserved surface %s', (pathname) => {
		productionFlags('false', 'false');

		expect(matches(pathname)).toBe(false);
		expect(getLockedPublicLearningFeature(pathname)).toBeNull();
		expect(proxy(request(pathname)).headers.get('x-middleware-next')).toBe('1');
	});
});
