import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { CpResult } from '@/features/teaching/domain/cp';
import type { TeachingGradebookStudent, TeachingSessionRecord } from '@/features/teaching/types';

import { AttendanceGrid } from './AttendanceGrid';

function cp(overrides: Partial<CpResult> = {}): CpResult {
	return {
		takenSessions: 0,
		unexcusedAbsences: 0,
		excusedAbsences: 0,
		lateCount: 0,
		presentCount: 0,
		makeupCount: 0,
		participationTotal: 0,
		giftDeduction: 0,
		absenceDeduction: 0,
		attendanceScore: 5,
		banLimit: 2,
		banned: false,
		examEligible: true,
		cp: 0,
		totalScore: 5,
		riskLevel: 'OK',
		...overrides,
	};
}

function student(overrides: Partial<TeachingGradebookStudent> = {}): TeachingGradebookStudent {
	return {
		enrollmentId: 'e1',
		studentId: 's1',
		orderNo: 1,
		tutorialClassId: 't1',
		enrolledFromWeek: 1,
		status: 'ACTIVE',
		giftCount: 0,
		studentCode: '2406090045',
		familyName: 'Chu Khải Linh',
		givenName: 'Anh',
		homeClassCode: '2D-24',
		majorName: 'Quản trị Kinh doanh',
		dateOfBirth: '2006-05-29',
		email: null,
		note: '',
		marks: {},
		participation: {},
		cp: cp(),
		...overrides,
	};
}

function sessions(): TeachingSessionRecord[] {
	return Array.from({ length: 10 }, (_, index) => ({
		id: `sess-${index + 1}`,
		classId: 'c1',
		tutorialClassId: 't1',
		weekNumber: index + 1,
		heldOn: null,
		topic: '',
		method: 'ROLL_CALL' as const,
		isCancelled: false,
		attendanceTakenAt: index === 0 ? '2026-09-01T00:00:00.000Z' : null,
		attendanceOpen: index === 0,
		participationTakenAt: null,
		participationOpen: false,
	}));
}

