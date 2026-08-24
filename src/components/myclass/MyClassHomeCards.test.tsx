import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MyClassAdminStudio from './MyClassAdminStudio';
import MyClassHomeCards from './MyClassHomeCards';

const course = {
	id: 'course-1',
	slug: 'hrm-toi-gian',
	title: 'HRM Tối giản',
	summary: 'Ôn lý thuyết nhân sự.',
	description: '',
	thumbnailUrl: null,
	level: null,
	tags: [],
	lessonCount: 10,
	unitCount: 40,
	estimatedMinutes: 120,
	firstUnitHref: '/my-space/my-class/hrm-toi-gian/hrm-la-gi/hrm-sample-l01-s02-k01',
};

describe('My Class studio controls', () => {
	beforeEach(() => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => ({
				ok: true,
				json: async () => ({ ok: true, data: { courses: [] } }),
			})),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('renders each course as a compact row without per-course studio actions', () => {
		render(<MyClassHomeCards courses={[course]} />);
		expect(screen.queryByRole('link', { name: /Thiết kế lớp/ })).not.toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'HRM Tối giản' })).toBeVisible();
		expect(screen.getByRole('link', { name: /HRM Tối giản/ })).toHaveAttribute(
			'href',
			'/my-space/my-class/hrm-toi-gian/hrm-la-gi/hrm-sample-l01-s02-k01',
		);
	});

	it('opens the admin studio and new-course flow from the hub bar', () => {
		render(<MyClassAdminStudio />);
		expect(screen.getByRole('region', { name: 'Studio lớp học' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Mở studio' })).toHaveAttribute(
			'href',
			'/admin/my-class',
		);
		expect(screen.getByRole('link', { name: 'Tạo lớp mới' })).toHaveAttribute(
			'href',
			'/admin/my-class/courses/new',
		);
	});

	it('points the course row at the resumable item when progress is available', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => ({
				ok: true,
				json: async () => ({
					data: {
						courses: [
							{
								courseId: course.id,
								courseSlug: course.slug,
								totalItems: 40,
								completedItems: 12,
								percent: 30,
								currentItem: null,
								nextItem: null,
								resumeItem: { href: '/resume', title: 'Tuyển dụng có hệ thống' },
								afterResumeItem: null,
								isComplete: false,
							},
						],
					},
				}),
			})),
		);
		render(<MyClassHomeCards courses={[course]} />);
		expect(await screen.findByText('30% Hoàn thành')).toBeVisible();
		expect(screen.getByRole('link', { name: /HRM Tối giản/ })).toHaveAttribute('href', '/resume');
	});
});
