import { AppError } from '@/lib/appError';
import dbConnect from '@/lib/dbConnect';
import { prisma } from '@/lib/prisma';
import User from '@/models/User';
import { fillStudyDays, studyReportPage, studyReportRange } from './studyReportTime';

// Admin-only caller: the page checks authorization before querying any report.
export async function getLearnStudyLearnerReport(
	courseSlug: string,
	days: number,
	userId: string,
	requestedPage = 1,
) {
	const course = await prisma.learnCourse.findUnique({
		where: { slug: courseSlug },
		select: { id: true },
	});
	if (!course) throw new AppError('Không tìm thấy khóa học', 404);
	const { rangeDays, startDay, start } = studyReportRange(days);
	const pageSize = 20;
	const data = await prisma.$transaction(
		async (tx) => {
			const where = {
				courseId: course.id,
				userId,
				OR: [{ startedAt: { gte: start } }, { buckets: { some: { day: { gte: startDay } } } }],
			};
			const sessionCount = await tx.learnStudySession.count({ where });
			if (!sessionCount) return null;
			const totalPages = Math.max(1, Math.ceil(sessionCount / pageSize));
			const page = Math.min(studyReportPage(requestedPage), totalPages);
			const [daily, sections, sessions] = await Promise.all([
				tx.$queryRaw<
					Array<{ day: Date; seconds: bigint; sessionCount: bigint; sectionCount: bigint }>
				>`
				SELECT b.day, SUM(b.seconds) AS seconds, COUNT(DISTINCT s.id) AS "sessionCount",
					COUNT(DISTINCT b."sectionId") AS "sectionCount"
				FROM "LearnStudyBucket" b JOIN "LearnStudySession" s ON s.id = b."sessionId"
				WHERE s."courseId" = ${course.id} AND s."userId" = ${userId} AND b.day >= ${startDay}
				GROUP BY b.day ORDER BY b.day
			`,
				tx.$queryRaw<Array<{ day: Date; sectionId: string; title: string; seconds: bigint }>>`
				SELECT b.day, b."sectionId", COALESCE(sec.title, MAX(b."sectionTitle"), 'Mục đã lưu trữ') AS title,
					SUM(b.seconds) AS seconds
				FROM "LearnStudyBucket" b JOIN "LearnStudySession" s ON s.id = b."sessionId"
				LEFT JOIN "LearnSection" sec ON sec.id = b."sectionId"
				WHERE s."courseId" = ${course.id} AND s."userId" = ${userId} AND b.day >= ${startDay}
				GROUP BY b.day, b."sectionId", sec.title ORDER BY b.day, SUM(b.seconds) DESC, b."sectionId"
			`,
				tx.$queryRaw<Array<{ id: string; startedAt: Date; lastActivityAt: Date; seconds: bigint }>>`
				SELECT s.id, s."startedAt", s."lastActivityAt", COALESCE(SUM(b.seconds), 0) AS seconds
				FROM "LearnStudySession" s LEFT JOIN "LearnStudyBucket" b
					ON b."sessionId" = s.id AND b.day >= ${startDay}
				WHERE s."courseId" = ${course.id} AND s."userId" = ${userId}
					AND (s."startedAt" >= ${start} OR b.id IS NOT NULL)
				GROUP BY s.id ORDER BY s."startedAt" DESC, s.id
				LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
			`,
			]);
			return { daily, sections, sessions, sessionCount, totalPages, page };
		},
		{ isolationLevel: 'RepeatableRead' },
	);
	if (!data) return null;
	let user: { name?: string; email?: string } | null = null;
	if (/^[a-f\d]{24}$/i.test(userId)) {
		await dbConnect();
		user = await User.findById(userId).select('name email').lean();
	}
	const sectionsByDay = new Map<
		string,
		Array<{ sectionId: string; title: string; seconds: number }>
	>();
	for (const row of data.sections) {
		const day = row.day.toISOString().slice(0, 10);
		const entries = sectionsByDay.get(day) ?? [];
		entries.push({ sectionId: row.sectionId, title: row.title, seconds: Number(row.seconds) });
		sectionsByDay.set(day, entries);
	}
	const daily = fillStudyDays(
		startDay,
		rangeDays,
		data.daily.map((row) => ({
			day: row.day.toISOString().slice(0, 10),
			seconds: Number(row.seconds),
			sessions: Number(row.sessionCount),
			sectionCount: Number(row.sectionCount),
			sections: sectionsByDay.get(row.day.toISOString().slice(0, 10)) ?? [],
		})),
		{ seconds: 0, sessions: 0, sectionCount: 0, sections: [] },
	);
	const totalSeconds = daily.reduce((sum, day) => sum + day.seconds, 0);
	const activeDays = daily.filter((day) => day.seconds > 0).length;
	return {
		userId,
		name: user?.name ?? 'Tài khoản không còn trong hệ thống',
		email: user?.email ?? '',
		daily,
		totalSeconds,
		activeDays,
		averageSecondsPerActiveDay: activeDays ? Math.round(totalSeconds / activeDays) : 0,
		sessionCount: data.sessionCount,
		page: data.page,
		totalPages: data.totalPages,
		sessions: data.sessions.map((row) => ({
			id: row.id,
			startedAt: row.startedAt.toISOString(),
			lastActivityAt: row.lastActivityAt.toISOString(),
			seconds: Number(row.seconds),
		})),
	};
}