describe('AttendanceGrid', () => {
	it('keeps "Chưa chốt" on past and current weeks and drops it only for future weeks', () => {
		const rows = sessions().map((session) => ({
			...session,
			attendanceTakenAt: null,
			attendanceOpen: session.weekNumber === 3,
		}));
		// Weeks 1–2 were never finalized; week 3 is open. Only weeks 4+ are in the future.
		rows[0] = { ...rows[0], attendanceOpen: false };
		render(<AttendanceGrid students={[student()]} sessions={rows} totalWeeks={10} />);
		const state = (week: number) =>
			screen.getByRole('columnheader', { name: `W${week}` }).querySelector('.mc-grid-week-state')
				?.textContent;
		expect(state(1)).toBe('Chưa chốt');
		expect(state(2)).toBe('Chưa chốt');
		expect(state(3)).toBe('Đang nhập');
		expect(state(4)).toBeUndefined();
	});

	it('renders frozen identity columns, ten week columns and attendance eligibility', () => {
		render(
			<AttendanceGrid
				students={[
					student(),
					student({
						enrollmentId: 'e2',
						studentCode: '2304010103',
						familyName: 'Đỗ Hải',
						givenName: 'Yến',
						orderNo: 2,
						cp: cp({
							unexcusedAbsences: 3,
							banned: true,
							examEligible: false,
							cp: 0,
							riskLevel: 'BANNED',
						}),
					}),
				]}
				sessions={sessions()}
				totalWeeks={10}
				onMarkChange={vi.fn()}
			/>,
		);

		expect(screen.getByRole('columnheader', { name: 'STT' })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: 'Mã SV' })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: 'Họ và tên' })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: /W10/ })).toBeInTheDocument();
		expect(screen.queryByRole('columnheader', { name: 'CP' })).not.toBeInTheDocument();
		expect(screen.getByText('Cấm thi')).toBeInTheDocument();
		expect(screen.getByText('Đủ điều kiện')).toBeInTheDocument();
	});

	it('renders the assigned group number and can hide the eligibility column', () => {
		render(
			<AttendanceGrid
				students={[student(), student({ enrollmentId: 'e2', orderNo: 2, studentCode: 'SV02' })]}
				sessions={sessions()}
				totalWeeks={10}
				groupNumberByEnrollment={{ e1: 3 }}
				showEligibilityColumn={false}
			/>,
		);

		expect(screen.getByRole('columnheader', { name: 'Nhóm' })).toBeInTheDocument();
		expect(screen.getByText('3')).toBeInTheDocument();
		expect(screen.getAllByText('–').length).toBeGreaterThan(0);
		expect(screen.queryByRole('columnheader', { name: 'Trạng thái' })).not.toBeInTheDocument();
		expect(screen.queryByText('Đủ điều kiện')).not.toBeInTheDocument();
	});

	it('exposes page scrolling and a compact mobile student summary', () => {
		render(
			<AttendanceGrid
				students={[student()]}
				sessions={sessions()}
				totalWeeks={10}
				publicCompact
				scrollMode="page"
			/>,
		);

		expect(screen.getByRole('region', { name: 'Bảng điểm danh' })).toHaveAttribute(
			'data-scroll-mode',
			'page',
		);
		expect(screen.getByText('2406090045 · 0/10 vắng')).toBeInTheDocument();
		expect(screen.getByText('Chuyên cần 5,0/5 · Đủ điều kiện')).toBeInTheDocument();
	});

	it('cycles attendance with three clicks: present, late, absent', () => {
		const onMarkChange = vi.fn();
		render(
			<AttendanceGrid
				students={[student()]}
				sessions={sessions()}
				totalWeeks={10}
				onMarkChange={onMarkChange}
			/>,
		);
		const cell = screen.getByRole('button', { name: '2406090045 tuần 1' });
		fireEvent.click(cell);
		fireEvent.click(cell);
		fireEvent.click(cell);
		expect(onMarkChange.mock.calls.map(([payload]) => payload.status)).toEqual([
			'PRESENT',
			'LATE',
			'ABSENT_UNEXCUSED',
		]);
	});

	it('opens and locks attendance without hiding scored marks', () => {
		const onSessionToggle = vi.fn();
		const lockedSessions = sessions().map((session) =>
			session.id === 'sess-1'
				? { ...session, attendanceOpen: false, attendanceTakenAt: null }
				: session,
		);
		const markedStudent = student({
			marks: { 'sess-1': { status: 'PRESENT', note: 'Đã xác nhận' } },
		});
		const { rerender } = render(
			<AttendanceGrid
				students={[markedStudent]}
				sessions={lockedSessions}
				totalWeeks={10}
				onMarkChange={vi.fn()}
				onSessionToggle={onSessionToggle}
			/>,
		);

		expect(screen.getByRole('button', { name: 'Mở điểm danh tuần 1' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: '2406090045 tuần 1 chưa bắt đầu' })).toHaveAttribute(
			'data-status',
			'PRESENT',
		);
		fireEvent.click(screen.getByRole('button', { name: 'Mở điểm danh tuần 1' }));
		expect(onSessionToggle).toHaveBeenCalledWith('sess-1', true);

		rerender(
			<AttendanceGrid
				students={[markedStudent]}
				sessions={sessions()}
				totalWeeks={10}
				onMarkChange={vi.fn()}
				onSessionToggle={onSessionToggle}
			/>,
		);
		expect(screen.getByRole('button', { name: 'Tạm khóa điểm danh tuần 1' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: '2406090045 tuần 1' })).toHaveAttribute(
			'data-status',
			'PRESENT',
		);
	});

	it('selects a week directly from its header', () => {
		const onWeekSelect = vi.fn();
		render(
			<AttendanceGrid
				students={[student()]}
				sessions={sessions()}
				totalWeeks={10}
				onWeekSelect={onWeekSelect}
			/>,
		);
		fireEvent.click(screen.getByRole('button', { name: 'Chọn tuần 10' }));
		expect(onWeekSelect).toHaveBeenCalledWith(10);
	});

	it('edits the week date directly in the column header', () => {
		const onSessionDateChange = vi.fn();
		const dated = sessions().map((session) =>
			session.id === 'sess-1' ? { ...session, heldOn: '2026-09-01' } : session,
		);
		render(
			<AttendanceGrid
				students={[student()]}
				sessions={dated}
				totalWeeks={10}
				onSessionDateChange={onSessionDateChange}
			/>,
		);
		expect(screen.getByText('01/09/26')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Sửa ngày tuần 1' }));
		fireEvent.click(screen.getByRole('button', { name: '15/9/2026' }));
		expect(onSessionDateChange).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'sess-1' }),
			'2026-09-15',
		);
	});

	it('opens a note editor from the context menu without changing attendance', () => {
		const onMarkChange = vi.fn();
		render(
			<AttendanceGrid
				students={[student()]}
				sessions={sessions()}
				totalWeeks={10}
				onMarkChange={onMarkChange}
			/>,
		);
		const cell = screen.getByRole('button', { name: '2406090045 tuần 1' });
		fireEvent.contextMenu(cell);
		expect(screen.getByRole('dialog', { name: 'Ghi chú điểm danh' })).toBeInTheDocument();
		fireEvent.change(screen.getByPlaceholderText('Nhập ghi chú…'), {
			target: { value: 'Có giấy xác nhận' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Lưu ghi chú' }));
		expect(onMarkChange).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'ABSENT_UNEXCUSED', note: 'Có giấy xác nhận' }),
		);
	});

	it('closes the note editor on Escape and restores cell focus', () => {
		render(
			<AttendanceGrid
				students={[student()]}
				sessions={sessions()}
				totalWeeks={10}
				onMarkChange={vi.fn()}
			/>,
		);
		const cell = screen.getByRole('button', { name: '2406090045 tuần 1' });
		cell.focus();
		fireEvent.contextMenu(cell);
		expect(screen.getByRole('dialog', { name: 'Ghi chú điểm danh' })).toBeInTheDocument();
		fireEvent.keyDown(document, { key: 'Escape' });
		expect(screen.queryByRole('dialog', { name: 'Ghi chú điểm danh' })).not.toBeInTheDocument();
		expect(cell).toHaveFocus();
	});

	it('applies keyboard shortcuts to change attendance status', () => {
		const onMarkChange = vi.fn();
		render(
			<AttendanceGrid
				students={[student()]}
				sessions={sessions()}
				totalWeeks={10}
				onMarkChange={onMarkChange}
			/>,
		);
		const cell = screen.getByRole('button', { name: '2406090045 tuần 1' });
		fireEvent.keyDown(cell, { key: 'P' });
		expect(onMarkChange).toHaveBeenCalledWith(
			expect.objectContaining({
				enrollmentId: 'e1',
				sessionId: 'sess-1',
				status: 'PRESENT',
			}),
		);
	});
});
