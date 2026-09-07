import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	parseStudentListBuffer: vi.fn(),
	classFindMany: vi.fn(),
	getRosterClass: vi.fn(),
	listTutorials: vi.fn(),
	findStudentsByNormalizedCodes: vi.fn(),
	getTeachingClass: vi.fn(),
	getCourse: vi.fn(),
	findClassByIdentity: vi.fn(),
	transaction: vi.fn(),
	studentFindUnique: vi.fn(),
	studentCreate: vi.fn(),
	studentUpdate: vi.fn(),
	enrollmentCreate: vi.fn(),
	enrollmentUpdate: vi.fn(),
}));

vi.mock('../imports/parseStudentList', () => ({
	parseStudentListBuffer: mocks.parseStudentListBuffer,
	parseStudentListFromRows: vi.fn(),
}));

vi.mock('../repositories/teachingRepository', () => ({
	prisma: {
		teachingClass: { findMany: mocks.classFindMany },
		teachingStudent: {
			findUnique: mocks.studentFindUnique,
			create: mocks.studentCreate,
			update: mocks.studentUpdate,
		},
		teachingEnrollment: {
			create: mocks.enrollmentCreate,
			update: mocks.enrollmentUpdate,
		},
		$transaction: mocks.transaction,
	},
	getRosterClass: mocks.getRosterClass,
	listTutorials: mocks.listTutorials,
	findStudentsByNormalizedCodes: mocks.findStudentsByNormalizedCodes,
	getCourse: mocks.getCourse,
	findClassByIdentity: mocks.findClassByIdentity,
	DEFAULT_TUTORIAL_CODE: 'T01',
	DEFAULT_TUTORIAL_NAME: 'Tutorial 1',
}));

vi.mock('./classService', () => ({
	getTeachingClass: mocks.getTeachingClass,
	getGradebook: vi.fn(),
}));

import { commitRosterImport, importStudentListIntoClass, previewRosterImport, setupTeachingClassFromRoster } from './importService';

const metadata = {
	courseName: 'Human Resource Management',
	courseCode: 'HRM',
	lecturerName: 'Lecturer',
	lecturerCode: 'GV01',
	credits: 3,
	groupNo: '01',
	term: 'HK1',
};

function row(studentCode: string, orderNo: number, extra: Record<string, unknown> = {}) {
	return {
		orderNo,
		studentCode,
		familyName: 'Nguyễn',
		givenName: 'An',
		homeClassCode: 'K66A',
		majorName: 'Quản trị nhân lực',
		dateOfBirth: '2006-05-29',
		phone: '0901234567',
		email: `${studentCode.toLowerCase()}@example.edu`,
		tutorialCode: null,
		enrolledFromWeek: 1,
		ok: true,
		errors: [],
		...extra,
	};
}

