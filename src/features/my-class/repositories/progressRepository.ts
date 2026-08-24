import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import type { MyClassActor } from '../domain/actor';

const actorWhere = (actor: MyClassActor): Prisma.MyClassKuProgressWhereInput =>
	actor.type === 'user' ? { actorKey: actor.actorKey } : { actorKey: actor.actorKey };

export async function findProgress(courseId: string, knowledgeUnitId: string, actor: MyClassActor) {
	return prisma.myClassKuProgress.findUnique({
		where: { courseId_knowledgeUnitId_actorKey: { courseId, knowledgeUnitId, actorKey: actor.actorKey } },
	});
}

export async function listActorProgress(actor: MyClassActor, courseId?: string) {
	return prisma.myClassKuProgress.findMany({
		where: {
			...actorWhere(actor),
			...(courseId ? { courseId } : {}),
		},
		include: {
			course: true,
			knowledgeUnit: { include: { currentPublishedRevision: true } },
		},
		orderBy: { updatedAt: 'desc' },
	});
}

export async function listCompletedUnitIds(actor: MyClassActor, courseId: string): Promise<string[]> {
	const rows = await prisma.myClassKuProgress.findMany({
		where: { courseId, actorKey: actor.actorKey, completedAt: { not: null } },
		select: { knowledgeUnitId: true },
	});
	return rows.map((row) => row.knowledgeUnitId);
}

export async function findLatestViewedUnitId(actor: MyClassActor, courseId: string): Promise<string | null> {
	const row = await prisma.myClassKuProgress.findFirst({
		where: { courseId, actorKey: actor.actorKey, lastViewedAt: { not: null } },
		orderBy: { lastViewedAt: 'desc' },
		select: { knowledgeUnitId: true },
	});
	return row?.knowledgeUnitId ?? null;
}

async function recordActivityDay(courseId: string, actorKey: string) {
	const now = new Date();
	const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
	try {
		await prisma.myClassActivityDay.upsert({
			where: {
				actorKey_courseId_day: {
					actorKey,
					courseId,
					day,
				},
			},
			create: { actorKey, courseId, day },
			update: {},
		});
	} catch (error) {
		console.error('[my-class] activity day upsert failed', error);
	}
}

export async function upsertViewed(courseId: string, knowledgeUnitId: string, actor: MyClassActor) {
	const now = new Date();
	await recordActivityDay(courseId, actor.actorKey);
	return prisma.myClassKuProgress.upsert({
		where: {
			courseId_knowledgeUnitId_actorKey: { courseId, knowledgeUnitId, actorKey: actor.actorKey },
		},
		create: {
			courseId,
			knowledgeUnitId,
			actorKey: actor.actorKey,
			userId: actor.type === 'user' ? actor.userId : null,
			guestId: actor.type === 'guest' ? actor.guestId : null,
			firstViewedAt: now,
			lastViewedAt: now,
		},
		update: { lastViewedAt: now },
	});
}

export async function markCompleted(courseId: string, knowledgeUnitId: string, actor: MyClassActor) {
	const existing = await findProgress(courseId, knowledgeUnitId, actor);
	const now = new Date();
	if (!existing) {
		return prisma.myClassKuProgress.create({
			data: {
				courseId,
				knowledgeUnitId,
				actorKey: actor.actorKey,
				userId: actor.type === 'user' ? actor.userId : null,
				guestId: actor.type === 'guest' ? actor.guestId : null,
				firstViewedAt: now,
				lastViewedAt: now,
				completedAt: now,
			},
		});
	}
	if (existing.completedAt) {
		return { ...existing, alreadyCompleted: true as const };
	}
	const updated = await prisma.myClassKuProgress.update({
		where: { id: existing.id },
		data: {
			completedAt: now,
			firstViewedAt: existing.firstViewedAt ?? now,
			lastViewedAt: now,
		},
	});
	return { ...updated, alreadyCompleted: false as const };
}

export async function listProgress(userId: string) {
	return prisma.myClassKuProgress.findMany({
		where: { userId },
		include: {
			course: true,
			knowledgeUnit: { include: { currentPublishedRevision: true } },
		},
		orderBy: { firstViewedAt: 'desc' },
	});
}

export async function listUserAttempts(userId: string) {
	return prisma.myClassTestAttempt.findMany({
		where: { userId },
		include: {
			test: true,
			course: true,
			placement: { include: { course: true } },
			evidence: { include: { knowledgeUnit: { include: { currentPublishedRevision: { select: { title: true } } } } } },
		},
		orderBy: { submittedAt: 'desc' },
		take: 200,
	});
}

export async function listGuestAttempts(guestId: string) {
	return prisma.myClassTestAttempt.findMany({
		where: { guestId },
		include: {
			test: true,
			course: true,
			placement: { include: { course: true } },
			evidence: { include: { knowledgeUnit: { include: { currentPublishedRevision: true } } } },
		},
		orderBy: { submittedAt: 'desc' },
	});
}

export async function kuBelongsToCourse(courseId: string, knowledgeUnitId: string) {
	const mapping = await prisma.myClassSectionKnowledgeUnit.findFirst({
		where: { knowledgeUnitId, section: { lesson: { courseId } } },
		select: { id: true },
	});
	return Boolean(mapping);
}

export async function kuBelongsToContext(
	courseId: string,
	knowledgeUnitId: string,
	context?: { lessonSlug?: string; sectionId?: string },
) {
	const mapping = await prisma.myClassSectionKnowledgeUnit.findFirst({
		where: {
			knowledgeUnitId,
			section: {
				...(context?.sectionId ? { id: context.sectionId } : {}),
				lesson: {
					courseId,
					...(context?.lessonSlug ? { slug: context.lessonSlug } : {}),
				},
			},
		},
		select: { id: true, sectionId: true, section: { select: { lesson: { select: { slug: true } } } } },
	});
	return mapping;
}

export async function listGuestProgress(guestId: string) {
	return prisma.myClassKuProgress.findMany({
		where: { guestId },
	});
}

export async function listUserCourseProgress(userId: string, courseId: string) {
	return prisma.myClassKuProgress.findMany({
		where: { userId, courseId },
	});
}

export async function listActivityDays(actorKey: string, since: Date) {
	return prisma.myClassActivityDay.findMany({
		where: { actorKey, day: { gte: since } },
		orderBy: { day: 'asc' },
		select: { day: true },
	});
}
