import { NextResponse, type NextRequest } from 'next/server';
import { getApiUser } from '@/lib/apiAuth';
import { getNotifications, markNotificationsRead } from '@/services/notificationService';

/** GET /api/notifications — get notifications for the current user */
export async function GET(request: NextRequest) {
	try {
		const user = await getApiUser(request);
		if (!user) {
			return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
		}

		// Admin uses 'admin' as recipientId; regular users use their userId
		const recipientId = (user as { role?: string }).role === 'admin' ? 'admin' : user.id;
		const result = await getNotifications(recipientId);
		return NextResponse.json({ ok: true, data: result });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}

/** PATCH /api/notifications — mark notifications as read */
export async function PATCH(request: NextRequest) {
	try {
		const user = await getApiUser(request);
		if (!user) {
			return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
		}

		const body = (await request.json()) as unknown;
		const notificationId =
			typeof body === 'object' && body !== null && typeof (body as { id?: unknown }).id === 'string'
				? (body as { id: string }).id
				: undefined;

		const recipientId = (user as { role?: string }).role === 'admin' ? 'admin' : user.id;
		await markNotificationsRead(recipientId, notificationId);
		return NextResponse.json({ ok: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
