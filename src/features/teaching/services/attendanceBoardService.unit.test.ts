import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as repo from '../repositories/teachingRepository';
import { getPublicClassBoard } from './attendanceBoardService';

vi.mock('../repositories/teachingRepository', () => ({
	getAttendanceBoardBySlug: vi.fn(),
	getClassIdBySlug: vi.fn(),
}));

function boardClass(overrides: Record<string, unknown> = {}) {
	return {
		id: 'class-1',
		courseCode: 'HRM101',
		courseName: 'Human Resource Management',
		groupNo: '01',
		term: 'Fall 2026',
		credits: 3,
		lecturerName: 'Nguyễn Duy Khánh',
		lecturerCode: 'SECRET-CODE',
		totalWeeks: 10,
		absenceThresholdPercent: 20,
		lateGraceMinutes: 15,
		status: 'ACTIVE',
		publicSlug: 'hrm-fall-2026',
		publicTitle: 'HRM',
		publicSummary: 'Public summary',
		publicDescription: 'Course description',
		publicAnnouncement: 'Welcome to class',
		attendanceVisible: true,
		classRules: 'Bring student card',
		createdAt: new Date('2026-08-18T00:00:00.000Z'),
		updatedAt: new Date('2026-08-18T01:00:00.000Z'),
		publicLinks: [
			{
				id: 'link-1',
				classId: 'class-1',
				label: 'Slides',
				url: 'https://example.com',
				description: '',
				displayOrder: 0,
				createdAt: new Date('2026-08-18T00:00:00.000Z'),
				updatedAt: new Date('2026-08-18T00:00:00.000Z'),
			},
		],
		tutorials: [
			{
				id: 'tutorial-1',
				classId: 'class-1',
				code: 'T01',
				name: 'Tutorial 1',
				room: 'A301',
				scheduleNote: 'Monday',
				displayOrder: 0,
				createdAt: new Date('2026-08-18T00:00:00.000Z'),
				updatedAt: new Date('2026-08-18T00:00:00.000Z'),
			},
		],
		sessions: [
			{
				id: 'session-1',
				classId: 'class-1',
				tutorialClassId: 'tutorial-1',
				weekNumber: 1,
				heldOn: new Date('2026-09-07T00:00:00.000Z'),
				topic: 'Introduction',
				method: 'ROLL_CALL',
				isCancelled: false,
				attendanceTakenAt: new Date('2026-09-07T02:00:00.000Z'),
				attendanceTakenById: 'admin-1',
				attendanceOpen: false,
				participationTakenAt: new Date('2026-09-07T03:00:00.000Z'),
				participationTakenById: 'admin-1',
				participationOpen: false,
				createdAt: new Date('2026-08-18T00:00:00.000Z'),
				updatedAt: new Date('2026-08-18T00:00:00.000Z'),
			},
			{
				id: 'session-2',
				classId: 'class-1',
				tutorialClassId: 'tutorial-1',
				weekNumber: 2,
				heldOn: new Date('2026-09-14T00:00:00.000Z'),
				topic: 'Week 2',
				method: 'ROLL_CALL',
				isCancelled: false,
				attendanceTakenAt: new Date('2026-09-14T02:00:00.000Z'),
				attendanceTakenById: 'admin-1',
				attendanceOpen: false,
				participationTakenAt: new Date('2026-09-14T03:00:00.000Z'),
				participationTakenById: 'admin-1',
				participationOpen: false,
				createdAt: new Date('2026-08-18T00:00:00.000Z'),
				updatedAt: new Date('2026-08-18T00:00:00.000Z'),
			},
		],
		enrollments: [
			{
				id: 'enroll-1',
				classId: 'class-1',
				tutorialClassId: 'tutorial-1',
				studentId: 'student-1',
				orderNo: 1,
				enrolledFromWeek: 2,
				status: 'ACTIVE',
				note: 'private lecturer note',
				createdAt: new Date('2026-08-18T00:00:00.000Z'),
				updatedAt: new Date('2026-08-18T00:00:00.000Z'),
				student: {
					id: 'student-1',
					studentCode: '2406090045',
					familyName: 'Chu Khải Linh',
					givenName: 'Anh',
					hasDateOfBirth: true,
					dateOfBirth: new Date('2006-05-29T00:00:00.000Z'),
					homeClassCode: '2D-24',
					majorName: 'QTKD',
					email: 'hidden@example.com',
					createdAt: new Date('2026-08-18T00:00:00.000Z'),
					updatedAt: new Date('2026-08-18T00:00:00.000Z'),
				},
				attendance: [
					{
						id: 'att-2',
						sessionId: 'session-2',
						enrollmentId: 'enroll-1',
						status: 'PRESENT',
						participationPoints: 1,
						note: 'spoke up',
						recordedById: 'admin-1',
						recordedAt: new Date('2026-09-14T02:00:00.000Z'),
						createdAt: new Date('2026-08-18T00:00:00.000Z'),
						updatedAt: new Date('2026-08-18T00:00:00.000Z'),
					},
				],
				participation: [
					{
						id: 'cp-2',
						sessionId: 'session-2',
						enrollmentId: 'enroll-1',
						points: 1,
						note: 'Trình bày rõ ràng',
						recordedById: 'admin-1',
						recordedAt: new Date('2026-09-14T02:00:00.000Z'),
						createdAt: new Date('2026-08-18T00:00:00.000Z'),
						updatedAt: new Date('2026-08-18T00:00:00.000Z'),
					},
				],
			},
		],
		...overrides,
	};
}

