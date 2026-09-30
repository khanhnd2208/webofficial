import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '@/lib/appError';

const repo = vi.hoisted(() => ({
	listCourses: vi.fn(),
	getCourse: vi.fn(),
	listDistinctTerms: vi.fn(),
	prisma: {
		teachingCourse: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
		teachingClass: { count: vi.fn(), updateMany: vi.fn() },
		activeRecallDeck: { count: vi.fn(), updateMany: vi.fn() },
		$queryRaw: vi.fn(),
		$transaction: vi.fn(),
	},
}));

const classService = vi.hoisted(() => ({
	listTeachingClasses: vi.fn(async () => []),
}));

vi.mock('../repositories/teachingRepository', () => repo);
vi.mock('./classService', () => classService);

import {
	assertCourseIsActive,
	createTeachingCourse,
	deleteTeachingCourse,
	updateTeachingCourse,
} from './courseService';

const now = new Date('2026-09-01T00:00:00.000Z');

function courseRow(overrides: Record<string, unknown> = {}) {
	return {
		id: 'course-1',
		courseCode: 'HRM101',
		courseName: 'Human Resource Management',
		status: 'ACTIVE',
		createdAt: now,
		updatedAt: now,
		...overrides,
	};
}

describe('courseService admin lifecycle', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		repo.prisma.$transaction.mockImplementation(async (fn: (tx: typeof repo.prisma) => unknown) =>
			fn(repo.prisma),
		);
		repo.prisma.teachingCourse.update.mockImplementation(
			async ({ data }: { data: Record<string, unknown> }) => courseRow(data),
		);
	});

	it('creates a course from code and name only', async () => {
		repo.prisma.teachingCourse.create.mockImplementation(
			async ({ data }: { data: Record<string, unknown> }) => courseRow(data),
		);
		await expect(
			createTeachingCourse({ courseCode: 'hrm101', courseName: 'Human Resource Management' }),
		).resolves.toMatchObject({ courseCode: '61MGT3HRM', status: 'ACTIVE' });
	});

	it('blocks mutations on archived courses', async () => {
		repo.getCourse.mockResolvedValue(courseRow({ status: 'ARCHIVED' }));
		await expect(assertCourseIsActive('course-1')).rejects.toMatchObject({
			status: 409,
			code: 'COURSE_ARCHIVED',
		} satisfies Partial<AppError>);
	});

	it('blocks archive while active children remain', async () => {
		repo.getCourse.mockResolvedValue(courseRow());
		repo.prisma.$queryRaw.mockResolvedValue([{ id: 'course-1', status: 'ACTIVE' }]);
		repo.prisma.teachingClass.count.mockResolvedValue(1);
		repo.prisma.activeRecallDeck.count.mockResolvedValue(1);
		await expect(updateTeachingCourse('course-1', { status: 'ARCHIVED' })).rejects.toMatchObject({
			status: 409,
			code: 'HAS_DEPENDENCIES',
		});
	});

	it('restores an archived course', async () => {
		repo.getCourse.mockResolvedValue(courseRow({ status: 'ARCHIVED' }));
		repo.prisma.$queryRaw.mockResolvedValue([{ id: 'course-1', status: 'ARCHIVED' }]);
		await expect(updateTeachingCourse('course-1', { status: 'ACTIVE' })).resolves.toMatchObject({
			status: 'ACTIVE',
		});
		expect(repo.prisma.teachingCourse.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ status: 'ACTIVE' }),
			}),
		);
	});

	it('deletes a course that has no classes or decks', async () => {
		repo.getCourse.mockResolvedValue(courseRow());
		repo.prisma.teachingClass.count.mockResolvedValue(0);
		repo.prisma.activeRecallDeck.count.mockResolvedValue(0);
		await expect(deleteTeachingCourse('course-1')).resolves.toEqual({ id: 'course-1' });
		expect(repo.prisma.teachingCourse.delete).toHaveBeenCalledWith({ where: { id: 'course-1' } });
	});

	it('blocks permanent delete when any class or deck still exists', async () => {
		repo.getCourse.mockResolvedValue(courseRow());
		repo.prisma.teachingClass.count.mockResolvedValue(1);
		repo.prisma.activeRecallDeck.count.mockResolvedValue(0);
		await expect(deleteTeachingCourse('course-1')).rejects.toMatchObject({
			status: 409,
			fields: { classes: '1' },
		});
		expect(repo.prisma.teachingCourse.delete).not.toHaveBeenCalled();
	});
});
