import type { Prisma, TeachingStudent } from '@prisma/client';

import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';
import { normalizeStudentCode } from '../domain/studentIdentity';

export const DEFAULT_TUTORIAL_CODE = 'T01';
export const DEFAULT_TUTORIAL_NAME = 'Tutorial 1';

const classInclude = {
	tutorials: { orderBy: [{ displayOrder: 'asc' as const }, { code: 'asc' as const }] },
	_count: { select: { enrollments: true, sessions: true, tutorials: true } },
} satisfies Prisma.TeachingClassInclude;

export async function listClasses() {
	return prisma.teachingClass.findMany({
		orderBy: [{ updatedAt: 'desc' }],
		include: {
			...classInclude,
			sessions: {
				select: {
					id: true,
					tutorialClassId: true,
					weekNumber: true,
					attendanceTakenAt: true,
					attendanceOpen: true,
					participationTakenAt: true,
					participationOpen: true,
					isCancelled: true,
				},
			},
			enrollments: {
				where: { status: 'ACTIVE' },
				select: {
					id: true,
					tutorialClassId: true,
					enrolledFromWeek: true,
					giftCount: true,
					attendance: {
						select: {
							status: true,
							sessionId: true,
						},
					},
					participation: {
						select: {
							points: true,
							sessionId: true,
						},
					},
				},
			},
		},
	});
}

export async function getClass(id: string) {
	return prisma.teachingClass.findUnique({
		where: { id },
		include: classInclude,
	});
}

export function getPublicPageConfig(id: string) {
	return prisma.teachingClass.findUnique({
		where: { id },
		include: {
			publicLinks: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
		},
	});
}

export function listClassNotes(classId: string) {
	return prisma.teachingClassNote.findMany({
		where: { classId },
		orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
	});
}

export function getClassNote(id: string) {
	return prisma.teachingClassNote.findUnique({ where: { id } });
}

export function createClassNote(data: Prisma.TeachingClassNoteUncheckedCreateInput) {
	return prisma.teachingClassNote.create({ data });
}

export function updateClassNote(
	id: string,
	data: Prisma.TeachingClassNoteUncheckedUpdateInput,
) {
	return prisma.teachingClassNote.update({ where: { id }, data });
}

export function deleteClassNote(id: string) {
	return prisma.teachingClassNote.delete({ where: { id } });
}

export function reorderClassNotes(classId: string, ids: string[]) {
	return prisma.$transaction(
		ids.map((id, displayOrder) =>
			prisma.teachingClassNote.update({
				where: { id },
				data: { displayOrder },
			}),
		),
	);
}

export function updatePublicPageConfig(
	id: string,
	data: {
		publicSlug: string;
		publicTitle: string;
		publicSummary: string;
		publicDescription: string;
		publicAnnouncement: string;
		links: Array<{ label: string; url: string; description: string }>;
	},
) {
	return prisma.$transaction(async (transaction) => {
		await transaction.teachingClass.update({
			where: { id },
			data: {
				publicSlug: data.publicSlug,
				publicTitle: data.publicTitle,
				publicSummary: data.publicSummary,
				publicDescription: data.publicDescription,
				publicAnnouncement: data.publicAnnouncement,
			},
		});
		await transaction.teachingClassPublicLink.deleteMany({ where: { classId: id } });
		if (data.links.length) {
			await transaction.teachingClassPublicLink.createMany({
				data: data.links.map((link, displayOrder) => ({
					classId: id,
					label: link.label,
					url: link.url,
					description: link.description,
					displayOrder,
				})),
			});
		}
		return transaction.teachingClass.findUniqueOrThrow({
			where: { id },
			include: {
				publicLinks: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
			},
		});
	});
}

export async function getGradebookClass(id: string) {
	return prisma.teachingClass.findUnique({
		where: { id },
		include: {
			tutorials: { orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }] },
			sessions: { orderBy: [{ weekNumber: 'asc' }] },
			enrollments: {
				where: { status: { not: 'WITHDRAWN' } },
				orderBy: [{ orderNo: 'asc' }, { createdAt: 'asc' }],
				include: {
					student: true,
					attendance: true,
					participation: true,
				},
			},
		},
	});
}

