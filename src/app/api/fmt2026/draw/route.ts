import { type NextRequest } from 'next/server';

import { hasBoothAccess } from '@/features/fmt2026/services/boothAccess';
import { drawOnce } from '@/features/fmt2026/services/drawService';
import { AppError, apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { assertScopedRateLimit } from '@/lib/inquiryRateLimit';

/** One booth laptop draws at most a few times a minute; this only stops a script. */
const DRAWS_PER_WINDOW = 300;

export const POST = withErrorHandling(async (request: NextRequest) => {
	if (!(await hasBoothAccess(request))) {
		throw new AppError('Cần mã PIN của quầy quà', 401, 'LOCKED');
	}
	await assertScopedRateLimit(request, 'fmt2026-draw', DRAWS_PER_WINDOW);
	return apiSuccess(await drawOnce(), 201);
});
