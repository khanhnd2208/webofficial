export interface PostReactions {
	like: number;
	love: number;
	fire: number;
	clap: number;
}

export interface PostListItemDTO {
	id: string;
	title: string;
	slug: string;
	summary: string;
	category: string;
	tags: string[];
	thumbnailUrl?: string;
	chapterNumber?: number;
	isPinned: boolean;
	wordCount: number;
	views: number;
	reactions: PostReactions;
	publishedAt?: string;
	createdAt: string;
}

export interface PostDetailDTO extends PostListItemDTO {
	content: string;
	contentFormat: 'markdown' | 'html';
}

export interface GetAllPostsResult {
	items: PostListItemDTO[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface AdminPostListItemDTO extends PostListItemDTO {
	isPublished: boolean;
	updatedAt: string;
}

export interface AdminPostDetailDTO extends AdminPostListItemDTO {
	content: string;
	contentFormat: 'markdown' | 'html';
}

export interface GetAdminPostsResult {
	items: AdminPostListItemDTO[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}
