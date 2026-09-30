import { describe, expect, it, vi } from 'vitest';

import { AppError } from '@/lib/appError';

import {
	derivedCourseCode,
	ensureTeachingCourse,
	ensureTeachingCourseFromSubject,
	lockActiveCourse,
	HRM_COURSE_CODE,
	HRM_COURSE_NAME,
	normalizeCourseCode,
	resolveCourseFromSubject,
	UNASSIGNED_COURSE_CODE,
} from './courseIdentity';

describe('resolveCourseFromSubject', () => {
	it('maps HRM aliases onto the shared 61MGT3HRM course', () => {
		expect(resolveCourseFromSubject('Human Resource Management')).toEqual({
			courseCode: HRM_COURSE_CODE,
			courseName: HRM_COURSE_NAME,
		});
		expect(resolveCourseFromSubject('Human Resources Management')).toEqual({
			courseCode: HRM_COURSE_CODE,
			courseName: HRM_COURSE_NAME,
		});
		expect(resolveCourseFromSubject('hrm')).toEqual({
			courseCode: HRM_COURSE_CODE,
			courseName: HRM_COURSE_NAME,
		});
		expect(resolveCourseFromSubject('Quản trị nhân sự')).toEqual({
			courseCode: HRM_COURSE_CODE,
			courseName: HRM_COURSE_NAME,
		});
	});

	it('creates a fallback course for empty subjects', () => {
		expect(resolveCourseFromSubject('')).toEqual({
			courseCode: UNASSIGNED_COURSE_CODE,
			courseName: 'Chưa phân loại',
		});
	});

	it('normalizes course codes so imports cannot create HRM duplicates', () => {
		expect(normalizeCourseCode(' hrm101 ')).toBe(HRM_COURSE_CODE);
		expect(normalizeCourseCode('hrm')).toBe(HRM_COURSE_CODE);
		expect(normalizeCourseCode('61MGT3HRM')).toBe(HRM_COURSE_CODE);
	});

	it('derives stable distinct codes instead of stripping punctuation', () => {
		expect(derivedCourseCode('A-B')).not.toBe(derivedCourseCode('AB'));
		expect(resolveCourseFromSubject('Organizational Behavior')).toEqual({
			courseCode: derivedCourseCode('Organizational Behavior'),
			courseName: 'Organizational Behavior',
		});
	});
});

describe('ensureTeachingCourse', () => {
	it('reuses an existing course instead of creating a duplicate during backfill', async () => {
		const existing = { id: 'course-1', courseCode: HRM_COURSE_CODE, courseName: HRM_COURSE_NAME };
		const db = {
			teachingCourse: {
				findUnique: vi.fn(async () => existing),
				create: vi.fn(),
			},
		};

		await expect(
			ensureTeachingCourse(db as never, { courseCode: 'HRM101', courseName: 'HRM' }),
		).resolves.toEqual(existing);
		expect(db.teachingCourse.findUnique).toHaveBeenCalledWith({
			where: { courseCode: HRM_COURSE_CODE },
		});
		expect(db.teachingCourse.create).not.toHaveBeenCalled();
	});

	it('creates a course when the code has not been seen yet', async () => {
		const created = { id: 'course-2', courseCode: 'OB101', courseName: 'Organizational Behavior' };
		const db = {
			teachingCourse: {
				findUnique: vi.fn(async () => null),
				create: vi.fn(async () => created),
			},
		};

		await expect(
			ensureTeachingCourse(db as never, {
				courseCode: 'OB101',
				courseName: 'Organizational Behavior',
			}),
		).resolves.toEqual(created);
		expect(db.teachingCourse.create).toHaveBeenCalledWith({
			data: { courseCode: 'OB101', courseName: 'Organizational Behavior' },
		});
	});
});

describe('ensureTeachingCourseFromSubject', () => {
	it('rejects an ambiguous normalized course name', async () => {
		const db = {
			teachingCourse: {
				findMany: vi.fn(async () => [
					{ id: 'a', courseCode: 'X1', courseName: 'Strategy' },
					{ id: 'b', courseCode: 'X2', courseName: 'strategy' },
				]),
				create: vi.fn(),
			},
		};

		await expect(ensureTeachingCourseFromSubject(db as never, 'Strategy')).rejects.toMatchObject({
			status: 422,
			code: 'AMBIGUOUS_COURSE',
		} satisfies Partial<AppError>);
		expect(db.teachingCourse.create).not.toHaveBeenCalled();
	});
});

describe('lockActiveCourse', () => {
	it('rejects an archived course after locking the row', async () => {
		const db = {
			$queryRaw: vi.fn(async () => [{ id: 'course-1', status: 'ARCHIVED' }]),
		};
		await expect(lockActiveCourse(db as never, 'course-1')).rejects.toMatchObject({
			status: 409,
			code: 'COURSE_ARCHIVED',
		} satisfies Partial<AppError>);
	});

	it('returns the locked active course', async () => {
		const db = {
			$queryRaw: vi.fn(async () => [{ id: 'course-1', status: 'ACTIVE' }]),
		};
		await expect(lockActiveCourse(db as never, 'course-1')).resolves.toEqual({
			id: 'course-1',
			status: 'ACTIVE',
		});
	});
});
