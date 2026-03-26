import { type NextRequest } from 'next/server';
import { withAuth, apiSuccess } from '@/lib/apiUtils';
import { getNotifications, markNotificationsRead } from '@/services/notificationService';

/** GET /api/notifications — get notifications for the current user */
export const GET = withAuth(async (_request: NextRequest, user) => {
	// Admin uses 'admin' as recipientId; regular users use their userId
	const recipientId = user.role === 'admin' ? 'admin' : user.id;
	const result = await getNotifications(recipientId);
	return apiSuccess(result);
});

/** PATCH /api/notifications — mark notifications as read */
export const PATCH = withAuth(async (request: NextRequest, user) => {
	const body = (await request.json()) as unknown;
	// Accept either 'notificationId' (from Navbar) or 'id' for backwards compat
	const notificationId =
		typeof body === 'object' && body !== null
			? (
				typeof (body as { notificationId?: unknown }).notificationId === 'string'
					? (body as { notificationId: string }).notificationId
					: typeof (body as { id?: unknown }).id === 'string'
						? (body as { id: string }).id
						: undefined
			  )
			: undefined;

	const recipientId = user.role === 'admin' ? 'admin' : user.id;
	await markNotificationsRead(recipientId, notificationId);
	return apiSuccess(null);
});
