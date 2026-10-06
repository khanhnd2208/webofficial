import { prisma } from '@/lib/prisma';

import type { PublishStatus } from '@prisma/client';

export interface AdminLearnCourse {
	id: string;
	slug: string;
	title: string;
	status: PublishStatus;
	lessonCount: number;
	sectionCount: number;
	questionCount: number;
	lastEditedAt: string;
}

interface StatsRow {
	courseId: string;
	lessonCount: number;
	sectionCount: number;
	questionCount: number;
	lastEditedAt: Date;
}

/** Admin catalog counts questions from JSON length and never loads markdown bodies. */
export async function listLearnCoursesForAdmin(): Promise<AdminLearnCourse[]> {
	const [courses, stats] = await Promise.all([
		prisma.learnCourse.findMany({
			orderBy: [{ position: 'asc' }, { updatedAt: 'desc' }],
			select: { id: true, slug: true, title: true, status: true },
		}),
		prisma.$queryRaw<StatsRow[]>`
			SELECT
				c.id AS "courseId",
				(SELECT COUNT(*)::int FROM "LearnLesson" l WHERE l."courseId" = c.id) AS "lessonCount",
				(
					SELECT COUNT(*)::int
					FROM "LearnSection" s
					JOIN "LearnLesson" l ON l.id = s."lessonId"
					WHERE l."courseId" = c.id
				) AS "sectionCount",
				(
					SELECT COALESCE(SUM(
						COALESCE(jsonb_array_length(
							CASE
								WHEN jsonb_typeof(s.quiz -> 'questions') = 'array' THEN s.quiz -> 'questions'
								ELSE '[]'::jsonb
							END
						), 0)
						+ COALESCE(jsonb_array_length(
							CASE
								WHEN jsonb_typeof(s.discussion -> 'questions') = 'array' THEN s.discussion -> 'questions'
								ELSE '[]'::jsonb
							END
						), 0)
					), 0)::int
					FROM "LearnSection" s
					JOIN "LearnLesson" l ON l.id = s."lessonId"
					WHERE l."courseId" = c.id
				) AS "questionCount",
				GREATEST(
					c."updatedAt",
					COALESCE((SELECT MAX(l."updatedAt") FROM "LearnLesson" l WHERE l."courseId" = c.id), c."updatedAt"),
					COALESCE((
						SELECT MAX(s."updatedAt")
						FROM "LearnSection" s
						JOIN "LearnLesson" l ON l.id = s."lessonId"
						WHERE l."courseId" = c.id
					), c."updatedAt")
				) AS "lastEditedAt"
			FROM "LearnCourse" c
		`,
	]);
	const byId = new Map(stats.map((row) => [row.courseId, row]));
	return courses.map((course) => {
		const row = byId.get(course.id);
		return {
			...course,
			lessonCount: row?.lessonCount ?? 0,
			sectionCount: row?.sectionCount ?? 0,
			questionCount: row?.questionCount ?? 0,
			lastEditedAt: (row?.lastEditedAt ?? new Date(0)).toISOString(),
		};
	});
}
