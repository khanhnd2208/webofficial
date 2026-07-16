import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { AppError } from '@/lib/appError';
import {
	assertInquiryRateLimit,
	consumeRateLimitBucket,
	getClientIp,
	getRateLimitWindowStart,
	hashRateLimitBucket,
} from '@/lib/inquiryRateLimit';
import InquiryRateLimit from '@/models/InquiryRateLimit';

describe('inquiry rate-limit buckets', () => {
	beforeEach(async () => {
		await InquiryRateLimit.deleteMany({});
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('increments one bucket atomically under concurrent requests', async () => {
		const windowStart = getRateLimitWindowStart(1_800_000);
		const bucket = hashRateLimitBucket('203.0.113.10', 'test-secret', windowStart);

		const counts = await Promise.all(
			Array.from({ length: 10 }, () => consumeRateLimitBucket(bucket, windowStart)),
		);

		expect([...counts].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
		const stored = await InquiryRateLimit.findById(bucket).lean();
		expect(stored?.count).toBe(10);
		expect(JSON.stringify(stored)).not.toContain('203.0.113.10');
	});

	it('uses the proxy-overwritten real IP instead of a spoofable forwarded prefix', () => {
		const request = new NextRequest('http://localhost/api/inquiries', {
			headers: {
				'x-real-ip': '203.0.113.20',
				'x-forwarded-for': '198.51.100.99, 203.0.113.20',
			},
		});

		expect(getClientIp(request)).toBe('203.0.113.20');
	});

	it('accepts five requests and rejects the sixth in a window', async () => {
		vi.stubEnv('AUTH_SECRET', 'test-rate-limit-secret');
		const request = new NextRequest('http://localhost/api/inquiries', {
			headers: { 'x-forwarded-for': '203.0.113.11' },
		});

		for (let count = 0; count < 5; count += 1) {
			await expect(assertInquiryRateLimit(request)).resolves.toBeUndefined();
		}
		await expect(assertInquiryRateLimit(request)).rejects.toMatchObject({
			status: 429,
			code: 'RATE_LIMITED',
		} satisfies Partial<AppError>);
	});

	it('fails closed in production when the HMAC secret is missing', async () => {
		vi.stubEnv('NODE_ENV', 'production');
		vi.stubEnv('AUTH_SECRET', '');
		vi.stubEnv('NEXTAUTH_SECRET', '');

		const request = new NextRequest('http://localhost/api/inquiries');
		await expect(assertInquiryRateLimit(request)).rejects.toMatchObject({
			status: 503,
			code: 'INQUIRY_UNAVAILABLE',
		} satisfies Partial<AppError>);
	});
});
