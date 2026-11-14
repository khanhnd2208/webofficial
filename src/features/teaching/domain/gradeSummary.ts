import {
	ATTENDANCE_MAX_POINTS,
	CP_MAX_POINTS,
	isAttendanceCounted,
	isParticipationCounted,
} from './cp';
import type { TeachingGradebook } from '../types';

export function getGradeSummary(gradebook: TeachingGradebook) {
	const students = gradebook.students.filter((student) => student.status === 'ACTIVE');
	const tutorials = new Map(gradebook.tutorials.map((tutorial) => [tutorial.id, tutorial]));
	const sessionsByTutorialWeek = new Map(
		gradebook.sessions.map((session) => [
			`${session.tutorialClassId}:${session.weekNumber}`,
			session,
		]),
	);
	const weeks = Array.from({ length: gradebook.class.totalWeeks }, (_, index) => index + 1);
	const unfinished = gradebook.tutorials.flatMap((tutorial) =>
		weeks.flatMap((week) => {
			const session = sessionsByTutorialWeek.get(`${tutorial.id}:${week}`);
			if (session?.isCancelled) return [];
			const attendance = !session || !isAttendanceCounted(session);
			const contribution = !session || !isParticipationCounted(session);
			if (!attendance && !contribution) return [];

			return [
				{
					tutorialId: tutorial.id,
					tutorial: tutorial.name || tutorial.code,
					week,
					attendance,
					contribution,
					missingSession: !session,
				},
			];
		}),
	);
	const unassignedCount = students.filter(
		(student) => !student.tutorialClassId || !tutorials.has(student.tutorialClassId),
	).length;

	if (students.length === 0 || unassignedCount > 0 || unfinished.length > 0) {
		return { ready: false as const, studentCount: students.length, unassignedCount, unfinished };
	}

	const attendanceWeight = gradebook.policy.attendanceMaxPoints ?? ATTENDANCE_MAX_POINTS;
	const contributionWeight = gradebook.policy.cpMaxPoints ?? CP_MAX_POINTS;
	return {
		ready: true as const,
		headers: [
			'TT',
			'MSSV',
			'Name',
			'Class',
			'Tut',
			'Eligible for exam',
			`Attendance (${attendanceWeight}%)`,
			`Contribution (${contributionWeight}%)`,
			'Total',
		],
		rows: students.map((student, index) => {
			const tutorial = tutorials.get(student.tutorialClassId ?? '');
			return [
				index + 1,
				student.studentCode,
				`${student.familyName} ${student.givenName}`.trim(),
				student.homeClassCode,
				tutorial?.name || tutorial?.code || '',
				student.cp.examEligible ? 'Yes' : 'No',
				student.cp.attendanceScore,
				student.cp.cp,
				student.cp.totalScore,
			] as const;
		}),
	};
}

export const GRADE_SUMMARY_NOT_READY =
	'Cần hoàn tất điểm danh và CP của lớp trước khi xuất bảng tổng kết.';

export function gradeSummaryFilename({ courseCode, groupNo, term }: TeachingGradebook['class']) {
	const classLabel = `${courseCode}_${groupNo}_${term}`
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.replace(/đ/gi, 'd')
		.replace(/[^a-zA-Z0-9_-]+/g, '-');
	return `${classLabel}_tong-ket.xlsx`;
}
