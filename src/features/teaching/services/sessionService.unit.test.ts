import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TeachingGradebook, TeachingGradebookStudent, TeachingSessionRecord } from '../types';

const repo = vi.hoisted(() => ({
	getSession: vi.fn(),
	startAttendanceSession: vi.fn(),
	lockAttendanceSession: vi.fn(),
	parkAttendanceSession: vi.fn(),
	finalizeAttendanceSession: vi.fn(),
	setParticipationSessionOpen: vi.fn(),
	setParticipationSessionLifecycle: vi.fn(),
	incrementGift: vi.fn(),
	decrementGift: vi.fn(),
	getEnrollment: vi.fn(),
	getEnrollmentsByIds: vi.fn(),
	upsertAttendanceMarks: vi.fn(),
	upsertParticipationMarks: vi.fn(),
	updateSession: vi.fn(),
	getSessionForTest: vi.fn(),
}));

const classService = vi.hoisted(() => ({
	getGradebook: vi.fn(),
	notFound: vi.fn((entity = 'Class') => {
		throw new Error(`${entity} not found`);
	}),
}));

vi.mock('../repositories/teachingRepository', () => repo);
vi.mock('./classService', () => classService);

import {
	saveAttendance,
	saveParticipation,
	setAttendanceLifecycle,
	setAttendanceOpen,
	setParticipationLifecycle,
	setParticipationOpen,
	startAttendance,
	updateGift,
} from './sessionService';

function session(overrides: Partial<TeachingSessionRecord> = {}): TeachingSessionRecord {
	return {
		id: 's1',
		classId: 'c1',
		tutorialClassId: 't1',
		weekNumber: 2,
		heldOn: null,
		topic: '',
		method: 'ROLL_CALL',
		isCancelled: false,
		attendanceTakenAt: null,
		attendanceOpen: false,
		participationTakenAt: null,
		participationOpen: false,
		...overrides,
	};
}

function student(overrides: Partial<TeachingGradebookStudent> = {}): TeachingGradebookStudent {
	return {
		enrollmentId: 'e1',
		studentId: 'student-1',
		orderNo: 1,
		tutorialClassId: 't1',
		enrolledFromWeek: 1,
		status: 'ACTIVE',
		studentCode: 'SV01',
		familyName: 'Nguyễn',
		givenName: 'An',
		homeClassCode: '',
		majorName: '',
		dateOfBirth: null,
		email: null,
		note: '',
		marks: {},
		participation: {},
		giftCount: 0,
		cp: {
			takenSessions: 0,
			unexcusedAbsences: 0,
			excusedAbsences: 0,
			lateCount: 0,
			presentCount: 0,
			makeupCount: 0,
			participationTotal: 0,
			giftDeduction: 0,
			absenceDeduction: 0,
			attendanceScore: 5,
			banLimit: 2,
			banned: false,
			examEligible: true,
			cp: 0,
			totalScore: 5,
			riskLevel: 'OK',
		},
		...overrides,
	};
}

function gradebook(
	students: TeachingGradebookStudent[],
	sessions: TeachingSessionRecord[] = [session()],
): TeachingGradebook {
	return {
		class: {
			id: 'c1',
			courseCode: 'HRM',
			courseName: 'HRM',
			groupNo: '1',
			term: 'HK1',
			credits: null,
			lecturerName: '',
			lecturerCode: '',
		totalWeeks: 10,
		attendanceMaxPoints: 5,
		cpMaxPoints: 5,
		absenceDeductionPoints: 0.5,
		lateDeductionPoints: 0.5,
		lateCountsTowardAbsenceThreshold: true,
		giftDeductionPoints: 1,
			absenceThresholdPercent: 20,
			lateGraceMinutes: 15,
			status: 'ACTIVE',
			publicSlug: null,
			publicTitle: '',
			publicSummary: '',
			publicDescription: '',
			publicAnnouncement: '',
			attendanceVisible: false,
			classRules: '',
			createdAt: '',
			updatedAt: '',
		},
		policy: { totalWeeks: 10, absenceThresholdPercent: 20 },
		tutorials: [],
		sessions,
		students,
		stats: {
			studentCount: students.length,
			sessionsTaken: 0,
			averageAttendance: 5,
			averageCp: 0,
			averageTotal: 5,
			atRiskCount: 0,
			bannedCount: 0,
		},
	};
}

