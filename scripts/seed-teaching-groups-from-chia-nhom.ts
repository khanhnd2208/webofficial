import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import readXlsxFile from 'read-excel-file/node';

expand(config({ path: '.env.local' }));

const SHEET_TO_GROUP_NO: Record<string, string> = {
	Tut1: '39-01',
	Tut2: '39-02',
	Tut3: '39-03',
	Tut4: '39-04',
};

const GROUP_LABEL = /^Nhóm\s+(\d+)$/i;

type SourceRow = {
	sheet: string;
	groupNo: string;
	groupNumber: number;
	studentCode: string;
	fullName: string;
};

function text(value: unknown) {
	return value == null ? '' : String(value).trim();
}

function normalizeStudentCode(value: string) {
	return value.normalize('NFC').replace(/\s+/g, '').toUpperCase();
}

function parseArgs(argv: string[]) {
	const dryRun = argv.includes('--dry-run');
	const positional = argv.filter((item) => item !== '--dry-run');
	const reportPath = positional[0];
	if (!reportPath) {
		throw new Error(
			'Usage: npx tsx scripts/seed-teaching-groups-from-chia-nhom.ts <xlsx> [--dry-run]',
		);
	}
	return { reportPath, dryRun };
}

function parseChiaNhomWorkbook(
	sheets: Array<{ sheet: string; data: unknown[][] }>,
): SourceRow[] {
	const missingSheets = Object.keys(SHEET_TO_GROUP_NO).filter(
		(name) => !sheets.some((sheet) => sheet.sheet === name),
	);
	if (missingSheets.length) {
		throw new Error(`Missing sheets: ${missingSheets.join(', ')}`);
	}

	const rows: SourceRow[] = [];
	for (const sheet of sheets) {
		const groupNo = SHEET_TO_GROUP_NO[sheet.sheet];
		if (!groupNo) continue;
		const headerIdx = sheet.data.findIndex((row) => text(row[0]) === 'STT');
		if (headerIdx < 0) throw new Error(`${sheet.sheet}: header row "STT" not found.`);
		for (const row of sheet.data.slice(headerIdx + 1)) {
			const studentCode = text(row[2]);
			if (!studentCode) continue;
			const groupLabel = text(row[1]);
			const match = groupLabel.match(GROUP_LABEL);
			if (!match) {
				throw new Error(`${sheet.sheet}: invalid group label ${JSON.stringify(groupLabel)}`);
			}
			rows.push({
				sheet: sheet.sheet,
				groupNo,
				groupNumber: Number(match[1]),
				studentCode,
				fullName: text(row[3]),
			});
		}
	}

	const seen = new Map<string, SourceRow>();
	for (const row of rows) {
		const key = normalizeStudentCode(row.studentCode);
		const previous = seen.get(key);
		if (previous) {
			throw new Error(
				`Duplicate student ${row.studentCode} in ${previous.sheet} and ${row.sheet}.`,
			);
		}
		seen.set(key, row);
	}
	return rows;
}

