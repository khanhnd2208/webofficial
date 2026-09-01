import { AppError } from '@/lib/appError';

import { withUniqueConflict } from '../domain/prismaErrors';
import * as repo from '../repositories/teachingRepository';
import { DEFAULT_TUTORIAL_CODE, DEFAULT_TUTORIAL_NAME } from '../repositories/teachingRepository';
import type {
	CreateTeachingClassInput,
	TeachingClassSetupInput,
	UpdateTeachingClassInput,
} from '../schemas';
import { mapClass, mapClassListItem, mapGradebook } from './mappers';

function notFound(entity = 'Class'): never {
	throw new AppError(`${entity} not found`, 404, 'NOT_FOUND');
}

export async function ensureWeeksForTutorial(
	classId: string,
	tutorialClassId: string,
	totalWeeks: number,
) {
	await repo.createSessions(
		Array.from({ length: totalWeeks }, (_, index) => ({
			classId,
			tutorialClassId,
			weekNumber: index + 1,
		})),
	);
}

export async function createDefaultTutorial(classId: string, totalWeeks: number) {
	const tutorial = await repo.createTutorial({
		classId,
		code: DEFAULT_TUTORIAL_CODE,
		name: DEFAULT_TUTORIAL_NAME,
		displayOrder: 0,
	});
	await ensureWeeksForTutorial(classId, tutorial.id, totalWeeks);
	return tutorial;
}

export async function listTeachingClasses() {
	const rows = await repo.listClasses();
	return rows.map(mapClassListItem);
}

export async function countActiveTeachingClasses() {
	return repo.countActiveClasses();
}

export async function getTeachingClass(id: string) {
	const row = await repo.getClass(id);
	if (!row) notFound();
	return mapClass(row);
}

export async function createTeachingClass(input: CreateTeachingClassInput) {
	const totalWeeks = input.totalWeeks ?? 10;
	const created = await withUniqueConflict(
		'A class with this course code, group and term already exists',
		() =>
			repo.createClassRecord({
				courseCode: input.courseCode,
				courseName: input.courseName,
				groupNo: input.groupNo,
				classCode: input.groupNo,
				term: input.term,
				credits: input.credits ?? null,
				lecturerName: input.lecturerName ?? '',
				lecturerCode: input.lecturerCode ?? '',
				totalWeeks,
			}),
	);
	await createDefaultTutorial(created.id, totalWeeks);
	return getTeachingClass(created.id);
}

