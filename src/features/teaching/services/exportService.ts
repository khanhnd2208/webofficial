import writeXlsxFile, { type Cell } from 'write-excel-file/node';

import { AppError } from '@/lib/appError';

import {
	ATTENDANCE_MAX_POINTS,
	CP_MAX_POINTS,
	TOTAL_MAX_POINTS,
	isAttendanceCounted,
} from '../domain/cp';
import {
	GRADE_SUMMARY_NOT_READY,
	getGradeSummary,
	gradeSummaryFilename,
} from '../domain/gradeSummary';
import { getGradebook } from './classService';

const STATUS_LABEL: Record<string, string> = {
	PRESENT: 'Present',
	LATE: 'Late',
	ABSENT_UNEXCUSED: 'Absent',
	ABSENT_EXCUSED: 'Excused',
	MAKEUP: 'Make-up',
};

export async function exportGradebookXlsx(
	classId: string,
): Promise<{ filename: string; buffer: Buffer }> {
	const gradebook = await getGradebook(classId);
	const weeks = Array.from({ length: gradebook.class.totalWeeks }, (_, index) => index + 1);
	const header = [
		'STT',
		'Student code',
		'Family name',
		'Given name',
		'Home class',
		'Major',
		'Date of birth',
		...weeks.map((week) => `W${week}`),
		'Absences',
		'CP tích lũy trước Gift',
		'Gift (-)',
		`Attendance /${gradebook.policy.attendanceMaxPoints ?? ATTENDANCE_MAX_POINTS}`,
		`CP /${gradebook.policy.cpMaxPoints ?? CP_MAX_POINTS}`,
		`Tổng /${TOTAL_MAX_POINTS}`,
		'Status',
	];
	const rows = gradebook.students.map((student) => {
		const weekValues = weeks.map((week) => {
			const session = gradebook.sessions.find(
				(item) => item.tutorialClassId === student.tutorialClassId && item.weekNumber === week,
			);
			if (!session) return '';
			if (week < student.enrolledFromWeek) return '';
			if (!isAttendanceCounted(session)) return '';
			const mark = student.marks[session.id];
			if (!mark) return 'Absent';
			return STATUS_LABEL[mark.status] ?? mark.status;
		});
		return [
			student.orderNo,
			student.studentCode,
			student.familyName,
			student.givenName,
			student.homeClassCode,
			student.majorName,
			student.dateOfBirth ?? '',
			...weekValues,
			student.cp.unexcusedAbsences,
			student.cp.participationTotal,
			-student.cp.giftDeduction,
			student.cp.attendanceScore,
			student.cp.cp,
			student.cp.totalScore,
			student.cp.riskLevel,
		];
	});
	const buffer = await writeXlsxFile([header, ...rows], {
		sheet: 'Gradebook',
		columns: header.map(() => ({ width: 18 })),
	}).toBuffer();
	const filename = `${gradebook.class.courseCode}_${gradebook.class.groupNo}_gradebook.xlsx`;
	return { filename, buffer };
}

export async function exportGradeSummaryXlsx(classId: string) {
	const gradebook = await getGradebook(classId, { consistentSnapshot: true });
	const summary = getGradeSummary(gradebook);
	if (!summary.ready) throw new AppError(GRADE_SUMMARY_NOT_READY, 409, 'CONFLICT');

	const header: Cell[] = summary.headers.map((value, column) => ({
		value,
		fontWeight: 'bold',
		textColor: '#FFFFFF',
		backgroundColor: '#176B63',
		align: column === 2 ? 'left' : 'center',
		alignVertical: 'center',
		height: 24,
	}));
	const rows = summary.rows.map((row, index): Cell[] =>
		row.map((value, column) => ({
			value,
			backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F0F6F4',
			align: column === 2 ? 'left' : 'center',
			alignVertical: 'center',
			height: 20,
			...(column >= 6 ? { format: '0.00' } : {}),
			...(column === 8 ? { fontWeight: 'bold' } : {}),
			...(column === 5 && value === 'No' ? { textColor: '#9F2525' } : {}),
		})),
	);
	const buffer = await writeXlsxFile([header, ...rows], {
		sheet: 'Tổng kết',
		stickyRowsCount: 1,
		showGridLines: false,
		columns: [7, 16, 38, 14, 18, 21, 19, 21, 10].map((width) => ({ width })),
	}).toBuffer();
	return { filename: gradeSummaryFilename(gradebook.class), buffer };
}
