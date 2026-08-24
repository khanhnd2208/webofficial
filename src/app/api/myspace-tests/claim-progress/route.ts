import { type NextRequest } from 'next/server';

import { myspaceTestsService } from '@/features/myspace-tests';
import { clearGuestId, readGuestId } from '@/features/myspace-tests/guestIdentity';
import { getApiUser } from '@/lib/apiAuth';
import { AppError } from '@/lib/appError';
import { withErrorHandling, apiSuccess } from '@/lib/apiUtils';

/**
 * Idempotent merge: attach guest-owned sessions to the signed-in account, then clear cookie.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
	const user = await getApiUser(request);
	if (!user?.id) {
		throw new AppError('Bạn cần đăng nhập để đồng bộ tiến độ', 401);
	}

	const guestId = await readGuestId();
	const result = await myspaceTestsService.claimGuestProgress(user.id, guestId);
	if (guestId) {
		await clearGuestId();
	}
	return apiSuccess(result);
});