export async function setupTeachingClass(input: TeachingClassSetupInput) {
	const totalWeeks = input.class.totalWeeks ?? 10;
	const seenCodes = new Set<string>();
	for (const student of input.students) {
		if (seenCodes.has(student.studentCode)) {
			throw new AppError(`Duplicate student code: ${student.studentCode}`, 422, 'VALIDATION');
		}
		seenCodes.add(student.studentCode);
	}

	const classId = await withUniqueConflict(
		'A class with this course code, group and term already exists',
		async () =>
			repo.prisma.$transaction(async (transaction) => {
				const teachingClass = await transaction.teachingClass.create({
					data: {
						courseCode: input.class.courseCode,
						courseName: input.class.courseName,
						groupNo: input.class.groupNo,
						classCode: input.class.groupNo,
						term: input.class.term,
						credits: input.class.credits ?? null,
						lecturerName: input.class.lecturerName ?? '',
						lecturerCode: input.class.lecturerCode ?? '',
						totalWeeks,
					},
				});
				const tutorial = await transaction.teachingTutorialClass.create({
					data: {
						classId: teachingClass.id,
						code: DEFAULT_TUTORIAL_CODE,
						name: DEFAULT_TUTORIAL_NAME,
						displayOrder: 0,
					},
				});
				await transaction.teachingSession.createMany({
					data: Array.from({ length: totalWeeks }, (_, index) => ({
						classId: teachingClass.id,
						tutorialClassId: tutorial.id,
						weekNumber: index + 1,
					})),
				});
				for (const [index, studentInput] of input.students.entries()) {
					const student = await transaction.teachingStudent.upsert({
						where: { studentCode: studentInput.studentCode },
						create: {
							studentCode: studentInput.studentCode,
							familyName: studentInput.familyName,
							givenName: studentInput.givenName,
							dateOfBirth: studentInput.dateOfBirth
								? new Date(`${studentInput.dateOfBirth}T00:00:00.000Z`)
								: null,
							homeClassCode: studentInput.homeClassCode ?? '',
							majorName: studentInput.majorName ?? '',
							phone: studentInput.phone ?? null,
							email: studentInput.email ?? null,
						},
						update: {
							familyName: studentInput.familyName,
							givenName: studentInput.givenName,
							dateOfBirth: studentInput.dateOfBirth
								? new Date(`${studentInput.dateOfBirth}T00:00:00.000Z`)
								: undefined,
							homeClassCode: studentInput.homeClassCode || undefined,
							majorName: studentInput.majorName || undefined,
							phone: studentInput.phone || undefined,
							email: studentInput.email || undefined,
						},
					});
					await transaction.teachingEnrollment.create({
						data: {
							classId: teachingClass.id,
							studentId: student.id,
							tutorialClassId: tutorial.id,
							orderNo: studentInput.orderNo ?? index + 1,
							enrolledFromWeek: studentInput.enrolledFromWeek ?? 1,
						},
					});
				}
				return teachingClass.id;
			}),
	);

	return {
		gradebook: await getGradebook(classId),
		createdStudentCount: input.students.length,
	};
}

export async function updateTeachingClass(id: string, input: UpdateTeachingClassInput) {
	const existing = await repo.getClass(id);
	if (!existing) notFound();
	const attendanceMaxPoints = input.attendanceMaxPoints ?? Number(existing.attendanceMaxPoints);
	const cpMaxPoints = input.cpMaxPoints ?? Number(existing.cpMaxPoints);
	if (Math.abs(attendanceMaxPoints + cpMaxPoints - 10) > 0.0001) {
		throw new AppError('Attendance và CP phải cộng thành 10 điểm.', 422, 'VALIDATION');
	}
	const totalWeeks = input.totalWeeks ?? existing.totalWeeks;
	const updated = await withUniqueConflict(
		'A class with this course code, group and term already exists',
		() =>
			repo.updateClassRecord(id, {
				courseCode: input.courseCode,
				courseName: input.courseName,
				groupNo: input.groupNo,
				classCode: input.groupNo,
				term: input.term,
				credits: input.credits === undefined ? undefined : input.credits,
				lecturerName: input.lecturerName,
				lecturerCode: input.lecturerCode,
				totalWeeks: input.totalWeeks,
				attendanceMaxPoints: input.attendanceMaxPoints,
				cpMaxPoints: input.cpMaxPoints,
				absenceDeductionPoints: input.absenceDeductionPoints,
				lateDeductionPoints: input.lateDeductionPoints,
				lateCountsTowardAbsenceThreshold: input.lateCountsTowardAbsenceThreshold,
				giftDeductionPoints: input.giftDeductionPoints,
				absenceThresholdPercent: input.absenceThresholdPercent,
				lateGraceMinutes: input.lateGraceMinutes,
				status: input.status,
			}),
	);
	if (totalWeeks > existing.totalWeeks) {
		for (const tutorial of updated.tutorials) {
			await ensureWeeksForTutorial(id, tutorial.id, totalWeeks);
		}
	}
	return mapClass(updated);
}

export async function deleteTeachingClass(id: string) {
	const existing = await repo.getClass(id);
	if (!existing) notFound();
	await repo.deleteClassRecord(id);
	return { id };
}

export async function getGradebook(classId: string) {
	const row = await repo.getGradebookClass(classId);
	if (!row) notFound();
	return mapGradebook({
		classRow: row,
		tutorials: row.tutorials,
		sessions: row.sessions,
		enrollments: row.enrollments,
	});
}

export { notFound };
