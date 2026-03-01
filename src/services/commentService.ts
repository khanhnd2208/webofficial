import mongoose from 'mongoose';

import dbConnect from '@/lib/dbConnect';
import Comment from '@/models/Comment';
import Notification from '@/models/Notification';
import type { CommentDTO } from '@/types/comment';

// ─── Internal lean type ────────────────────────────────────────────────────────

type CommentLean = {
	_id: unknown;
	postId: unknown;
	parentId?: unknown;
	postSlug: string;
	postTitle?: string;
	userId: string;
	userName: string;
	userImage?: string;
	content: string;
	likes?: number;
	likedBy?: string[];
	status: 'pending' | 'approved' | 'hidden';
	createdAt?: Date;
};

// ─── DTO mapper ────────────────────────────────────────────────────────────────

function toDTO(doc: CommentLean, currentUserId?: string, replies: CommentDTO[] = []): CommentDTO {
	return {
		id: String(doc._id),
		postId: String(doc.postId),
		parentId: doc.parentId ? String(doc.parentId) : null,
		postSlug: doc.postSlug,
		userId: doc.userId,
		userName: doc.userName,
		userImage: doc.userImage ?? undefined,
		content: doc.content,
		likes: doc.likes ?? 0,
		likedByMe: currentUserId ? (doc.likedBy ?? []).includes(currentUserId) : false,
		status: doc.status,
		replies,
		createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date(0).toISOString(),
	};
}

// ─── Read ──────────────────────────────────────────────────────────────────────

/**
 * Returns top-level comments for a post with nested replies.
 * Visibility: approved always visible; pending visible only to author + admin.
 */
export async function getCommentsByPostId(
	postId: string,
	currentUserId?: string,
	isAdmin = false
): Promise<{ items: CommentDTO[]; total: number; pendingCount: number }> {
	await dbConnect();

	const oid = new mongoose.Types.ObjectId(postId);
	const all = (await Comment.find({ postId: oid })
		.sort({ createdAt: 1 })
		.lean()) as unknown as CommentLean[];

	const pendingCount = all.filter((c) => c.status === 'pending').length;

	const visible = all.filter((c) => {
		if (isAdmin) return true;
		if (c.status === 'approved') return true;
		if (c.status === 'pending' && currentUserId && c.userId === currentUserId) return true;
		return false;
	});

	const topLevel = visible.filter((c) => !c.parentId);
	const replyDocs = visible.filter((c) => Boolean(c.parentId));

	const repliesByParent = new Map<string, CommentLean[]>();
	for (const r of replyDocs) {
		const pid = String(r.parentId);
		if (!repliesByParent.has(pid)) repliesByParent.set(pid, []);
		repliesByParent.get(pid)!.push(r);
	}

	const items: CommentDTO[] = topLevel.map((c) => {
		const childDocs = repliesByParent.get(String(c._id)) ?? [];
		const childDTOs = childDocs.map((r) => toDTO(r, currentUserId, []));
		return toDTO(c, currentUserId, childDTOs);
	});

	const total = items.reduce((sum, c) => sum + 1 + c.replies.length, 0);
	return { items, total, pendingCount };
}

// ─── Write ─────────────────────────────────────────────────────────────────────

export async function createComment(input: {
	postId: string;
	postSlug: string;
	postTitle?: string;
	parentId?: string | null;
	userId: string;
	userName: string;
	userImage?: string;
	content: string;
}): Promise<CommentDTO> {
	await dbConnect();

	const content = String(input.content ?? '').trim();
	if (!content) throw new Error('Comment cannot be empty');
	if (content.length > 2000) throw new Error('Comment too long (max 2000 characters)');

	const created = await Comment.create({
		postId: new mongoose.Types.ObjectId(input.postId),
		parentId: input.parentId ? new mongoose.Types.ObjectId(input.parentId) : null,
		postSlug: input.postSlug,
		postTitle: input.postTitle,
		userId: input.userId,
		userName: input.userName,
		userImage: input.userImage,
		content,
		status: 'pending',
	});

	const dto = toDTO(created.toObject() as unknown as CommentLean, input.userId);

	// Admin notification: new comment to moderate
	await Notification.create({
		recipientId: 'admin',
		type: 'comment_pending',
		message: `${input.userName} bình luận trong "${input.postTitle ?? input.postSlug}"`,
		href: `/admin/posts/comments`,
		meta: { commentId: dto.id, postSlug: input.postSlug, postTitle: input.postTitle ?? '' },
	});

	// If reply, notify parent author
	if (input.parentId) {
		const parent = await Comment.findById(input.parentId).select('userId userName').lean() as unknown as { userId: string; userName: string } | null;
		if (parent && parent.userId !== input.userId) {
			await Notification.create({
				recipientId: parent.userId,
				type: 'comment_replied',
				message: `${input.userName} đã trả lời bình luận của bạn trong "${input.postTitle ?? input.postSlug}"`,
				href: `/blog/${input.postSlug}`,
				meta: { commentId: dto.id, postSlug: input.postSlug },
			});
		}
	}

	return dto;
}

