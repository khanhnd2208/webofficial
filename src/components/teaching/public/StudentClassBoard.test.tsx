import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import type { PublicClassBoard } from '@/features/teaching/types';

import { StudentClassBoard } from './StudentClassBoard';

function board(): PublicClassBoard {
	const cp = {
		takenSessions: 1,
		unexcusedAbsences: 0,
		excusedAbsences: 0,
		lateCount: 0,
		presentCount: 1,
		makeupCount: 0,
		participationTotal: 1,
		giftDeduction: 0,
		absenceDeduction: 0,
		attendanceScore: 5,
		banLimit: 2,
		banned: false,
		examEligible: true,
		cp: 1,
		totalScore: 6,
		riskLevel: 'OK' as const,
	};
	return {
		slug: 'hrm-101',
		title: 'Human Resource Management',
		summary: '',
		description: '',
		announcement: '',
		courseCode: 'HRM101',
		courseName: 'Human Resource Management',
		groupNo: '01',
		term: 'Fall 2026',
		credits: 3,
		lecturerName: 'Nguyễn Duy Khánh',
		rules: 'Mang thẻ sinh viên\nCó mặt trước giờ học',
		updatedAt: '2026-09-01T00:00:00.000Z',
		policy: { totalWeeks: 1, absenceThresholdPercent: 20 },
		tutorials: [],
		sessions: [
			{
				id: 'session-1',
				classId: 'class-1',
				tutorialClassId: 'tutorial-1',
				weekNumber: 1,
				heldOn: null,
				topic: '',
				method: 'ROLL_CALL',
				isCancelled: false,
				attendanceTakenAt: '2026-09-01T00:00:00.000Z',
				attendanceOpen: true,
				participationTakenAt: '2026-09-01T00:00:00.000Z',
				participationOpen: true,
			},
		],
		students: [
			{
				enrollmentId: 'e1',
				orderNo: 1,
				tutorialClassId: 'tutorial-1',
				studentCode: '********45',
				familyName: 'Nguyễn',
				givenName: 'An',
				hasDateOfBirth: true,
				enrolledFromWeek: 1,
				marks: { 'session-1': { status: 'PRESENT', note: 'Chủ động hỗ trợ nhóm' } },
				participation: { 'session-1': { points: 1, note: 'Trình bày tốt' } },
				cp: { ...cp, giftDeduction: 0 },
			},
			{
				enrollmentId: 'e2',
				orderNo: 2,
				tutorialClassId: 'tutorial-1',
				studentCode: '********99',
				familyName: 'Trần',
				givenName: 'Bình',
				hasDateOfBirth: false,
				enrolledFromWeek: 1,
				marks: { 'session-1': { status: 'LATE' } },
				participation: { 'session-1': { points: 0.5, note: '' } },
				cp: { ...cp, giftDeduction: 0, cp: 0.5 },
			},
		],
		links: [],
		notes: [],
	};
}

