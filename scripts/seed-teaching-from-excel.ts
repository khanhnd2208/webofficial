/**
 * Replace the complete Teaching dataset with four tutorial classes from AC.xlsx.
 * The official HANU roster enriches matching students with DOB, major, phone and email.
 *
 * Run:
 * npm run db:seed:teaching:excel -- <AC.xlsx> <DanhSachSinhVien.xlsx>
 */
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type TeachingAttendanceStatus } from '@prisma/client';
import readXlsxFile, { readSheet, type Row } from 'read-excel-file/node';

import {
	parseStudentListFromRows,
	type ParsedStudentRow,
} from '../src/features/teaching/imports/parseStudentList';

expand(config({ path: '.env.local' }));

const [attendancePath, detailedRosterPath] = process.argv.slice(2);
if (!attendancePath || !detailedRosterPath) {
	throw new Error('Provide both AC.xlsx and the detailed student-list workbook.');
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required.');

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const TOTAL_WEEKS = 10;

type AttendanceStudent = {
	studentCode: string;
	familyName: string;
	givenName: string;
	homeClassCode: string;
	week1: TeachingAttendanceStatus;
};

function text(value: unknown): string {
	return value == null ? '' : String(value).replace(/\s+/g, ' ').trim();
}

function splitName(familyCell: unknown, givenCell: unknown) {
	const familyName = text(familyCell);
	const givenName = text(givenCell);
	if (givenName) return { familyName, givenName };
	const parts = familyName.split(' ').filter(Boolean);
	if (parts.length < 2) throw new Error(`Could not split full name: ${familyName}`);
	return { familyName: parts.slice(0, -1).join(' '), givenName: parts.at(-1)! };
}

function parseAttendanceSheet(sheetName: string, rows: Row): AttendanceStudent[] {
	const students: AttendanceStudent[] = [];
	for (const [rowIndex, row] of rows.slice(1).entries()) {
		const studentCode = text(row[1]);
		if (!studentCode && row.every((cell) => !text(cell))) continue;
		if (!studentCode) throw new Error(`${sheetName} row ${rowIndex + 2}: missing student code.`);
		const mark = text(row[5]).toLowerCase();
		if (mark && mark !== 'x') {
			throw new Error(`${sheetName} row ${rowIndex + 2}: unsupported Week 1 value "${mark}".`);
		}
		const name = splitName(row[2], row[3]);
		students.push({
			studentCode,
			...name,
			homeClassCode: text(row[4]),
			week1: mark === 'x' ? 'PRESENT' : 'ABSENT_UNEXCUSED',
		});
	}
	return students;
}

function tutorialGroupNumbers(firstGroup: string, count: number): string[] {
	const match = firstGroup.match(/^(.*?)(\d+)$/);
	if (!match) throw new Error(`Cannot derive tutorial group numbers from ${firstGroup}.`);
	const prefix = match[1]!;
	const start = Number(match[2]);
	const width = match[2]!.length;
	return Array.from(
		{ length: count },
		(_, index) => `${prefix}${String(start + index).padStart(width, '0')}`,
	);
}

async function main() {
	const [attendanceSheets, detailedRows] = await Promise.all([
		readXlsxFile(attendancePath),
		readSheet(detailedRosterPath),
	]);
	if (attendanceSheets.length !== 4) {
		throw new Error(`Expected exactly 4 tutorial sheets; found ${attendanceSheets.length}.`);
	}

	const detailed = parseStudentListFromRows(detailedRows);
	const invalid = detailed.students.filter((student) => !student.ok);
	if (invalid.length > 0) {
		throw new Error(`Detailed roster has ${invalid.length} invalid student rows.`);
	}
	const detailsByCode = new Map(detailed.students.map((student) => [student.studentCode, student]));
	const groupNumbers = tutorialGroupNumbers(detailed.metadata.groupNo, attendanceSheets.length);
	const tutorials = attendanceSheets.map((sheet, index) => ({
		sheetName: sheet.sheet,
		groupNo: groupNumbers[index]!,
		students: parseAttendanceSheet(sheet.sheet, sheet.data),
	}));

	const firstDetailedCodes = new Set(tutorials[0]!.students.map((student) => student.studentCode));
	const unmatchedDetails = detailed.students.filter(
		(student) => !firstDetailedCodes.has(student.studentCode),
	);
	if (unmatchedDetails.length > 0) {
		throw new Error(
			`Detailed roster has ${unmatchedDetails.length} students not found in the first tutorial sheet.`,
		);
	}

	const importedAt = new Date();
	await prisma.$transaction(
		async (transaction) => {
			await transaction.teachingClass.deleteMany();
			await transaction.teachingStudent.deleteMany();

			for (const [tutorialIndex, tutorialInput] of tutorials.entries()) {
				const teachingClass = await transaction.teachingClass.create({
					data: {
						courseCode: detailed.metadata.courseCode,
						courseName: detailed.metadata.courseName,
						groupNo: tutorialInput.groupNo,
						classCode: tutorialInput.groupNo,
						term: detailed.metadata.term,
						credits: detailed.metadata.credits,
						lecturerName: detailed.metadata.lecturerName,
						lecturerCode: detailed.metadata.lecturerCode,
						totalWeeks: TOTAL_WEEKS,
						attendanceVisible: false,
					},
				});
				const tutorial = await transaction.teachingTutorialClass.create({
					data: {
						classId: teachingClass.id,
						code: `T${String(tutorialIndex + 1).padStart(2, '0')}`,
						name: `Tutorial ${tutorialInput.groupNo}`,
						displayOrder: 0,
					},
				});
				await transaction.teachingSession.createMany({
					data: Array.from({ length: TOTAL_WEEKS }, (_, index) => ({
						classId: teachingClass.id,
						tutorialClassId: tutorial.id,
						weekNumber: index + 1,
						topic: index === 0 ? 'Week 1' : '',
						attendanceTakenAt: index === 0 ? importedAt : null,
						attendanceOpen: false,
					})),
				});
				const week1 = await transaction.teachingSession.findUniqueOrThrow({
					where: { tutorialClassId_weekNumber: { tutorialClassId: tutorial.id, weekNumber: 1 } },
				});

				const marks: Array<{
					sessionId: string;
					enrollmentId: string;
					status: TeachingAttendanceStatus;
				}> = [];
				for (const [studentIndex, attendanceStudent] of tutorialInput.students.entries()) {
					const detail: ParsedStudentRow | undefined = detailsByCode.get(
						attendanceStudent.studentCode,
					);
					const student = await transaction.teachingStudent.upsert({
						where: { studentCode: attendanceStudent.studentCode },
						create: {
							studentCode: attendanceStudent.studentCode,
							familyName: detail?.familyName ?? attendanceStudent.familyName,
							givenName: detail?.givenName ?? attendanceStudent.givenName,
							dateOfBirth: detail?.dateOfBirth
								? new Date(`${detail.dateOfBirth}T00:00:00.000Z`)
								: null,
							homeClassCode: detail?.homeClassCode ?? attendanceStudent.homeClassCode,
							majorName: detail?.majorName ?? '',
							phone: detail?.phone ?? null,
							email: detail?.email ?? null,
						},
						update: detail
							? {
									familyName: detail.familyName,
									givenName: detail.givenName,
									dateOfBirth: detail.dateOfBirth
										? new Date(`${detail.dateOfBirth}T00:00:00.000Z`)
										: null,
									homeClassCode: detail.homeClassCode,
									majorName: detail.majorName,
									phone: detail.phone,
									email: detail.email,
								}
							: {},
					});
					const enrollment = await transaction.teachingEnrollment.create({
						data: {
							classId: teachingClass.id,
							tutorialClassId: tutorial.id,
							studentId: student.id,
							orderNo: studentIndex + 1,
						},
					});
					marks.push({
						sessionId: week1.id,
						enrollmentId: enrollment.id,
						status: attendanceStudent.week1,
					});
				}
				await transaction.teachingAttendance.createMany({ data: marks });
			}
		},
		{ timeout: 30_000 },
	);

	const [classes, students, enrollments, attendance] = await Promise.all([
		prisma.teachingClass.count(),
		prisma.teachingStudent.count(),
		prisma.teachingEnrollment.count(),
		prisma.teachingAttendance.groupBy({ by: ['status'], _count: { _all: true } }),
	]);
	console.log(
		JSON.stringify(
			{
				classes,
				students,
				enrollments,
				attendance: Object.fromEntries(attendance.map((row) => [row.status, row._count._all])),
				groups: tutorials.map((tutorial) => ({
					groupNo: tutorial.groupNo,
					students: tutorial.students.length,
				})),
			},
			null,
			2,
		),
	);
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
