import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { routes } from '@/config/routes';
import type { TeachingClassListItem } from '@/features/teaching/types';

import { TeachingClassCards } from './TeachingClassCards';

vi.mock('next/navigation', () => ({
	useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

function createMockClass(overrides: Partial<TeachingClassListItem>): TeachingClassListItem {
	return {
		id: 'class-1',
		courseId: 'course-1',
		courseCode: '61MGT3HRM',
		courseName: 'Quản trị nhân sự',
		groupNo: '39-01',
		classCode: '39-01',
		term: 'HỌC KỲ 1 - NĂM HỌC 2026 - 2027',
		credits: 3,
		lecturerName: 'Duy Khanh Nguyen',
		lecturerCode: 'GV01',
		totalWeeks: 10,
		attendanceMaxPoints: 5,
		cpMaxPoints: 5,
		absenceDeductionPoints: 1,
		lateDeductionPoints: 0.5,
		lateCountsTowardAbsenceThreshold: true,
		giftDeductionPoints: 0.5,
		absenceThresholdPercent: 20,
		lateGraceMinutes: 15,
		status: 'ACTIVE',
		publicSlug: 'hrm-39-01',
		publicTitle: 'Quản trị nhân sự',
		publicSummary: '',
		publicDescription: '',
		publicAnnouncement: '',
		attendanceVisible: true,
		classRules: '',
		createdAt: '2026-09-01T00:00:00.000Z',
		updatedAt: '2026-09-01T00:00:00.000Z',
		studentCount: 41,
		tutorialCount: 0,
		sessionsTaken: 1,
		sessionCount: 10,
		averageAttendance: 4.9,
		averageCp: 0,
		averageTotal: 4.9,
		atRiskCount: 0,
		bannedCount: 0,
		canDelete: false,
		deleteBlockers: { students: 41 },
		...overrides,
	};
}

const mockClasses: TeachingClassListItem[] = [
	createMockClass({
		id: 'class-1',
		courseCode: '61MGT3HRM',
		courseName: 'Quản trị nhân sự',
		groupNo: '39-01',
		classCode: '39-01',
		term: 'HỌC KỲ 1 - NĂM HỌC 2026 - 2027',
		status: 'ACTIVE',
		attendanceVisible: true,
		studentCount: 41,
		sessionsTaken: 1,
	}),
	createMockClass({
		id: 'class-2',
		courseCode: '61MGT3OB',
		courseName: 'Hành vi tổ chức',
		groupNo: '38-02',
		classCode: '38-02',
		term: 'HỌC KỲ 2 - NĂM HỌC 2025 - 2026',
		status: 'ARCHIVED',
		attendanceVisible: false,
		studentCount: 35,
		sessionsTaken: 10,
		atRiskCount: 1,
		bannedCount: 1,
	}),
];

describe('TeachingClassCards', () => {
	it('renders empty state when no classes exist', () => {
		render(<TeachingClassCards classes={[]} />);
		expect(screen.getByTestId('teaching-empty-all')).toBeInTheDocument();
		expect(screen.getByText('Chưa có lớp học')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Tạo lớp đầu tiên' })).toHaveAttribute(
			'href',
			routes.mySpaceTeachingNew,
		);
	});

	it('defaults to active status filter and displays compact class identity', () => {
		render(<TeachingClassCards classes={mockClasses} />);
		expect(screen.getByText('Lớp 39-01')).toBeInTheDocument();
		expect(screen.getByText('HỌC KỲ 1 - NĂM HỌC 2026 - 2027')).toBeInTheDocument();
		expect(screen.getByText('41')).toBeInTheDocument();
		expect(screen.queryByText('Quản trị nhân sự')).not.toBeInTheDocument();
		expect(screen.queryByText('1/10')).not.toBeInTheDocument();
		const card = screen.getByTestId('teaching-class-card-class-1');
		expect(card).toHaveTextContent('Đang dạy');
		expect(card).toHaveTextContent('Đang chia sẻ');

		expect(screen.queryByText('Lớp 38-02')).not.toBeInTheDocument();

		const link = screen.getByRole('link', { name: 'Mở lớp 39-01' });
		expect(link).toHaveAttribute('href', routes.mySpaceTeachingClassTab('class-1', 'attendance'));
		expect(link).toHaveClass('focus-visible:ring-2');
	});

	it('switches status filter to archived or all', () => {
		render(<TeachingClassCards classes={mockClasses} />);
		const statusSelect = screen.getByTestId('teaching-status-filter');

		// Switch to all
		fireEvent.change(statusSelect, { target: { value: 'all' } });
		expect(screen.getByText('Lớp 39-01')).toBeInTheDocument();
		expect(screen.getByText('Lớp 38-02')).toBeInTheDocument();
		expect(screen.getByText('2 cảnh báo')).toBeInTheDocument();

		// Switch to archived
		fireEvent.change(statusSelect, { target: { value: 'archived' } });
		expect(screen.queryByText('Lớp 39-01')).not.toBeInTheDocument();
		expect(screen.getByText('Lớp 38-02')).toBeInTheDocument();
	});

	it('filters by search keyword and handles no match empty state', () => {
		render(<TeachingClassCards classes={mockClasses} />);
		const searchInput = screen.getByTestId('teaching-search-input');

		fireEvent.change(searchInput, { target: { value: 'nhân sự' } });
		expect(screen.getByText('Lớp 39-01')).toBeInTheDocument();

		fireEvent.change(searchInput, { target: { value: 'không tồn tại' } });
		expect(screen.getByTestId('teaching-empty-filtered')).toBeInTheDocument();
		expect(screen.getByText('Không có kết quả phù hợp')).toBeInTheDocument();

		// Reset filters button
		fireEvent.click(screen.getByRole('button', { name: 'Đặt lại bộ lọc' }));
		expect(screen.getByText('Lớp 39-01')).toBeInTheDocument();
		expect(screen.queryByText('Lớp 38-02')).not.toBeInTheDocument();
	});

	it('searches by the canonical class code when it differs from the group number', () => {
		render(
			<TeachingClassCards
				classes={[createMockClass({ groupNo: 'Nhóm 01', classCode: 'HRM-A1' })]}
			/>,
		);

		fireEvent.change(screen.getByTestId('teaching-search-input'), {
			target: { value: 'HRM-A1' },
		});
		expect(screen.getByText('Lớp HRM-A1')).toBeInTheDocument();
	});

	it('orders class cards by number instead of update history or string order', () => {
		const classes = [
			createMockClass({ id: 'class-10', classCode: '39-10', groupNo: '39-10' }),
			createMockClass({ id: 'class-2', classCode: '39-2', groupNo: '39-2' }),
			createMockClass({ id: 'class-1', classCode: '39-01', groupNo: '39-01' }),
		];

		render(<TeachingClassCards classes={classes} />);

		expect(screen.getAllByTestId(/teaching-class-card-/).map((card) => card.textContent)).toEqual([
			expect.stringContaining('Lớp 39-01'),
			expect.stringContaining('Lớp 39-2'),
			expect.stringContaining('Lớp 39-10'),
		]);
	});
});
