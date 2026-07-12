import { prisma } from '@/lib/prisma';

export async function markLessonComplete(lessonId: string, userId: string) {
	return prisma.lessonProgress.upsert({
		where: { lessonId_userId: { lessonId, userId } },
		create: { lessonId, userId },
		update: {},
	});
}

export async function listCompletedLessonIds(userId: string, lessonIds: string[]) {
	if (lessonIds.length === 0) return [] as string[];
	const rows = await prisma.lessonProgress.findMany({
		where: { userId, lessonId: { in: lessonIds } },
		select: { lessonId: true },
	});
	return rows.map((r) => r.lessonId);
}

export async function countCompletedForCourse(userId: string, courseId: string) {
	return prisma.lessonProgress.count({
		where: {
			userId,
			lesson: { module: { courseId } },
		},
	});
}
