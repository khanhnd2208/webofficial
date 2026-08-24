import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { TeachingGradebookStudent, TeachingSessionRecord } from '@/features/teaching/types';

import { ParticipationGrid } from './ParticipationGrid';

function student(): TeachingGradebookStudent {
	return {
		enrollmentId: 'e1',
		studentId: 's1',
		orderNo: 1,
		tutorialClassId: 't1',
		enrolledFromWeek: 1,
		status: 'ACTIVE',
		studentCode: 'SV01',
		familyName: 'Nguyễn',
		givenName: 'An',
		homeClassCode: 'A',
		majorName: 'M',
		dateOfBirth: null,
		giftCount: 0,
		email: null,
		note: '',
		marks: {},
		participation: {},
		cp: {
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
		},
	};
}

function sessions(): TeachingSessionRecord[] {
	return [
		{
			id: 's1',
			classId: 'c1',
			tutorialClassId: 't1',
			weekNumber: 1,
			heldOn: '2026-09-08',
			topic: '',
			method: 'ROLL_CALL',
			isCancelled: false,
			attendanceTakenAt: null,
			attendanceOpen: false,
			participationTakenAt: '2026-09-01T00:00:00.000Z',
			participationOpen: true,
		},
	];
}

describe('ParticipationGrid', () => {
	it('shows the session date but omits the group column from CP', () => {
		render(<ParticipationGrid students={[student()]} sessions={sessions()} totalWeeks={1} />);

		expect(screen.queryByRole('columnheader', { name: 'Nhóm' })).not.toBeInTheDocument();
		expect(screen.getByText('08/09/26')).toBeInTheDocument();
	});

	it('cycles CP independently through 0.5, 1, 2, 0', () => {
		const onParticipationChange = vi.fn();
		render(
			<ParticipationGrid
				students={[student()]}
				sessions={sessions()}
				totalWeeks={1}
				onParticipationChange={onParticipationChange}
			/>,
		);
		const cell = screen.getByRole('button', { name: /SV01 tuần 1 CP/ });
		fireEvent.click(cell);
		fireEvent.click(cell);
		fireEvent.click(cell);
		fireEvent.click(cell);
		expect(onParticipationChange.mock.calls.map(([payload]) => payload.points)).toEqual([
			0.5, 1, 2, 0,
		]);
	});

	it('renders no editing control in read-only mode', () => {
		render(
			<ParticipationGrid students={[student()]} sessions={sessions()} totalWeeks={1} readOnly />,
		);
		expect(screen.queryByRole('button', { name: /CP/ })).not.toBeInTheDocument();
	});

	it('exposes page scrolling and compact score metadata for public mode', () => {
		render(
			<ParticipationGrid
				students={[student()]}
				sessions={sessions()}
				totalWeeks={1}
				publicCompact
				scrollMode="page"
				readOnly
			/>,
		);

		expect(screen.getByRole('region', { name: 'Bảng điểm CP' })).toHaveAttribute(
			'data-scroll-mode',
			'page',
		);
		expect(screen.getByText('SV01 · Gift −0')).toBeInTheDocument();
		expect(screen.getByText('Attendance 5,0/5 · CP 0,0/5 · Tổng 5,0/10')).toBeInTheDocument();
	});

	it('renders the 5 + 5 score columns without repeating attendance absences', () => {
		const marked = {
			...student(),
			cp: {
				...student().cp,
				unexcusedAbsences: 1,
				absenceDeduction: 0.5,
				attendanceScore: 4.5,
				cp: 3,
				totalScore: 7.5,
			},
		};
		render(<ParticipationGrid students={[marked]} sessions={sessions()} totalWeeks={1} />);

		expect(screen.queryByRole('columnheader', { name: 'Số buổi vắng' })).not.toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: 'Attendance /5' })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: 'CP /5' })).toBeInTheDocument();
		expect(screen.getByRole('columnheader', { name: 'Tổng /10' })).toBeInTheDocument();
		expect(screen.getByText('4,5 / 5')).toBeInTheDocument();
		expect(screen.getByText('3,0 / 5')).toBeInTheDocument();
		expect(screen.getByText('7,5 / 10')).toBeInTheDocument();
	});

	it('saves a weekly CP note from the context menu and exposes it to read-only students', () => {
		const onParticipationChange = vi.fn();
		const marked = {
			...student(),
			participation: { s1: { points: 1, note: 'Phân tích tình huống tốt' } },
		};
		const { rerender } = render(
			<ParticipationGrid
				students={[marked]}
				sessions={sessions()}
				totalWeeks={1}
				onParticipationChange={onParticipationChange}
			/>,
		);
		const cell = screen.getByRole('button', { name: /SV01 tuần 1 CP/ });
		fireEvent.contextMenu(cell);
		expect(screen.getByRole('dialog', { name: 'Ghi chú điểm CP' })).toBeInTheDocument();
		fireEvent.change(screen.getByPlaceholderText('Nhập ghi chú CP…'), {
			target: { value: 'Lập luận rõ ràng' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Lưu ghi chú' }));
		expect(onParticipationChange).toHaveBeenCalledWith({
			enrollmentId: 'e1',
			sessionId: 's1',
			points: 1,
			note: 'Lập luận rõ ràng',
		});

		rerender(
			<ParticipationGrid students={[marked]} sessions={sessions()} totalWeeks={1} readOnly />,
		);
		expect(
			screen.getByLabelText('SV01 tuần 1: 1 điểm CP - Phân tích tình huống tốt'),
		).toHaveAttribute('title', '1 điểm CP - Phân tích tình huống tốt');
	});

	it('selects a CP week directly from its header', () => {
		const onWeekSelect = vi.fn();
		render(
			<ParticipationGrid
				students={[student()]}
				sessions={sessions()}
				totalWeeks={1}
				onWeekSelect={onWeekSelect}
			/>,
		);
		fireEvent.click(screen.getByRole('button', { name: 'Chọn tuần 1' }));
		expect(onWeekSelect).toHaveBeenCalledWith(1);
	});

	it('locks an ungraded CP week and exposes the week toggle', () => {
		const onSessionToggle = vi.fn();
		const locked = [{ ...sessions()[0]!, participationTakenAt: null, participationOpen: false }];
		render(
			<ParticipationGrid
				students={[student()]}
				sessions={locked}
				totalWeeks={1}
				onSessionToggle={onSessionToggle}
			/>,
		);
		const cell = screen.getByRole('button', { name: /SV01 tuần 1 chưa chấm CP/ });
		expect(cell).toBeDisabled();
		expect(cell).toHaveAttribute('data-points', '');
		fireEvent.click(screen.getByRole('button', { name: 'Mở chấm CP tuần 1' }));
		expect(onSessionToggle).toHaveBeenCalledWith('s1', true);
	});

	it('sends Gift add and undo actions', () => {
		const onGiftChange = vi.fn();
		render(
			<ParticipationGrid
				students={[student()]}
				sessions={sessions()}
				totalWeeks={1}
				onGiftChange={onGiftChange}
			/>,
		);
		fireEvent.click(screen.getByRole('button', { name: 'Thêm Gift cho SV01' }));
		expect(onGiftChange).toHaveBeenCalledWith('e1', 1);
		onGiftChange.mockReset();
		const gifted = { ...student(), giftCount: 1, cp: { ...student().cp, giftDeduction: 1 } };
		render(
			<ParticipationGrid
				students={[gifted]}
				sessions={sessions()}
				totalWeeks={1}
				onGiftChange={onGiftChange}
			/>,
		);
		fireEvent.click(screen.getAllByRole('button', { name: 'Hoàn tác Gift SV01' }).at(-1)!);
		expect(onGiftChange).toHaveBeenCalledWith('e1', -1);
	});
});
