import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { RecallReport } from '@/features/active-recall/analytics/contracts';
import { RecallAnalyticsReport } from './RecallAnalyticsReport';
vi.mock('./TeachingAppHeader', () => ({
	TeachingAppHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
const report: RecallReport = {
	today: '2026-10-03',
	filters: {
		start: '2026-10-01',
		end: '2026-10-03',
		course: 'course',
		class: 'direct',
		deck: '',
		visitor: '',
		page: 1,
		historyPage: 1,
	},
	totals: {
		visitors: 1,
		learners: 1,
		sessions: 2,
		seconds: 120,
		returning: 1,
		sessionsPerLearner: 2,
		opens: 3,
		reveals: 2,
	},
	daily: [],
	decks: [],
	visitors: [
		{
			publicId: '12345678-abcd',
			firstSeenAt: '2026-10-01T10:00:00Z',
			lastSeenAt: '2026-10-03T10:00:00Z',
			days: 2,
			sessions: 2,
			seconds: 120,
		},
	],
	visitorCount: 26,
	history: [],
	historyCount: 0,
	selectedVisitor: null,
	options: { courses: [{ id: 'course', name: 'HRM' }], classes: [], decks: [] },
};
describe('Recall report', () => {
	it('shows filters and preserves them when opening visitors or paginating', () => {
		render(<RecallAnalyticsReport report={report} />);
		expect(screen.getByRole('heading', { name: 'Thống kê Active Recall' })).toBeVisible();
		expect(screen.getByLabelText('Môn học')).toHaveValue('course');
		expect(screen.getByLabelText('Nguồn lớp')).toHaveValue('direct');
		const link = screen.getByRole('link', { name: 'Khách 12345678' });
		expect(link.getAttribute('href')).toContain('course=course');
		expect(link.getAttribute('href')).toContain('class=direct');
		expect(link.getAttribute('href')).toContain('visitor=12345678-abcd');
		expect(screen.getByRole('link', { name: 'Tiếp →' }).getAttribute('href')).toContain('page=2');
	});
	it('provides accessible charts, zero state and session history', () => {
		render(
			<RecallAnalyticsReport
				report={{
					...report,
					filters: { ...report.filters, visitor: '12345678-abcd' },
					totals: { ...report.totals, visitors: 0 },
					history: [
						{
							sessionId: 'a',
							startedAt: '2026-10-03T10:00:00Z',
							lastActivityAt: '2026-10-03T10:10:00Z',
							engaged: true,
							seconds: 120,
							decks: ['Deck A'],
							classes: ['Không qua link lớp'],
						},
					],
					historyCount: 1,
				}}
			/>,
		);
		expect(screen.getAllByRole('img')).toHaveLength(3);
		expect(screen.getByRole('status')).toHaveTextContent('Chưa có lượt sử dụng');
		expect(screen.getByRole('heading', { name: 'Lịch sử Khách 12345678' })).toBeVisible();
		expect(screen.getByText('Bộ thẻ: Deck A')).toBeVisible();
	});
});
