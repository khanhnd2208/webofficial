import { createHash, randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';
import {
	RECALL_IDLE_MS,
	RECALL_LEASE_MS,
	RECALL_SESSION_GAP_MS,
	type RecallBeginInput,
	type RecallHeartbeatInput,
} from './contracts';
import { recallDay, splitRecallSeconds } from './time';

type Tx = Prisma.TransactionClient;
export function recallVisitorHash(cookie: string) {
	return createHash('sha256').update(cookie).digest('hex');
}
async function lockVisitor(tx: Tx, visitorId: string) {
	await tx.$queryRaw`SELECT id FROM "RecallVisitor" WHERE id = ${visitorId} FOR UPDATE`;
}
async function target(tx: Tx, deckId: string, classSlug?: string) {
	const deck = await tx.activeRecallDeck.findFirst({
		where: { id: deckId, status: 'PUBLISHED', cards: { some: {} } },
		select: { id: true, title: true, courseId: true, course: { select: { courseName: true } } },
	});
	if (!deck) throw new AppError('Không tìm thấy bộ thẻ', 404);
	let classId = '',
		className = '';
	if (classSlug) {
		const cls = await tx.teachingClass.findFirst({
			where: {
				publicSlug: classSlug,
				courseId: deck.courseId,
				status: 'ACTIVE',
				attendanceVisible: true,
				recallDecks: { some: { deckId, enabled: true } },
			},
			select: { id: true, publicTitle: true, classCode: true, term: true },
		});
		if (!cls) throw new AppError('Không tìm thấy bộ thẻ của lớp', 404);
		classId = cls.id;
		className = cls.publicTitle || `${cls.classCode} · ${cls.term}`;
	}
	return {
		deckId,
		deckTitle: deck.title,
		courseId: deck.courseId,
		courseName: deck.course.courseName,
		classId,
		className,
		classSlug: classSlug || '',
	};
}
async function bucket(
	tx: Tx,
	visitId: string,
	day: string,
	increments: {
		opens?: number;
		interactions?: number;
		answerReveals?: number;
		activeSeconds?: number;
	},
) {
	await tx.recallStudyBucket.upsert({
		where: { visitId_day: { visitId, day: new Date(day) } },
		create: { visitId, day: new Date(day), ...increments },
		update: Object.fromEntries(
			Object.entries(increments).map(([key, value]) => [key, { increment: value }]),
		),
	});
}
export async function beginRecallStudy(visitorId: string, input: RecallBeginInput) {
	return prisma.$transaction(async (tx) => {
		const now = new Date();
		const context = await target(tx, input.deckId, input.classSlug);
		await tx.$executeRaw`
			INSERT INTO "RecallVisitor" (id, "publicId", "firstSeenAt", "lastSeenAt")
			VALUES (${visitorId}, ${randomUUID()}, ${now}, ${now}) ON CONFLICT (id) DO NOTHING
		`;
		await lockVisitor(tx, visitorId);
		const visitor = await tx.recallVisitor.findUniqueOrThrow({ where: { id: visitorId } });
		let visit = await tx.recallStudyVisit.findUnique({
			where: { id: input.visitId },
			include: { session: true },
		});
		if (
			visit &&
			(visit.session.visitorId !== visitorId ||
				visit.clientId !== input.clientId ||
				visit.deckId !== input.deckId ||
				visit.classSlug !== (input.classSlug || ''))
		)
			throw new AppError('Phiên học không hợp lệ', 409);
		// A retry never adds another open. A stale visit requires a fresh client visit ID.
		if (
			visit &&
			(visitor.currentSessionId !== visit.sessionId ||
				now.getTime() - visit.session.lastActivityAt.getTime() >= RECALL_SESSION_GAP_MS)
		)
			throw new AppError('Phiên học đã hết hạn', 409, 'RECALL_SESSION_EXPIRED');
		if (!visit) {
			let session = visitor.currentSessionId
				? await tx.recallStudySession.findUnique({ where: { id: visitor.currentSessionId } })
				: null;
			if (!session || now.getTime() - session.lastActivityAt.getTime() >= RECALL_SESSION_GAP_MS) {
				session = await tx.recallStudySession.create({
					data: { visitorId, startedAt: now, lastActivityAt: now },
				});
				await tx.recallVisitor.update({
					where: { id: visitorId },
					data: { currentSessionId: session.id },
				});
				await tx.recallStudyLease.deleteMany({ where: { visitorId } });
			}
			visit = await tx.recallStudyVisit.create({
				data: {
					id: input.visitId,
					clientId: input.clientId,
					sessionId: session.id,
					...context,
					openedAt: now,
					lastActivityAt: now,
					lastHeartbeatAt: now,
				},
				include: { session: true },
			});
			await bucket(tx, visit.id, recallDay(now), { opens: 1 });
			await tx.recallStudySession.update({
				where: { id: session.id },
				data: { lastActivityAt: now },
			});
			await tx.recallVisitor.update({ where: { id: visitorId }, data: { lastSeenAt: now } });
		}
		const lease = await tx.recallStudyLease.findUnique({ where: { visitorId } });
		const owns =
			lease?.visitId === visit.id && lease.clientId === input.clientId && lease.expiresAt > now;
		const granted = input.claimLease && (owns || !lease || lease.expiresAt <= now);
		if (granted) {
			const data = {
				sessionId: visit.sessionId,
				visitId: visit.id,
				clientId: input.clientId,
				expiresAt: new Date(now.getTime() + RECALL_LEASE_MS),
				timedAt: owns ? lease!.timedAt : now,
				lastInteraction: owns
					? lease!.lastInteraction
					: visit.engagedAt
						? visit.lastActivityAt
						: null,
			};
			await tx.recallStudyLease.upsert({
				where: { visitorId },
				create: { visitorId, ...data },
				update: data,
			});
		}
		return {
			sessionId: visit.sessionId,
			visitId: visit.id,
			lastSequence: visit.lastSequence,
			leaseGranted: granted,
		};
	});
}
export async function heartbeatRecallStudy(visitorId: string, input: RecallHeartbeatInput) {
	return prisma.$transaction(async (tx) => {
		await lockVisitor(tx, visitorId);
		const now = new Date();
		const visit = await tx.recallStudyVisit.findUnique({
			where: { id: input.visitId },
			include: { session: true },
		});
		if (
			!visit ||
			visit.session.visitorId !== visitorId ||
			visit.sessionId !== input.sessionId ||
			visit.clientId !== input.clientId
		)
			throw new AppError('Phiên học không hợp lệ', 403);
		await target(tx, visit.deckId, visit.classSlug);
		const lease = await tx.recallStudyLease.findUnique({ where: { visitorId } });
		const owns = Boolean(
			lease &&
			lease.visitId === visit.id &&
			lease.clientId === input.clientId &&
			lease.expiresAt > now,
		);
		if (input.sequence <= visit.lastSequence)
			return { accepted: true, leaseGranted: owns, lastSequence: visit.lastSequence };
		if (now.getTime() - visit.session.lastActivityAt.getTime() >= RECALL_SESSION_GAP_MS)
			throw new AppError('Phiên học đã hết hạn', 409, 'RECALL_SESSION_EXPIRED');
		if (input.sequence !== visit.lastSequence + 1)
			throw new AppError('Thứ tự ghi nhận không hợp lệ', 409, 'RECALL_SEQUENCE');
		// Qualifying actions and recent input establish activity; idle heartbeats do not.
		const interactionAt = new Date(now.getTime() - input.activityAgeSeconds * 1000);
		const recent =
			input.interactions > 0 ||
			(input.activityAgeSeconds * 1000 < RECALL_IDLE_MS && interactionAt > visit.lastActivityAt);
		const priorInteraction = lease?.lastInteraction;
		let seconds = 0;
		if (owns && lease && visit.engagedAt && priorInteraction) {
			const start = Math.max(lease.timedAt.getTime(), now.getTime() - 75_000);
			const idleEnd = priorInteraction.getTime() + RECALL_IDLE_MS;
			seconds = Math.min(
				input.seconds,
				Math.max(0, Math.floor((Math.min(now.getTime(), idleEnd) - start) / 1000)),
			);
		}
		// For delayed inactive heartbeats assign time to its bounded interval before the idle cutoff.
		const timingEnd = new Date(
			Math.min(
				now.getTime(),
				priorInteraction ? priorInteraction.getTime() + RECALL_IDLE_MS : now.getTime(),
			),
		);
		for (const row of splitRecallSeconds(timingEnd, seconds)) {
			if (row.seconds) await bucket(tx, visit.id, row.day, { activeSeconds: row.seconds });
		}
		if (input.interactions)
			await bucket(tx, visit.id, recallDay(now), {
				interactions: input.interactions,
				answerReveals: input.answerReveals,
			});
		await tx.recallStudyVisit.update({
			where: { id: visit.id },
			data: {
				lastSequence: input.sequence,
				lastHeartbeatAt: now,
				...(recent ? { lastActivityAt: input.interactions ? now : interactionAt } : {}),
				...(!visit.engagedAt && input.interactions ? { engagedAt: now } : {}),
			},
		});
		if (recent) {
			const activity = input.interactions ? now : interactionAt;
			await tx.recallStudySession.updateMany({
				where: { id: visit.sessionId, lastActivityAt: { lt: activity } },
				data: { lastActivityAt: activity },
			});
			await tx.recallVisitor.updateMany({
				where: { id: visitorId, lastSeenAt: { lt: activity } },
				data: { lastSeenAt: activity },
			});
		}
		if (owns && lease)
			await tx.recallStudyLease.update({
				where: { visitorId },
				data: {
					timedAt: now,
					expiresAt:
						input.releaseLease || !input.active ? now : new Date(now.getTime() + RECALL_LEASE_MS),
					lastInteraction:
						recent && (!priorInteraction || interactionAt > priorInteraction)
							? input.interactions
								? now
								: interactionAt
							: priorInteraction,
				},
			});
		return {
			accepted: true,
			leaseGranted: owns && input.active && !input.releaseLease,
			lastSequence: input.sequence,
		};
	});
}