export async function getRosterClass(id: string) {
	return prisma.teachingClass.findUnique({
		where: { id },
		include: {
			tutorials: { orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }] },
			enrollments: {
				orderBy: [{ orderNo: 'asc' }, { createdAt: 'asc' }],
				include: { student: true },
			},
		},
	});
}

export function createClassRecord(data: Prisma.TeachingClassCreateInput) {
	return prisma.teachingClass.create({ data, include: classInclude });
}

export function updateClassRecord(id: string, data: Prisma.TeachingClassUpdateInput) {
	return prisma.teachingClass.update({ where: { id }, data, include: classInclude });
}

export function deleteClassRecord(id: string) {
	return prisma.teachingClass.delete({ where: { id } });
}

export function createTutorial(data: Prisma.TeachingTutorialClassUncheckedCreateInput) {
	return prisma.teachingTutorialClass.create({ data });
}

export function updateTutorial(id: string, data: Prisma.TeachingTutorialClassUncheckedUpdateInput) {
	return prisma.teachingTutorialClass.update({ where: { id }, data });
}

export function deleteTutorial(id: string) {
	return prisma.teachingTutorialClass.delete({ where: { id } });
}

export function getTutorial(id: string) {
	return prisma.teachingTutorialClass.findUnique({ where: { id } });
}

export function listTutorials(classId: string) {
	return prisma.teachingTutorialClass.findMany({
		where: { classId },
		orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }],
		include: { _count: { select: { enrollments: true } } },
	});
}

export function createSessions(rows: Prisma.TeachingSessionCreateManyInput[]) {
	return prisma.teachingSession.createMany({ data: rows, skipDuplicates: true });
}

export function listSessionsForTutorial(tutorialClassId: string) {
	return prisma.teachingSession.findMany({
		where: { tutorialClassId },
		orderBy: { weekNumber: 'asc' },
	});
}

export function getEnrollmentsByIds(ids: string[]) {
	if (ids.length === 0) return Promise.resolve([]);
	return prisma.teachingEnrollment.findMany({
		where: { id: { in: ids } },
	});
}

export function getAttendanceBoardBySlug(slug: string) {
	return prisma.teachingClass.findFirst({
		where: { publicSlug: slug, attendanceVisible: true, status: 'ACTIVE' },
		include: {
			publicLinks: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
			tutorials: { orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }] },
			sessions: { orderBy: [{ weekNumber: 'asc' }] },
			enrollments: {
				where: { status: { not: 'WITHDRAWN' } },
				orderBy: [{ orderNo: 'asc' }, { createdAt: 'asc' }],
				include: {
					student: true,
					attendance: true,
					participation: true,
				},
			},
			notes: {
				where: { publishedAt: { not: null }, publishedHtml: { not: null } },
				orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
			},
		},
	});
}

export async function getClassIdBySlug(slug: string): Promise<string | null> {
	const row = await prisma.teachingClass.findFirst({
		where: { publicSlug: slug },
		select: { id: true },
	});
	return row?.id ?? null;
}

export function updateShareState(
	id: string,
	data: {
		publicSlug: string | null;
		publicTitle: string;
		publicSummary: string;
		attendanceVisible: boolean;
		classRules?: string;
	},
) {
	return prisma.$transaction(async (transaction) => {
		await transaction.teachingClass.update({
			where: { id },
			data: {
				publicSlug: data.publicSlug,
				publicTitle: data.publicTitle,
				publicSummary: data.publicSummary,
				attendanceVisible: data.attendanceVisible,
				classRules: data.classRules,
			},
		});
		return transaction.teachingClass.findUniqueOrThrow({
			where: { id },
			include: { publicLinks: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] } },
		});
	});
}

export function countActiveClasses() {
	return prisma.teachingClass.count({ where: { status: 'ACTIVE' } });
}

export function getSession(id: string) {
	return prisma.teachingSession.findUnique({
		where: { id },
		include: { class: true, tutorialClass: true },
	});
}

export function updateSession(id: string, data: Prisma.TeachingSessionUncheckedUpdateInput) {
	return prisma.teachingSession.update({ where: { id }, data });
}

export function getStudentByCode(studentCode: string) {
	return prisma.teachingStudent.findUnique({
		where: { studentCodeNormalized: normalizeStudentCode(studentCode) },
	});
}

