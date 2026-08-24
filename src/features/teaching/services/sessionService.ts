import { AppError } from '@/lib/appError';

import { parseIsoDate } from '../domain/prismaErrors';
import * as repo from '../repositories/teachingRepository';
import type {
	BatchAttendanceInput,
	BatchParticipationInput,
	SessionLifecycleAction,
	UpdateSessionInput,
} from '../schemas';
import { mapSession } from './mappers';
import { getGradebook, notFound } from './classService';
import type {
	TeachingAttendanceMutationResult,
	TeachingGiftMutationResult,
	TeachingParticipationMutationResult,
} from '../types';

export async function updateSession(sessionId: string, input: UpdateSessionInput) {
	const existing = await repo.getSession(sessionId);
	if (!existing) notFound('Session');
	const updated = await repo.updateSession(sessionId, {
		heldOn: input.heldOn === undefined ? undefined : parseIsoDate(input.heldOn),
		topic: input.topic,
		method: input.method,
		isCancelled: input.isCancelled,
	});
	return mapSession(updated);
}

export async function saveAttendance(
	sessionId: string,
	input: BatchAttendanceInput,
	userId?: string,
) {
	const session = await repo.getSession(sessionId);
	if (!session) notFound('Session');
	if (session.isCancelled)
		throw new AppError('Cannot mark attendance for a cancelled session', 422, 'VALIDATION');
	if (!session.attendanceOpen)
		throw new AppError('Open attendance for this week before saving', 409, 'CONFLICT');
	const enrollmentIds = new Set(input.marks.map((mark) => mark.enrollmentId));
	if (enrollmentIds.size !== input.marks.length) {
		throw new AppError('Duplicate enrollment in attendance payload', 422, 'VALIDATION');
	}
	const enrollments = await repo.getEnrollmentsByIds([...enrollmentIds]);
	const byId = new Map(enrollments.map((enrollment) => [enrollment.id, enrollment]));
	for (const mark of input.marks) {
		const enrollment = byId.get(mark.enrollmentId);
		if (
			!enrollment ||
			enrollment.classId !== session.classId ||
			enrollment.tutorialClassId !== session.tutorialClassId
		) {
			notFound('Enrollment');
		}
		if (enrollment.enrolledFromWeek > session.weekNumber) {
			throw new AppError('Student was not enrolled for this week', 422, 'VALIDATION');
		}
	}
	await repo.upsertAttendanceMarks(
		sessionId,
		input.marks.map((mark) => ({
			enrollmentId: mark.enrollmentId,
			status: mark.status,
			note:
				mark.note ?? (mark.status === 'LATE' ? 'Late' : mark.status === 'MAKEUP' ? 'Make-up' : ''),
			recordedById: userId ?? null,
		})),
	);
	const gradebook = await getGradebook(session.classId);
	const updatedSession = gradebook.sessions.find((item) => item.id === sessionId);
	if (!updatedSession) notFound('Session');
	const affectedIds = new Set(input.marks.map((mark) => mark.enrollmentId));
	const result: TeachingAttendanceMutationResult = {
		session: updatedSession,
		students: gradebook.students.filter((student) => affectedIds.has(student.enrollmentId)),
		stats: gradebook.stats,
	};
	return result;
}

export async function startAttendance(
	sessionId: string,
	userId?: string,
	heldOn?: string | null,
): Promise<TeachingAttendanceMutationResult> {
	const existing = await repo.getSession(sessionId);
	if (!existing) notFound('Session');
	if (existing.isCancelled)
		throw new AppError('Cannot start a cancelled session', 422, 'VALIDATION');

	const session =
		heldOn === undefined
			? await repo.startAttendanceSession(sessionId, userId ?? null)
			: await repo.startAttendanceSession(sessionId, userId ?? null, heldOn);
	if (!session) notFound('Session');

	const gradebook = await getGradebook(session.classId);
	const updatedSession = gradebook.sessions.find((item) => item.id === sessionId);
	if (!updatedSession) notFound('Session');
	const affectedIds = new Set(
		gradebook.students
			.filter(
				(student) =>
					student.tutorialClassId === session.tutorialClassId &&
					student.enrolledFromWeek <= session.weekNumber,
			)
			.map((student) => student.enrollmentId),
	);

	return {
		session: updatedSession,
		students: gradebook.students.filter((student) => affectedIds.has(student.enrollmentId)),
		stats: gradebook.stats,
	};
}

async function attendanceMutationResult(
	sessionId: string,
	session: { classId: string; tutorialClassId: string; weekNumber: number },
): Promise<TeachingAttendanceMutationResult> {
	const gradebook = await getGradebook(session.classId);
	const updatedSession = gradebook.sessions.find((item) => item.id === sessionId);
	if (!updatedSession) notFound('Session');
	const affectedIds = new Set(
		gradebook.students
			.filter(
				(student) =>
					student.tutorialClassId === session.tutorialClassId &&
					student.enrolledFromWeek <= session.weekNumber,
			)
			.map((student) => student.enrollmentId),
	);
	return {
		session: updatedSession,
		students: gradebook.students.filter((student) => affectedIds.has(student.enrollmentId)),
		stats: gradebook.stats,
	};
}

