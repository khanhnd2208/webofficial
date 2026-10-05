import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';
import type {
	RecallMetrics,
	RecallReport,
	RecallReportFilters,
	RecallVisitorRow,
	RecallHistoryRow,
} from './contracts';
import { RECALL_REPORT_PAGE_SIZE } from './contracts';
import { recallDay, recallDays } from './time';

const metrics = Prisma.sql`
	COALESCE(SUM(opens),0)::int AS opens,
	COUNT(DISTINCT "visitorId")::int AS visitors,
	COUNT(DISTINCT "visitorId") FILTER (WHERE interactions > 0)::int AS learners,
	COUNT(DISTINCT "sessionId") FILTER (WHERE interactions > 0)::int AS sessions,
	COALESCE(SUM("activeSeconds"),0)::int AS seconds,
	COALESCE(SUM("answerReveals"),0)::int AS reveals`;
function source(filters: RecallReportFilters, includeRange = true) {
	const classFilter =
		filters.class === 'direct'
			? Prisma.sql`AND v."classId" = ''`
			: filters.class
				? Prisma.sql`AND v."classId" = ${filters.class}`
				: Prisma.empty;
	return Prisma.sql`
		SELECT b.*, v."deckId", v."deckTitle", v."courseId", v."courseName", v."classId", v."className",
			v."sessionId", s."visitorId", p."publicId", p."firstSeenAt", p."lastSeenAt",
			s."startedAt", s."lastActivityAt"
		FROM "RecallStudyBucket" b
		JOIN "RecallStudyVisit" v ON v.id = b."visitId"
		JOIN "RecallStudySession" s ON s.id = v."sessionId"
		JOIN "RecallVisitor" p ON p.id = s."visitorId"
		WHERE TRUE
		${includeRange ? Prisma.sql`AND b.day >= ${new Date(filters.start)} AND b.day <= ${new Date(filters.end)}` : Prisma.empty}
		${filters.course ? Prisma.sql`AND v."courseId" = ${filters.course}` : Prisma.empty}
		${classFilter}
		${filters.deck ? Prisma.sql`AND v."deckId" = ${filters.deck}` : Prisma.empty}`;
}
const visitorSelect = Prisma.sql`"publicId", MAX("firstSeenAt") AS "firstSeenAt", MAX("lastSeenAt") AS "lastSeenAt",
	COUNT(DISTINCT day) FILTER (WHERE interactions > 0)::int AS days,
	COUNT(DISTINCT "sessionId") FILTER (WHERE interactions > 0)::int AS sessions,
	COALESCE(SUM("activeSeconds"),0)::int AS seconds`;
