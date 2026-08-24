import { claimGuestProgress } from '@/features/my-class';
import { getApiUser } from '@/lib/apiAuth';
import { AppError } from '@/lib/appError';
import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { readGuestId } from '@/features/myspace-tests/guestIdentity';
import { type NextRequest } from 'next/server';

export const POST = withErrorHandling(async (request: NextRequest) => {
	const user = await getApiUser(request);
	if (!user?.id) throw new AppError('Bạn cần đăng nhập để đồng bộ tiến độ', 401);
	const guestId = await readGuestId();
	return apiSuccess(await claimGuestProgress(user.id, guestId));
});
