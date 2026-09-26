import { randomUUID } from 'node:crypto';

import { AppError } from '@/lib/appError';
import dbConnect from '@/lib/dbConnect';
import { prisma } from '@/lib/prisma';
import User from '@/models/User';

const LEASE_MS = 2 * 60_000;
const SESSION_GAP_MS = 30 * 60_000;
const MAX_HEARTBEAT_SECONDS = 75;

export async function beginLearnStudy(input: {
	sessionId: string;
	clientId: string;
	claimLease: boolean;
	courseSlug: string;
	userId: string;
}) {
	const course = await prisma.learnCourse.findFirst({
		where: { slug: input.courseSlug, status: 'PUBLISHED' },
		select: { id: true },
	});
	if (!course) throw new AppError('Không tìm thấy khóa học', 404);

	const existing = await prisma.learnStudySession.findUnique({ where: { id: input.sessionId } });
	let sessionId = input.sessionId;
	const now = new Date();
	if (existing && (existing.userId !== input.userId || existing.courseId !== course.id)) {
		throw new AppError('Phiên học không hợp lệ', 409);
	}
	if (
		existing &&
		(existing.endedAt || now.getTime() - existing.lastActivityAt.getTime() > SESSION_GAP_MS)
	) {
		await prisma.learnStudyLease.deleteMany({ where: { userId: input.userId, sessionId } });
		await prisma.learnStudySession.updateMany({
			where: { id: sessionId, endedAt: null },
			data: { endedAt: now },
		});
		sessionId = randomUUID();
	}
	const session = await prisma.learnStudySession.upsert({
		where: { id: sessionId },
		create: {
			id: sessionId,
			userId: input.userId,
			courseId: course.id,
			startedAt: now,
			lastActivityAt: now,
		},
		update: {},
	});
	if (session.userId !== input.userId || session.courseId !== course.id)
		throw new AppError('Phiên học không hợp lệ', 409);
	if (!input.claimLease)
		return { sessionId, leaseGranted: false, lastSequence: session.lastSequence };

	const lease = await prisma.$transaction(async (tx) => {
		const rows = await tx.$queryRaw<Array<{ sessionId: string }>>`
			INSERT INTO "LearnStudyLease" ("userId", "sessionId", "clientId", "expiresAt", "updatedAt")
			VALUES (${input.userId}, ${sessionId}, ${input.clientId}, ${new Date(now.getTime() + LEASE_MS)}, ${now})
			ON CONFLICT ("userId") DO UPDATE SET
				"sessionId" = EXCLUDED."sessionId",
				"clientId" = EXCLUDED."clientId",
				"expiresAt" = EXCLUDED."expiresAt",
				"updatedAt" = EXCLUDED."updatedAt"
			WHERE ("LearnStudyLease"."sessionId" = EXCLUDED."sessionId" AND "LearnStudyLease"."clientId" = EXCLUDED."clientId")
				OR "LearnStudyLease"."expiresAt" <= ${now}
			RETURNING "sessionId"
		`;
		return rows[0]?.sessionId === sessionId;
	});
	return { sessionId, leaseGranted: lease, lastSequence: session.lastSequence };
}

function vietnamDay(date: Date): Date {
	const local = new Date(date.getTime() + 7 * 60 * 60_000);
	return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
}

