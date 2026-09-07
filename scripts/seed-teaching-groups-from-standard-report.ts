import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import readXlsxFile from 'read-excel-file/node';

expand(config({ path: '.env.local' }));

const reportPath =
	process.argv[2] ?? 'outputs/teaching-lms-audit/teaching_standard_report_61MGT3HRM_39.xlsx';
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required.');

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function text(value: unknown) {
	return value == null ? '' : String(value).trim();
}

async function main() {
	const workbookSheets = await readXlsxFile(reportPath);
	const selectedSheet = workbookSheets.find((sheet) => sheet.sheet === 'Danh sach chuan de xuat');
	if (!selectedSheet) throw new Error('Sheet "Danh sach chuan de xuat" not found.');
	const sheets = selectedSheet.data;
	const rows = sheets.slice(1).filter((row) => text(row[0]));
	const source = rows.map((row, index) => ({
		row: index + 2,
		studentCode: text(row[0]),
		groupNo: text(row[2]),
	}));
	const invalidSource = source.filter((row) => !/^39-0[1-4]$/.test(row.groupNo));
	if (invalidSource.length)
		throw new Error(`Invalid source rows: ${JSON.stringify(invalidSource)}`);

	const classes = await prisma.teachingClass.findMany({
		where: { courseCode: '61MGT3HRM', groupNo: { in: ['39-01', '39-02', '39-03', '39-04'] } },
		include: { tutorials: true },
	});
	const classByGroup = new Map(classes.map((item) => [item.groupNo, item]));
	if (classByGroup.size !== 4)
		throw new Error(`Expected 4 class groups, found ${classByGroup.size}.`);

	const reportByGroup = new Map<string, typeof source>();
	for (const row of source)
		reportByGroup.set(row.groupNo, [...(reportByGroup.get(row.groupNo) ?? []), row]);

	const result = await prisma.$transaction(
		async (tx) => {
			const summary: Array<{ groupNo: string; students: number; groups: number }> = [];
			await tx.teachingGroupAssignment.deleteMany({
				where: { enrollment: { classId: { in: classes.map((item) => item.id) } } },
			});
			for (const groupNo of ['39-01', '39-02', '39-03', '39-04']) {
				const teachingClass = classByGroup.get(groupNo)!;
				const tutorial =
					teachingClass.tutorials.find((item) => item.code === `T${groupNo.slice(-2)}`) ??
					teachingClass.tutorials[0];
				if (!tutorial) throw new Error(`${groupNo}: tutorial not found.`);
				const enrollments = await tx.teachingEnrollment.findMany({
					where: { classId: teachingClass.id, tutorialClassId: tutorial.id, status: 'ACTIVE' },
					include: { student: { select: { studentCode: true, studentCodeNormalized: true } } },
					orderBy: { orderNo: 'asc' },
				});
				const byCode = new Map(
					enrollments.map((item) => [item.student.studentCodeNormalized, item]),
				);
				const rowsForGroup = [...(reportByGroup.get(groupNo) ?? [])];
				// The standard report deliberately excludes the two website-only active students
				// 067WKT0001 and 067WKT0002 pending confirmation. They are still active in the
				// website database and belong to 39-01, so include them to eliminate unassigned
				// active students without changing any source-confirmed placement.
				for (const enrollment of enrollments) {
					if (
						!rowsForGroup.some(
							(row) => row.studentCode.toUpperCase() === enrollment.student.studentCodeNormalized,
						)
					) {
						rowsForGroup.push({ row: 0, studentCode: enrollment.student.studentCode, groupNo });
					}
				}
				const missing = rowsForGroup.filter((row) => !byCode.has(row.studentCode.toUpperCase()));
				if (missing.length)
					throw new Error(
						`${groupNo}: missing student codes ${missing.map((row) => row.studentCode).join(', ')}`,
					);
				const enrollmentIds = rowsForGroup.map(
					(row) => byCode.get(row.studentCode.toUpperCase())!.id,
				);
				if (new Set(enrollmentIds).size !== enrollmentIds.length) {
					throw new Error(`${groupNo}: duplicate enrollment mapping in source.`);
				}
				const board = await tx.teachingGroupBoard.upsert({
					where: { tutorialClassId: tutorial.id },
					create: { classId: teachingClass.id, tutorialClassId: tutorial.id },
					update: {},
				});
				await tx.teachingGroupAssignment.deleteMany({ where: { boardId: board.id } });
				await tx.teachingGroup.deleteMany({ where: { boardId: board.id } });
				const groupCount = Math.max(1, Math.ceil(rowsForGroup.length / 5));
				for (let displayOrder = 0; displayOrder < groupCount; displayOrder += 1) {
					const group = await tx.teachingGroup.create({
						data: { boardId: board.id, displayOrder },
					});
					const members = rowsForGroup.slice(displayOrder * 5, (displayOrder + 1) * 5);
					await tx.teachingGroupAssignment.createMany({
						data: members.map((row, slotIndex) => ({
							boardId: board.id,
							groupId: group.id,
							enrollmentId: byCode.get(row.studentCode.toUpperCase())!.id,
							slotIndex,
						})),
					});
				}
				await tx.teachingGroupBoard.update({
					where: { id: board.id },
					data: { groupCount, groupSize: 5, version: { increment: 1 } },
				});
				summary.push({ groupNo, students: rowsForGroup.length, groups: groupCount });
			}
			return summary;
		},
		{ timeout: 30_000 },
	);
	console.log(JSON.stringify({ source: reportPath, summary: result }, null, 2));
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
