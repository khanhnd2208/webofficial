export interface MessageListItemDTO {
	slug: string;
	title: string;
	recipientName: string;
	displayFont?: string;
	coverImageUrl?: string;
	musicTrack?: string;
	isPublished: boolean;
	hasPassword: boolean;
	viewCount: number;
	expiresAt?: string;
	createdAt: string;
	updatedAt: string;
}

export interface MessageDetailDTO extends MessageListItemDTO {
	content: string;
}

export interface PublicMessageDTO {
	slug: string;
	title: string;
	recipientName: string;
	displayFont?: string;
	content?: string;
	coverImageUrl?: string;
	musicTrack?: string;
	hasPassword: boolean;
	isExpired: boolean;
	isPublished: boolean;
	viewCount: number;
}

export interface CreateMessageInput {
	title: string;
	recipientName: string;
	content: string;
	displayFont?: string;
	coverImageUrl?: string;
	musicTrack?: string;
	password?: string;
	isPublished?: boolean;
	expiresAt?: string;
}

export interface UpdateMessageInput {
	title?: string;
	recipientName?: string;
	content?: string;
	displayFont?: string | null;
	coverImageUrl?: string | null;
	musicTrack?: string | null;
	password?: string | null;
	isPublished?: boolean;
	expiresAt?: string | null;
}
