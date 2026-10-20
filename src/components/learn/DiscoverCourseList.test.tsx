import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import DiscoverCourseList, { type DiscoverCoursePreview } from './DiscoverCourseList';

vi.mock('@/components/site/SharedArtwork', () => ({
	default: ({ children, className }: { children: React.ReactNode; className?: string }) => (
		<span className={className}>{children}</span>
	),
}));

vi.mock('next/image', () => ({
	default: ({
		src,
		alt,
		onError,
	}: {
		src: string | { src: string };
		alt: string;
		onError?: () => void;
	}) => <img alt={alt} src={typeof src === 'string' ? src : src.src} onError={onError} />,
}));

const course: DiscoverCoursePreview = {
	slug: 'quan-tri-nhan-su-va-to-chuc-hoc-hien-dai',
	title: 'Quản trị nhân sự và tổ chức học hiện đại cho người mới bắt đầu từ những tình huống thật',
	subtitle: 'Một câu dẫn ngắn cho người mới.',
	description: 'Mô tả dài không được hiện khi đã có câu dẫn.',
	category: 'Quản trị',
	level: 'BASIC',
	thumbnailUrl: '/uploads/cover.webp',
	lessonCount: 8,
	totalMinutes: 90,
	lessonTitles: ['Bài mở đầu', 'Bài hai'],
};

describe('DiscoverCourseList', () => {
	it('makes the course overview one keyboard link and keeps the syllabus separate', () => {
		render(<DiscoverCourseList courses={[course]} signedIn={false} />);

		const link = screen.getByRole('link', { name: /Vào khóa học/ });
		expect(link).toHaveAttribute('href', '/khoa-hoc/quan-tri-nhan-su-va-to-chuc-hoc-hien-dai');
		expect(link.className).toContain('focus-visible:outline-accent');
		expect(link).toHaveTextContent(course.title);
		expect(link).toHaveTextContent('Một câu dẫn ngắn cho người mới.');
		expect(link).not.toHaveTextContent('Mô tả dài không được hiện khi đã có câu dẫn.');
		expect(link).toHaveTextContent('Cơ bản · Quản trị · 8 bài · khoảng 1 giờ 30 phút');
		expect(link.querySelector('img')?.getAttribute('src')).toContain('/uploads/cover.webp');
		link.focus();
		expect(link).toHaveFocus();

		const summary = screen.getByText('Xem chương trình');
		expect(summary.className).toContain('min-h-11');
		expect(summary.className).toContain('w-full');
		expect(summary.closest('a')).toBeNull();
		expect(summary.closest('article')).toContainElement(link);
		fireEvent.click(summary);
		expect(screen.getByText('Bài mở đầu')).toBeInTheDocument();
		expect(link).toHaveAttribute('href', '/khoa-hoc/quan-tri-nhan-su-va-to-chuc-hoc-hien-dai');
	});

	it('uses the description when the subtitle is missing and artwork when the image fails', () => {
		const { rerender } = render(
			<DiscoverCourseList
				courses={[
					{
						...course,
						subtitle: '  ',
						description: 'Chỉ còn phần mô tả.',
						thumbnailUrl: null,
						totalMinutes: 0,
						lessonTitles: [],
					},
				]}
				signedIn
			/>,
		);

		const link = screen.getByRole('link', { name: /Vào khóa học/ });
		expect(link).toHaveTextContent('Chỉ còn phần mô tả.');
		expect(link).toHaveTextContent('8 bài');
		expect(link).not.toHaveTextContent('khoảng');
		expect(screen.queryByText('Xem chương trình')).not.toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Khóa học của tôi/ })).toHaveAttribute(
			'href',
			'/my-space/courses',
		);
		expect(link.querySelector('img')?.getAttribute('src') ?? '').not.toContain('/uploads/');

		rerender(
			<DiscoverCourseList
				courses={[
					{ ...course, subtitle: '', description: '', thumbnailUrl: '/uploads/broken.webp' },
				]}
				signedIn={false}
			/>,
		);
		const broken = screen.getByRole('link', { name: /Vào khóa học/ }).querySelector('img');
		expect(broken).not.toBeNull();
		fireEvent.error(broken!);
		expect(
			screen
				.getByRole('link', { name: /Vào khóa học/ })
				.querySelector('img')
				?.getAttribute('src') ?? '',
		).not.toContain('broken.webp');

		rerender(
			<DiscoverCourseList
				courses={[{ ...course, thumbnailUrl: '/uploads/recovered.webp' }]}
				signedIn={false}
			/>,
		);
		expect(
			screen
				.getByRole('link', { name: /Vào khóa học/ })
				.querySelector('img')
				?.getAttribute('src'),
		).toContain('/uploads/recovered.webp');
	});

	it('shows the empty catalog without a course link', () => {
		render(<DiscoverCourseList courses={[]} signedIn={false} />);
		expect(
			screen.getByRole('heading', { name: 'Các khóa học đang được chuẩn bị' }),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', { name: 'Một điều mới bắt đầu từ đây.' }),
		).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: /Vào khóa học/ })).not.toBeInTheDocument();
	});
});
