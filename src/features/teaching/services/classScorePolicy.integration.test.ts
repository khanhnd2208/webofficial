import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { prisma } from '@/lib/prisma';
import { disconnectTestPrisma } from '@/test/helpers/db.postgres';

import { updateTeachingClass } from './classService';

const suffix = `policy-${Date.now().toString(36)}`;
const ids = { course: '', class: '' };

beforeAll(async () => {
	const course = await prisma.teachingCourse.create({
		data: { courseCode: `POLICY-${suffix}`.slice(0, 40), courseName: 'Policy course' },
	});
	const teachingClass = await prisma.teachingClass.create({
		data: {
			courseId: course.id,
			courseCode: course.courseCode,
			courseName: course.courseName,
			groupNo: suffix.slice(0, 20),
			classCode: suffix.slice(0, 20),
			term: `Policy ${suffix}`,
			status: 'ARCHIVED',
		},
	});
	ids.course = course.id;
	ids.class = teachingClass.id;
});

afterAll(async () => {
	await prisma.teachingClass.deleteMany({ where: { id: ids.class } });
	await prisma.teachingCourse.deleteMany({ where: { id: ids.course } });
	await disconnectTestPrisma();
});

describe('teaching class score policy', () => {
	it('saves a split other than 5 + 5 as long as it sums to 10', async () => {
		await updateTeachingClass(ids.class, { attendanceMaxPoints: 7, cpMaxPoints: 3 });
		const saved = await prisma.teachingClass.findUniqueOrThrow({ where: { id: ids.class } });
		expect(Number(saved.attendanceMaxPoints)).toBe(7);
		expect(Number(saved.cpMaxPoints)).toBe(3);
	});

	it('still rejects a split that does not sum to 10', async () => {
		await expect(
			updateTeachingClass(ids.class, { attendanceMaxPoints: 6, cpMaxPoints: 3 }),
		).rejects.toMatchObject({ status: 422 });
	});
});
