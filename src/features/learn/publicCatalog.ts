import { prisma } from '@/lib/prisma';

/** Public course metadata only. Lesson bodies, quizzes and learner progress stay private. */
export async function listPublishedCoursePreviews() {
	const courses = await prisma.learnCourse.findMany({
		where: { status: 'PUBLISHED' },
		orderBy: [{ position: 'asc' }, { updatedAt: 'desc' }],
		select: {
			slug: true,
			title: true,
			subtitle: true,
			description: true,
			category: true,
			level: true,
			lessons: {
				orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
				select: {
					title: true,
					sections: { select: { estimatedMinutes: true } },
				},
			},
		},
	});

	return courses.map(({ lessons, ...course }) => ({
		...course,
		lessonCount: lessons.length,
		totalMinutes: lessons.reduce(
			(total, lesson) =>
				total + lesson.sections.reduce((minutes, section) => minutes + section.estimatedMinutes, 0),
			0,
		),
		lessonTitles: lessons.map((lesson) => lesson.title),
	}));
}