export function findStudentsByNormalizedCodes(codes: string[]) {
	if (codes.length === 0) return Promise.resolve([]);
	return prisma.teachingStudent.findMany({
		where: { studentCodeNormalized: { in: codes.map(normalizeStudentCode) } },
		include: {
			enrollments: { select: { id: true, classId: true, status: true } },
		},
	});
}

export function upsertStudent(data: {
	studentCode: string;
	familyName: string;
	givenName: string;
	dateOfBirth: Date | null;
	homeClassCode: string;
	majorName: string;
	phone?: string | null;
	email?: string | null;
}) {
	const studentCode = normalizeStudentCode(data.studentCode);
	const payload = {
		...data,
		studentCode,
		studentCodeNormalized: studentCode,
	};
	return prisma.teachingStudent.upsert({
		where: { studentCodeNormalized: studentCode },
		create: payload,
		update: {
			familyName: payload.familyName,
			givenName: payload.givenName,
			dateOfBirth: payload.dateOfBirth,
			homeClassCode: payload.homeClassCode,
			majorName: payload.majorName,
			phone: payload.phone ?? undefined,
			email: payload.email ?? undefined,
			studentCode,
			studentCodeNormalized: studentCode,
		},
	});
}

type StudentBackfillSnapshot = Pick<
	TeachingStudent,
	| 'id'
	| 'familyName'
	| 'givenName'
	| 'dateOfBirth'
	| 'homeClassCode'
	| 'majorName'
	| 'phone'
	| 'email'
>;

type StudentBackfillInput = Omit<StudentBackfillSnapshot, 'id'>;

/** Backfills only missing values, using per-field compare-and-set guards to avoid concurrent overwrite. */
export async function backfillStudentMissingFields(
	existing: StudentBackfillSnapshot,
	incoming: StudentBackfillInput,
): Promise<boolean> {
	const updates: Array<ReturnType<typeof prisma.teachingStudent.updateMany>> = [];
	const familyName = incoming.familyName.trim();
	const givenName = incoming.givenName.trim();
	const homeClassCode = incoming.homeClassCode.trim();
	const majorName = incoming.majorName.trim();
	const phone = incoming.phone?.trim() || null;
	const email = incoming.email?.trim() || null;

	if (!existing.familyName.trim() && familyName) {
		updates.push(
			prisma.teachingStudent.updateMany({
				where: { id: existing.id, familyName: existing.familyName },
				data: { familyName },
			}),
		);
	}
	if (!existing.givenName.trim() && givenName) {
		updates.push(
			prisma.teachingStudent.updateMany({
				where: { id: existing.id, givenName: existing.givenName },
				data: { givenName },
			}),
		);
	}
	if (!existing.dateOfBirth && incoming.dateOfBirth) {
		updates.push(
			prisma.teachingStudent.updateMany({
				where: { id: existing.id, dateOfBirth: null },
				data: { dateOfBirth: incoming.dateOfBirth },
			}),
		);
	}
	if (!existing.homeClassCode.trim() && homeClassCode) {
		updates.push(
			prisma.teachingStudent.updateMany({
				where: { id: existing.id, homeClassCode: existing.homeClassCode },
				data: { homeClassCode },
			}),
		);
	}
	if (!existing.majorName.trim() && majorName) {
		updates.push(
			prisma.teachingStudent.updateMany({
				where: { id: existing.id, majorName: existing.majorName },
				data: { majorName },
			}),
		);
	}
	if (!existing.phone?.trim() && phone) {
		updates.push(
			prisma.teachingStudent.updateMany({
				where: { id: existing.id, phone: existing.phone },
				data: { phone },
			}),
		);
	}
	if (!existing.email?.trim() && email) {
		updates.push(
			prisma.teachingStudent.updateMany({
				where: { id: existing.id, email: existing.email },
				data: { email },
			}),
		);
	}

	if (updates.length === 0) return false;
	const results = await prisma.$transaction(updates);
	return results.some((result) => result.count > 0);
}

export function getEnrollment(id: string) {
	return prisma.teachingEnrollment.findUnique({
		where: { id },
		include: { student: true, class: true },
	});
}

export function getEnrollmentByClassAndStudent(classId: string, studentId: string) {
	return prisma.teachingEnrollment.findUnique({
		where: { classId_studentId: { classId, studentId } },
	});
}

