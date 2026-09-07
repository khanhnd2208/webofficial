/**
 * Normalize the legacy TeachingClass -> TutorialClass shape.
 *
 * Each TeachingClass becomes one actual class. A legacy class with multiple
 * tutorials is split into one class per tutorial; attendance, participation,
 * sessions and enrollments stay attached to their original tutorial.
 * Safe to run repeatedly: after a split each source class has one tutorial.
 */
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { CP_MAX_POINTS, ABSENCE_DEDUCTION_POINTS } from '../src/features/teaching/domain/cp';

expand(config({ path: '.env.local' }));
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
	const classes = await prisma.teachingClass.findMany({
		include: { tutorials: { orderBy: { displayOrder: 'asc' } } },
		orderBy: [{ courseCode: 'asc' }, { term: 'asc' }, { groupNo: 'asc' }],
	});
	let splitCount = 0;
	for (const source of classes) {
		if (source.tutorials.length <= 1) {
			if (!source.classCode)
				await prisma.teachingClass.update({
					where: { id: source.id },
					data: { classCode: source.groupNo },
				});
			continue;
		}
		const [first, ...rest] = source.tutorials;
		await prisma.$transaction(async (tx) => {
			const firstConflict = await tx.teachingClass.findFirst({
				where: {
					courseCode: source.courseCode,
					term: source.term,
					classCode: first!.code,
					id: { not: source.id },
				},
				select: { id: true },
			});
			await tx.teachingClass.update({
				where: { id: source.id },
				data: { classCode: firstConflict ? `${source.groupNo}-${first!.code}` : first!.code },
			});
			for (const tutorial of rest) {
				const existing = await tx.teachingClass.findFirst({
					where: {
						courseCode: source.courseCode,
						term: source.term,
						classCode: tutorial.code,
						tutorials: { some: { code: tutorial.code } },
					},
				});
				const classCodeConflict = await tx.teachingClass.findFirst({
					where: { courseCode: source.courseCode, term: source.term, classCode: tutorial.code },
					select: { id: true },
				});
				const target =
					existing ??
					(await tx.teachingClass.create({
						data: {
							courseId: source.courseId,
							courseCode: source.courseCode,
							courseName: source.courseName,
							groupNo: `${source.groupNo}-${tutorial.code}`,
							classCode: classCodeConflict ? `${source.groupNo}-${tutorial.code}` : tutorial.code,
							term: source.term,
							credits: source.credits,
							lecturerName: source.lecturerName,
							lecturerCode: source.lecturerCode,
							totalWeeks: source.totalWeeks,
							cpMaxPoints: CP_MAX_POINTS,
							cpPerAbsence: ABSENCE_DEDUCTION_POINTS,
							absenceThresholdPercent: source.absenceThresholdPercent,
							lateGraceMinutes: source.lateGraceMinutes,
							publicTitle: source.publicTitle,
							publicSummary: source.publicSummary,
							publicDescription: source.publicDescription,
							publicAnnouncement: source.publicAnnouncement,
							classRules: source.classRules,
							attendanceVisible: false,
						},
					}));
				await tx.teachingTutorialClass.update({
					where: { id: tutorial.id },
					data: { classId: target.id },
				});
				await tx.teachingEnrollment.updateMany({
					where: { tutorialClassId: tutorial.id },
					data: { classId: target.id },
				});
				await tx.teachingSession.updateMany({
					where: { tutorialClassId: tutorial.id },
					data: { classId: target.id },
				});
				splitCount += 1;
			}
		});
	}
	console.log(`Teaching normalization complete: ${splitCount} class records split.`);
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
