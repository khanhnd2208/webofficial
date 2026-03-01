import dbConnect from '@/lib/dbConnect';
import Notification, { type NotificationType } from '@/models/Notification';

export interface NotificationDTO {
	id: string;
	type: NotificationType;
	message: string;
	href: string;
	meta: Record<string, string>;
	read: boolean;
	createdAt: string;
}

type NotifLean = {
	_id: unknown;
	type: NotificationType;
	message: string;
	href: string;
	meta?: Record<string, string>;
	read: boolean;
	createdAt?: Date;
};

function toDTO(doc: NotifLean): NotificationDTO {
	return {
		id: String(doc._id),
		type: doc.type,
		message: doc.message,
		href: doc.href,
		meta: doc.meta ?? {},
		read: doc.read,
		createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
	};
}

/** Get notifications for a recipient, newest first, max 50 */
export async function getNotifications(recipientId: string): Promise<{
	items: NotificationDTO[];
	unreadCount: number;
}> {
	await dbConnect();

	const [items, unreadCount] = await Promise.all([
		Notification.find({ recipientId })
			.sort({ createdAt: -1 })
			.limit(50)
			.lean() as Promise<unknown>,
		Notification.countDocuments({ recipientId, read: false }),
	]);

	return {
		items: (items as NotifLean[]).map(toDTO),
		unreadCount,
	};
}

/** Mark one or all notifications as read */
export async function markNotificationsRead(
	recipientId: string,
	notificationId?: string // if omitted, marks ALL as read
): Promise<void> {
	await dbConnect();

	const filter = notificationId
		? { _id: notificationId, recipientId }
		: { recipientId, read: false };

	await Notification.updateMany(filter, { read: true });
}

/** Create a notification (used by services internally — also exported for admin use) */
export async function createNotification(data: {
	recipientId: string;
	type: NotificationType;
	message: string;
	href: string;
	meta?: Record<string, string>;
}): Promise<void> {
	await dbConnect();
	await Notification.create(data);
}
