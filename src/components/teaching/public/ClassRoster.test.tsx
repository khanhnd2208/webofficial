import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { TeachingSessionRecord } from '@/features/teaching/types';

import type { BoardGridStudent } from '../board/gridTypes';
import { ClassRoster } from './ClassRoster';

const sessions: TeachingSessionRecord[] = [1, 2].map((week) => ({
	id: `s${week}`,
	classId: 'c',
	tutorialClassId: 't',
	weekNumber: week,
	heldOn: `2026-09-0${week}`,
	topic: '',
	method: 'ROLL_CALL',
	isCancelled: false,
	attendanceTakenAt: '2026-09-01T00:00:00.000Z',
	attendanceOpen: false,
	participationTakenAt: null,
	participationOpen: false,
}));

function student(id: string, givenName: string, riskLevel = 'OK'): BoardGridStudent {
	return {
		enrollmentId: id,
		orderNo: 1,
		tutorialClassId: 't',
		enrolledFromWeek: 1,
		studentCode: '********45',
		familyName: 'Nguyễn',
		givenName,
		marks: { s1: { status: 'PRESENT', note: '' }, s2: { status: 'LATE', note: 'Kẹt xe' } },
		participation: {},
		cp: {
			unexcusedAbsences: 1,
			attendanceScore: 4.5,
			cp: 0,
			giftDeduction: 0,
			riskLevel,
		} as BoardGridStudent['cp'],
	};
}

describe('ClassRoster', () => {
	it('shows one strip per student and lists every recorded week on tap', () => {
		render(
			<ClassRoster
				students={[student('e1', 'An'), student('e2', 'Bình', 'AT_RISK')]}
				sessions={sessions}
				totalWeeks={4}
				view="attendance"
				meId="e1"
			/>,
		);

		expect(screen.getByText('Bạn')).toBeInTheDocument();
		expect(screen.getByText('Có nguy cơ')).toBeInTheDocument();
		expect(screen.getAllByLabelText('Tuần 2: Muộn · Kẹt xe')).toHaveLength(2);

		const toggle = screen.getByRole('button', { name: 'Nguyễn An' });
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
		fireEvent.click(toggle);
		expect(toggle).toHaveAttribute('aria-expanded', 'true');
		const detail = document.getElementById('roster-detail-e1')!;
		expect(detail).toHaveTextContent('Tuần 1');
		expect(detail).toHaveTextContent('Muộn · Kẹt xe');
		expect(detail).not.toHaveTextContent('Tuần 3');
	});
});
