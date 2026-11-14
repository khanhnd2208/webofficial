import type { TeachingStudent } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import { normalizeStudentCode } from '../domain/studentIdentity';
import { decryptStudentRecord, encryptStudentPiiField } from '../domain/studentPiiCrypto';

export async function getStudentByCode(studentCode: string) {
	const student = await prisma.teachingStudent.findUnique({
		where: { studentCodeNormalized: normalizeStudentCode(studentCode) },
	});
	return student ? decryptStudentRecord(student) : null;
}

export async function findStudentsByNormalizedCodes(codes: string[]) {
	if (codes.length === 0) return [];
	const rows = await prisma.teachingStudent.findMany({
		where: { studentCodeNormalized: { in: codes.map(normalizeStudentCode) } },
		include: {
			enrollments: { select: { id: true, classId: true, status: true } },
		},
	});
	return rows.map(decryptStudentRecord);
}

export async function upsertStudent(data: {
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
	const encryptedPhone = encryptStudentPiiField(data.phone);
	const encryptedEmail = encryptStudentPiiField(data.email);
	const payload = {
		...data,
		phone: encryptedPhone,
		email: encryptedEmail,
		studentCode,
		studentCodeNormalized: studentCode,
	};
	const saved = await prisma.teachingStudent.upsert({
		where: { studentCodeNormalized: studentCode },
		create: payload,
		update: {
			familyName: payload.familyName,
			givenName: payload.givenName,
			dateOfBirth: payload.dateOfBirth,
			homeClassCode: payload.homeClassCode,
			majorName: payload.majorName,
			phone: encryptedPhone ?? undefined,
			email: encryptedEmail ?? undefined,
			studentCode,
			studentCodeNormalized: studentCode,
		},
	});
	return decryptStudentRecord(saved);
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
				data: { phone: encryptStudentPiiField(phone) },
			}),
		);
	}
	if (!existing.email?.trim() && email) {
		updates.push(
			prisma.teachingStudent.updateMany({
				where: { id: existing.id, email: existing.email },
				data: { email: encryptStudentPiiField(email) },
			}),
		);
	}

	if (updates.length === 0) return false;
	const results = await prisma.$transaction(updates);
	return results.some((result) => result.count > 0);
}