async function main() {
	const { reportPath, dryRun } = parseArgs(process.argv.slice(2));
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) throw new Error('DATABASE_URL is required.');

	const workbookSheets = await readXlsxFile(reportPath);
	const source = parseChiaNhomWorkbook(workbookSheets);

	const pool = new Pool({ connectionString });
	const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

	try {
		const classes = await prisma.teachingClass.findMany({
			where: {
				courseCode: '61MGT3HRM',
				groupNo: { in: ['39-01', '39-02', '39-03', '39-04'] },
				status: 'ACTIVE',
			},
			include: { tutorials: { orderBy: { displayOrder: 'asc' } } },
		});
		const classByGroup = new Map(classes.map((item) => [item.groupNo, item]));
		const duplicateGroups = ['39-01', '39-02', '39-03', '39-04'].filter(
			(groupNo) => classes.filter((item) => item.groupNo === groupNo).length > 1,
		);
		if (duplicateGroups.length) {
			throw new Error(`Multiple active classes for ${duplicateGroups.join(', ')}.`);
		}
		if (classByGroup.size !== 4) {
			throw new Error(
				`Expected 4 active HRM classes 39-01..04, found ${classByGroup.size}: ${classes
					.map((item) => item.groupNo)
					.join(', ')}`,
			);
		}

		const plan = [];
		const blocking: string[] = [];
		for (const groupNo of ['39-01', '39-02', '39-03', '39-04']) {
			const teachingClass = classByGroup.get(groupNo)!;
			const tutorial =
				teachingClass.tutorials.find((item) => item.code === `T${groupNo.slice(-2)}`) ??
				teachingClass.tutorials[0];
			if (!tutorial) {
				blocking.push(`${groupNo}: tutorial not found.`);
				continue;
			}
			const enrollments = await prisma.teachingEnrollment.findMany({
				where: { classId: teachingClass.id, status: 'ACTIVE' },
				include: { student: { select: { studentCode: true, studentCodeNormalized: true } } },
				orderBy: { orderNo: 'asc' },
			});
			const byCode = new Map(
				enrollments.map((item) => [item.student.studentCodeNormalized, item]),
			);
			const sourceRows = source.filter((row) => row.groupNo === groupNo);
			const missingInDb = sourceRows.filter(
				(row) => !byCode.has(normalizeStudentCode(row.studentCode)),
			);
			const extraInDb = enrollments.filter(
				(item) =>
					!sourceRows.some(
						(row) => normalizeStudentCode(row.studentCode) === item.student.studentCodeNormalized,
					),
			);
			const tutorialMismatch = sourceRows.flatMap((row) => {
				const enrollment = byCode.get(normalizeStudentCode(row.studentCode));
				if (!enrollment) return [];
				if (enrollment.tutorialClassId === tutorial.id) return [];
				return [
					{
						studentCode: row.studentCode,
						enrollmentTutorialId: enrollment.tutorialClassId,
					},
				];
			});
			if (missingInDb.length) {
				blocking.push(
					`${groupNo}: Excel students not enrolled: ${missingInDb
						.map((row) => row.studentCode)
						.join(', ')}`,
				);
			}
			if (tutorialMismatch.length) {
				blocking.push(
					`${groupNo}: tutorial mismatch: ${tutorialMismatch
						.map((row) => row.studentCode)
						.join(', ')}`,
				);
			}
			const groups = new Map<number, SourceRow[]>();
			for (const row of sourceRows) {
				groups.set(row.groupNumber, [...(groups.get(row.groupNumber) ?? []), row]);
			}
			const maxGroup = Math.max(0, ...sourceRows.map((row) => row.groupNumber));
			plan.push({
				groupNo,
				classId: teachingClass.id,
				term: teachingClass.term,
				tutorialId: tutorial.id,
				tutorialCode: tutorial.code,
				excelStudents: sourceRows.length,
				enrolledStudents: enrollments.length,
				unassignedAfter: extraInDb.map((item) => item.student.studentCode),
				groupCount: maxGroup,
				groups: [...groups.entries()]
					.sort((a, b) => a[0] - b[0])
					.map(([number, members]) => ({ number, size: members.length })),
			});
		}

		console.log(
			JSON.stringify(
				{
					source: reportPath,
					dryRun,
					excelStudents: source.length,
					blocking,
					plan,
				},
				null,
				2,
			),
		);
		if (blocking.length) {
			throw new Error(blocking.join('\n'));
		}
		if (dryRun) return;

		const summary = await prisma.$transaction(
			async (tx) => {
				const result: Array<{
					groupNo: string;
					students: number;
					groups: number;
					unassigned: number;
				}> = [];
				for (const item of plan) {
					const sourceRows = source.filter((row) => row.groupNo === item.groupNo);
					const enrollments = await tx.teachingEnrollment.findMany({
						where: { classId: item.classId, status: 'ACTIVE' },
						include: { student: { select: { studentCodeNormalized: true } } },
					});
					const byCode = new Map(
						enrollments.map((enrollment) => [enrollment.student.studentCodeNormalized, enrollment]),
					);
					const board = await tx.teachingGroupBoard.upsert({
						where: { tutorialClassId: item.tutorialId },
						create: { classId: item.classId, tutorialClassId: item.tutorialId },
						update: {},
					});
					await tx.teachingGroupAssignment.deleteMany({ where: { boardId: board.id } });
					await tx.teachingGroup.deleteMany({ where: { boardId: board.id } });
					const groups = new Map<number, { id: string }>();
					for (let displayOrder = 0; displayOrder < item.groupCount; displayOrder += 1) {
						const group = await tx.teachingGroup.create({
							data: { boardId: board.id, displayOrder },
						});
						groups.set(displayOrder + 1, group);
					}
					const byGroup = new Map<number, SourceRow[]>();
					for (const row of sourceRows) {
						byGroup.set(row.groupNumber, [...(byGroup.get(row.groupNumber) ?? []), row]);
					}
					for (const [groupNumber, members] of byGroup) {
						const group = groups.get(groupNumber);
						if (!group) throw new Error(`${item.groupNo}: missing group ${groupNumber}.`);
						await tx.teachingGroupAssignment.createMany({
							data: members.map((row, slotIndex) => ({
								boardId: board.id,
								groupId: group.id,
								enrollmentId: byCode.get(normalizeStudentCode(row.studentCode))!.id,
								slotIndex,
							})),
						});
					}
					await tx.teachingGroupBoard.update({
						where: { id: board.id },
						data: {
							groupCount: item.groupCount,
							groupSize: 5,
							version: { increment: 1 },
						},
					});
					await tx.teachingGroupAudit.create({
						data: {
							boardId: board.id,
							actor: 'ADMIN',
							action: 'CONFIGURE',
							metadata: {
								source: 'chia-nhom-hrm.xlsx',
								groupCount: item.groupCount,
								assigned: sourceRows.length,
							},
						},
					});
					result.push({
						groupNo: item.groupNo,
						students: sourceRows.length,
						groups: item.groupCount,
						unassigned: item.unassignedAfter.length,
					});
				}
				return result;
			},
			{ timeout: 30_000 },
		);
		console.log(JSON.stringify({ applied: true, summary }, null, 2));
	} finally {
		await prisma.$disconnect();
		await pool.end();
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
