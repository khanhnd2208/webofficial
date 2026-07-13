import crypto from 'crypto';

import { type NextRequest } from 'next/server';

import dbConnect from '@/lib/dbConnect';
import { AppError } from '@/lib/appError';
import InquiryRateLimit from '@/models/InquiryRateLimit';

export const INQUIRY_RATE_LIMIT_MAX = 5;
export const INQUIRY_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export function getRateLimitSecret(): string | null {
	return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? null;
}

export function getClientIp(request: NextRequest): string {
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) {
		const first = forwarded.split(',')[0]?.trim();
		if (first) return first;
	}
	const realIp = request.headers.get('x-real-ip')?.trim();
	if (realIp) return realIp;
	return 'unknown';
}

export function hashClientIp(ip: string, secret: string): string {
	return crypto.createHmac('sha256', secret).update(ip).digest('hex');
}

export function isRateLimitBreached(count: number, max = INQUIRY_RATE_LIMIT_MAX): boolean {
	return count >= max;
}

export async function countRecentRateLimitHits(ipHmac: string): Promise<number> {
	await dbConnect();
	const since = new Date(Date.now() - INQUIRY_RATE_LIMIT_WINDOW_MS);
	return InquiryRateLimit.countDocuments({ ipHmac, createdAt: { $gte: since } });
}

export async function recordRateLimitHit(ipHmac: string): Promise<void> {
	await dbConnect();
	await InquiryRateLimit.create({ ipHmac });
}

/**
 * Enforces inquiry submission rate limit (5 per 15 minutes per IP).
 * Stores HMAC(ip) only — raw IP is never persisted.
 */
export async function assertInquiryRateLimit(request: NextRequest): Promise<void> {
	const secret = getRateLimitSecret();
	if (!secret) {
		console.warn('[inquiryRateLimit] Missing AUTH_SECRET / NEXTAUTH_SECRET — rate limit skipped');
		return;
	}

	const ip = getClientIp(request);
	const ipHmac = hashClientIp(ip, secret);
	const count = await countRecentRateLimitHits(ipHmac);

	if (isRateLimitBreached(count)) {
		throw new AppError('Too many submissions. Please try again later.', 429, 'RATE_LIMITED');
	}

	await recordRateLimitHit(ipHmac);
}
