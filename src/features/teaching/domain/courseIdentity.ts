import { createHash } from 'node:crypto';

import type { Prisma, PrismaClient } from '@prisma/client';

import { AppError } from '@/lib/appError';

export const UNASSIGNED_COURSE_CODE = 'UNASSIGNED';
export const HRM_COURSE_CODE = '61MGT3HRM';
export const HRM_COURSE_NAME = 'Quản trị nhân sự';
export const COURSE_ARCHIVED_CODE = 'COURSE_ARCHIVED';
export const COURSE_ARCHIVED_MESSAGE = 'Hãy khôi phục môn học trước khi tạo lớp hoặc bộ thẻ mới';

const HRM_ALIAS_KEYS = new Set([
	'hrm',
	'hrm101',
	'61mgt3hrm',
	'human resource management',
	'human resources management',
	'quản trị nhân sự',
	'quan tri nhan su',
]);

export type TeachingDb = PrismaClient | Prisma.TransactionClient;

export type ResolvedCourseIdentity = {
	courseCode: string;
	courseName: string;
};

export function normalizeCourseName(value: string) {
	return value.normalize('NFD').replace(/\p{M}/gu, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function isHrmCourseKey(value: string) {
	const trimmed = value.trim();
	if (!trimmed) return false;
	return (
		HRM_ALIAS_KEYS.has(trimmed.toLowerCase()) || HRM_ALIAS_KEYS.has(normalizeCourseName(trimmed))
	);
}

export function normalizeCourseCode(value: string) {
	const trimmed = value.trim();
	if (!trimmed) return UNASSIGNED_COURSE_CODE;
	if (isHrmCourseKey(trimmed)) return HRM_COURSE_CODE;
	return trimmed.toUpperCase();
}

export function derivedCourseCode(subject: string) {
	const normalized = normalizeCourseName(subject);
	if (!normalized) return UNASSIGNED_COURSE_CODE;
	return `AR-${createHash('md5').update(normalized, 'utf8').digest('hex').toUpperCase()}`;
}

export function resolveCourseFromSubject(subject: string): ResolvedCourseIdentity {
	const trimmed = subject.trim();
	if (isHrmCourseKey(trimmed)) {
		return { courseCode: HRM_COURSE_CODE, courseName: HRM_COURSE_NAME };
	}
	if (!trimmed) {
		return { courseCode: UNASSIGNED_COURSE_CODE, courseName: 'Chưa phân loại' };
	}
	return {
		courseCode: derivedCourseCode(trimmed),
		courseName: trimmed,
	};
}

export async function lockActiveCourse(db: TeachingDb, courseId: string) {
	const rows = await db.$queryRaw<Array<{ id: string; status: string }>>`
		SELECT id, status::text AS status
		FROM "TeachingCourse"
		WHERE id = ${courseId}
		FOR UPDATE
	`;
	const course = rows[0];
	if (!course) throw new AppError('Không tìm thấy môn học', 404, 'NOT_FOUND');
	if (course.status === 'ARCHIVED') {
		throw new AppError(COURSE_ARCHIVED_MESSAGE, 409, COURSE_ARCHIVED_CODE);
	}
	return course;
}

export function throwIfCourseArchived(status: string | null | undefined) {
	if (status === 'ARCHIVED') {
		throw new AppError(COURSE_ARCHIVED_MESSAGE, 409, COURSE_ARCHIVED_CODE);
	}
}

export async function ensureTeachingCourse(
	db: TeachingDb,
	input: { courseCode: string; courseName: string },
) {
	const courseCode = normalizeCourseCode(input.courseCode);
	const requestedName = input.courseName.trim();
	const courseName =
		courseCode === HRM_COURSE_CODE
			? requestedName && !isHrmCourseKey(requestedName)
				? requestedName
				: HRM_COURSE_NAME
			: requestedName || courseCode;
	const existing = await db.teachingCourse.findUnique({ where: { courseCode } });
	if (existing) return existing;
	return db.teachingCourse.create({
		data: { courseCode, courseName },
	});
}

export async function ensureTeachingCourseFromSubject(db: TeachingDb, subject: string) {
	const trimmed = subject.trim();
	if (isHrmCourseKey(trimmed) || !trimmed) {
		return ensureTeachingCourse(db, resolveCourseFromSubject(trimmed));
	}

	const courses = await db.teachingCourse.findMany({
		select: {
			id: true,
			courseCode: true,
			courseName: true,
			status: true,
			createdAt: true,
			updatedAt: true,
		},
	});
	const code = derivedCourseCode(trimmed);
	const nameKey = normalizeCourseName(trimmed);
	const byCode = courses.find((course) => course.courseCode === code);
	if (byCode) {
		if (normalizeCourseName(byCode.courseName) !== nameKey) {
			throw new AppError(
				`Mã môn ${code} đã được dùng cho “${byCode.courseName}”. Hãy chọn môn hiện có thay vì tạo từ subject này.`,
				422,
				'COURSE_CODE_COLLISION',
			);
		}
		return byCode;
	}

	const byName = courses.filter((course) => normalizeCourseName(course.courseName) === nameKey);
	if (byName.length > 1) {
		throw new AppError(
			`Có nhiều môn trùng tên “${trimmed}”. Hãy chọn đúng môn theo mã học phần.`,
			422,
			'AMBIGUOUS_COURSE',
		);
	}
	if (byName.length === 1) return byName[0]!;

	return db.teachingCourse.create({
		data: { courseCode: code, courseName: trimmed },
	});
}
