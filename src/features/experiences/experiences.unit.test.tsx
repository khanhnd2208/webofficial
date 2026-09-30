import { render, fireEvent } from '@testing-library/react';
import StoryCover from './StoryCover';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const posts = vi.hoisted(() => ({ getAllPosts: vi.fn(), getPostBySlug: vi.fn() }));
vi.mock('@/services/postService', () => posts);
const files = vi.hoisted(() => ({ stat: vi.fn(async () => ({ isFile: () => true })) }));
vi.mock('node:fs/promises', async (importOriginal) => {
	const actual = await importOriginal<typeof import('node:fs/promises')>();
	return { ...actual, ...files, default: { ...actual, ...files } };
});

import StoryList from './StoryList';
import { storyCoverSource } from './coverSource';
import ExperienceStoryPage, { generateMetadata } from '@/app/trai-nghiem/[slug]/page';

const story = {
	id: 'story-1',
	slug: 'mot-chuyen-di',
	title: 'Một chuyến đi',
	summary: 'Một góc nhìn mới.',
	thumbnailUrl: '/uploads/chuyen-di.jpg',
	contentFormat: 'html',
	content:
		'<p>Một câu chuyện thật.</p><img src="/uploads/photo.jpg" onerror="alert(1)"><script>alert(2)</script>',
};

describe('experience stories', () => {
	it('links published stories to their own reader and keeps photo covers', async () => {
		posts.getAllPosts.mockResolvedValue({ items: [story], page: 1, totalPages: 2 });
		const html = renderToStaticMarkup(await StoryList({ page: 1 }));
		expect(html).toContain('/trai-nghiem/mot-chuyen-di');
		expect(html).toContain('/uploads/chuyen-di.jpg');
		expect(html).toContain('?page=2#cau-chuyen');
	});

	it('keeps the archive usable when stories cannot be loaded', async () => {
		posts.getAllPosts.mockRejectedValue(new Error('unavailable'));
		const html = renderToStaticMarkup(await StoryList({ page: 1 }));
		expect(html).toContain('Chưa tải được những câu chuyện');
		expect(html).not.toContain('experience-story-card');
	});

	it('removes executable HTML while preserving text and inline photographs', async () => {
		posts.getPostBySlug.mockResolvedValue(story);
		const html = renderToStaticMarkup(
			await ExperienceStoryPage({ params: Promise.resolve({ slug: story.slug }) }),
		);
		expect(html).toContain('Một câu chuyện thật.');
		expect(html).toContain('/uploads/photo.jpg');
		expect(html).not.toContain('onerror');
		expect(html).not.toContain('<script');
	});

	it('does not render stories excluded by the publication filter', async () => {
		posts.getPostBySlug.mockResolvedValue(null);
		await expect(
			ExperienceStoryPage({ params: Promise.resolve({ slug: 'draft-story' }) }),
		).rejects.toThrow();
		const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'draft-story' }) });
		expect(metadata.robots).toEqual({ index: false });
	});
});

it('preserves the cover layout when an old photograph cannot load', () => {
	const { container } = render(<StoryCover src="/uploads/missing-photo.jpg" />);
	const photo = container.querySelector('img')!;
	fireEvent.error(photo);
	expect(container.querySelector('img')).toBeNull();
	expect(container.querySelector('.experience-photo')).not.toBeNull();
});

it('handles a photograph that failed before hydration', () => {
	const completed = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
	const width = vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(0);
	try {
		const { container } = render(<StoryCover src="/uploads/cached-failure.jpg" />);
		expect(container.querySelector('img')).toBeNull();
		expect(container.querySelector('.experience-photo')).not.toBeNull();
	} finally {
		completed.mockRestore();
		width.mockRestore();
	}
});

it('substitutes a decorative cover for uploads missing on the server', async () => {
	files.stat.mockRejectedValueOnce(new Error('ENOENT'));
	expect(await storyCoverSource('/uploads/missing.jpg')).toBe('/brand/learning-landscape.webp');
	expect(await storyCoverSource('https://toiladuykhanh.com/uploads/photo.jpg')).toBe(
		'https://toiladuykhanh.com/uploads/photo.jpg',
	);
});
