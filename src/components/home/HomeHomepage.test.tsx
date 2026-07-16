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
				name: 'Việc học không dừng ở điều ta biết. Nó thay đổi cách ta nhìn và cách ta làm.',
			}),
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

	it('shows the latest writing and removes the unrelated emotional interlude', () => {
		const post = {
			id: '1',
			title: 'LỜI NGỎ',
			slug: 'loi-ngo',
			summary: 'Một lời mở đầu.',
			publishedAt: '2026-02-15T00:00:00.000Z',
			createdAt: '2026-02-15T00:00:00.000Z',
		} as PostListItemDTO;
		render(<HomeWriting posts={[post]} podcast={null} />);

		expect(screen.getByRole('link', { name: /LỜI NGỎ/i })).toHaveAttribute(
			'href',
			'/bai-viet/loi-ngo',
		);
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
});
