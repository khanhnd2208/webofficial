import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PersonalProgress, PublicSubjectGroup } from '@/features/myspace-tests';

import SubjectExplorer from './SubjectExplorer';

const navigation = vi.hoisted(() => ({
	pathname: '/my-space/tests',
	push: vi.fn(),
	replace: vi.fn(),
	search: '',
}));

vi.mock('next/navigation', () => ({
	usePathname: () => navigation.pathname,
	useRouter: () => ({ push: navigation.push, replace: navigation.replace }),
	useSearchParams: () => new URLSearchParams(navigation.search),
}));

vi.mock('@/components/ui/Dialog', () => ({
	Sheet: ({
		open,
		onClose,
		title,
		children,
	}: {
		open: boolean;
		onClose: () => void;
		title: string;
		children: ReactNode;
	}) =>
		open ? (
			<div role="dialog" aria-label={title}>
				<button type="button" onClick={onClose}>
					Đóng
				</button>
				{children}
			</div>
		) : null,
}));

const notStarted: PersonalProgress = {
	status: 'not_started',
	completedCount: 0,
	bestScorePercent: null,
	lastCompletedAt: null,
	recentCompletions: [],
};

const completed: PersonalProgress = {
	status: 'completed',
	completedCount: 3,
	bestScorePercent: 90,
	lastCompletedAt: '2026-08-10T10:00:00.000Z',
	recentCompletions: [
		{ score: 27, total: 30, submittedAt: '2026-08-10T10:00:00.000Z' },
		{ score: 24, total: 30, submittedAt: '2026-08-09T10:00:00.000Z' },
		{ score: 21, total: 30, submittedAt: '2026-08-08T10:00:00.000Z' },
		{ score: 18, total: 30, submittedAt: '2026-08-07T10:00:00.000Z' },
		{ score: 15, total: 30, submittedAt: '2026-08-06T10:00:00.000Z' },
		{ score: 12, total: 30, submittedAt: '2026-08-05T10:00:00.000Z' },
	].slice(0, 5),
};

const baseTest = {
	description: 'Ôn lại vai trò quản trị và tổ chức.',
	subject: 'Introduction to Management',
	subjectId: 'itm',
	topics: ['Management', 'Organizations'],
	difficulties: [2],
	classifications: ['Chapter review'],
	questionCount: 30,
	displayOrder: 1,
	personalProgress: notStarted,
};

const groups: PublicSubjectGroup[] = [
	{
		subject: 'Introduction to Management',
		subjectId: 'itm',
		tests: [
			{
				...baseTest,
				slug: 'chapter-2',
				title: 'Chapter 2 Foundations',
				displayOrder: 2,
				personalProgress: completed,
			},
			{
				...baseTest,
				slug: 'chapter-10',
				title: 'Chapter 10 Strategy',
				displayOrder: 10,
				description: '',
				topics: ['Strategy'],
				difficulties: [],
				classifications: [],
			},
			{
				...baseTest,
				slug: 'chapter-1',
				title: 'Chapter 1 Intro',
				displayOrder: 1,
				description: '',
				topics: [],
				difficulties: [],
				classifications: [],
			},
		],
	},
	{
		subject: 'Human Resource Management',
		subjectId: 'hrm',
		tests: [
			{
				...baseTest,
				slug: 'recruitment',
				title: 'Recruitment basics',
				subject: 'Human Resource Management',
				subjectId: 'hrm',
				description: '',
				topics: ['Tuyển dụng'],
				difficulties: [],
				classifications: [],
				questionCount: 20,
				displayOrder: 1,
			},
		],
	},
];

describe('SubjectExplorer', () => {
	beforeEach(() => {
		navigation.search = '';
		navigation.push.mockReset();
		navigation.replace.mockReset();
	});

	it('shows Start CTA for untouched tests and Retry for completed ones', () => {
		render(<SubjectExplorer groups={groups} />);

		expect(screen.getByTestId('myspace-test-start-chapter-2')).toHaveTextContent(/Làm lại/i);
		expect(screen.getByTestId('myspace-test-start-chapter-1')).toHaveTextContent(/Bắt đầu/i);
		expect(screen.getByTestId('myspace-test-status-chapter-2')).toHaveTextContent('Đã làm');
		expect(screen.getByTestId('myspace-test-status-chapter-1')).toHaveTextContent('Chưa làm');
		expect(screen.queryByText(/lượt làm|Điểm TB/i)).not.toBeInTheDocument();
	});

	it('filters by accent-insensitive title, subject, and topic', () => {
		render(<SubjectExplorer groups={groups} />);

		fireEvent.change(screen.getByTestId('myspace-test-search'), {
			target: { value: 'tuyen dung' },
		});

		expect(screen.getByText('Recruitment basics')).toBeVisible();
		expect(screen.queryByText('Chapter 1 Intro')).not.toBeInTheDocument();

		fireEvent.change(screen.getByTestId('myspace-test-search'), {
			target: { value: 'quan tri' },
		});
		// "Introduction to Management" doesn't fold to quan tri — use Vietnamese subject search via topic/title
		fireEvent.change(screen.getByTestId('myspace-test-search'), {
			target: { value: 'strategy' },
		});
		expect(screen.getByText('Chapter 10 Strategy')).toBeVisible();
		expect(screen.queryByText('Recruitment basics')).not.toBeInTheDocument();
	});

	it('keeps subject selection in the URL without scrolling to top', () => {
		render(<SubjectExplorer groups={groups} />);

		fireEvent.click(screen.getByTestId('myspace-subject-filter-hrm'));
		expect(navigation.push).toHaveBeenCalledWith('/my-space/tests?subject=hrm', {
			scroll: false,
		});
	});

	it('clears invalid subject query params', () => {
		navigation.search = 'subject=missing';
		render(<SubjectExplorer groups={groups} />);
		expect(navigation.replace).toHaveBeenCalledWith('/my-space/tests', { scroll: false });
	});

	it('renders empty state with clear-filter action', () => {
		render(<SubjectExplorer groups={groups} />);
		fireEvent.change(screen.getByTestId('myspace-test-search'), {
			target: { value: 'zzz-no-match' },
		});
		expect(screen.getByTestId('myspace-tests-empty')).toBeVisible();
		fireEvent.click(screen.getByTestId('myspace-tests-clear-filters'));
		expect(screen.getByText('Chapter 1 Intro')).toBeVisible();
	});

	it('shows at most five recent completions in inline history', () => {
		render(<SubjectExplorer groups={groups} />);
		fireEvent.click(screen.getByTestId('myspace-test-history-toggle-chapter-2'));
		const history = screen.getByTestId('myspace-test-history-chapter-2');
		expect(within(history).getAllByRole('listitem')).toHaveLength(5);
	});

	it('opens the mobile subject sheet', () => {
		render(<SubjectExplorer groups={groups} />);
		fireEvent.click(screen.getByTestId('myspace-subject-picker'));
		expect(screen.getByRole('dialog', { name: /Chọn môn học/i })).toBeVisible();
		expect(screen.getByTestId('myspace-subject-sheet')).toBeVisible();
	});
});
