import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Page from './page';

const { auth, courses, report, learnerReport } = vi.hoisted(() => ({
	auth: vi.fn(),
	courses: vi.fn(),
	report: vi.fn(),
	learnerReport: vi.fn(),
}));
vi.mock('@/lib/auth', () => ({ auth }));
vi.mock('@/lib/prisma', () => ({ prisma: { learnCourse: { findMany: courses } } }));
vi.mock('@/features/learn', () => ({
	getLearnStudyReport: report,
	getLearnStudyLearnerReport: learnerReport,
}));
vi.mock('next/navigation', () => ({
	redirect: (url: string) => {
		throw new Error('redirect:' + url);
	},
}));

describe('admin course analytics', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		learnerReport.mockResolvedValue(null);
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

	it('shows a selected learner and keeps course/day filters in session pagination links', async () => {
		learnerReport.mockResolvedValue({
			userId: 'student&one',
			name: 'Nguyễn An',
			email: 'an@example.test',
			totalSeconds: 120,
			activeDays: 1,
			averageSecondsPerActiveDay: 120,
			sessionCount: 21,
			page: 1,
			totalPages: 2,
			daily: [
				{
					day: '2026-10-03',
					seconds: 120,
					sessions: 1,
					sectionCount: 1,
					sections: [{ sectionId: 's1', title: 'Khái niệm quản trị', seconds: 120 }],
				},
			],
			sessions: [
				{
					id: 'visit-1',
					startedAt: '2026-10-03T13:00:00Z',
					lastActivityAt: '2026-10-03T14:00:00Z',
					seconds: 120,
				},
			],
		});
		render(
			await Page({
				searchParams: Promise.resolve({ course: 'itm', days: '7', user: 'student&one' }),
			}),
		);
		expect(learnerReport).toHaveBeenCalledWith('itm', 7, 'student&one', 1);
		expect(
			screen.getByRole('heading', { name: 'Chi tiết học viên: Nguyễn An' }),
		).toBeInTheDocument();
		expect(screen.getByText('Khái niệm quản trị · 2 phút')).toBeInTheDocument();
		expect(screen.getByText(/khoảng giữa hai mốc có thể có lúc nghỉ/)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Phiên sau →' })).toHaveAttribute(
			'href',
			'/admin/learn-analytics?course=itm&days=7&page=1&user=student%26one&sessionPage=2#learner-study-title',
		);
	});
	it('handles a learner without history and does not interpret missing records as active time', async () => {
		render(await Page({ searchParams: Promise.resolve({ course: 'itm', user: 'missing' }) }));
		expect(screen.getByText(/Không có phiên truy cập của học viên/)).toBeInTheDocument();
	});
	it('rejects oversized learner input without running a learner query', async () => {
		render(await Page({ searchParams: Promise.resolve({ user: 'a'.repeat(129) }) }));
		expect(learnerReport).not.toHaveBeenCalled();
	});
	it('does not query reports for a student', async () => {
		auth.mockResolvedValue({ user: { role: 'student' } });
		render(await Page({ searchParams: Promise.resolve({ course: 'hrm', user: 'student' }) }));
		expect(courses).not.toHaveBeenCalled();
		expect(report).not.toHaveBeenCalled();
		expect(learnerReport).not.toHaveBeenCalled();
	});
	it('redirects guests before querying the database', async () => {
		auth.mockResolvedValue(null);
		await expect(Page({ searchParams: Promise.resolve({ user: 'student' }) })).rejects.toThrow(
			'redirect:/dang-nhap',
		);
		expect(courses).not.toHaveBeenCalled();
		expect(report).not.toHaveBeenCalled();
		expect(learnerReport).not.toHaveBeenCalled();
	});
});
