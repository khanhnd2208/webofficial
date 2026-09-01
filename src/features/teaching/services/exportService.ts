import writeXlsxFile from 'write-excel-file/node';

import {
	ATTENDANCE_MAX_POINTS,
	CP_MAX_POINTS,
	TOTAL_MAX_POINTS,
	isAttendanceCounted,
} from '../domain/cp';
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