export function upsertEnrollment(data: {
	classId: string;
	studentId: string;
	tutorialClassId: string | null;
	orderNo: number;
	enrolledFromWeek?: number;
}) {
	return prisma.teachingEnrollment.upsert({
		where: { classId_studentId: { classId: data.classId, studentId: data.studentId } },
		create: {
			classId: data.classId,
			studentId: data.studentId,
			tutorialClassId: data.tutorialClassId,
			orderNo: data.orderNo,
			status: 'ACTIVE',
			enrolledFromWeek: data.enrolledFromWeek ?? 1,
		},
		update: {
			tutorialClassId: data.tutorialClassId,
			orderNo: data.orderNo,
			status: 'ACTIVE',
			...(data.enrolledFromWeek != null ? { enrolledFromWeek: data.enrolledFromWeek } : {}),
		},
	});
}

export function updateEnrollment(id: string, data: Prisma.TeachingEnrollmentUncheckedUpdateInput) {
	return prisma.teachingEnrollment.update({ where: { id }, data, include: { student: true } });
}

export function countActiveEnrollments(classId: string) {
	return prisma.teachingEnrollment.count({ where: { classId, status: 'ACTIVE' } });
}

export async function nextEnrollmentOrderNo(classId: string) {
	const result = await prisma.teachingEnrollment.aggregate({
		where: { classId },
		_max: { orderNo: true },
	});
	return (result._max.orderNo ?? 0) + 1;
}

export async function upsertAttendanceMarks(
	sessionId: string,
	marks: Array<{
		enrollmentId: string;
		status: Prisma.TeachingAttendanceCreateInput['status'];
		note: string;
		recordedById: string | null;
	}>,
) {
	await prisma.$transaction(async (transaction) => {
		const session = await transaction.teachingSession.findUnique({
			where: { id: sessionId },
			select: { attendanceOpen: true, isCancelled: true },
		});
		if (!session) throw new AppError('Session not found', 404, 'NOT_FOUND');
		if (session.isCancelled)
			throw new AppError('Cannot mark attendance for a cancelled session', 422, 'VALIDATION');
		if (!session.attendanceOpen)
			throw new AppError('Open attendance for this week before saving', 409, 'CONFLICT');
		for (const mark of marks) {
			await transaction.teachingAttendance.upsert({
				where: { sessionId_enrollmentId: { sessionId, enrollmentId: mark.enrollmentId } },
				create: {
					sessionId,
					enrollmentId: mark.enrollmentId,
					status: mark.status,
					note: mark.note,
					recordedById: mark.recordedById,
					recordedAt: new Date(),
				},
				update: {
					status: mark.status,
					note: mark.note,
					recordedById: mark.recordedById,
					recordedAt: new Date(),
				},
			});
		}
	});
}

async function writeAttendanceSession(
	sessionId: string,
	userId: string | null,
	heldOn: string | null | undefined,
	mode: 'open' | 'finalize',
) {
	return prisma.$transaction(async (transaction) => {
		const session = await transaction.teachingSession.findUnique({
			where: { id: sessionId },
			include: { class: true },
		});
		if (!session) return null;

		const enrollments = await transaction.teachingEnrollment.findMany({
			where: {
				classId: session.classId,
				tutorialClassId: session.tutorialClassId,
				status: 'ACTIVE',
				enrolledFromWeek: { lte: session.weekNumber },
			},
			select: { id: true },
		});
		const existing = await transaction.teachingAttendance.findMany({
			where: { sessionId },
			select: { enrollmentId: true },
		});
		const existingIds = new Set(existing.map((mark) => mark.enrollmentId));
		const missing = enrollments.filter((enrollment) => !existingIds.has(enrollment.id));

		if (missing.length > 0) {
			await transaction.teachingAttendance.createMany({
				data: missing.map((enrollment) => ({
					sessionId,
					enrollmentId: enrollment.id,
					status: 'ABSENT_UNEXCUSED' as const,
					note: '',
					recordedById: userId,
				})),
				skipDuplicates: true,
			});
		}

		return transaction.teachingSession.update({
			where: { id: sessionId },
			data: {
				heldOn:
					heldOn === undefined ? undefined : heldOn ? new Date(`${heldOn}T00:00:00.000Z`) : null,
				attendanceTakenAt: mode === 'finalize' ? (session.attendanceTakenAt ?? new Date()) : undefined,
				attendanceTakenById: userId ?? session.attendanceTakenById,
				attendanceOpen: mode === 'open',
			},
		});
	});
}