describe('roster import preview and commit', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.classFindMany.mockResolvedValue([]);
		mocks.findClassByIdentity.mockResolvedValue(null);
		mocks.getTeachingClass.mockResolvedValue({ courseCode: 'HRM', groupNo: '01', totalWeeks: 10 });
		mocks.listTutorials.mockResolvedValue([{ id: 'tutorial-1', code: 'T01' }]);
		mocks.findStudentsByNormalizedCodes.mockResolvedValue([]);
		mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
			callback({
				teachingStudent: {
					findUnique: mocks.studentFindUnique,
					create: mocks.studentCreate,
					update: mocks.studentUpdate,
				},
				teachingEnrollment: {
					create: mocks.enrollmentCreate,
					update: mocks.enrollmentUpdate,
				},
			}),
		);
		mocks.studentFindUnique.mockResolvedValue(null);
		mocks.studentCreate.mockImplementation(async (args: { data: { studentCode: string } }) => ({
			id: `id-${args.data.studentCode}`,
			...args.data,
		}));
	});

	it('previews new rows and flags shared-profile conflicts instead of silent overwrite', async () => {
		mocks.parseStudentListBuffer.mockResolvedValue({
			metadata,
			students: [row('SV01', 1, { familyName: 'Trần' }), row('SV02', 2)],
			headerRowIndex: 6,
		});
		mocks.findStudentsByNormalizedCodes.mockResolvedValue([
			{
				id: 'student-existing',
				studentCode: 'SV01',
				studentCodeNormalized: 'SV01',
				updatedAt: new Date('2026-09-01T00:00:00.000Z'),
				familyName: 'Nguyễn',
				givenName: 'An',
				dateOfBirth: new Date('2006-05-29T00:00:00.000Z'),
				homeClassCode: 'K66A',
				majorName: 'Quản trị nhân lực',
				phone: '0901234567',
				email: 'sv01@example.edu',
				enrollments: [{ id: 'enrollment-1', classId: 'class-1', status: 'ACTIVE' }],
			},
		]);

		const preview = await previewRosterImport({
			source: { kind: 'xlsx', buffer: Buffer.from('xlsx') },
			classId: 'class-1',
		});
		expect(preview.rows[0]?.status).toBe('conflict');
		expect(preview.rows[1]?.status).toBe('new');
		await expect(importStudentListIntoClass('class-1', Buffer.from('xlsx'))).rejects.toThrow(
			/đối chiếu/i,
		);
	});

	it('detects an existing class through the canonical course code', async () => {
		mocks.parseStudentListBuffer.mockResolvedValue({
			metadata: { ...metadata, courseCode: ' hrm ' },
			students: [row('SV03', 1)],
			headerRowIndex: 6,
		});
		mocks.classFindMany.mockResolvedValue([
			{ id: 'class-existing', classCode: '01', groupNo: '01', term: 'HK1' },
		]);

		const preview = await previewRosterImport({
			source: { kind: 'xlsx', buffer: Buffer.from('xlsx') },
		});

		expect(preview.existingClassId).toBe('class-existing');
		expect(mocks.classFindMany).toHaveBeenCalledWith({
			where: {
				OR: [
					{ course: { courseCode: '61MGT3HRM' } },
					{ courseCode: ' hrm ' },
				],
			},
			select: { id: true, classCode: true, groupNo: true, term: true },
		});
	});

	it('commits a whole batch in one transaction and rolls back on failure', async () => {
		mocks.studentCreate.mockRejectedValueOnce(new Error('write failed'));
		await expect(
			commitRosterImport({
				classId: 'class-1',
				rows: [
					{
						key: '1:SV02',
						input: {
							sourceRow: 2,
							orderNo: 1,
							studentCode: 'SV02',
							familyName: 'Nguyễn',
							givenName: 'An',
							homeClassCode: 'K66A',
							majorName: 'Quản trị nhân lực',
							dateOfBirth: '2006-05-29',
							phone: '0901234567',
							email: 'sv02@example.edu',
							tutorialCode: null,
							tutorialClassId: null,
							enrolledFromWeek: 1,
						},
					},
				],
			}),
		).rejects.toThrow('write failed');
		expect(mocks.transaction).toHaveBeenCalled();
	});

	it('treats an unchanged existing roster row as skipped', async () => {
		const existing = {
			id: 'student-existing',
			studentCode: 'SV01',
			studentCodeNormalized: 'SV01',
			updatedAt: new Date('2026-09-01T00:00:00.000Z'),
			familyName: 'Nguyễn',
			givenName: 'An',
			dateOfBirth: new Date('2006-05-29T00:00:00.000Z'),
			homeClassCode: 'K66A',
			majorName: 'Quản trị nhân lực',
			phone: '0901234567',
			email: 'sv01@example.edu',
			enrollments: [{ id: 'enrollment-1', classId: 'class-1', status: 'ACTIVE' as const }],
		};
		mocks.studentFindUnique.mockResolvedValue(existing);
		const result = await commitRosterImport({
			classId: 'class-1',
			rows: [
				{
					key: '1:SV01',
					expectedUpdatedAt: existing.updatedAt.toISOString(),
					input: {
						sourceRow: 2,
						orderNo: 1,
						studentCode: 'SV01',
						familyName: 'Nguyễn',
						givenName: 'An',
						homeClassCode: 'K66A',
						majorName: 'Quản trị nhân lực',
						dateOfBirth: '2006-05-29',
						phone: '0901234567',
						email: 'sv01@example.edu',
						tutorialCode: null,
							tutorialClassId: null,
							enrolledFromWeek: 1,
						},
				},
			],
		});
		expect(result.skippedCount).toBe(1);
		expect(mocks.studentUpdate).not.toHaveBeenCalled();
		expect(mocks.enrollmentCreate).not.toHaveBeenCalled();
	});
});

describe('setupTeachingClassFromRoster guards', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.findClassByIdentity.mockResolvedValue(null);
		mocks.getTeachingClass.mockResolvedValue({ courseCode: 'AUDIT', groupNo: 'LOWER', totalWeeks: 10 });
	});

	it('blocks creating a class on an archived course', async () => {
		mocks.getCourse.mockResolvedValue({
			id: 'course-1',
			courseCode: 'AUDIT',
			courseName: 'Audit',
			status: 'ARCHIVED',
		});
		await expect(
			setupTeachingClassFromRoster({
				class: { courseId: 'course-1', groupNo: 'lower', term: 'Audit  term' },
				rows: [],
			}),
		).rejects.toMatchObject({ status: 409, code: 'COURSE_ARCHIVED' });
		expect(mocks.transaction).not.toHaveBeenCalled();
	});

	it('normalizes class identity and rejects a duplicate after collapsing case and spaces', async () => {
		mocks.getCourse.mockResolvedValue({
			id: 'course-1',
			courseCode: 'AUDIT',
			courseName: 'Audit',
			status: 'ACTIVE',
		});
		mocks.findClassByIdentity.mockResolvedValue({ id: 'existing' });
		await expect(
			setupTeachingClassFromRoster({
				class: { courseId: 'course-1', groupNo: 'lower', term: 'Audit  term' },
				rows: [],
			}),
		).rejects.toMatchObject({ status: 409, code: 'CLASS_EXISTS' });
		expect(mocks.findClassByIdentity).toHaveBeenCalledWith({
			courseId: 'course-1',
			classCode: 'LOWER',
			term: 'Audit term',
		});
	});
});
