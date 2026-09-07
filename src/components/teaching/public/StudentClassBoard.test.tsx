import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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
	it('opens the requested public tab without flashing attendance first', () => {
		render(<StudentClassBoard board={board()} initialTab="cp" />);
		expect(screen.getByRole('tab', { name: 'Điểm CP' })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByRole('heading', { name: 'Bảng điểm CP' })).toBeInTheDocument();
		expect(screen.queryByRole('heading', { name: 'Bảng điểm danh' })).not.toBeInTheDocument();
	});

	it('offers Learning Experience alongside attendance, CP and groups', () => {
		render(<StudentClassBoard board={board()} groupBoardEnabled />);
		expect(screen.getByRole('tab', { name: 'Điểm danh' })).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: 'Điểm CP' })).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: 'Xếp nhóm' })).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: 'Learning Experience' })).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: 'Class Notes' })).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: 'Active Recall' })).toBeInTheDocument();
	});

	it('lists enabled Active Recall decks on the class board', () => {
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
		expect(screen.getByRole('tab', { name: 'Active Recall' })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByRole('link', { name: /HRM · Lesson 1/i })).toHaveAttribute(
			'href',
			'/lop/hrm-101/active-recall/hrm-lesson-1',
		);
	});

	it('keeps tutorial selection scoped across the public attendance board', () => {
		const contentBoard = board();
		contentBoard.tutorials = [
			{ id: 'tutorial-1', classId: 'class-1', code: 'T01', name: 'Nhóm 01', room: '', scheduleNote: '', displayOrder: 0, studentCount: 2 },
			{ id: 'tutorial-2', classId: 'class-1', code: 'T02', name: 'Nhóm 02', room: '', scheduleNote: '', displayOrder: 1, studentCount: 1 },
		];
		contentBoard.sessions.push({ ...contentBoard.sessions[0]!, id: 'session-2', tutorialClassId: 'tutorial-2' });
		contentBoard.students.push({ ...contentBoard.students[0]!, enrollmentId: 'e3', tutorialClassId: 'tutorial-2', studentCode: '********77', marks: { 'session-2': { status: 'PRESENT' } }, participation: { 'session-2': { points: 1, note: '' } } });
		render(<StudentClassBoard board={contentBoard} />);
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
			{ id: 'tutorial-1', classId: 'class-1', code: 'T01', name: 'Nhóm 01', room: '', scheduleNote: '', displayOrder: 0, studentCount: 2 },
		];
		contentBoard.students.push({
			...contentBoard.students[0]!,
			enrollmentId: 'e-unassigned',
			tutorialClassId: null,
			studentCode: '********00',
			givenName: 'Chưa phân',
		});
		render(<StudentClassBoard board={contentBoard} />);
		expect(screen.getByLabelText('Tutorial')).toHaveValue('');
		expect(screen.getByRole('option', { name: 'Toàn lớp' })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: 'Chưa phân tutorial' })).toBeInTheDocument();
		expect(screen.getByText('********00')).toBeInTheDocument();
		expect(screen.getByText('********45')).toBeInTheDocument();
		expect(screen.getByText(/3 SV/)).toBeInTheDocument();
		fireEvent.change(screen.getByLabelText('Tutorial'), { target: { value: 'tutorial-1' } });
		expect(screen.queryByText('********00')).not.toBeInTheDocument();
		fireEvent.change(screen.getByLabelText('Tutorial'), { target: { value: '__unassigned__' } });
		expect(screen.getByText('********00')).toBeInTheDocument();
		expect(screen.queryByText('********45')).not.toBeInTheDocument();
	});

	it('opens published Class Notes and switches between note pages', () => {
		const contentBoard = board();
		contentBoard.notes = [
			{ id: 'note-1', title: 'Tuần 1', html: '<p>Nội dung tuần 1</p>', publishedAt: '2026-09-01T00:00:00.000Z' },
			{ id: 'note-2', title: 'Topic A', html: '<p>Nội dung topic A</p>', publishedAt: '2026-09-02T00:00:00.000Z' },
		];
		render(<StudentClassBoard board={contentBoard} initialTab="notes" />);
		expect(screen.getByRole('tab', { name: 'Class Notes' })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByRole('heading', { name: 'Tuần 1' })).toBeInTheDocument();
		expect(screen.getByText('Nội dung tuần 1')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Topic A' }));
		expect(screen.getByRole('heading', { name: 'Topic A' })).toBeInTheDocument();
		expect(screen.getByText('Nội dung topic A')).toBeInTheDocument();
	});

	it('shows the public summary, announcement, description and resource links', () => {
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
	});

	it('hides the group board and falls back to attendance when disabled', () => {
		render(<StudentClassBoard board={board()} initialTab="groups" />);
		expect(screen.queryByRole('tab', { name: 'Xếp nhóm' })).not.toBeInTheDocument();
		expect(screen.getByRole('tab', { name: 'Điểm danh' })).toHaveAttribute('aria-selected', 'true');
		expect(screen.queryByText('Bảng xếp nhóm')).not.toBeInTheDocument();
	});

	it('keeps the public board read-only and filters by student code after four characters', () => {
		render(<StudentClassBoard board={board()} />);
		fireEvent.click(screen.getByRole('button', { name: 'Quy định lớp' }));
		expect(screen.getByRole('dialog')).toHaveTextContent('Mang thẻ sinh viên');
		expect(screen.getByRole('dialog')).toHaveTextContent('Có mặt trước giờ học');
		const grid = screen.getByTestId('attendance-grid');
		const search = screen.getByPlaceholderText('Tìm tên hoặc MSV');

		expect(grid.querySelectorAll('tbody tr')).toHaveLength(2);
		expect(screen.queryAllByRole('button', { name: /tuần 1/i })).toHaveLength(0);
		fireEvent.change(search, { target: { value: '**' } });
		expect(grid.querySelectorAll('tbody tr')).toHaveLength(2);
		fireEvent.change(search, { target: { value: '45' } });
		expect(grid.querySelectorAll('tbody tr')).toHaveLength(1);
		expect(screen.getAllByText('Nguyễn An').length).toBeGreaterThan(0);
		expect(screen.queryByText('Trần Bình')).not.toBeInTheDocument();
		fireEvent.change(search, { target: { value: 'Nguyễn' } });
		expect(grid.querySelectorAll('tbody tr')).toHaveLength(1);
		expect(screen.getAllByText('Nguyễn An').length).toBeGreaterThan(0);
	});

	it('keeps a locked attendance week visible while leaving its stored mark intact', () => {
		const lockedBoard = board();
		lockedBoard.sessions[0] = { ...lockedBoard.sessions[0]!, attendanceOpen: false };
		render(<StudentClassBoard board={lockedBoard} />);

		expect(
			screen.getByLabelText('********45 tuần 1: Có mặt - Chủ động hỗ trợ nhóm'),
		).toHaveAttribute('data-status', 'PRESENT');
		expect(
			screen.getByLabelText('********45 tuần 1: Có mặt - Chủ động hỗ trợ nhóm'),
		).toHaveAttribute('title', 'Có mặt - Chủ động hỗ trợ nhóm');
		expect(lockedBoard.students[0]!.marks['session-1']).toEqual({
			status: 'PRESENT',
			note: 'Chủ động hỗ trợ nhóm',
		});
	});

	it('shows the weekly CP note in the student tooltip', () => {
		render(<StudentClassBoard board={board()} />);
		fireEvent.click(screen.getByRole('tab', { name: 'Điểm CP' }));
		expect(screen.getByLabelText('********45 tuần 1: 1 điểm CP - Trình bày tốt')).toHaveAttribute(
			'title',
			'1 điểm CP - Trình bày tốt',
		);
	});
});
