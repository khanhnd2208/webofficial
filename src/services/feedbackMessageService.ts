import dbConnect from '@/lib/dbConnect';
import FeedbackMessage, { type IFeedbackMessage } from '@/models/FeedbackMessage';
import type { FeedbackMessageDTO } from '@/types/feedbackMessage';

type FeedbackLean = {
	_id: unknown;
} & IFeedbackMessage;

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
		status: doc.status,
		createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
		updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
	};
}

/** Create a new feedback message from a logged-in user */
export async function createFeedbackMessage(data: {
	userId: string;
	userName: string;
	userEmail: string;
	userImage?: string;
	subject: string;
	content: string;
}): Promise<FeedbackMessageDTO> {
	await dbConnect();
	const doc = await FeedbackMessage.create({
		userId: data.userId,
		userName: data.userName,
		userEmail: data.userEmail,
		userImage: data.userImage,
		subject: data.subject.trim(),
		content: data.content.trim(),
		status: 'pending',
	});
	return toDTO(doc.toObject() as unknown as FeedbackLean);
}

/** Get all messages for a specific user (sorted newest first) */
export async function getUserMessages(userId: string): Promise<FeedbackMessageDTO[]> {
	await dbConnect();
	const docs = await FeedbackMessage.find({ userId })
		.sort({ createdAt: -1 })
		.lean() as unknown as FeedbackLean[];
	return docs.map(toDTO);
}

/** Get all messages for admin (sorted: pending first, then newest) */
export async function getAllMessages(): Promise<FeedbackMessageDTO[]> {
	await dbConnect();
	const docs = await FeedbackMessage.find()
		.sort({ status: 1, createdAt: -1 })
		.lean() as unknown as FeedbackLean[];
	return docs.map(toDTO);
}

/** Admin reply to a feedback message */
export async function replyToMessage(
	messageId: string,
	adminReply: string
): Promise<FeedbackMessageDTO | null> {
	await dbConnect();
	const doc = await FeedbackMessage.findByIdAndUpdate(
		messageId,
		{
			adminReply: adminReply.trim(),
			adminRepliedAt: new Date(),
			status: 'replied',
		},
		{ new: true }
	).lean() as unknown as FeedbackLean | null;

	return doc ? toDTO(doc) : null;
}

/** Admin close a message (mark as resolved) */
export async function closeMessage(messageId: string): Promise<FeedbackMessageDTO | null> {
	await dbConnect();
	const doc = await FeedbackMessage.findByIdAndUpdate(
		messageId,
		{ status: 'closed' },
		{ new: true }
	).lean() as unknown as FeedbackLean | null;

	return doc ? toDTO(doc) : null;
}

/** Get message count by status (for admin badge) */
export async function getMessageCounts(): Promise<{ pending: number; replied: number; closed: number; total: number }> {
	await dbConnect();
	const [pending, replied, closed] = await Promise.all([
		FeedbackMessage.countDocuments({ status: 'pending' }),
		FeedbackMessage.countDocuments({ status: 'replied' }),
		FeedbackMessage.countDocuments({ status: 'closed' }),
	]);
	return { pending, replied, closed, total: pending + replied + closed };
}
