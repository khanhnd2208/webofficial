import mongoose from 'mongoose';

import dbConnect from '@/lib/dbConnect';
import Comment from '@/models/Comment';
import type { CommentDTO } from '@/types/comment';

type CommentLean = {
	_id: unknown;
	postId: unknown;
	userId: string;
	userName: string;
	userImage?: string;
	content: string;
	likes?: number;
	likedBy?: string[];
	createdAt?: Date;
};

function toDTO(doc: CommentLean, currentUserId?: string): CommentDTO {
	return {
		id: String(doc._id),
		postId: String(doc.postId),
		userId: doc.userId,
		userName: doc.userName,
		userImage: doc.userImage ?? undefined,
		content: doc.content,
		likes: doc.likes ?? 0,
		likedByMe: currentUserId ? (doc.likedBy ?? []).includes(currentUserId) : false,
		createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date(0).toISOString(),
	};
}

export async function getCommentsByPostId(
	postId: string,
	page = 1,
	limit = 50,
	currentUserId?: string
): Promise<{ items: CommentDTO[]; total: number }> {
	await dbConnect();

	const p = Math.max(1, Math.floor(page));
	const l = Math.min(100, Math.max(1, Math.floor(limit)));

	const filter = { postId: new mongoose.Types.ObjectId(postId) };

	const [total, items] = await Promise.all([
		Comment.countDocuments(filter),
		Comment.find(filter)
			.sort({ likes: -1, createdAt: -1 })
			.skip((p - 1) * l)
			.limit(l)
			.lean(),
	]);

	return {
		items: (items as unknown as CommentLean[]).map((c) => toDTO(c, currentUserId)),
		total,
	};
}

export async function createComment(input: {
	postId: string;
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
		userId: input.userId,
		userName: input.userName,
		userImage: input.userImage,
		content,
		likes: 0,
		likedBy: [],
	});

	return toDTO(created.toObject() as unknown as CommentLean, input.userId);
}

export async function toggleCommentLike(
	commentId: string,
	userId: string
): Promise<{ likes: number; likedByMe: boolean }> {
	await dbConnect();

	// Check if user already liked — single atomic read
	const existing = await Comment.findOne(
		{ _id: commentId, likedBy: userId },
		{ _id: 1 }
	).lean();

	const alreadyLiked = Boolean(existing);

	// Atomic update — no race conditions even with concurrent requests
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

export async function deleteComment(commentId: string, userId: string): Promise<void> {
	await dbConnect();

	const comment = await Comment.findById(commentId);
	if (!comment) throw new Error('Comment not found');
	if (comment.userId !== userId) throw new Error('Unauthorized');

	await Comment.findByIdAndDelete(commentId);
}

export async function getCommentCount(postId: string): Promise<number> {
	await dbConnect();
	return Comment.countDocuments({ postId: new mongoose.Types.ObjectId(postId) });
}
