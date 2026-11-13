import { type NextRequest } from 'next/server';

import {
	BOOTH_COOKIE,
	BOOTH_UNLOCK_TTL_MS,
	issueBoothToken,
	issueSetupToken,
	verifyPin,
} from '@/features/fmt2026/services/boothUnlock';
import { getPinState } from '@/features/fmt2026/services/drawService';
import { unlockSchema } from '@/features/fmt2026/schemas';
import { AppError, apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { assertScopedRateLimit } from '@/lib/inquiryRateLimit';
import { parseSchema } from '@/lib/validation/parse';

/** Enough for fat fingers at the booth, far too few to guess a 4-digit PIN. */
const ATTEMPTS_PER_WINDOW = 20;

export const POST = withErrorHandling(async (request: NextRequest) => {
	const { pin, setup } = parseSchema(unlockSchema, await request.json());
	await assertScopedRateLimit(request, 'fmt2026-unlock', ATTEMPTS_PER_WINDOW);
	const { pinHash, pinVersion } = await getPinState();
	if (!pinHash) throw new AppError('Admin chưa đặt mã PIN cho quầy quà', 409, 'NO_PIN');
	if (!verifyPin(pin, pinHash)) throw new AppError('Mã PIN không đúng', 401, 'WRONG_PIN');

	const token = issueBoothToken(pinVersion);
	if (!token) throw new AppError('Máy chủ chưa cấu hình khóa bí mật', 503);

	const response = apiSuccess({
		unlocked: true,
		...(setup && { setupToken: issueSetupToken(pinVersion) }),
	});
	response.headers.set('cache-control', 'private, no-store');
	response.cookies.set(BOOTH_COOKIE, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		path: '/',
		maxAge: Math.floor(BOOTH_UNLOCK_TTL_MS / 1000),
	});
	return response;
});
