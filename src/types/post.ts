export interface PostListItemDTO {
	id: string;
	title: string;
	slug: string;
	summary: string;
	tags: string[];
	thumbnailUrl?: string;
	createdAt: string;
}

export interface PostDetailDTO extends PostListItemDTO {
	content: string;
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
}

export interface GetAdminPostsResult {
	items: AdminPostListItemDTO[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}
