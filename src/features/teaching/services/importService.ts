import { AppError } from '@/lib/appError';

import { parseStudentListBuffer, type ParsedStudentList } from '../imports/parseStudentList';
import { parseIsoDate } from '../domain/prismaErrors';
import * as repo from '../repositories/teachingRepository';
import { addEnrollment } from './enrollmentService';
import { getTeachingClass } from './classService';
import { setupTeachingClass } from './classService';

export interface StudentListPreview extends ParsedStudentList {
	existingClassId: string | null;
}

export async function previewStudentListImport(buffer: Buffer): Promise<StudentListPreview> {
	const parsed = await parseStudentListBuffer(buffer);
	if (!parsed.metadata.courseCode || !parsed.metadata.groupNo) {
		throw new AppError('The file is missing course code or group number', 422, 'VALIDATION');
	}
	const existing = await repo.prisma.teachingClass.findUnique({
		where: {
			courseCode_groupNo_term: {
				courseCode: parsed.metadata.courseCode,
				groupNo: parsed.metadata.groupNo,
				term: parsed.metadata.term || 'Unknown term',
			},
		},
		select: { id: true },
	});
	return { ...parsed, existingClassId: existing?.id ?? null };
}

export async function commitStudentListImport(buffer: Buffer) {
	const preview = await previewStudentListImport(buffer);
	const invalid = preview.students.filter((row) => !row.ok);
	if (invalid.length > 0) {
		throw new AppError('Fix validation errors before importing', 422, 'VALIDATION', {
			rows: `${invalid.length} invalid rows`,
		});
	}
	if (preview.students.length === 0) {
		throw new AppError('The file contains no students', 422, 'VALIDATION');
	}
	if (preview.existingClassId) {
		throw new AppError(
			'This class already exists. Open it to add or review students.',
			409,
			'CLASS_EXISTS',
			{
				existingClassId: preview.existingClassId,
			},
		);
	}

	return setupTeachingClass({
		class: {
			courseCode: preview.metadata.courseCode,
			courseName: preview.metadata.courseName || preview.metadata.courseCode,
			groupNo: preview.metadata.groupNo,
			term: preview.metadata.term || 'Unknown term',
			credits: preview.metadata.credits,
			lecturerName: preview.metadata.lecturerName,
			lecturerCode: preview.metadata.lecturerCode,
		},
		students: preview.students.map((row) => ({
			studentCode: row.studentCode,
			familyName: row.familyName,
			givenName: row.givenName,
			dateOfBirth: row.dateOfBirth,
			homeClassCode: row.homeClassCode,
			majorName: row.majorName,
			phone: row.phone,
			email: row.email,
			orderNo: row.orderNo,
		})),
	});
}

export async function importStudentListIntoClass(classId: string, buffer: Buffer) {
	const teachingClass = await getTeachingClass(classId);
	const preview = await previewStudentListImport(buffer);
	const invalid = preview.students.filter((row) => !row.ok);
	if (invalid.length > 0) {
		throw new AppError('Fix validation errors before importing', 422, 'VALIDATION', {
			rows: `${invalid.length} invalid rows`,
		});
	}
	if (preview.metadata.courseCode && preview.metadata.courseCode !== teachingClass.courseCode) {
		throw new AppError('The file belongs to a different course', 422, 'VALIDATION');
	}
	if (preview.metadata.groupNo && preview.metadata.groupNo !== teachingClass.groupNo) {
		throw new AppError('The file belongs to a different class group', 422, 'VALIDATION');
	}

	const [roster, tutorials] = await Promise.all([
		repo.getRosterClass(classId),
		repo.listTutorials(classId),
	]);
	if (!roster) throw new AppError('Class not found', 404, 'NOT_FOUND');
	const existingByCode = new Map(
		roster.enrollments.map((enrollment) => [enrollment.student.studentCode, enrollment]),
	);
	const tutorialClassId = tutorials[0]?.id ?? null;
	let addedCount = 0;
	let updatedCount = 0;
	let skippedCount = 0;
	const incoming: typeof preview.students = [];
	const existing: Array<{
		enrollment: (typeof roster.enrollments)[number];
		row: (typeof preview.students)[number];
	}> = [];
	for (const row of preview.students) {
		const enrollment = existingByCode.get(row.studentCode);
		if (enrollment) {
			existing.push({ enrollment, row });
			continue;
		}
		incoming.push(row);
	}
	const BATCH = 8;
	for (let index = 0; index < existing.length; index += BATCH) {
		const batch = existing.slice(index, index + BATCH);
		const results = await Promise.all(
			batch.map(({ enrollment, row }) =>
				repo.backfillStudentMissingFields(enrollment.student, {
					familyName: row.familyName,
					givenName: row.givenName,
					dateOfBirth: parseIsoDate(row.dateOfBirth),
					homeClassCode: row.homeClassCode,
					majorName: row.majorName,
					phone: row.phone,
					email: row.email,
				}),
			),
		);
		updatedCount += results.filter(Boolean).length;
		skippedCount += results.filter((updated) => !updated).length;
	}
	for (let index = 0; index < incoming.length; index += BATCH) {
		const batch = incoming.slice(index, index + BATCH);
		await Promise.all(
			batch.map((row) =>
				addEnrollment(classId, {
					studentCode: row.studentCode,
					familyName: row.familyName,
					givenName: row.givenName,
					dateOfBirth: row.dateOfBirth,
					homeClassCode: row.homeClassCode,
					majorName: row.majorName,
					phone: row.phone,
					email: row.email,
					orderNo: row.orderNo,
					tutorialClassId,
				}),
			),
		);
		addedCount += batch.length;
	}
	return { classId, addedCount, updatedCount, skippedCount };
}
