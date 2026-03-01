export type FeedbackMessageStatus = 'pending' | 'replied' | 'closed';

export interface FeedbackReplyDTO {
	id: string;
	role: 'user' | 'admin';
	authorId: string;
	authorName: string;
	content: string;
	createdAt: string;
}

export interface FeedbackMessageDTO {
	id: string;
	userId: string;
	userName: string;
	userEmail: string;
	userImage?: string;
	subject: string;
	content: string;
	// Legacy single-reply (kept for compatibility during transition)
	adminReply?: string;
	adminRepliedAt?: string;
	// Full conversation thread
	replies: FeedbackReplyDTO[];
	status: FeedbackMessageStatus;
	sourceUrl?: string;
	createdAt: string;
	updatedAt: string;
}
