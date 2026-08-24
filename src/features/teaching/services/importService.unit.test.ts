import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	parseStudentListBuffer: vi.fn(),
	classFindUnique: vi.fn(),
	getRosterClass: vi.fn(),
	listTutorials: vi.fn(),
	backfillStudentMissingFields: vi.fn(),
	addEnrollment: vi.fn(),
	getTeachingClass: vi.fn(),
	setupTeachingClass: vi.fn(),
}));

vi.mock('../imports/parseStudentList', () => ({
	parseStudentListBuffer: mocks.parseStudentListBuffer,
}));

vi.mock('../repositories/teachingRepository', () => ({
	prisma: { teachingClass: { findUnique: mocks.classFindUnique } },
	getRosterClass: mocks.getRosterClass,
	listTutorials: mocks.listTutorials,
	backfillStudentMissingFields: mocks.backfillStudentMissingFields,
}));

vi.mock('./enrollmentService', () => ({ addEnrollment: mocks.addEnrollment }));
vi.mock('./classService', () => ({
	getTeachingClass: mocks.getTeachingClass,
	setupTeachingClass: mocks.setupTeachingClass,
}));

import { importStudentListIntoClass } from './importService';

const metadata = {
	courseName: 'Human Resource Management',
	courseCode: 'HRM',
	lecturerName: 'Lecturer',
	lecturerCode: 'GV01',
	credits: 3,
	groupNo: '01',
	term: 'HK1',
};

function row(studentCode: string, orderNo: number) {
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
		ok: true,
		errors: [],
	};
}

describe('importStudentListIntoClass', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.classFindUnique.mockResolvedValue(null);
		mocks.getTeachingClass.mockResolvedValue({ courseCode: 'HRM', groupNo: '01' });
		mocks.listTutorials.mockResolvedValue([{ id: 'tutorial-1' }]);
		mocks.addEnrollment.mockResolvedValue({});
	});

	it('backfills existing students and preserves every parsed field for new students', async () => {
		const existingStudent = {
			id: 'student-existing',
			studentCode: 'SV01',
			familyName: 'Nguyễn',
			givenName: 'An',
			dateOfBirth: null,
			homeClassCode: '',
			majorName: '',
			phone: null,
			email: null,
		};
		mocks.parseStudentListBuffer.mockResolvedValue({
			metadata,
			students: [row('SV01', 1), row('SV02', 2)],
			headerRowIndex: 6,
		});
		mocks.getRosterClass.mockResolvedValue({
			enrollments: [{ id: 'enrollment-1', student: existingStudent }],
		});
		mocks.backfillStudentMissingFields.mockResolvedValue(true);

		await expect(importStudentListIntoClass('class-1', Buffer.from('xlsx'))).resolves.toEqual({
			classId: 'class-1',
			addedCount: 1,
			updatedCount: 1,
			skippedCount: 0,
		});
		expect(mocks.backfillStudentMissingFields).toHaveBeenCalledWith(
			existingStudent,
			expect.objectContaining({
				dateOfBirth: new Date('2006-05-29T00:00:00.000Z'),
				homeClassCode: 'K66A',
				majorName: 'Quản trị nhân lực',
				phone: '0901234567',
				email: 'sv01@example.edu',
			}),
		);
		expect(mocks.addEnrollment).toHaveBeenCalledWith(
			'class-1',
			expect.objectContaining({
				studentCode: 'SV02',
				dateOfBirth: '2006-05-29',
				homeClassCode: 'K66A',
				majorName: 'Quản trị nhân lực',
				phone: '0901234567',
				email: 'sv02@example.edu',
				orderNo: 2,
				tutorialClassId: 'tutorial-1',
			}),
		);
	});

	it('counts an existing student as skipped when no missing value can be filled', async () => {
		mocks.parseStudentListBuffer.mockResolvedValue({
			metadata,
			students: [row('SV01', 1)],
			headerRowIndex: 6,
		});
		mocks.getRosterClass.mockResolvedValue({
			enrollments: [
				{
					id: 'enrollment-1',
					student: { id: 'student-1', studentCode: 'SV01' },
				},
			],
		});
		mocks.backfillStudentMissingFields.mockResolvedValue(false);

		await expect(importStudentListIntoClass('class-1', Buffer.from('xlsx'))).resolves.toEqual({
			classId: 'class-1',
			addedCount: 0,
			updatedCount: 0,
			skippedCount: 1,
		});
	});
});