type VisitorDb = Omit<RecallVisitorRow, 'firstSeenAt' | 'lastSeenAt'> & {
	firstSeenAt: Date;
	lastSeenAt: Date;
};
function mapVisitor(row: VisitorDb): RecallVisitorRow {
	return {
		...row,
		firstSeenAt: row.firstSeenAt.toISOString(),
		lastSeenAt: row.lastSeenAt.toISOString(),
	};
}
/** The service itself enforces admin access, including direct server-page calls. */
export async function getRecallReport(filters: RecallReportFilters): Promise<RecallReport> {
	if ((await auth())?.user?.role !== 'admin')
		throw new AppError('Không có quyền xem thống kê', 403);
	return prisma.$transaction(
		async (tx) => {
			const scoped = source(filters);
			const all = source(filters, false);
			const totals = (
				await tx.$queryRaw<(RecallMetrics & { returning: number })[]>(Prisma.sql`
			WITH scoped AS (${scoped}), prior AS (${all})
			SELECT ${metrics}, COUNT(DISTINCT "visitorId") FILTER (WHERE interactions > 0 AND
				"visitorId" IN (SELECT "visitorId" FROM prior WHERE day < ${new Date(filters.start)} AND interactions > 0))::int AS returning
			FROM scoped`)
			)[0];
			const daily = await tx.$queryRaw<(RecallMetrics & { day: Date })[]>(Prisma.sql`
			WITH scoped AS (${scoped}) SELECT day, ${metrics} FROM scoped GROUP BY day ORDER BY day`);
			const decks = await tx.$queryRaw<RecallReport['decks']>(Prisma.sql`
			WITH scoped AS (${scoped}) SELECT "deckId", (ARRAY_AGG("deckTitle" ORDER BY day DESC))[1] AS title,
				(ARRAY_AGG("courseName" ORDER BY day DESC))[1] AS "courseName", ${metrics}
			FROM scoped GROUP BY "deckId" ORDER BY sessions DESC, opens DESC, "deckId"`);
			const count = await tx.$queryRaw<{ count: number }[]>(Prisma.sql`
			WITH scoped AS (${scoped}) SELECT COUNT(DISTINCT "visitorId")::int AS count FROM scoped`);
			const visitors = await tx.$queryRaw<VisitorDb[]>(Prisma.sql`
			WITH scoped AS (${scoped}) SELECT ${visitorSelect} FROM scoped GROUP BY "publicId"
			ORDER BY "lastSeenAt" DESC, "publicId" LIMIT ${RECALL_REPORT_PAGE_SIZE} OFFSET ${(filters.page - 1) * RECALL_REPORT_PAGE_SIZE}`);
			const history = filters.visitor
				? await tx.$queryRaw<
						(Omit<RecallHistoryRow, 'startedAt' | 'lastActivityAt'> & {
							startedAt: Date;
							lastActivityAt: Date;
						})[]
					>(Prisma.sql`
			WITH scoped AS (${scoped}) SELECT "sessionId", MAX("startedAt") AS "startedAt",
				MAX("lastActivityAt") AS "lastActivityAt", BOOL_OR(interactions > 0) AS engaged,
				COALESCE(SUM("activeSeconds"),0)::int AS seconds, ARRAY_AGG(DISTINCT "deckTitle") AS decks,
				ARRAY_AGG(DISTINCT CASE WHEN "classId" = '' THEN 'Không qua link lớp' ELSE "className" END) AS classes
			FROM scoped WHERE "publicId" = ${filters.visitor} GROUP BY "sessionId"
			ORDER BY "startedAt" DESC, "sessionId" LIMIT ${RECALL_REPORT_PAGE_SIZE} OFFSET ${(filters.historyPage - 1) * RECALL_REPORT_PAGE_SIZE}`)
				: [];
			const historyCount = filters.visitor
				? await tx.$queryRaw<{ count: number }[]>(Prisma.sql`
			WITH scoped AS (${scoped}) SELECT COUNT(DISTINCT "sessionId")::int AS count FROM scoped WHERE "publicId" = ${filters.visitor}`)
				: [{ count: 0 }];
			const selected = filters.visitor
				? await tx.$queryRaw<VisitorDb[]>(Prisma.sql`
			WITH scoped AS (${scoped}) SELECT ${visitorSelect} FROM scoped WHERE "publicId" = ${filters.visitor} GROUP BY "publicId"`)
				: [];
			// Include historical content snapshots so deleted content remains filterable.
			const courseOptions = await tx.$queryRaw<{ id: string; name: string }[]>(Prisma.sql`
			SELECT DISTINCT ON (id) id, name FROM (
				SELECT id, "courseName" AS name, 0 AS priority FROM "TeachingCourse"
				UNION ALL SELECT "courseId", "courseName", 1 FROM "RecallStudyVisit"
			) options ORDER BY id, priority, name`);
			const classOptions = await tx.$queryRaw<{ id: string; name: string }[]>(Prisma.sql`
			SELECT DISTINCT ON (id) id, name FROM (
				SELECT id, CASE WHEN "publicTitle" <> '' THEN "publicTitle" ELSE "classCode" || ' · ' || term END AS name, 0 AS priority
				FROM "TeachingClass" ${filters.course ? Prisma.sql`WHERE "courseId" = ${filters.course}` : Prisma.empty}
				UNION ALL SELECT "classId", "className", 1 FROM "RecallStudyVisit" WHERE "classId" <> ''
				${filters.course ? Prisma.sql`AND "courseId" = ${filters.course}` : Prisma.empty}
			) options ORDER BY id, priority, name`);
			const deckOptions = await tx.$queryRaw<{ id: string; name: string }[]>(Prisma.sql`
			SELECT DISTINCT ON (id) id, name FROM (
				SELECT id, title AS name, 0 AS priority FROM "ActiveRecallDeck"
				${filters.course ? Prisma.sql`WHERE "courseId" = ${filters.course}` : Prisma.empty}
				UNION ALL SELECT "deckId", "deckTitle", 1 FROM "RecallStudyVisit" WHERE TRUE
				${filters.course ? Prisma.sql`AND "courseId" = ${filters.course}` : Prisma.empty}
			) options ORDER BY id, priority, name`);
			const empty: RecallMetrics = {
				opens: 0,
				visitors: 0,
				learners: 0,
				sessions: 0,
				seconds: 0,
				reveals: 0,
			};
			const byDay = new Map(daily.map((row) => [row.day.toISOString().slice(0, 10), row]));
			return {
				today: recallDay(new Date()),
				filters,
				totals: {
					...totals,
					sessionsPerLearner: totals.learners ? totals.sessions / totals.learners : 0,
				},
				daily: recallDays(filters.start, filters.end).map((day) => ({
					...empty,
					...byDay.get(day),
					day,
				})),
				decks,
				visitors: visitors.map(mapVisitor),
				visitorCount: count[0].count,
				history: history.map((row) => ({
					...row,
					startedAt: row.startedAt.toISOString(),
					lastActivityAt: row.lastActivityAt.toISOString(),
				})),
				historyCount: historyCount[0].count,
				selectedVisitor: selected[0] ? mapVisitor(selected[0]) : null,
				options: { courses: courseOptions, classes: classOptions, decks: deckOptions },
			};
		},
		{ isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
	);
}
