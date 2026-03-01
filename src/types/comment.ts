import type { CommentStatus } from '@/models/Comment';

export type { CommentStatus };

export interface CommentDTO {
	id: string;
	postId: string;
	parentId: string | null;
	postSlug: string;
	userId: string;
	userName: string;
	userImage?: string;
	content: string;
	likes: number;
	likedByMe: boolean;
	status: CommentStatus;
	// Populated for top-level comments: direct replies (one level deep)
	replies: CommentDTO[];
	createdAt: string;
}
