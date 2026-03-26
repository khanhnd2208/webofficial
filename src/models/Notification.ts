import mongoose, { Schema, type Model } from 'mongoose';

/**
 * Notification types:
 *  - comment_pending   → admin: new comment awaiting approval
 *  - comment_replied   → user: someone replied to their comment
 *  - comment_approved  → user: their comment was approved
 *  - feedback_new      → admin: new feedback message received
 *  - feedback_replied  → user: admin replied in their feedback thread
 */
export type NotificationType =
	| 'comment_pending'
	| 'comment_replied'
	| 'comment_approved'
	| 'feedback_new'
	| 'feedback_replied';

export interface INotification {
	// Who receives this notification
	recipientId: string; // userId or 'admin'
	type: NotificationType;
	// Human-readable summary
	message: string;
	// Deep-link for navigation
	href: string;
	// Additional context (commentId, feedbackId, postSlug, etc.)
	meta?: Record<string, string>;
	read: boolean;
	createdAt?: Date;
	updatedAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
	{
		recipientId: { type: String, required: true },
		type: {
			type: String,
			enum: [
				'comment_pending',
				'comment_replied',
				'comment_approved',
				'feedback_new',
				'feedback_replied',
			],
			required: true,
		},
		message: { type: String, required: true, trim: true },
		href: { type: String, required: true, trim: true },
		meta: { type: Schema.Types.Mixed, default: {} },
		read: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

// Fast query: unread count for a recipient
NotificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });
// Auto-delete notifications older than 90 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Notification: Model<INotification> =
	(mongoose.models.Notification as Model<INotification>) ??
	mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
