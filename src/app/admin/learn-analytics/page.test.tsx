import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Page from './page';

const { auth, courses, report } = vi.hoisted(() => ({
	auth: vi.fn(),
	courses: vi.fn(),
	report: vi.fn(),
}));
vi.mock('@/lib/auth', () => ({ auth }));
vi.mock('@/lib/prisma', () => ({ prisma: { learnCourse: { findMany: courses } } }));
vi.mock('@/features/learn', () => ({ getLearnStudyReport: report }));
vi.mock('next/navigation', () => ({
	redirect: (url: string) => {
		throw new Error('redirect:' + url);
	},
}));

describe('admin course analytics', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		auth.mockResolvedValue({ user: { role: 'admin' } });
		courses.mockResolvedValue([
			{ id: 'hrm-id', slug: 'hrm', title: 'HRM' },
			{ id: 'itm-id', slug: 'itm', title: 'ITM — Nhập môn quản trị' },
		]);
		report.mockImplementation(async (slug: string, days: number) => ({
			course: { slug, title: slug.toUpperCase() },
			days,
			trackingSince: null,
			page: 1,
			totalPages: 1,
			totals: {
				visitors: 0,
				visits: 0,
				activeLearners: 0,
				totalSeconds: 0,
				averageSecondsPerActiveLearner: 0,
			},
			daily: [],
			sections: [],
			learners: [],
		}));
	});
	afterEach(cleanup);
	it.each(['hrm', 'itm'])('lets the admin select %s and view its empty report', async (slug) => {
		render(await Page({ searchParams: Promise.resolve({ course: slug, days: '7' }) }));
		expect(report).toHaveBeenCalledWith(slug, 7, 1);
		expect(screen.getByRole('combobox', { name: 'Khóa học' })).toHaveValue(slug);
		expect(screen.getByRole('option', { name: 'HRM' })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: 'ITM — Nhập môn quản trị' })).toBeInTheDocument();
		expect(screen.getByText('Chưa có thời gian học được ghi nhận.')).toBeInTheDocument();
	});
	it('does not query reports for a student', async () => {
		auth.mockResolvedValue({ user: { role: 'student' } });
		render(await Page({ searchParams: Promise.resolve({ course: 'hrm' }) }));
		expect(courses).not.toHaveBeenCalled();
		expect(report).not.toHaveBeenCalled();
	});
	it('redirects guests before querying the database', async () => {
		auth.mockResolvedValue(null);
		await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toThrow(
			'redirect:/dang-nhap',
		);
		expect(courses).not.toHaveBeenCalled();
		expect(report).not.toHaveBeenCalled();
	});
});
