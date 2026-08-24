import { AppError } from '@/lib/appError';

import { defaultEnrolledFromWeek } from '../domain/cp';
import { parseIsoDate, withUniqueConflict } from '../domain/prismaErrors';
import * as repo from '../repositories/teachingRepository';
import type { AddEnrollmentInput, UpdateEnrollmentInput } from '../schemas';
import { mapRosterStudent } from './mappers';
import { getTeachingClass, notFound } from './classService';

export async function listRoster(classId: string) {
	const row = await repo.getRosterClass(classId);
	if (!row) notFound();
	return {
		class: await getTeachingClass(classId),
		students: row.enrollments.map(mapRosterStudent),
	};
}

export async function addEnrollment(classId: string, input: AddEnrollmentInput) {
	const teachingClass = await getTeachingClass(classId);
	if (input.tutorialClassId) {
		const tutorial = await repo.getTutorial(input.tutorialClassId);
		if (!tutorial || tutorial.classId !== classId) notFound('Tutorial class');
	}
	const existingStudent = await repo.getStudentByCode(input.studentCode);
	if (existingStudent) {
		const existingEnrollment = await repo.getEnrollmentByClassAndStudent(
			classId,
			existingStudent.id,
		);
		if (existingEnrollment?.status === 'ACTIVE') {
			throw new AppError('This student is already on the roster', 409, 'CONFLICT');
		}
	}
	const studentData = {
		studentCode: input.studentCode,
		familyName: input.familyName,
		givenName: input.givenName,
		dateOfBirth: parseIsoDate(input.dateOfBirth),
		homeClassCode: input.homeClassCode ?? '',
		majorName: input.majorName ?? '',
		phone: input.phone ?? null,
		email: input.email ?? null,
	};
	let student: NonNullable<Awaited<ReturnType<typeof repo.getStudentByCode>>>;
	if (existingStudent) {
		await repo.backfillStudentMissingFields(existingStudent, studentData);
		student = (await repo.getStudentByCode(input.studentCode)) ?? existingStudent;
	} else {
		student = await repo.upsertStudent(studentData);
	}
	const orderNo = input.orderNo ?? (await repo.nextEnrollmentOrderNo(classId));
	let enrolledFromWeek = input.enrolledFromWeek;
	if (enrolledFromWeek == null) {
		if (input.tutorialClassId) {
			const sessions = await repo.listSessionsForTutorial(input.tutorialClassId);
			enrolledFromWeek = defaultEnrolledFromWeek(sessions, teachingClass.totalWeeks);
		} else {
			enrolledFromWeek = 1;
		}
	}
	const enrollment = await withUniqueConflict('This student is already on the roster', () =>
		repo.upsertEnrollment({
			classId,
			studentId: student.id,
			tutorialClassId: input.tutorialClassId ?? null,
			orderNo,
			enrolledFromWeek,
		}),
	);
	return mapRosterStudent({ ...enrollment, student });
}

export async function updateEnrollment(enrollmentId: string, input: UpdateEnrollmentInput) {
	const existing = await repo.getEnrollment(enrollmentId);
	if (!existing) notFound('Enrollment');
	if (input.tutorialClassId) {
		const tutorial = await repo.getTutorial(input.tutorialClassId);
		if (!tutorial || tutorial.classId !== existing.classId) notFound('Tutorial class');
	}
	if (
		input.familyName ||
		input.givenName ||
		input.homeClassCode != null ||
		input.majorName != null ||
		input.phone !== undefined ||
		input.dateOfBirth !== undefined ||
		input.email !== undefined
	) {
		await repo.upsertStudent({
			studentCode: existing.student.studentCode,
			familyName: input.familyName ?? existing.student.familyName,
			givenName: input.givenName ?? existing.student.givenName,
			dateOfBirth:
				input.dateOfBirth !== undefined
					? parseIsoDate(input.dateOfBirth)
					: existing.student.dateOfBirth,
			homeClassCode: input.homeClassCode ?? existing.student.homeClassCode,
			majorName: input.majorName ?? existing.student.majorName,
			phone: input.phone === undefined ? existing.student.phone : input.phone,
			email: input.email === undefined ? existing.student.email : input.email,
		});
	}
	const learningExperienceReset =
		input.learningExperienceAction === 'clear'
			? {
					learningExperience: null,
					learningExperienceSelectedAt: null,
					learningExperienceChangeCount: 0,
				}
			: input.learningExperienceAction === 'unlock'
				? { learningExperienceChangeCount: 0 }
				: {};
	const updated = await repo.updateEnrollment(enrollmentId, {
		orderNo: input.orderNo,
		tutorialClassId: input.tutorialClassId === undefined ? undefined : input.tutorialClassId,
		enrolledFromWeek: input.enrolledFromWeek,
		status: input.status,
		note: input.note,
		...learningExperienceReset,
	});
	return mapRosterStudent(updated);
}

export async function withdrawEnrollment(enrollmentId: string) {
	const existing = await repo.getEnrollment(enrollmentId);
	if (!existing) notFound('Enrollment');
	if (existing.status === 'WITHDRAWN') {
		throw new AppError('Student is already withdrawn', 409, 'CONFLICT');
	}
	const updated = await repo.updateEnrollment(enrollmentId, { status: 'WITHDRAWN' });
	return mapRosterStudent(updated);
}