describe('StudentClassBoard', () => {
	beforeEach(() => {
		window.localStorage.clear();
		window.history.replaceState(null, '', '/lop/hrm-101');
	});

	it('opens on Của tôi by default with the identity picker and compact 4-item navigation', () => {
		render(<StudentClassBoard board={board()} groupBoardEnabled />);
		expect(screen.getByRole('tab', { name: 'Của tôi' })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByRole('tab', { name: 'Bảng điểm' })).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: 'Nhóm' })).toBeInTheDocument();
		expect(screen.queryByRole('tab', { name: 'Ghi chú lớp' })).not.toBeInTheDocument();
		expect(screen.queryByRole('tab', { name: 'Ôn tập' })).not.toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Bạn là ai trong lớp?' })).toBeInTheDocument();
	});

	it('remembers the selected student on Của tôi and lets them switch identity', () => {
		render(<StudentClassBoard board={board()} />);
		fireEvent.click(screen.getByRole('button', { name: /Nguyễn An/ }));
		expect(screen.getByRole('heading', { name: 'Chào Nguyễn An' })).toBeInTheDocument();
		expect(window.localStorage.getItem('teaching-public-me:hrm-101')).toBe('e1');

		fireEvent.click(screen.getByRole('button', { name: 'Đổi' }));
		expect(screen.getByRole('heading', { name: 'Bạn là ai trong lớp?' })).toBeInTheDocument();
		expect(window.localStorage.getItem('teaching-public-me:hrm-101')).toBeNull();
	});

	it('opens the requested legacy cp tab directly in Bảng điểm without flashing attendance first', () => {
		render(<StudentClassBoard board={board()} initialTab="cp" />);
		expect(screen.getByRole('tab', { name: 'Bảng điểm' })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByTestId('participation-grid')).toBeInTheDocument();
		expect(screen.queryByTestId('attendance-grid')).not.toBeInTheDocument();
	});

	it('falls back to Của tôi when ?tab=recall has no decks', () => {
		render(<StudentClassBoard board={board()} initialTab="recall" />);
		expect(screen.getByRole('tab', { name: 'Của tôi' })).toHaveAttribute('aria-selected', 'true');
	});

	it('opens the learning style sheet over Của tôi for legacy ?tab=learning links', () => {
		render(<StudentClassBoard board={board()} initialTab="learning" />);
		expect(screen.getByRole('tab', { name: 'Của tôi' })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByRole('dialog', { name: 'Phong cách học' })).toBeInTheDocument();
	});

	it('lists enabled review decks under Ôn tập on the class board', () => {
		const contentBoard = board();
		contentBoard.recallDecks = [
			{
				id: 'deck-1',
				slug: 'hrm-lesson-1',
				title: 'HRM · Lesson 1 — Introduction to HRM',
				lessonLabel: 'Lesson 1',
				description: 'Foundations',
				cardCount: 28,
			},
		];
		render(<StudentClassBoard board={contentBoard} initialTab="recall" />);
		expect(screen.getByRole('tab', { name: 'Ôn tập' })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByRole('link', { name: /HRM · Lesson 1/i })).toHaveAttribute(
			'href',
			'/lop/hrm-101/active-recall/hrm-lesson-1',
		);
	});

	it('keeps tutorial selection scoped across the public attendance board', () => {
		const contentBoard = board();
		contentBoard.tutorials = [
			{
				id: 'tutorial-1',
				classId: 'class-1',
				code: 'T01',
				name: 'Nhóm 01',
				room: '',
				scheduleNote: '',
				displayOrder: 0,
				studentCount: 2,
			},
			{
				id: 'tutorial-2',
				classId: 'class-1',
				code: 'T02',
				name: 'Nhóm 02',
				room: '',
				scheduleNote: '',
				displayOrder: 1,
				studentCount: 1,
			},
		];
		contentBoard.sessions.push({
			...contentBoard.sessions[0]!,
			id: 'session-2',
			tutorialClassId: 'tutorial-2',
		});
		contentBoard.students.push({
			...contentBoard.students[0]!,
			enrollmentId: 'e3',
			tutorialClassId: 'tutorial-2',
			studentCode: '********77',
			marks: { 'session-2': { status: 'PRESENT' } },
			participation: { 'session-2': { points: 1, note: '' } },
		});
		render(<StudentClassBoard board={contentBoard} initialTab="attendance" />);
		const grid = screen.getByTestId('attendance-grid');
		expect(screen.getByLabelText('Tutorial')).toHaveValue('tutorial-1');
		expect(grid.querySelectorAll('tbody tr')).toHaveLength(2);
		fireEvent.change(screen.getByLabelText('Tutorial'), { target: { value: 'tutorial-2' } });
		expect(grid.querySelectorAll('tbody tr')).toHaveLength(1);
		expect(screen.getByText('********77')).toBeInTheDocument();
		expect(screen.queryByText('********45')).not.toBeInTheDocument();
	});

	it('keeps unassigned students visible instead of hiding them behind the first tutorial', () => {
		const contentBoard = board();
		contentBoard.tutorials = [
			{
				id: 'tutorial-1',
				classId: 'class-1',
				code: 'T01',
				name: 'Nhóm 01',
				room: '',
				scheduleNote: '',
				displayOrder: 0,
				studentCount: 2,
			},
		];
		contentBoard.students.push({
			...contentBoard.students[0]!,
			enrollmentId: 'e-unassigned',
			tutorialClassId: null,
			studentCode: '********00',
			givenName: 'Chưa phân',
		});
		render(<StudentClassBoard board={contentBoard} initialTab="attendance" />);
		expect(screen.getByLabelText('Tutorial')).toHaveValue('');
		expect(screen.getByRole('option', { name: 'Toàn lớp' })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: 'Chưa phân tutorial' })).toBeInTheDocument();
		expect(screen.getByText('********00')).toBeInTheDocument();
		expect(screen.getByText('********45')).toBeInTheDocument();
		fireEvent.change(screen.getByLabelText('Tutorial'), { target: { value: 'tutorial-1' } });
		expect(screen.queryByText('********00')).not.toBeInTheDocument();
		fireEvent.change(screen.getByLabelText('Tutorial'), { target: { value: '__unassigned__' } });
		expect(screen.getByText('********00')).toBeInTheDocument();
		expect(screen.queryByText('********45')).not.toBeInTheDocument();
	});

	it('opens published Class Notes when explicitly enabled and switches between note pages', () => {
		const contentBoard = board();
		contentBoard.notes = [
			{
				id: 'note-1',
				title: 'Tuần 1',
				html: '<p>Nội dung tuần 1</p>',
				publishedAt: '2026-09-01T00:00:00.000Z',
			},
			{
				id: 'note-2',
				title: 'Topic A',
				html: '<p>Nội dung topic A</p>',
				publishedAt: '2026-09-02T00:00:00.000Z',
			},
		];
		render(<StudentClassBoard board={contentBoard} initialTab="notes" notesEnabled />);
		expect(screen.getByRole('tab', { name: 'Ghi chú lớp' })).toHaveAttribute(
			'aria-selected',
			'true',
		);
		expect(screen.getByRole('heading', { name: 'Tuần 1' })).toBeInTheDocument();
		expect(screen.getByText('Nội dung tuần 1')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Topic A' }));
		expect(screen.getByRole('heading', { name: 'Topic A' })).toBeInTheDocument();
		expect(screen.getByText('Nội dung topic A')).toBeInTheDocument();
	});

	it('shows the announcement, class info, rules and resource links on Của tôi', () => {
		const contentBoard = board();
		contentBoard.summary = 'Tổng quan ngắn cho lớp.';
		contentBoard.announcement = 'Buổi học ngày mai bắt đầu lúc 08:00.';
		contentBoard.description = 'Chuẩn bị chương 1\nMang theo tài liệu.';
		contentBoard.links = [
			{
				id: 'resource-1',
				label: 'Đề cương học phần',
				url: 'https://example.edu/syllabus',
				description: 'Bản cập nhật mới nhất',
				displayOrder: 0,
			},
		];

		render(<StudentClassBoard board={contentBoard} />);

		expect(screen.getByRole('note')).toHaveTextContent('Buổi học ngày mai bắt đầu lúc 08:00.');
		expect(screen.getByText('Tổng quan ngắn cho lớp.')).toBeInTheDocument();
		expect(screen.getByText(/Chuẩn bị chương 1/)).toHaveClass('whitespace-pre-wrap');
		expect(screen.getByRole('link', { name: /Đề cương học phần/i })).toHaveAttribute(
			'href',
			'https://example.edu/syllabus',
		);
		expect(screen.getByRole('link', { name: /Đề cương học phần/i })).toHaveAttribute(
			'rel',
			'noopener noreferrer',
		);
		fireEvent.click(screen.getByRole('button', { name: /Quy định lớp/ }));
		expect(screen.getByRole('dialog')).toHaveTextContent('Mang thẻ sinh viên');
	});

	it('hides Class Notes and falls back to Của tôi by default', () => {
		const contentBoard = board();
		contentBoard.notes = [
			{
				id: 'note-1',
				title: 'Tuần 1',
				html: '<p>Nội dung tuần 1</p>',
				publishedAt: '2026-09-01T00:00:00.000Z',
			},
		];
		render(<StudentClassBoard board={contentBoard} initialTab="notes" />);
		expect(screen.queryByRole('tab', { name: 'Ghi chú lớp' })).not.toBeInTheDocument();
		expect(screen.getByRole('tab', { name: 'Của tôi' })).toHaveAttribute('aria-selected', 'true');
		expect(screen.queryByText('Nội dung tuần 1')).not.toBeInTheDocument();
	});

	it('hides the group board and falls back to Của tôi when disabled', () => {
		render(<StudentClassBoard board={board()} initialTab="groups" />);
		expect(screen.queryByRole('tab', { name: 'Nhóm' })).not.toBeInTheDocument();
		expect(screen.getByRole('tab', { name: 'Của tôi' })).toHaveAttribute('aria-selected', 'true');
	});

	it('keeps the public board read-only and filters by student code or name', () => {
		render(<StudentClassBoard board={board()} initialTab="attendance" />);
		const grid = screen.getByTestId('attendance-grid');
		const search = screen.getByPlaceholderText('Tìm trong 2 sinh viên');

		expect(grid.querySelectorAll('tbody tr')).toHaveLength(2);
		expect(screen.queryByRole('columnheader', { name: 'Trạng thái' })).not.toBeInTheDocument();
		expect(screen.queryByLabelText('Đây là tôi')).not.toBeInTheDocument();
		expect(screen.queryAllByRole('button', { name: /tuần 1/i })).toHaveLength(0);
		expect(
			screen.getByRole('button', { name: /Chọn bạn là ai để ghim hàng của bạn/ }),
		).toBeInTheDocument();

		fireEvent.change(search, { target: { value: '45' } });
		expect(grid.querySelectorAll('tbody tr')).toHaveLength(1);
		expect(screen.getAllByText('Nguyễn An').length).toBeGreaterThan(0);
		expect(grid.textContent).not.toContain('Trần Bình');
		fireEvent.change(search, { target: { value: 'Nguyễn' } });
		expect(grid.querySelectorAll('tbody tr')).toHaveLength(1);

		fireEvent.click(screen.getByRole('button', { name: 'CP' }));
		expect(screen.getByTestId('participation-grid')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Tổng kết' }));
		expect(screen.getByTestId('summary-locked')).toBeInTheDocument();
	});

	it('defaults the gradebook tutorial filter to the identified student tutorial', () => {
		const contentBoard = board();
		contentBoard.tutorials = [
			{
				id: 'tutorial-1',
				classId: 'class-1',
				code: 'T01',
				name: 'Nhóm 01',
				room: '',
				scheduleNote: '',
				displayOrder: 0,
				studentCount: 2,
			},
			{
				id: 'tutorial-2',
				classId: 'class-1',
				code: 'T02',
				name: 'Nhóm 02',
				room: '',
				scheduleNote: '',
				displayOrder: 1,
				studentCount: 1,
			},
		];
		contentBoard.sessions.push({
			...contentBoard.sessions[0]!,
			id: 'session-2',
			tutorialClassId: 'tutorial-2',
		});
		contentBoard.students.push({
			...contentBoard.students[0]!,
			enrollmentId: 'e3',
			tutorialClassId: 'tutorial-2',
			studentCode: '********77',
			familyName: 'Lê',
			givenName: 'Chi',
			marks: { 'session-2': { status: 'PRESENT' } },
			participation: { 'session-2': { points: 1, note: '' } },
		});

		render(<StudentClassBoard board={contentBoard} />);
		fireEvent.click(screen.getByRole('button', { name: /Lê Chi/ }));
		fireEvent.click(screen.getByRole('tab', { name: 'Bảng điểm' }));

		expect(screen.getByLabelText('Tutorial')).toHaveValue('tutorial-2');
		expect(screen.getByTestId('attendance-grid').querySelectorAll('tbody tr')).toHaveLength(1);
	});

	it('keeps a locked attendance week visible while leaving its stored mark intact', () => {
		const lockedBoard = board();
		lockedBoard.sessions[0] = { ...lockedBoard.sessions[0]!, attendanceOpen: false };
		render(<StudentClassBoard board={lockedBoard} initialTab="attendance" />);

		expect(
			screen.getByLabelText('********45 tuần 1: Có mặt - Chủ động hỗ trợ nhóm'),
		).toHaveAttribute('data-status', 'PRESENT');
		expect(
			screen.getByLabelText('********45 tuần 1: Có mặt - Chủ động hỗ trợ nhóm'),
		).toHaveAttribute('title', 'Có mặt - Chủ động hỗ trợ nhóm');
	});

	it('shows the weekly CP note in the student tooltip', () => {
		render(<StudentClassBoard board={board()} initialTab="cp" />);
		expect(screen.getByLabelText('********45 tuần 1: 1 điểm CP - Trình bày tốt')).toHaveAttribute(
			'title',
			'1 điểm CP - Trình bày tốt',
		);
	});

	it('locks the summary view until all 10 weeks of attendance and CP are finalized', () => {
		const tenWeekBoard = board();
		tenWeekBoard.policy = { totalWeeks: 10, absenceThresholdPercent: 20 };
		tenWeekBoard.sessions = Array.from({ length: 10 }, (_, index) => ({
			id: `session-${index + 1}`,
			classId: 'class-1',
			tutorialClassId: 'tutorial-1',
			weekNumber: index + 1,
			heldOn: null,
			topic: '',
			method: 'ROLL_CALL' as const,
			isCancelled: false,
			attendanceTakenAt: '2026-09-01T00:00:00.000Z',
			attendanceOpen: false,
			participationTakenAt: index < 9 ? '2026-09-01T00:00:00.000Z' : null,
			participationOpen: index === 9,
		}));

		render(<StudentClassBoard board={tenWeekBoard} initialTab="summary" />);
		expect(screen.getByRole('tab', { name: 'Bảng điểm' })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByTestId('summary-locked')).toBeInTheDocument();
		expect(screen.queryByTestId('summary-grid')).not.toBeInTheDocument();
	});

	it('displays final summary scores once all 10 weeks of attendance and CP are locked', () => {
		const unlockedBoard = board();
		unlockedBoard.policy = {
			totalWeeks: 10,
			absenceThresholdPercent: 20,
			attendanceMaxPoints: 5,
			cpMaxPoints: 5,
		};
		unlockedBoard.students[1] = {
			...unlockedBoard.students[1]!,
			cp: {
				...unlockedBoard.students[1]!.cp,
				totalScore: 5.5,
			},
		};
		unlockedBoard.sessions = Array.from({ length: 10 }, (_, index) => ({
			id: `session-${index + 1}`,
			classId: 'class-1',
			tutorialClassId: 'tutorial-1',
			weekNumber: index + 1,
			heldOn: null,
			topic: '',
			method: 'ROLL_CALL' as const,
			isCancelled: false,
			attendanceTakenAt: '2026-09-01T00:00:00.000Z',
			attendanceOpen: false,
			participationTakenAt: '2026-09-01T00:00:00.000Z',
			participationOpen: false,
		}));

		render(<StudentClassBoard board={unlockedBoard} initialTab="summary" />);
		const grid = screen.getByTestId('summary-grid');
		expect(grid).toBeInTheDocument();
		expect(grid.textContent).toContain('5,0 / 5');
		expect(grid.textContent).toContain('1,0 / 5');
		expect(grid.textContent).toContain('6,0 / 10');
		expect(grid.textContent).toContain('5,5 / 10');
	});
});
