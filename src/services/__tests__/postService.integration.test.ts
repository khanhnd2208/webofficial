import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createPost, getAdminPostById, deletePostById, getPostBySlug } from '@/services/postService';

vi.mock('next/cache', () => ({
	unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
	revalidatePath: vi.fn(),
	revalidateTag: vi.fn(),
}));

describe('postService', () => {
	beforeEach(async () => {
		const Post = (await import('@/models/Post')).default;
		await Post.deleteMany({});
	});

	it('creates a published post with slug', async () => {
		const post = await createPost({
			title: 'Hello World',
			content: '<p>Content</p>',
			summary: 'Summary',
			isPublished: true,
		});
		expect(post.slug).toBe('hello-world');
		expect(post.title).toBe('Hello World');
	});

	it('retrieves post by slug for public view', async () => {
		const created = await createPost({
			title: 'Test Post',
			content: 'Body',
			summary: 'Sum',
			isPublished: true,
		});
		const found = await getPostBySlug(created.slug);
		expect(found?.title).toBe('Test Post');
	});

	it('getAdminPostById returns admin detail', async () => {
		const created = await createPost({
			title: 'Admin View',
			content: 'Body',
			summary: 'Sum',
			isPublished: false,
		});
		const admin = await getAdminPostById(created.id);
		expect(admin).not.toBeNull();
		expect(admin?.title).toBe('Admin View');
	});

	it('deletePostById removes the post', async () => {
		const created = await createPost({
			title: 'To Delete',
			content: 'Body',
			summary: 'Sum',
			isPublished: true,
		});
		await deletePostById(created.id);
		const found = await getAdminPostById(created.id);
		expect(found).toBeNull();
	});
});
