export interface CommentDTO {
	id: string;
	postId: string;
	userId: string;
	userName: string;
	userImage?: string;
	content: string;
	likes: number;
	likedByMe: boolean;
	createdAt: string;
}