export async function setAttendanceLifecycle(
	sessionId: string,
	action: SessionLifecycleAction,
	userId?: string,
	heldOn?: string | null,
): Promise<TeachingAttendanceMutationResult> {
	const existing = await repo.getSession(sessionId);
	if (!existing) notFound('Session');
	if (existing.isCancelled)
		throw new AppError('Cannot change a cancelled session', 422, 'VALIDATION');
	if (action === 'open' || action === 'unfinalize') {
		return startAttendance(sessionId, userId, heldOn);
	}
	if (action === 'finalize') {
		const session =
			heldOn === undefined
				? await repo.finalizeAttendanceSession(sessionId, userId ?? null)
				: await repo.finalizeAttendanceSession(sessionId, userId ?? null, heldOn);
		if (!session) notFound('Session');
		return attendanceMutationResult(sessionId, session);
	}
	const session = await repo.parkAttendanceSession(sessionId);
	return attendanceMutationResult(sessionId, session);
}

export async function setAttendanceOpen(
	sessionId: string,
	open: boolean,
	userId?: string,
	heldOn?: string | null,
): Promise<TeachingAttendanceMutationResult> {
	return setAttendanceLifecycle(sessionId, open ? 'open' : 'park', userId, heldOn);
}

export async function saveParticipation(
	sessionId: string,
	input: BatchParticipationInput,
	userId?: string,
): Promise<TeachingParticipationMutationResult> {
	const session = await repo.getSession(sessionId);
	if (!session) notFound('Session');
	if (session.isCancelled)
		throw new AppError('Cannot grade a cancelled session', 422, 'VALIDATION');
	if (!session.participationOpen)
		throw new AppError('Open CP grading for this week before saving', 409, 'CONFLICT');
	const enrollmentIds = new Set(input.marks.map((mark) => mark.enrollmentId));
	if (enrollmentIds.size !== input.marks.length) {
		throw new AppError('Duplicate enrollment in participation payload', 422, 'VALIDATION');
	}
	const enrollments = await repo.getEnrollmentsByIds([...enrollmentIds]);
	const byId = new Map(enrollments.map((enrollment) => [enrollment.id, enrollment]));
	for (const mark of input.marks) {
		const enrollment = byId.get(mark.enrollmentId);
		if (
			!enrollment ||
			enrollment.classId !== session.classId ||
			enrollment.tutorialClassId !== session.tutorialClassId
		) {
			notFound('Enrollment');
		}
		if (enrollment.enrolledFromWeek > session.weekNumber) {
			throw new AppError('Student was not enrolled for this week', 422, 'VALIDATION');
		}
	}
	await repo.upsertParticipationMarks(
		sessionId,
		input.marks.map((mark) => ({
			enrollmentId: mark.enrollmentId,
			points: mark.points,
			note: mark.note ?? '',
			recordedById: userId ?? null,
		})),
	);
	const gradebook = await getGradebook(session.classId);
	const updatedSession = gradebook.sessions.find((item) => item.id === sessionId);
	if (!updatedSession) notFound('Session');
	const affectedIds = new Set(input.marks.map((mark) => mark.enrollmentId));
	return {
		session: updatedSession,
		students: gradebook.students.filter((student) => affectedIds.has(student.enrollmentId)),
		stats: gradebook.stats,
	};
}

export async function setParticipationOpen(
	sessionId: string,
	open: boolean,
	userId?: string,
): Promise<TeachingParticipationMutationResult> {
	const existing = await repo.getSession(sessionId);
	if (!existing) notFound('Session');
	if (existing.isCancelled)
		throw new AppError('Cannot change CP grading for a cancelled session', 422, 'VALIDATION');

	const session = await repo.setParticipationSessionLifecycle(
		sessionId,
		open ? 'open' : 'park',
		userId ?? null,
	);
	if (!session) notFound('Session');
	return attendanceMutationResult(sessionId, session);
}

export async function setParticipationLifecycle(
	sessionId: string,
	action: SessionLifecycleAction,
	userId?: string,
): Promise<TeachingParticipationMutationResult> {
	const existing = await repo.getSession(sessionId);
	if (!existing) notFound('Session');
	if (existing.isCancelled)
		throw new AppError('Cannot change CP grading for a cancelled session', 422, 'VALIDATION');
	const session = await repo.setParticipationSessionLifecycle(sessionId, action, userId ?? null);
	if (!session) notFound('Session');
	return attendanceMutationResult(sessionId, session);
}

export async function updateGift(
	enrollmentId: string,
	delta: 1 | -1,
): Promise<TeachingGiftMutationResult> {
	const enrollment = await repo.getEnrollment(enrollmentId);
	if (!enrollment || enrollment.status === 'WITHDRAWN') notFound('Enrollment');
	if (delta === 1) await repo.incrementGift(enrollmentId);
	else {
		const decreased = await repo.decrementGift(enrollmentId);
		if (!decreased) {
			throw new AppError('Không thể giảm Gift khi đã ở 0', 409, 'CONFLICT');
		}
	}
	const gradebook = await getGradebook(enrollment.classId);
	const student = gradebook.students.find((item) => item.enrollmentId === enrollmentId);
	if (!student) notFound('Enrollment');
	return { student, stats: gradebook.stats };
}
