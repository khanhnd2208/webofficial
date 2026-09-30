import type { Prisma } from '@prisma/client';

import { AppError } from '@/lib/appError';

import {
	dependencyConflict,
	isEmptyClassScaffold,
	normalizeClassCode,
	normalizeTerm,
} from '../domain/adminLifecycle';
import {
	ensureTeachingCourse,
	lockActiveCourse,
	throwIfCourseArchived,
} from '../domain/courseIdentity';
import { withUniqueConflict } from '../domain/prismaErrors';
import * as repo from '../repositories/teachingRepository';
import { DEFAULT_TUTORIAL_CODE, DEFAULT_TUTORIAL_NAME } from '../repositories/teachingRepository';
import type {
	CreateTeachingClassInput,
	TeachingClassSetupInput,
	UpdateTeachingClassInput,
} from '../schemas';
import { classSnapshotFromLifecycle, mapClass, mapClassListItem, mapGradebook } from './mappers';
import { enablePublishedDecksForClass } from './recallPlacementService';

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

async function enablePublishedDecksInTransaction(
	transaction: Prisma.TransactionClient,
	classId: string,
	courseId: string,
) {
	const decks = await transaction.activeRecallDeck.findMany({
		where: { courseId, status: 'PUBLISHED' },
		select: { id: true, position: true },
	});
	if (!decks.length) return;
	await transaction.teachingClassRecallDeck.createMany({
		data: decks.map((deck) => ({
			classId,
			deckId: deck.id,
			enabled: true,
			displayOrder: deck.position,
		})),
		skipDuplicates: true,
	});
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

async function resolveCourse(input: {
	courseId?: string;
	courseCode?: string;
	courseName?: string;
}) {
	if (input.courseId) {
		const existing = await repo.getCourse(input.courseId);
		if (!existing) throw new AppError('Không tìm thấy môn học', 404, 'NOT_FOUND');
		throwIfCourseArchived(existing.status);
		return existing;
	}
	if (!input.courseCode || !input.courseName) {
		throw new AppError('Hãy chọn môn học', 422, 'VALIDATION');
	}
	const course = await ensureTeachingCourse(repo.prisma, {
		courseCode: input.courseCode,
		courseName: input.courseName,
	});
	throwIfCourseArchived(course.status);
	return course;
}

async function assertClassIdentityAvailable(input: {
	courseId: string;
	classCode: string;
	term: string;
	excludeId?: string;
}) {
	const existing = await repo.findClassByIdentity({
		courseId: input.courseId,
		classCode: input.classCode,
		term: input.term,
	});
	if (existing && existing.id !== input.excludeId) {
		throw new AppError('Lớp với mã này đã tồn tại trong học kỳ đã chọn', 409, 'CLASS_EXISTS', {
			groupNo: 'Mã lớp đã được dùng trong học kỳ này',
			term: 'Học kỳ này đã có lớp cùng mã',
		});
	}
}

export async function createTeachingClass(input: CreateTeachingClassInput) {
	const totalWeeks = input.totalWeeks ?? 10;
	const groupNo = normalizeClassCode(input.groupNo);
	const term = normalizeTerm(input.term);
	const course = await resolveCourse(input);
	await assertClassIdentityAvailable({ courseId: course.id, classCode: groupNo, term });
	const classId = await withUniqueConflict('Lớp với mã này đã tồn tại trong học kỳ đã chọn', () =>
		repo.prisma.$transaction(async (transaction) => {
			await lockActiveCourse(transaction, course.id);
			const teachingClass = await transaction.teachingClass.create({
				data: {
					courseId: course.id,
					courseCode: course.courseCode,
					courseName: course.courseName,
					groupNo,
					classCode: groupNo,
					term,
					credits: input.credits ?? null,
					lecturerName: input.lecturerName ?? '',
					lecturerCode: input.lecturerCode ?? '',
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
			await enablePublishedDecksInTransaction(transaction, teachingClass.id, course.id);
			return teachingClass.id;
		}),
	);
	return getTeachingClass(classId);
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

	const course = await resolveCourse(input.class);
	const groupNo = normalizeClassCode(input.class.groupNo);
	const term = normalizeTerm(input.class.term);
	await assertClassIdentityAvailable({ courseId: course.id, classCode: groupNo, term });
	const classId = await withUniqueConflict(
		'Lớp với mã này đã tồn tại trong học kỳ đã chọn',
		async () =>
			repo.prisma.$transaction(async (transaction) => {
				await lockActiveCourse(transaction, course.id);
				const teachingClass = await transaction.teachingClass.create({
					data: {
						courseId: course.id,
						courseCode: course.courseCode,
						courseName: course.courseName,
						groupNo,
						classCode: groupNo,
						term,
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
					const studentCode = studentInput.studentCode.trim().toUpperCase();
					const existingStudent = await transaction.teachingStudent.findUnique({
						where: { studentCodeNormalized: studentCode },
					});
					const createData = {
						studentCode,
						studentCodeNormalized: studentCode,
						familyName: studentInput.familyName,
						givenName: studentInput.givenName,
						dateOfBirth: studentInput.dateOfBirth
							? new Date(`${studentInput.dateOfBirth}T00:00:00.000Z`)
							: null,
						homeClassCode: studentInput.homeClassCode ?? '',
						majorName: studentInput.majorName ?? '',
						phone: studentInput.phone ?? null,
						email: studentInput.email ?? null,
					};
					const student = existingStudent
						? await transaction.teachingStudent.update({
								where: { id: existingStudent.id },
								data: {
									familyName: existingStudent.familyName.trim()
										? existingStudent.familyName
										: createData.familyName,
									givenName: existingStudent.givenName.trim()
										? existingStudent.givenName
										: createData.givenName,
									dateOfBirth: existingStudent.dateOfBirth ?? createData.dateOfBirth,
									homeClassCode: existingStudent.homeClassCode.trim()
										? existingStudent.homeClassCode
										: createData.homeClassCode,
									majorName: existingStudent.majorName.trim()
										? existingStudent.majorName
										: createData.majorName,
									phone: existingStudent.phone?.trim() ? existingStudent.phone : createData.phone,
									email: existingStudent.email?.trim() ? existingStudent.email : createData.email,
								},
							})
						: await transaction.teachingStudent.create({ data: createData });
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
				await enablePublishedDecksInTransaction(transaction, teachingClass.id, course.id);
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
	const nextCourse =
		input.courseId || input.courseCode || input.courseName
			? await resolveCourse({
					courseId: input.courseId,
					courseCode: input.courseCode ?? existing.courseCode,
					courseName: input.courseName ?? existing.courseName,
				})
			: { id: existing.courseId, courseCode: existing.courseCode, courseName: existing.courseName };
	const nextGroupNo = input.groupNo != null ? normalizeClassCode(input.groupNo) : existing.groupNo;
	const nextTerm = input.term != null ? normalizeTerm(input.term) : existing.term;
	if (
		nextGroupNo !== existing.groupNo ||
		nextTerm !== existing.term ||
		nextCourse.id !== existing.courseId
	) {
		await assertClassIdentityAvailable({
			courseId: nextCourse.id,
			classCode: nextGroupNo,
			term: nextTerm,
			excludeId: id,
		});
	}
	const nextStatus = input.status ?? existing.status;
	const updated = await withUniqueConflict('Lớp với mã này đã tồn tại trong học kỳ đã chọn', () =>
		repo.prisma.$transaction(async (transaction) => {
			if (nextStatus === 'ACTIVE') {
				await lockActiveCourse(transaction, nextCourse.id);
			}
			return transaction.teachingClass.update({
				where: { id },
				data: {
					course: { connect: { id: nextCourse.id } },
					courseCode: nextCourse.courseCode,
					courseName: nextCourse.courseName,
					groupNo: nextGroupNo,
					classCode: nextGroupNo,
					term: nextTerm,
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
				},
				include: {
					tutorials: { orderBy: [{ displayOrder: 'asc' as const }, { code: 'asc' as const }] },
					_count: {
						select: {
							enrollments: true,
							sessions: true,
							tutorials: true,
							notes: true,
							publicLinks: true,
						},
					},
				},
			});
		}),
	);
	if (totalWeeks > existing.totalWeeks) {
		for (const tutorial of updated.tutorials) {
			await ensureWeeksForTutorial(id, tutorial.id, totalWeeks);
		}
	}
	if (nextCourse.id !== existing.courseId) {
		await repo.prisma.teachingClassRecallDeck.deleteMany({ where: { classId: id } });
		await enablePublishedDecksForClass(id, nextCourse.id);
	}
	return mapClass(updated);
}

export async function deleteTeachingClass(id: string) {
	const existing = await repo.getClassLifecycleSnapshot(id);
	if (!existing) notFound();
	const snapshot = classSnapshotFromLifecycle(existing);
	if (!isEmptyClassScaffold(snapshot)) {
		throw dependencyConflict(
			'Chỉ xóa được lớp còn trống, chưa có sinh viên hay nội dung tùy chỉnh',
			{
				students: snapshot.enrollmentCount || undefined,
				attendance: snapshot.attendanceCount || undefined,
				participation: snapshot.participationCount || undefined,
				groups: snapshot.configuredGroupCount || undefined,
				notes: snapshot.noteCount || undefined,
				publicLinks: snapshot.publicLinkCount || undefined,
				customizedSessions: snapshot.customizedSessionCount || undefined,
				studentPage: snapshot.studentPageCount || undefined,
				sharing: snapshot.sharingCount || undefined,
			},
		);
	}
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