describe('session attendance lifecycle', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		classService.notFound.mockImplementation((entity = 'Class') => {
			throw new Error(`${entity} not found`);
		});
	});

	it('starts a session and returns all eligible students', async () => {
		const started = session({ attendanceTakenAt: null, attendanceOpen: true });
		repo.getSession.mockResolvedValue({ ...session(), isCancelled: false });
		repo.startAttendanceSession.mockResolvedValue(started);
		const students = [student(), student({ enrollmentId: 'e2', enrolledFromWeek: 3 })];
		classService.getGradebook.mockResolvedValue(gradebook(students, [started]));

		const result = await startAttendance('s1', 'admin-1');

		expect(repo.startAttendanceSession).toHaveBeenCalledWith('s1', 'admin-1');
		expect(result.session.id).toBe('s1');
		expect(result.students.map((item) => item.enrollmentId)).toEqual(['e1']);
	});

	it('rejects starting or saving attendance for a cancelled session', async () => {
		repo.getSession.mockResolvedValue({ ...session(), isCancelled: true });
		await expect(startAttendance('s1', 'admin-1')).rejects.toThrow('cancelled');
		await expect(
			saveAttendance(
				's1',
				{ marks: [{ enrollmentId: 'e1', status: 'PRESENT', note: '' }] },
				'admin-1',
			),
		).rejects.toThrow('cancelled');
		expect(repo.startAttendanceSession).not.toHaveBeenCalled();
		expect(repo.upsertAttendanceMarks).not.toHaveBeenCalled();
	});

	it('rejects CP writes while the week is locked', async () => {
		repo.getSession.mockResolvedValue(
			session({ participationTakenAt: null, participationOpen: false }),
		);
		await expect(
			saveParticipation('s1', { marks: [{ enrollmentId: 'e1', points: 0.5 }] }),
		).rejects.toThrow('Open CP grading');
		expect(repo.upsertParticipationMarks).not.toHaveBeenCalled();
	});

	it('persists a CP note even when the weekly score is zero', async () => {
		const openSession = session({
			participationTakenAt: '2026-09-01T00:00:00.000Z',
			participationOpen: true,
		});
		repo.getSession.mockResolvedValue(openSession);
		repo.getEnrollmentsByIds.mockResolvedValue([
			{ id: 'e1', classId: 'c1', tutorialClassId: 't1', enrolledFromWeek: 1 },
		]);
		classService.getGradebook.mockResolvedValue(
			gradebook(
				[student({ participation: { s1: { points: 0, note: 'Chưa chuẩn bị bài' } } })],
				[openSession],
			),
		);

		await saveParticipation(
			's1',
			{ marks: [{ enrollmentId: 'e1', points: 0, note: 'Chưa chuẩn bị bài' }] },
			'admin-1',
		);

		expect(repo.upsertParticipationMarks).toHaveBeenCalledWith('s1', [
			{
				enrollmentId: 'e1',
				points: 0,
				note: 'Chưa chuẩn bị bài',
				recordedById: 'admin-1',
			},
		]);
	});

	it('rejects attendance writes for an enrollment in another tutorial', async () => {
		repo.getSession.mockResolvedValue(session({ attendanceOpen: true }));
		repo.getEnrollmentsByIds.mockResolvedValue([
			{ id: 'e1', classId: 'c1', tutorialClassId: 't2', enrolledFromWeek: 1 },
		]);

		await expect(
			saveAttendance('s1', { marks: [{ enrollmentId: 'e1', status: 'PRESENT' }] }),
		).rejects.toThrow('Enrollment not found');
		expect(repo.upsertAttendanceMarks).not.toHaveBeenCalled();
	});

	it('rejects CP writes for an enrollment in another tutorial', async () => {
		repo.getSession.mockResolvedValue(session({ participationOpen: true }));
		repo.getEnrollmentsByIds.mockResolvedValue([
			{ id: 'e1', classId: 'c1', tutorialClassId: 't2', enrolledFromWeek: 1 },
		]);

		await expect(
			saveParticipation('s1', { marks: [{ enrollmentId: 'e1', points: 1 }] }),
		).rejects.toThrow('Enrollment not found');
		expect(repo.upsertParticipationMarks).not.toHaveBeenCalled();
	});

	it('opens CP grading without finalizing the week', async () => {
		const existing = session({
			participationTakenAt: null,
			participationOpen: false,
		});
		const updated = session({
			participationTakenAt: null,
			participationOpen: true,
		});
		repo.getSession.mockResolvedValue(existing);
		repo.setParticipationSessionLifecycle.mockResolvedValue(updated);
		classService.getGradebook.mockResolvedValue(gradebook([student()], [updated]));
		const result = await setParticipationOpen('s1', true, 'admin-1');
		expect(repo.setParticipationSessionLifecycle).toHaveBeenCalledWith('s1', 'open', 'admin-1');
		expect(result.session.participationOpen).toBe(true);
		expect(result.session.participationTakenAt).toBeNull();
	});

	it('increments and decrements Gift through the enrollment aggregate', async () => {
		repo.getEnrollment.mockResolvedValue({ id: 'e1', classId: 'c1', status: 'ACTIVE' });
		repo.incrementGift.mockResolvedValue(undefined);
		classService.getGradebook.mockResolvedValue(
			gradebook([student({ giftCount: 1, cp: { ...student().cp, giftDeduction: 1, cp: 0 } })]),
		);
		const result = await updateGift('e1', 1);
		expect(repo.incrementGift).toHaveBeenCalledWith('e1');
		expect(result.student.giftCount).toBe(1);
	});

	it('parks a session without deleting existing attendance marks', async () => {
		const parked = session({
			attendanceTakenAt: null,
			attendanceOpen: false,
		});
		repo.getSession.mockResolvedValue({
			...session(),
			attendanceTakenAt: null,
			attendanceOpen: true,
		});
		repo.parkAttendanceSession.mockResolvedValue(parked);
		const existing = student({ marks: { s1: { status: 'PRESENT', note: 'Đã kiểm tra' } } });
		classService.getGradebook.mockResolvedValue(gradebook([existing], [parked]));

		const result = await setAttendanceOpen('s1', false, 'admin-1');

		expect(repo.parkAttendanceSession).toHaveBeenCalledWith('s1');
		expect(result.session.attendanceTakenAt).toBeNull();
		expect(result.students[0]?.marks.s1).toEqual({ status: 'PRESENT', note: 'Đã kiểm tra' });
	});

	it('finalizes a week so it starts counting toward the grade', async () => {
		const finalized = session({
			attendanceTakenAt: '2026-09-01T00:00:00.000Z',
			attendanceOpen: false,
		});
		repo.getSession.mockResolvedValue({ ...session(), attendanceOpen: true });
		repo.finalizeAttendanceSession.mockResolvedValue(finalized);
		classService.getGradebook.mockResolvedValue(gradebook([student()], [finalized]));

		const result = await setAttendanceLifecycle('s1', 'finalize', 'admin-1');

		expect(repo.finalizeAttendanceSession).toHaveBeenCalledWith('s1', 'admin-1');
		expect(result.session.attendanceTakenAt).toBe('2026-09-01T00:00:00.000Z');
		expect(result.session.attendanceOpen).toBe(false);
	});

	it('opens a locked session through the idempotent start flow', async () => {
		const opened = session({ attendanceTakenAt: null, attendanceOpen: true });
		repo.getSession.mockResolvedValue({
			...session(),
			attendanceTakenAt: null,
			attendanceOpen: false,
		});
		repo.startAttendanceSession.mockResolvedValue(opened);
		classService.getGradebook.mockResolvedValue(gradebook([student()], [opened]));

		const result = await setAttendanceOpen('s1', true, 'admin-1');

		expect(repo.startAttendanceSession).toHaveBeenCalledWith('s1', 'admin-1');
		expect(result.session.attendanceOpen).toBe(true);
	});

	it('rejects decrementing Gift when the count is already zero', async () => {
		repo.getEnrollment.mockResolvedValue({ id: 'e1', classId: 'c1', status: 'ACTIVE' });
		repo.decrementGift.mockResolvedValue(false);
		await expect(updateGift('e1', -1)).rejects.toThrow('Không thể giảm Gift');
	});

	it('finalizes CP independently from the open/park toggle', async () => {
		repo.getSession.mockResolvedValue(session({ participationOpen: true }));
		const finalized = session({
			participationTakenAt: '2026-09-01T00:00:00.000Z',
			participationOpen: false,
		});
		repo.setParticipationSessionLifecycle.mockResolvedValue(finalized);
		classService.getGradebook.mockResolvedValue(gradebook([student()], [finalized]));
		const result = await setParticipationLifecycle('s1', 'finalize', 'admin-1');
		expect(repo.setParticipationSessionLifecycle).toHaveBeenCalledWith('s1', 'finalize', 'admin-1');
		expect(result.session.participationTakenAt).toBe('2026-09-01T00:00:00.000Z');
	});

	it('passes an optional held-on date through the open transaction', async () => {
		const opened = session({
			heldOn: '2026-09-15',
			attendanceTakenAt: null,
			attendanceOpen: true,
		});
		repo.getSession.mockResolvedValue({
			...session(),
			attendanceTakenAt: '2026-09-15T00:00:00.000Z',
			attendanceOpen: false,
		});
		repo.startAttendanceSession.mockResolvedValue(opened);
		classService.getGradebook.mockResolvedValue(gradebook([student()], [opened]));

		await setAttendanceOpen('s1', true, 'admin-1', '2026-09-15');

		expect(repo.startAttendanceSession).toHaveBeenCalledWith('s1', 'admin-1', '2026-09-15');
	});
});
