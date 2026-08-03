import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomeHero from './HomeHero';
import HomeWriting from './HomeWriting';
import type { PostListItemDTO } from '@/types/post';

describe('Duy Khánh homepage components', () => {
	it('renders one H1, accessible art and both hero paths without client hydration', () => {
		render(<HomeHero />);

		expect(
			screen.getByRole('heading', {
				level: 1,
				name: 'Learning changes how we see — and how we act.',
			}),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Young lecturer, passionate about making education an art/i),
		).toBeInTheDocument();
		expect(
			screen.getByRole('img', { name: /hành trình học hỏi và giảng dạy/i }),
		).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Tìm hiểu về Khánh/i })).toHaveAttribute(
			'href',
			'/gioi-thieu',
		);
		expect(screen.getByRole('link', { name: /Đọc bài viết mới/i })).toHaveAttribute(
			'href',
			'/bai-viet',
		);
	});

	it('shows the latest writing as an editorial list without the emotional interlude', () => {
		const post = {
			id: '1',
			title: 'LỜI NGỎ',
			slug: 'loi-ngo',
			summary: 'Một lời mở đầu.',
			publishedAt: '2026-02-15T00:00:00.000Z',
			createdAt: '2026-02-15T00:00:00.000Z',
		} as PostListItemDTO;
		render(<HomeWriting posts={[post]} podcast={null} />);

		expect(screen.getByRole('heading', { level: 2, name: /Những ghi chép mới/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /LỜI NGỎ/i })).toHaveAttribute(
			'href',
			'/bai-viet/loi-ngo',
		);
		expect(screen.getByText('Một lời mở đầu.')).toBeInTheDocument();
		expect(screen.queryByText(/Emotion leads us/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/^Podcast$/i)).not.toBeInTheDocument();
	});

	it('omits a summary instead of inventing placeholder copy', () => {
		const post = {
			id: '2',
			title: 'Một ghi chép ngắn',
			slug: 'mot-ghi-chep-ngan',
			summary: '',
			publishedAt: '2026-02-16T00:00:00.000Z',
			createdAt: '2026-02-16T00:00:00.000Z',
		} as PostListItemDTO;
		render(<HomeWriting posts={[post]} podcast={null} />);

		expect(screen.queryByText(/Mở bài để đọc/i)).not.toBeInTheDocument();
	});

	it('hides summary when it only repeats the title', () => {
		const post = {
			id: '3',
			title: 'Một ghi chép ngắn',
			slug: 'mot-ghi-chep-ngan',
			summary: '  Một ghi chép ngắn  ',
			publishedAt: '2026-02-16T00:00:00.000Z',
			createdAt: '2026-02-16T00:00:00.000Z',
		} as PostListItemDTO;
		render(<HomeWriting posts={[post]} podcast={null} />);

		expect(screen.getByRole('heading', { level: 3, name: 'Một ghi chép ngắn' })).toBeInTheDocument();
		expect(screen.queryAllByText('Một ghi chép ngắn')).toHaveLength(1);
	});

	it('renders zero, one, two and three writing rows without single-item min-height chrome', () => {
		const base = {
			summary: 'Tóm tắt.',
			publishedAt: '2026-02-16T00:00:00.000Z',
			createdAt: '2026-02-16T00:00:00.000Z',
		};

		const { rerender } = render(<HomeWriting posts={[]} podcast={null} />);
		expect(screen.getByText(/Những ghi chép mới đang được chuẩn bị/i)).toBeInTheDocument();

		for (const count of [1, 2, 3]) {
			const posts = Array.from({ length: count }, (_, index) => ({
				...base,
				id: String(index + 1),
				title: `Bài ${index + 1}`,
				slug: `bai-${index + 1}`,
			})) as PostListItemDTO[];
			rerender(<HomeWriting posts={posts} podcast={null} />);
			expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(count);
		}
	});
});