export async function heartbeatLearnStudy(input: {
	userId: string;
	sessionId: string;
	clientId: string;
	sequence: number;
	seconds: number;
	sectionId: string | null;
	active: boolean;
	releaseLease: boolean;
}) {
	if (!Number.isSafeInteger(input.sequence) || input.sequence < 0)
		throw new AppError('Số thứ tự không hợp lệ', 400);
	if (
		!Number.isSafeInteger(input.seconds) ||
		input.seconds < 0 ||
		input.seconds > MAX_HEARTBEAT_SECONDS
	) {
		throw new AppError('Khoảng thời gian cập nhật không hợp lệ', 400);
	}
	return prisma.$transaction(async (tx) => {
		const now = new Date();
		const [lease] = await tx.$queryRaw<
			Array<{ sessionId: string; clientId: string; expiresAt: Date; updatedAt: Date }>
		>`
			SELECT "sessionId", "clientId", "expiresAt", "updatedAt" FROM "LearnStudyLease"
			WHERE "userId" = ${input.userId} FOR UPDATE
		`;
		if (
			!lease ||
			lease.sessionId !== input.sessionId ||
			lease.clientId !== input.clientId ||
			lease.expiresAt <= now
		)
			return { accepted: false, seconds: 0 };
		const [session] = await tx.$queryRaw<
			Array<{
				id: string;
				userId: string;
				courseId: string;
				endedAt: Date | null;
				lastSequence: number;
				lastHeartbeatAt: Date;
			}>
		>`
			SELECT "id", "userId", "courseId", "endedAt", "lastSequence", "lastHeartbeatAt"
			FROM "LearnStudySession" WHERE "id" = ${input.sessionId} FOR UPDATE
		`;
		if (!session || session.userId !== input.userId || session.endedAt)
			throw new AppError('Phiên học không còn hợp lệ', 409);
		if (input.sequence <= session.lastSequence)
			return { accepted: true, duplicate: true, seconds: 0 };
		const intervalStart = new Date(
			Math.max(session.lastHeartbeatAt.getTime(), lease.updatedAt.getTime()),
		);
		const elapsedSeconds = Math.max(
			0,
			Math.floor((now.getTime() - intervalStart.getTime()) / 1000),
		);
		const acceptedSeconds = input.sectionId
			? Math.min(input.seconds, MAX_HEARTBEAT_SECONDS, elapsedSeconds)
			: 0;

		let section: { id: string; title: string } | null = null;
		if (input.sectionId) {
			section = await tx.learnSection.findFirst({
				where: { id: input.sectionId, lesson: { courseId: session.courseId } },
				select: { id: true, title: true },
			});
			if (!section) throw new AppError('Mục học không thuộc khóa học này', 400);
		}

		// Renew the lease atomically so a heartbeat cannot count after another
		// device has taken ownership of the learner's active timer.
		const leaseRenewed = await tx.learnStudyLease.updateMany({
			where: { userId: input.userId, sessionId: session.id, expiresAt: { gt: now } },
			data: {
				expiresAt: new Date(now.getTime() + (input.releaseLease ? 0 : LEASE_MS)),
				updatedAt: now,
			},
		});
		if (!leaseRenewed.count) return { accepted: false, seconds: 0 };

		// Compare-and-set makes an identical in-flight retry idempotent even when
		// the first HTTP response was lost and both database transactions overlap.
		const sessionUpdated = await tx.learnStudySession.updateMany({
			where: {
				id: session.id,
				userId: input.userId,
				endedAt: null,
				lastSequence: { lt: input.sequence },
			},
			data: {
				lastSequence: input.sequence,
				lastHeartbeatAt: now,
				...(input.active || acceptedSeconds > 0 ? { lastActivityAt: now } : {}),
				totalActiveSeconds: { increment: acceptedSeconds },
			},
		});
		if (!sessionUpdated.count) return { accepted: true, duplicate: true, seconds: 0 };

		if (section && acceptedSeconds > 0) {
			const endDay = vietnamDay(now);
			const startDay = vietnamDay(intervalStart);
			const buckets = [{ day: endDay, seconds: acceptedSeconds }];
			if (startDay.getTime() !== endDay.getTime()) {
				const midnightUtc = new Date(endDay.getTime() - 7 * 60 * 60_000);
				const intervalMs = now.getTime() - intervalStart.getTime();
				const beforeMidnight = Math.max(0, midnightUtc.getTime() - intervalStart.getTime());
				const secondsBefore = Math.min(
					acceptedSeconds,
					Math.round((acceptedSeconds * beforeMidnight) / intervalMs),
				);
				buckets.splice(
					0,
					1,
					{ day: startDay, seconds: secondsBefore },
					{ day: endDay, seconds: acceptedSeconds - secondsBefore },
				);
			}
			for (const bucket of buckets) {
				if (!bucket.seconds) continue;
				await tx.learnStudyBucket.upsert({
					where: {
						sessionId_sectionId_day: {
							sessionId: session.id,
							sectionId: section.id,
							day: bucket.day,
						},
					},
					create: {
						sessionId: session.id,
						sectionId: section.id,
						sectionTitle: section.title,
						day: bucket.day,
						seconds: bucket.seconds,
					},
					update: { seconds: { increment: bucket.seconds } },
				});
			}
		}
		return { accepted: true, duplicate: false, seconds: acceptedSeconds };
	});
}

