import type { NotificationType } from '@/models/Notification';

export type { NotificationType };

export interface NotificationDTO {
	id: string;
	type: NotificationType;
	message: string;
	href: string;
	meta: Record<string, string>;
	read: boolean;
	createdAt: string;
}
