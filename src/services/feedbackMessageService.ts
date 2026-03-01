import dbConnect from '@/lib/dbConnect';
import FeedbackMessage, { type IFeedbackMessage, type IFeedbackReply } from '@/models/FeedbackMessage';
import { createNotification } from '@/services/notificationService';
import type { FeedbackMessageDTO, FeedbackReplyDTO } from '@/types/feedbackMessage';

// ─── Lean type ────────────────────────────────────────────────────────────────

type FeedbackLean = { _id: unknown } & IFeedbackMessage;

// ─── DTO mapper ───────────────────────────────────────────────────────────────

function replyToDTO(r: IFeedbackReply & { _id?: unknown }): FeedbackReplyDTO {
	return {
		id: String(r._id ?? ''),
		role: r.role,
		authorId: r.authorId,
		authorName: r.authorName,
		content: r.content,
		createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
	};
}

function toDTO(doc: FeedbackLean): FeedbackMessageDTO {
	return {
		id: String(doc._id),
		userId: doc.userId,
		userName: doc.userName,
		userEmail: doc.userEmail,
		userImage: doc.userImage,
		subject: doc.subject,
		content: doc.content,
		adminReply: doc.adminReply,
		adminRepliedAt: doc.adminRepliedAt ? new Date(doc.adminRepliedAt).toISOString() : undefined,
		replies: (doc.replies ?? []).map((r) => replyToDTO(r as IFeedbackReply & { _id?: unknown })),
		status: doc.status,
		sourceUrl: doc.sourceUrl,
		createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
		updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
	};
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createFeedbackMessage(data: {
	userId: string;
	userName: string;
	userEmail: string;
	userImage?: string;
	subject: string;
	content: string;
	sourceUrl?: string;
}): Promise<FeedbackMessageDTO> {
	await dbConnect();
	const doc = await FeedbackMessage.create({
		userId: data.userId,
		userName: data.userName,
		userEmail: data.userEmail,
		userImage: data.userImage,
		subject: data.subject.trim(),
		content: data.content.trim(),
		sourceUrl: data.sourceUrl,
		status: 'pending',
		replies: [],
	});

	// Admin notification
	const sourceHint = data.sourceUrl ? ` (từ ${data.sourceUrl})` : '';
	await createNotification({
		recipientId: 'admin',
		type: 'feedback_new',
		message: `${data.userName} gửi phản hồi mới: "${data.subject}"${sourceHint}`,
		href: `/admin/feedback/messages`,
		meta: { feedbackId: String(doc._id), sourceUrl: data.sourceUrl ?? '' },
	});

	return toDTO(doc.toObject() as unknown as FeedbackLean);
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getUserMessages(userId: string): Promise<FeedbackMessageDTO[]> {
	await dbConnect();
	const docs = await FeedbackMessage.find({ userId })
		.sort({ createdAt: -1 })
		.lean() as unknown as FeedbackLean[];
	return docs.map(toDTO);
}

export async function getAllMessages(): Promise<FeedbackMessageDTO[]> {
	await dbConnect();
	const docs = await FeedbackMessage.find()
		.sort({ status: 1, createdAt: -1 })
		.lean() as unknown as FeedbackLean[];
	return docs.map(toDTO);
}

// ─── Thread replies ───────────────────────────────────────────────────────────

/**
 * Add a reply to the conversation thread.
 * role='admin' → notify user
 * role='user'  → notify admin
 */
export async function addReplyToMessage(
	messageId: string,
	reply: { role: 'user' | 'admin'; authorId: string; authorName: string; content: string }
): Promise<FeedbackMessageDTO | null> {
	await dbConnect();

	const newReply: IFeedbackReply = {
		role: reply.role,
		authorId: reply.authorId,
		authorName: reply.authorName,
		content: reply.content.trim(),
		createdAt: new Date(),
	};

	const statusUpdate = reply.role === 'admin' ? { status: 'replied' as const } : {};

	const doc = await FeedbackMessage.findByIdAndUpdate(
		messageId,
		{
			$push: { replies: newReply },
			// Legacy fields: update if admin is replying for the first time
			...(reply.role === 'admin' ? { adminReply: reply.content.trim(), adminRepliedAt: new Date() } : {}),
			...statusUpdate,
		},
		{ new: true }
	).lean() as unknown as FeedbackLean | null;

	if (!doc) return null;
	const dto = toDTO(doc);

	if (reply.role === 'admin') {
		// Notify the user that admin replied
		await createNotification({
			recipientId: doc.userId,
			type: 'feedback_replied',
			message: `Giảng viên đã trả lời phản hồi "${doc.subject}" của bạn`,
			href: `/feedback`,
			meta: { feedbackId: messageId },
		});
	} else {
		// User replied — notify admin
		await createNotification({
			recipientId: 'admin',
			type: 'feedback_new',
			message: `${reply.authorName} đã trả lời tiếp trong "${doc.subject}"`,
			href: `/admin/feedback/messages`,
			meta: { feedbackId: messageId },
		});
	}

	return dto;
}

// ─── Legacy single-reply (for backwards compat) ───────────────────────────────

export async function replyToMessage(
	messageId: string,
	adminReply: string,
	adminId: string,
	adminName: string
): Promise<FeedbackMessageDTO | null> {
	return addReplyToMessage(messageId, {
		role: 'admin',
		authorId: adminId,
		authorName: adminName,
		content: adminReply,
	});
}

// ─── Status ───────────────────────────────────────────────────────────────────

export async function closeMessage(messageId: string): Promise<FeedbackMessageDTO | null> {
	await dbConnect();
	const doc = await FeedbackMessage.findByIdAndUpdate(
		messageId,
		{ status: 'closed' },
		{ new: true }
	).lean() as unknown as FeedbackLean | null;
	return doc ? toDTO(doc) : null;
}

// ─── Counts ───────────────────────────────────────────────────────────────────

export async function getMessageCounts(): Promise<{
	pending: number; replied: number; closed: number; total: number;
}> {
	await dbConnect();
	const [pending, replied, closed] = await Promise.all([
		FeedbackMessage.countDocuments({ status: 'pending' }),
		FeedbackMessage.countDocuments({ status: 'replied' }),
		FeedbackMessage.countDocuments({ status: 'closed' }),
	]);
	return { pending, replied, closed, total: pending + replied + closed };
}