// ─── Admin moderation ─────────────────────────────────────────────────────────

export async function approveComment(commentId: string): Promise<CommentDTO> {
	await dbConnect();

	const updated = await Comment.findByIdAndUpdate(
		commentId,
		{ status: 'approved' },
		{ returnDocument: 'after' }
	).lean() as unknown as CommentLean | null;

	if (!updated) throw new Error('Comment not found');

	await Notification.create({
		recipientId: updated.userId,
		type: 'comment_approved',
		message: `Bình luận của bạn đã được duyệt trong "${updated.postTitle ?? updated.postSlug}"`,
		href: `/blog/${updated.postSlug}`,
		meta: { commentId, postSlug: updated.postSlug },
	});

	return toDTO(updated);
}

export async function hideComment(commentId: string): Promise<CommentDTO> {
	await dbConnect();
	const updated = await Comment.findByIdAndUpdate(
		commentId,
		{ status: 'hidden' },
		{ returnDocument: 'after' }
	).lean() as unknown as CommentLean | null;
	if (!updated) throw new Error('Comment not found');
	return toDTO(updated);
}

export async function adminDeleteComment(commentId: string): Promise<void> {
	await dbConnect();
	await Promise.all([
		Comment.findByIdAndDelete(commentId),
		Comment.deleteMany({ parentId: new mongoose.Types.ObjectId(commentId) }),
	]);
}

// ─── User self-delete ─────────────────────────────────────────────────────────

export async function deleteComment(commentId: string, userId: string): Promise<void> {
	await dbConnect();
	const comment = await Comment.findById(commentId);
	if (!comment) throw new Error('Comment not found');
	if (comment.userId !== userId) throw new Error('Unauthorized');
	await Promise.all([
		Comment.findByIdAndDelete(commentId),
		Comment.deleteMany({ parentId: new mongoose.Types.ObjectId(commentId) }),
	]);
}

// ─── Like toggle ──────────────────────────────────────────────────────────────

export async function toggleCommentLike(
	commentId: string,
	userId: string
): Promise<{ likes: number; likedByMe: boolean }> {
	await dbConnect();

	const existing = await Comment.findOne({ _id: commentId, likedBy: userId }, { _id: 1 }).lean();
	const alreadyLiked = Boolean(existing);

	const updated = await Comment.findByIdAndUpdate(
		commentId,
		alreadyLiked
			? { $pull: { likedBy: userId }, $inc: { likes: -1 } }
			: { $addToSet: { likedBy: userId }, $inc: { likes: 1 } },
		{ returnDocument: 'after', select: 'likes' }
	).lean();

	if (!updated) throw new Error('Comment not found');
	const likes = Math.max(0, (updated as unknown as { likes?: number }).likes ?? 0);
	return { likes, likedByMe: !alreadyLiked };
}

// ─── Counts ───────────────────────────────────────────────────────────────────

export async function getCommentCount(postId: string): Promise<number> {
	await dbConnect();
	return Comment.countDocuments({ postId: new mongoose.Types.ObjectId(postId), status: 'approved' });
}

export async function getPendingCommentCount(): Promise<number> {
	await dbConnect();
	return Comment.countDocuments({ status: 'pending' });
}

export async function getPendingComments(): Promise<CommentDTO[]> {
	await dbConnect();
	const docs = (await Comment.find({ status: 'pending' })
		.sort({ createdAt: 1 })
		.lean()) as unknown as CommentLean[];
	return docs.map((c) => toDTO(c));
}

