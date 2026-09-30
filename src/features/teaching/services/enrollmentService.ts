import { AppError } from '@/lib/appError';

import { defaultEnrolledFromWeek } from '../domain/cp';
import {
	applyConflictResolution,
	classifyRosterRow,
	defaultConflictResolution,
	type RosterExistingSnapshot,
} from '../domain/rosterImport';
import { parseIsoDate, toIsoDate, withUniqueConflict } from '../domain/prismaErrors';
import { normalizeRawStudentInput } from '../imports/normalizeStudentRow';
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

function toSnapshot(
	student: NonNullable<Awaited<ReturnType<typeof repo.getStudentByCode>>>,
	enrollment: { id: string; status: 'ACTIVE' | 'WITHDRAWN' } | null,
): RosterExistingSnapshot {
	return {
		studentId: student.id,
		updatedAt: student.updatedAt.toISOString(),
		studentCode: student.studentCode,
		familyName: student.familyName,
		givenName: student.givenName,
		dateOfBirth: toIsoDate(student.dateOfBirth),
		homeClassCode: student.homeClassCode,
		majorName: student.majorName,
		phone: student.phone,
		email: student.email,
		enrollmentId: enrollment?.id ?? null,
		enrollmentStatus: enrollment?.status ?? null,
	};
}

export async function addEnrollment(classId: string, input: AddEnrollmentInput) {
	const teachingClass = await getTeachingClass(classId);
	const normalized = normalizeRawStudentInput(
		{
			sourceRow: 1,
			orderNo: input.orderNo,
			studentCode: input.studentCode,
			familyName: input.familyName,
			givenName: input.givenName,
			homeClassCode: input.homeClassCode,
			majorName: input.majorName,
			dateOfBirth: input.dateOfBirth,
			phone: input.phone,
			email: input.email,
			tutorialClassId: input.tutorialClassId,
			enrolledFromWeek: input.enrolledFromWeek,
		},
		{ maxWeek: teachingClass.totalWeeks },
	);
	if (Object.keys(normalized.fieldErrors).length > 0) {
		throw new AppError('Dữ liệu sinh viên không hợp lệ', 422, 'VALIDATION', {
			...Object.fromEntries(
				Object.entries(normalized.fieldErrors).map(([key, message]) => [key, message ?? '']),
			),
		});
	}
	if (input.tutorialClassId) {
		const tutorial = await repo.getTutorial(input.tutorialClassId);
		if (!tutorial || tutorial.classId !== classId) notFound('Tutorial class');
	}
	const existingStudent = await repo.getStudentByCode(normalized.studentCode);
	const existingEnrollment = existingStudent
		? await repo.getEnrollmentByClassAndStudent(classId, existingStudent.id)
		: null;
	if (existingEnrollment?.status === 'ACTIVE') {
		throw new AppError('This student is already on the roster', 409, 'CONFLICT');
	}

	if (existingStudent) {
		const snapshot = toSnapshot(existingStudent, existingEnrollment);
		if (input.expectedUpdatedAt && snapshot.updatedAt !== input.expectedUpdatedAt) {
			throw new AppError('Dữ liệu đã thay đổi, hãy đối chiếu lại', 409, 'STALE_PREVIEW');
		}
		const classified = classifyRosterRow(normalized, snapshot);
		if (!input.confirmExisting) {
			throw new AppError(
				'Sinh viên này đã có hồ sơ. Hãy đối chiếu trước khi thêm vào lớp.',
				409,
				'STUDENT_PROFILE_CONFLICT',
				undefined,
				{
					existing: snapshot,
					incoming: normalized,
					conflicts: classified.conflicts,
					fillBlankFields: classified.fillBlankFields,
					resolution: defaultConflictResolution(classified.conflicts),
					sharedProfile: true,
				},
			);
		}
		if (classified.conflicts.some((conflict) => !input.conflictResolution?.[conflict.field])) {
			throw new AppError(
				'Hãy chọn giữ dữ liệu hiện tại hoặc dùng dữ liệu mới cho từng trường khác nhau.',
				422,
				'VALIDATION',
			);
		}
		const profile = applyConflictResolution(
			normalized,
			snapshot,
			input.conflictResolution ?? {},
			classified.fillBlankFields,
		);
		await repo.upsertStudent({
			studentCode: normalized.studentCode,
			familyName: profile.familyName,
			givenName: profile.givenName,
			dateOfBirth: parseIsoDate(profile.dateOfBirth),
			homeClassCode: profile.homeClassCode,
			majorName: profile.majorName,
			phone: profile.phone,
			email: profile.email,
		});
	}

	const student =
		(await repo.getStudentByCode(normalized.studentCode)) ??
		(await repo.upsertStudent({
			studentCode: normalized.studentCode,
			familyName: normalized.familyName,
			givenName: normalized.givenName,
			dateOfBirth: parseIsoDate(normalized.dateOfBirth),
			homeClassCode: normalized.homeClassCode,
			majorName: normalized.majorName,
			phone: normalized.phone,
			email: normalized.email,
		}));
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