export async function getLearnStudyReport(courseSlug: string, days: number, requestedPage = 1) {
	const page = Number.isFinite(requestedPage)
		? Math.min(100_000, Math.max(1, Math.floor(requestedPage)))
		: 1;
	const pageSize = 50;
	const rangeDays = Math.min(365, Math.max(1, Math.floor(days)));
	const course = await prisma.learnCourse.findUnique({
		where: { slug: courseSlug },
		select: { id: true, slug: true, title: true },
	});
	if (!course) throw new AppError('Không tìm thấy khóa học', 404);
	const today = vietnamDay(new Date());
	const startDay = new Date(today.getTime() - (rangeDays - 1) * 24 * 60 * 60_000);
	const start = new Date(startDay.getTime() - 7 * 60 * 60_000);
	const [visits, activeUsers, firstTracked, daily, sections, learners, completed, sectionCount] =
		await prisma.$transaction(
			async (tx) =>
				Promise.all([
					tx.$queryRaw<Array<{ learnerCount: bigint; visitCount: bigint }>>`
			SELECT COUNT(DISTINCT s."userId") AS "learnerCount",
				COUNT(*) AS "visitCount"
			FROM "LearnStudySession" s WHERE s."courseId" = ${course.id}
			AND (s."startedAt" >= ${start} OR EXISTS (
				SELECT 1 FROM "LearnStudyBucket" b WHERE b."sessionId" = s.id AND b.day >= ${startDay}
			))
		`,
					tx.$queryRaw<Array<{ count: bigint }>>`
			SELECT COUNT(DISTINCT s."userId") AS count FROM "LearnStudyBucket" b
			JOIN "LearnStudySession" s ON s."id" = b."sessionId"
			WHERE s."courseId" = ${course.id} AND b."day" >= ${startDay}
		`,
					tx.$queryRaw<Array<{ firstTrackedAt: Date | null }>>`
			SELECT MIN("startedAt") AS "firstTrackedAt" FROM "LearnStudySession" WHERE "courseId" = ${course.id}
		`,
					tx.$queryRaw<Array<{ day: Date; seconds: bigint; learnerCount: bigint }>>`
			SELECT b."day" AS day, SUM(b."seconds") AS seconds,
				COUNT(DISTINCT s."userId") AS "learnerCount"
			FROM "LearnStudyBucket" b JOIN "LearnStudySession" s ON s."id" = b."sessionId"
			WHERE s."courseId" = ${course.id} AND b."day" >= ${startDay}
			GROUP BY b."day" ORDER BY b."day"
		`,
					tx.$queryRaw<
						Array<{ sectionId: string; title: string; seconds: bigint; learnerCount: bigint }>
					>`
			SELECT b."sectionId", COALESCE(sec."title", MAX(b."sectionTitle"), 'Mục đã lưu trữ') AS title,
				SUM(b."seconds") AS seconds, COUNT(DISTINCT s."userId") AS "learnerCount"
			FROM "LearnStudyBucket" b JOIN "LearnStudySession" s ON s."id" = b."sessionId"
			LEFT JOIN "LearnSection" sec ON sec."id" = b."sectionId"
			WHERE s."courseId" = ${course.id} AND b."day" >= ${startDay}
			GROUP BY b."sectionId", sec."title" ORDER BY SUM(b."seconds") DESC
		`,
					tx.$queryRaw<
						Array<{ userId: string; seconds: bigint; lastActivityAt: Date; sessionCount: bigint }>
					>`
			SELECT s."userId", SUM(b."seconds") AS seconds, MAX(s."lastActivityAt") AS "lastActivityAt",
			COUNT(DISTINCT s."id") FILTER (WHERE s."startedAt" >= ${start} OR b."id" IS NOT NULL) AS "sessionCount"
			FROM "LearnStudySession" s LEFT JOIN "LearnStudyBucket" b ON b."sessionId" = s."id" AND b."day" >= ${startDay}
			WHERE s."courseId" = ${course.id} AND (s."startedAt" >= ${start} OR b."id" IS NOT NULL)
			GROUP BY s."userId" ORDER BY SUM(COALESCE(b."seconds", 0)) DESC, MAX(s."lastActivityAt") DESC, s."userId"
			LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
		`,
					tx.learnSectionProgress.groupBy({
						by: ['userId'],
						where: { courseId: course.id, completedAt: { not: null } },
						_count: { _all: true },
					}),
					tx.learnSection.count({ where: { lesson: { courseId: course.id } } }),
				]),
			{ isolationLevel: 'RepeatableRead' },
		);
	const totalSeconds = daily.reduce((sum, row) => sum + Number(row.seconds), 0);
	const activeLearnerCount = Number(activeUsers[0]?.count ?? BigInt(0));
	const completedByUser = new Map(completed.map((row) => [row.userId, row._count._all]));
	const mongoIds = learners.map((row) => row.userId).filter((id) => /^[a-f\d]{24}$/i.test(id));
	const usersById = new Map<string, { name?: string; email?: string }>();
	if (mongoIds.length) {
		await dbConnect();
		const users = await User.find({ _id: { $in: mongoIds } })
			.select('_id name email')
			.lean();
		for (const user of users)
			usersById.set(String(user._id), { name: user.name, email: user.email });
	}
	return {
		course,
		page,
		totalPages: Math.max(1, Math.ceil(Number(visits[0]?.learnerCount ?? BigInt(0)) / pageSize)),
		days: rangeDays,
		totals: {
			visitors: Number(visits[0]?.learnerCount ?? BigInt(0)),
			visits: Number(visits[0]?.visitCount ?? BigInt(0)),
			activeLearners: activeLearnerCount,
			totalSeconds,
			averageSecondsPerActiveLearner: activeLearnerCount
				? Math.round(totalSeconds / activeLearnerCount)
				: 0,
		},
		daily: daily.map((row) => ({
			day: row.day.toISOString().slice(0, 10),
			seconds: Number(row.seconds),
			learners: Number(row.learnerCount),
		})),
		sections: sections.map((row) => ({
			sectionId: row.sectionId,
			title: row.title,
			seconds: Number(row.seconds),
			learners: Number(row.learnerCount),
		})),
		learners: learners.map((row) => ({
			userId: row.userId,
			name: usersById.get(row.userId)?.name ?? 'Tài khoản không còn trong hệ thống',
			email: usersById.get(row.userId)?.email ?? '',
			seconds: Number(row.seconds),
			lastActivityAt: row.lastActivityAt.toISOString(),
			sessions: Number(row.sessionCount),
			completedSections: completedByUser.get(row.userId) ?? 0,
			sectionCount,
		})),
		trackingSince: firstTracked[0]?.firstTrackedAt?.toISOString() ?? null,
	};
}
