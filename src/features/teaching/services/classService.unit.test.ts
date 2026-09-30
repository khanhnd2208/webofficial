import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const repo = vi.hoisted(() => ({
	getCourse: vi.fn(),
	getClass: vi.fn(),
	findClassByIdentity: vi.fn(),
	getClassLifecycleSnapshot: vi.fn(),
	deleteClassRecord: vi.fn(),
	prisma: {
		$transaction: vi.fn(),
	},
}));

vi.mock('../repositories/teachingRepository', () => ({
	...repo,
	DEFAULT_TUTORIAL_CODE: 'T01',
	DEFAULT_TUTORIAL_NAME: 'Tutorial 1',
}));
vi.mock('./recallPlacementService', () => ({ enablePublishedDecksForClass: vi.fn() }));

import { createTeachingClass, deleteTeachingClass } from './classService';

const now = new Date('2026-09-01T00:00:00.000Z');
const course = {
	id: 'course-1',
	courseCode: 'HRM101',
	courseName: 'HRM',
	status: 'ACTIVE' as const,
	createdAt: now,
	updatedAt: now,
};

describe('createTeachingClass identity', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		repo.getCourse.mockResolvedValue(course);
	});

	it('normalizes class code and term then rejects duplicates before insert', async () => {
		repo.findClassByIdentity.mockResolvedValue({ id: 'existing' });
		await expect(
			createTeachingClass({ courseId: 'course-1', groupNo: ' 39-01 ', term: ' HK1 ' }),
		).rejects.toMatchObject({ status: 409, code: 'CLASS_EXISTS' });
		expect(repo.findClassByIdentity).toHaveBeenCalledWith({
			courseId: 'course-1',
			classCode: '39-01',
			term: 'HK1',
		});
		expect(repo.prisma.$transaction).not.toHaveBeenCalled();
	});

	it('blocks creating a class on an archived course', async () => {
		repo.getCourse.mockResolvedValue({ ...course, status: 'ARCHIVED' });
		await expect(
			createTeachingClass({ courseId: 'course-1', groupNo: '01', term: 'HK1' }),
		).rejects.toMatchObject({ status: 409, code: 'COURSE_ARCHIVED' });
	});

	it('creates an empty class from three fields with 10 weeks and no roster', async () => {
		repo.findClassByIdentity.mockResolvedValue(null);
		const createdClass = {
			id: 'class-1',
			courseId: course.id,
			courseCode: course.courseCode,
			courseName: course.courseName,
			groupNo: '39-01',
			classCode: '39-01',
			term: 'HK1',
			credits: null,
			lecturerName: '',
			lecturerCode: '',
			totalWeeks: 10,
			cpMaxPoints: new Prisma.Decimal(5),
			cpPerAbsence: new Prisma.Decimal(0.5),
			maxParticipationPerSession: new Prisma.Decimal(2),
			attendanceMaxPoints: new Prisma.Decimal(5),
			absenceDeductionPoints: new Prisma.Decimal(0.5),
			lateDeductionPoints: new Prisma.Decimal(0.5),
			lateCountsTowardAbsenceThreshold: true,
			giftDeductionPoints: new Prisma.Decimal(1),
			absenceThresholdPercent: 20,
			lateGraceMinutes: 15,
			status: 'ACTIVE' as const,
			publicSlug: null,
			publicTitle: '',
			publicSummary: '',
			publicDescription: '',
			publicAnnouncement: '',
			attendanceVisible: false,
			classRules: '',
			createdAt: now,
			updatedAt: now,
		};
		const tx = {
			$queryRaw: vi.fn(async () => [{ id: course.id, status: 'ACTIVE' }]),
			teachingClass: {
				create: vi.fn(async () => createdClass),
			},
			teachingTutorialClass: {
				create: vi.fn(async () => ({ id: 'tutorial-1' })),
			},
			teachingSession: {
				createMany: vi.fn(async () => ({ count: 10 })),
			},
			activeRecallDeck: {
				findMany: vi.fn(async () => []),
			},
		};
		repo.prisma.$transaction.mockImplementation(async (fn: (client: typeof tx) => unknown) =>
			fn(tx),
		);
		repo.getClass.mockResolvedValue(createdClass);

		await expect(
			createTeachingClass({ courseId: 'course-1', groupNo: ' 39-01 ', term: ' HK1 ' }),
		).resolves.toMatchObject({
			id: 'class-1',
			groupNo: '39-01',
			term: 'HK1',
			totalWeeks: 10,
			credits: null,
			lecturerName: '',
		});
		expect(tx.teachingClass.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				courseId: 'course-1',
				groupNo: '39-01',
				classCode: '39-01',
				term: 'HK1',
				credits: null,
				lecturerName: '',
				lecturerCode: '',
				totalWeeks: 10,
			}),
		});
		const sessionCreate = tx.teachingSession.createMany.mock.calls.at(0)?.at(0) as unknown as {
			data: Array<{ weekNumber: number }>;
		};
		expect(sessionCreate.data).toHaveLength(10);
		expect(sessionCreate.data.at(-1)).toMatchObject({ weekNumber: 10 });
	});
});

describe('deleteTeachingClass scaffold guard', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('rejects classes that already have students', async () => {
		repo.getClassLifecycleSnapshot.mockResolvedValue({
			id: 'class-1',
			publicTitle: '',
			publicSummary: '',
			publicDescription: '',
			publicAnnouncement: '',
			classRules: '',
			attendanceVisible: false,
			publicSlug: null,
			_count: { enrollments: 2, notes: 0, publicLinks: 0 },
			sessions: [],
			groupBoards: [],
		});
		await expect(deleteTeachingClass('class-1')).rejects.toMatchObject({
			status: 409,
			fields: { students: '2' },
		});
		expect(repo.deleteClassRecord).not.toHaveBeenCalled();
	});

	it('rejects classes that already have authored student-page content', async () => {
		repo.getClassLifecycleSnapshot.mockResolvedValue({
			id: 'class-1',
			publicTitle: 'HRM 39-01',
			publicSummary: 'Tóm tắt lớp',
			publicDescription: '',
			publicAnnouncement: '',
			classRules: 'Mang thẻ SV',
			attendanceVisible: true,
			publicSlug: 'hrm-39-01',
			_count: { enrollments: 0, notes: 0, publicLinks: 0 },
			sessions: [],
			groupBoards: [],
		});
		await expect(deleteTeachingClass('class-1')).rejects.toMatchObject({
			status: 409,
			fields: { studentPage: '1', sharing: '1' },
		});
		expect(repo.deleteClassRecord).not.toHaveBeenCalled();
	});

	it('deletes an empty generated scaffold', async () => {
		repo.getClassLifecycleSnapshot.mockResolvedValue({
			id: 'class-1',
			publicTitle: '',
			publicSummary: '',
			publicDescription: '',
			publicAnnouncement: '',
			classRules: '',
			attendanceVisible: false,
			publicSlug: null,
			_count: { enrollments: 0, notes: 0, publicLinks: 0 },
			sessions: [
				{
					heldOn: null,
					topic: '',
					method: 'ROLL_CALL',
					isCancelled: false,
					attendanceTakenAt: null,
					participationTakenAt: null,
					_count: { attendance: 0, participation: 0 },
				},
			],
			groupBoards: [{ groupCount: 0, _count: { assignments: 0 } }],
		});
		repo.deleteClassRecord.mockResolvedValue({ id: 'class-1' });
		await expect(deleteTeachingClass('class-1')).resolves.toEqual({ id: 'class-1' });
	});
});
