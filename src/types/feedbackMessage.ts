export type FeedbackMessageStatus = 'pending' | 'replied' | 'closed';

export interface FeedbackMessageDTO {
	id: string;
	userId: string;
	userName: string;
	userEmail: string;
	userImage?: string;
	subject: string;
	content: string;
	adminReply?: string;
	adminRepliedAt?: string;
	status: FeedbackMessageStatus;
	createdAt: string;
	updatedAt: string;
}
