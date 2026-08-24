/**
 * Fill TeachingStudent.dateOfBirth from an official student-list workbook.
 *
 * The script is intentionally dry-run by default. Pass --apply to update only
 * students enrolled in the active classes matching the workbook's course/term.
 * It never changes attendance, CP, names, groups, phone numbers or emails.
 */
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { readSheet } from 'read-excel-file/node';

import { parseStudentListFromRows } from '../src/features/teaching/imports/parseStudentList';

expand(config({ path: '.env.local' }));

const rosterPath = process.argv.slice(2).find((arg) => !arg.startsWith('-'));
const apply = process.argv.includes('--apply');

if (!rosterPath) {
	throw new Error(
		'Usage: npx tsx scripts/update-teaching-dob-from-excel.ts <roster.xlsx> [--apply]',
	);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required.');

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function normalizeCode(value: string): string {
	return value.replace(/\s+/g, '').trim();
}

async function main() {
	const rows = await readSheet(rosterPath!);
	const parsed = parseStudentListFromRows(rows);
	const invalid = parsed.students.filter((student) => !student.ok);
	if (invalid.length > 0) {
		throw new Error(
			`Roster has ${invalid.length} invalid rows: ${invalid
				.slice(0, 3)
				.map((row) => row.studentCode || row.errors.join(', '))
				.join('; ')}`,
		);
	}
	const withDob = parsed.students.filter((student) => student.dateOfBirth);
	if (withDob.length !== parsed.students.length) {
		throw new Error(
			`Roster has ${parsed.students.length - withDob.length} students without a valid date of birth.`,
		);
	}

	const classes = await prisma.teachingClass.findMany({
		where: {
			status: 'ACTIVE',
			courseCode: parsed.metadata.courseCode,
			term: parsed.metadata.term,
		},
		include: {
			enrollments: {
				where: { status: 'ACTIVE' },
				include: { student: true },
				orderBy: { orderNo: 'asc' },
			},
		},
		orderBy: { classCode: 'asc' },
	});
	if (classes.length === 0) {
		throw new Error(
			`No active classes found for ${parsed.metadata.courseCode} / ${parsed.metadata.term}.`,
		);
	}

	const rosterByCode = new Map(
		parsed.students.map((student) => [normalizeCode(student.studentCode), student]),
	);
	const enrolled = classes.flatMap((teachingClass) =>
		teachingClass.enrollments.map((enrollment) => ({ teachingClass, enrollment })),
	);
	const enrolledByCode = new Map(
		enrolled.map(({ enrollment }) => [
			normalizeCode(enrollment.student.studentCode),
			enrollment.student,
		]),
	);
	const missingInRoster = enrolled.filter(
		({ enrollment }) => !rosterByCode.has(normalizeCode(enrollment.student.studentCode)),
	);
	const extrasInRoster = parsed.students.filter(
		(student) => !enrolledByCode.has(normalizeCode(student.studentCode)),
	);
	const conflicts = enrolled.filter(({ enrollment }) => {
		const source = rosterByCode.get(normalizeCode(enrollment.student.studentCode));
		if (!source?.dateOfBirth || !enrollment.student.dateOfBirth) return false;
		return enrollment.student.dateOfBirth.toISOString().slice(0, 10) !== source.dateOfBirth;
	});

	const matched = enrolled.filter(({ enrollment }) =>
		rosterByCode.has(normalizeCode(enrollment.student.studentCode)),
	);
	const alreadyCorrect = matched.filter(({ enrollment }) => {
		const source = rosterByCode.get(normalizeCode(enrollment.student.studentCode));
		return Boolean(
			source?.dateOfBirth &&
			enrollment.student.dateOfBirth?.toISOString().slice(0, 10) === source.dateOfBirth,
		);
	});
	const toUpdateCodes = matched
		.filter(({ enrollment }) => {
			const source = rosterByCode.get(normalizeCode(enrollment.student.studentCode));
			return Boolean(
				source?.dateOfBirth &&
				enrollment.student.dateOfBirth?.toISOString().slice(0, 10) !== source.dateOfBirth,
			);
		})
		.map(({ enrollment }) => normalizeCode(enrollment.student.studentCode));

	if (apply && conflicts.length > 0) {
		throw new Error(
			`Refusing to overwrite ${conflicts.length} conflicting existing DOB values. Run without --apply to review them.`,
		);
	}

	if (apply && toUpdateCodes.length > 0) {
		await prisma.$transaction(
			toUpdateCodes.map((studentCode) => {
				const source = rosterByCode.get(studentCode)!;
				return prisma.teachingStudent.update({
					where: { studentCode },
					data: { dateOfBirth: new Date(`${source.dateOfBirth!}T00:00:00.000Z`) },
				});
			}),
		);
	}

	const report = {
		mode: apply ? 'apply' : 'dry-run',
		workbook: rosterPath,
		courseCode: parsed.metadata.courseCode,
		term: parsed.metadata.term,
		rosterStudents: parsed.students.length,
		activeClasses: classes.map((teachingClass) => ({
			classCode: teachingClass.classCode,
			students: teachingClass.enrollments.length,
			matched: teachingClass.enrollments.filter((enrollment) =>
				rosterByCode.has(normalizeCode(enrollment.student.studentCode)),
			).length,
			missingInRoster: teachingClass.enrollments
				.filter((enrollment) => !rosterByCode.has(normalizeCode(enrollment.student.studentCode)))
				.map((enrollment) => ({
					studentCode: enrollment.student.studentCode,
					name: `${enrollment.student.familyName} ${enrollment.student.givenName}`.trim(),
				})),
		})),
		matchedStudents: matched.length,
		alreadyCorrect: alreadyCorrect.length,
		updated: apply ? toUpdateCodes.length : 0,
		wouldUpdate: toUpdateCodes.length,
		conflicts: conflicts.map(({ enrollment }) => ({
			studentCode: enrollment.student.studentCode,
			name: `${enrollment.student.familyName} ${enrollment.student.givenName}`.trim(),
			current: enrollment.student.dateOfBirth?.toISOString().slice(0, 10) ?? null,
			fromFile:
				rosterByCode.get(normalizeCode(enrollment.student.studentCode))?.dateOfBirth ?? null,
		})),
		extraRosterStudents: extrasInRoster.map((student) => ({
			studentCode: student.studentCode,
			name: `${student.familyName} ${student.givenName}`.trim(),
		})),
		missingStudents: missingInRoster.map(({ enrollment }) => ({
			studentCode: enrollment.student.studentCode,
			name: `${enrollment.student.familyName} ${enrollment.student.givenName}`.trim(),
			classCode: enrolled.find((item) => item.enrollment.id === enrollment.id)?.teachingClass
				.classCode,
		})),
	};

	if (apply) {
		const verification = await prisma.teachingStudent.count({
			where: {
				studentCode: { in: matched.map(({ enrollment }) => enrollment.student.studentCode) },
				dateOfBirth: { not: null },
			},
		});
		Object.assign(report, { verifiedMatchedWithDob: verification });
	}

	console.log(JSON.stringify(report, null, 2));
}

main()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
		await pool.end();
	});
