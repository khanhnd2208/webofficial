import crypto from 'crypto';

import { type NextRequest } from 'next/server';

import dbConnect from '@/lib/dbConnect';
import { AppError } from '@/lib/appError';
import InquiryRateLimit from '@/models/InquiryRateLimit';

export const INQUIRY_RATE_LIMIT_MAX = 5;
export const INQUIRY_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export function getRateLimitSecret(): string | null {
	const dedicatedSecret = process.env.INQUIRY_RATE_LIMIT_SECRET?.trim();
	if (dedicatedSecret) return dedicatedSecret;
	const authSecret = process.env.AUTH_SECRET?.trim();
	if (authSecret) return authSecret;
	const nextAuthSecret = process.env.NEXTAUTH_SECRET?.trim();
	if (nextAuthSecret) return nextAuthSecret;
	const adminSecret = process.env.ADMIN_SECRET?.trim();
	return adminSecret || null;
}

export function getClientIp(request: NextRequest): string {
	// Production Nginx overwrites X-Real-IP with the socket peer, so a caller
	// cannot evade the bucket by prefixing arbitrary X-Forwarded-For values.
	const realIp = request.headers.get('x-real-ip')?.trim();
	if (realIp) return realIp;
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) {
		const trustedHop = forwarded.split(',').at(-1)?.trim();
		if (trustedHop) return trustedHop;
	}
	return 'unknown';
}

export function hashClientIp(ip: string, secret: string): string {
	return crypto.createHmac('sha256', secret).update(ip).digest('hex');
}

export function getRateLimitWindowStart(nowMs = Date.now()): number {
	return Math.floor(nowMs / INQUIRY_RATE_LIMIT_WINDOW_MS) * INQUIRY_RATE_LIMIT_WINDOW_MS;
}

/** HMAC includes the window, so stored bucket ids cannot be linked across windows. */
export function hashRateLimitBucket(
	ip: string,
	secret: string,
	windowStartMs: number,
	scope = 'inquiry',
): string {
	return crypto
		.createHmac('sha256', secret)
		.update(`${scope}:${ip}:${windowStartMs}`)
		.digest('hex');
}

export function isRateLimitBreached(count: number, max = INQUIRY_RATE_LIMIT_MAX): boolean {
	return count >= max;
}

/** Atomically consumes one slot and returns the resulting count for this window. */
export async function consumeRateLimitBucket(
	bucketHmac: string,
	windowStartMs: number,
	windowMs = INQUIRY_RATE_LIMIT_WINDOW_MS,
): Promise<number> {
	await dbConnect();

	const windowStart = new Date(windowStartMs);
	const expiresAt = new Date(windowStartMs + windowMs);

	const increment = () =>
		InquiryRateLimit.findOneAndUpdate(
			{ _id: bucketHmac },
			{
				$inc: { count: 1 },
				$setOnInsert: { windowStart, expiresAt },
			},
			{
				upsert: true,
				returnDocument: 'after',
				setDefaultsOnInsert: false,
			},
		).lean();

	try {
		const bucket = await increment();
		return bucket?.count ?? 1;
	} catch (error) {
		// Two first requests can race while creating the same deterministic id.
		// Retry as a plain update if Mongo reports a duplicate-key upsert race.
		if ((error as { code?: number })?.code !== 11000) throw error;
		const bucket = await InquiryRateLimit.findOneAndUpdate(
			{ _id: bucketHmac },
			{ $inc: { count: 1 } },
			{ returnDocument: 'after' },
		).lean();
		return bucket?.count ?? INQUIRY_RATE_LIMIT_MAX + 1;
	}
}

/**
 * Enforces five inquiry submissions per fixed fifteen-minute window per IP.
 * Only a window-scoped HMAC is persisted; the raw IP never leaves this module.
 */
export async function assertInquiryRateLimit(request: NextRequest): Promise<void> {
	return assertScopedRateLimit(
		request,
		'inquiry',
		INQUIRY_RATE_LIMIT_MAX,
		INQUIRY_RATE_LIMIT_WINDOW_MS,
	);
}

/** Generic Mongo-backed limiter for anonymous mutation endpoints. */
export async function assertScopedRateLimit(
	request: NextRequest,
	scope: string,
	max: number,
	windowMs = INQUIRY_RATE_LIMIT_WINDOW_MS,
): Promise<void> {
	const secret = getRateLimitSecret();
	if (!secret) {
		if (process.env.NODE_ENV === 'production') {
			const inquiryScope = scope === 'inquiry';
			throw new AppError(
				inquiryScope
					? 'Kênh nhận lời nhắn đang tạm khóa vì cấu hình bảo vệ chưa đầy đủ.'
					: 'Tính năng này đang tạm khóa vì cấu hình bảo vệ chưa đầy đủ.',
				503,
				inquiryScope ? 'INQUIRY_UNAVAILABLE' : 'RATE_LIMIT_UNAVAILABLE',
			);
		}
		console.warn('[inquiryRateLimit] Missing server secret — skipped outside production');
		return;
	}

	const windowStartMs = Math.floor(Date.now() / windowMs) * windowMs;
	const bucketHmac = hashRateLimitBucket(getClientIp(request), secret, windowStartMs, scope);
	const count = await consumeRateLimitBucket(bucketHmac, windowStartMs, windowMs);

	// `count` already includes this request; the sixth request is the first denied one.
	if (isRateLimitBreached(count - 1, max)) {
		throw new AppError(
			scope === 'inquiry'
				? 'Bạn đã gửi quá nhiều lời nhắn. Vui lòng thử lại sau khoảng 15 phút.'
				: 'Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau ít phút.',
			429,
			'RATE_LIMITED',
		);
	}
}