export async function startAttendanceSession(
	sessionId: string,
	userId: string | null,
	heldOn?: string | null,
) {
	return writeAttendanceSession(sessionId, userId, heldOn, 'open');
}

export function parkAttendanceSession(sessionId: string) {
	return prisma.teachingSession.update({
		where: { id: sessionId },
		data: {
			attendanceOpen: false,
			attendanceTakenAt: null,
		},
	});
}

export function lockAttendanceSession(sessionId: string) {
	return parkAttendanceSession(sessionId);
}

export async function finalizeAttendanceSession(
	sessionId: string,
	userId: string | null,
	heldOn?: string | null,
) {
	return writeAttendanceSession(sessionId, userId, heldOn, 'finalize');
}

export async function setParticipationSessionLifecycle(
	sessionId: string,
	action: 'open' | 'park' | 'finalize' | 'unfinalize',
	userId: string | null,
) {
	const existing = await prisma.teachingSession.findUnique({
		where: { id: sessionId },
		select: { participationTakenAt: true, participationTakenById: true },
	});
	if (!existing) return null;
	if (action === 'open' || action === 'unfinalize') {
		return prisma.teachingSession.update({
			where: { id: sessionId },
			data: {
				participationOpen: true,
				participationTakenById: userId ?? existing.participationTakenById,
			},
		});
	}
	if (action === 'park') {
		return prisma.teachingSession.update({
			where: { id: sessionId },
			data: {
				participationOpen: false,
				participationTakenAt: null,
			},
		});
	}
	return prisma.teachingSession.update({
		where: { id: sessionId },
		data: {
			participationOpen: false,
			participationTakenAt: existing.participationTakenAt ?? new Date(),
			participationTakenById: userId ?? existing.participationTakenById,
		},
	});
}

export async function setParticipationSessionOpen(
	sessionId: string,
	open: boolean,
	userId: string | null,
	_openedAt = new Date(),
) {
	return setParticipationSessionLifecycle(sessionId, open ? 'open' : 'park', userId);
}

export async function upsertParticipationMarks(
	sessionId: string,
	marks: Array<{ enrollmentId: string; points: number; note: string; recordedById: string | null }>,
) {
	await prisma.$transaction(async (transaction) => {
		const session = await transaction.teachingSession.findUnique({
			where: { id: sessionId },
			select: { participationOpen: true, isCancelled: true },
		});
		if (!session) throw new AppError('Session not found', 404, 'NOT_FOUND');
		if (session.isCancelled)
			throw new AppError('Cannot grade a cancelled session', 422, 'VALIDATION');
		if (!session.participationOpen)
			throw new AppError('Open CP grading for this week before saving', 409, 'CONFLICT');
		for (const mark of marks) {
			if (mark.points === 0 && !mark.note) {
				await transaction.teachingParticipation.deleteMany({
					where: { sessionId, enrollmentId: mark.enrollmentId },
				});
				continue;
			}
			await transaction.teachingParticipation.upsert({
				where: { sessionId_enrollmentId: { sessionId, enrollmentId: mark.enrollmentId } },
				create: {
					sessionId,
					enrollmentId: mark.enrollmentId,
					points: mark.points,
					note: mark.note,
					recordedById: mark.recordedById,
					recordedAt: new Date(),
				},
				update: {
					points: mark.points,
					note: mark.note,
					recordedById: mark.recordedById,
					recordedAt: new Date(),
				},
			});
		}
	});
}

export function incrementGift(enrollmentId: string) {
	return prisma.teachingEnrollment.update({
		where: { id: enrollmentId },
		data: { giftCount: { increment: 1 } },
	});
}

export async function decrementGift(enrollmentId: string) {
	const updated = await prisma.teachingEnrollment.updateMany({
		where: { id: enrollmentId, giftCount: { gt: 0 } },
		data: { giftCount: { decrement: 1 } },
	});
	return updated.count > 0;
}

export { prisma };
