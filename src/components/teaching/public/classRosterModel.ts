import {
	formatTeachingScore,
	isAttendanceCounted,
	isParticipationCounted,
	type AttendanceStatus,
} from '@/features/teaching/domain/cp';
import type { TeachingSessionRecord } from '@/features/teaching/types';

import { sessionDateLabel, weekColumns } from '../admin/attendanceLabels';
import type { BoardGridStudent } from '../board/gridTypes';

export type RosterView = 'attendance' | 'cp';

/** One week of one student, reduced to what the public roster draws. */
export interface RosterCell {
	weekNumber: number;
	/** Short date of the session, or '' when the week has no session yet. */
	date: string;
	kind: 'status' | 'points' | 'pending' | 'cancelled' | 'none' | 'not-enrolled';
	status?: AttendanceStatus;
	points?: number;
	note: string;
	/** Plain-language description for screen readers and the detail list. */
	label: string;
	/** True once the teacher has finalised the week, so the value will not change. */
	final: boolean;
}

export const ATTENDANCE_STATUS_TEXT: Record<AttendanceStatus, string> = {
	PRESENT: 'Có mặt',
	LATE: 'Muộn',
	ABSENT_UNEXCUSED: 'Vắng',
	ABSENT_EXCUSED: 'Vắng có phép',
	MAKEUP: 'Học bù',
};

export function rosterWeeks(sessions: TeachingSessionRecord[], totalWeeks: number) {
	return weekColumns(sessions, totalWeeks);
}

/**
 * Builds the week cells for a student. A week with no session, a cancelled session,
 * a week before the student enrolled, and a week not marked yet each get their own
 * kind so the strip can show them differently from a real mark.
 */
export function rosterCells(
	student: BoardGridStudent,
	weeks: ReturnType<typeof weekColumns>,
	view: RosterView,
): RosterCell[] {
	return weeks.map(({ weekNumber, session }) => {
		const date = session ? sessionDateLabel(session.heldOn, '') : '';
		const base = { weekNumber, date, note: '', final: false };
		if (!session) return { ...base, kind: 'none', label: `Tuần ${weekNumber}: Chưa có buổi` };
		if (session.isCancelled)
			return { ...base, kind: 'cancelled', final: true, label: `Tuần ${weekNumber}: Nghỉ` };
		if (student.enrolledFromWeek > weekNumber)
			return {
				...base,
				kind: 'not-enrolled',
				final: true,
				label: `Tuần ${weekNumber}: Chưa vào lớp`,
			};

		if (view === 'attendance') {
			const mark = student.marks[session.id];
			const note = mark?.note?.trim() ?? '';
			if (!mark?.status)
				return { ...base, kind: 'pending', label: `Tuần ${weekNumber}: Chưa điểm danh` };
			return {
				...base,
				kind: 'status',
				status: mark.status,
				note,
				final: isAttendanceCounted(session),
				label: `Tuần ${weekNumber}: ${ATTENDANCE_STATUS_TEXT[mark.status]}${note ? ` · ${note}` : ''}`,
			};
		}

		const started = Boolean(session.participationOpen || session.participationTakenAt);
		if (!started) return { ...base, kind: 'pending', label: `Tuần ${weekNumber}: Chưa chấm CP` };
		const mark = student.participation[session.id];
		const points = mark?.points ?? 0;
		const note = mark?.note?.trim() ?? '';
		return {
			...base,
			kind: 'points',
			points,
			note,
			final: isParticipationCounted(session),
			label: `Tuần ${weekNumber}: ${formatTeachingScore(points)} điểm CP${note ? ` · ${note}` : ''}`,
		};
	});
}

/** Text for a CP value inside a strip cell: "2", "1", ",5", "1,5"; zero stays visible as "0". */
export function pointsGlyph(points: number): string {
	if (Number.isInteger(points)) return String(points);
	const text = formatTeachingScore(points);
	return points > 0 && points < 1 ? text.replace(/^0/, '') : text;
}