describe('getPublicClassBoard', () => {
	beforeEach(() => {
		vi.mocked(repo.getAttendanceBoardBySlug).mockReset();
	});

	it('returns null when the class is missing, hidden or archived', async () => {
		vi.mocked(repo.getAttendanceBoardBySlug).mockResolvedValue(null);
		await expect(getPublicClassBoard('hrm-fall-2026')).resolves.toBeNull();
	});

	it('maps a privacy-safe shared board and skips weeks before enrollment', async () => {
		vi.mocked(repo.getAttendanceBoardBySlug).mockResolvedValue(boardClass() as never);
		const result = await getPublicClassBoard('hrm-fall-2026');
		expect(result).toMatchObject({
			slug: 'hrm-fall-2026',
			title: 'HRM',
			summary: 'Public summary',
			description: 'Course description',
			announcement: 'Welcome to class',
			credits: 3,
			rules: 'Bring student card',
			students: [
				{
					studentCode: '********45',
					familyName: 'Chu Khải Linh',
					givenName: 'Anh',
					enrolledFromWeek: 2,
				},
			],
		});
		expect(result?.students[0]?.cp.unexcusedAbsences).toBe(0);
		expect(result?.students[0]?.marks['session-1']).toBeUndefined();
		expect(result?.students[0]?.marks['session-2']).toEqual({
			status: 'PRESENT',
			note: 'spoke up',
		});
		expect(result?.students[0]?.participation['session-2']).toEqual({
			points: 1,
			note: 'Trình bày rõ ràng',
		});
		expect(JSON.stringify(result)).not.toContain('2406090045');
		expect(JSON.stringify(result)).not.toContain('hidden@example.com');
		expect(JSON.stringify(result)).not.toContain('2006-05-29');
		expect(JSON.stringify(result)).not.toContain('private lecturer note');
		expect(result).not.toHaveProperty('email');
		expect(result?.students[0]).not.toHaveProperty('email');
		expect(result?.students[0]).not.toHaveProperty('dateOfBirth');
		expect(result?.students[0]).not.toHaveProperty('homeClassCode');
		expect(result?.students[0]).not.toHaveProperty('majorName');
		expect(result?.students[0]).not.toHaveProperty('note');
	});

	it('keeps sessions beyond totalWeeks out of the public board and score', async () => {
		const source = boardClass({ totalWeeks: 1 });
		source.enrollments[0]!.enrolledFromWeek = 1;
		vi.mocked(repo.getAttendanceBoardBySlug).mockResolvedValue(source as never);

		const result = await getPublicClassBoard('hrm-fall-2026');

		expect(result?.sessions.map((session) => session.id)).toEqual(['session-1']);
		expect(result?.students[0]?.marks['session-2']).toBeUndefined();
		expect(result?.students[0]?.participation['session-2']).toBeUndefined();
		expect(result?.students[0]?.cp.participationTotal).toBe(0);
	});
});
