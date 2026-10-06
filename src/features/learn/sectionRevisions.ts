import { Prisma, type LearnSection } from '@prisma/client';

import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';

import { readCheckpoint, readDiscussion, readQuiz, sectionMinutes } from './content';
import { mapStudioSection } from './studioSection';
import type { LearnStudioSection } from './types';

const REVISION_GAP_MS = 10 * 60 * 1000;
const REVISION_KEEP = 50;

export async function snapshotSection(
	sectionId: string,
	reason: 'autosave' | 'import' | 'restore' | 'manual' | 'conflict',
	force: boolean,
) {
	if (!force) {
		const latest = await prisma.learnSectionRevision.findFirst({
			where: { sectionId },
			orderBy: { createdAt: 'desc' },
			select: { createdAt: true },
		});
		const created = latest
			? null
			: await prisma.learnSection.findUnique({
					where: { id: sectionId },
					select: { createdAt: true },
				});
		if (!latest && !created) return;
		const lastAt = latest?.createdAt ?? created!.createdAt;
		if (Date.now() - lastAt.getTime() < REVISION_GAP_MS) return;
	}
	const current = await prisma.learnSection.findUnique({ where: { id: sectionId } });
	if (!current) return;
	await prisma.$transaction(async (tx) => {
		await tx.learnSectionRevision.create({
			data: {
				sectionId,
				title: current.title,
				summary: current.summary,
				markdown: current.markdown,
				keyTakeaways: current.keyTakeaways,
				checkpoint:
					current.checkpoint === null
						? Prisma.DbNull
						: (current.checkpoint as Prisma.InputJsonValue),
				quiz: current.quiz === null ? Prisma.DbNull : (current.quiz as Prisma.InputJsonValue),
				discussion:
					current.discussion === null
						? Prisma.DbNull
						: (current.discussion as Prisma.InputJsonValue),
				reason,
			},
		});
		const stale = await tx.learnSectionRevision.findMany({
			where: { sectionId },
			orderBy: { createdAt: 'desc' },
			skip: REVISION_KEEP,
			select: { id: true },
		});
		if (stale.length) {
			await tx.learnSectionRevision.deleteMany({
				where: { id: { in: stale.map((row) => row.id) } },
			});
		}
	});
}

export async function createSectionRevision(
	sectionId: string,
	reason: 'manual' | 'conflict' = 'manual',
) {
	const current = await prisma.learnSection.findUnique({
		where: { id: sectionId },
		select: { id: true },
	});
	if (!current) throw new AppError('Không tìm thấy mục học', 404);
	await snapshotSection(sectionId, reason, true);
	return listSectionRevisions(sectionId);
}

export async function getLearnStudioSection(id: string): Promise<LearnStudioSection> {
	const section = await prisma.learnSection.findUnique({ where: { id } });
	if (!section) throw new AppError('Không tìm thấy mục học', 404);
	return mapStudioSection(section);
}

export async function getSectionRevision(sectionId: string, revisionId: string) {
	const revision = await prisma.learnSectionRevision.findFirst({
		where: { id: revisionId, sectionId },
	});
	if (!revision) throw new AppError('Không tìm thấy bản lưu', 404);
	return {
		id: revision.id,
		title: revision.title,
		summary: revision.summary,
		markdown: revision.markdown,
		keyTakeaways: revision.keyTakeaways,
		checkpoint: readCheckpoint(revision.checkpoint),
		quiz: readQuiz(revision.quiz),
		discussion: readDiscussion(revision.discussion),
		reason: revision.reason,
		createdAt: revision.createdAt.toISOString(),
	};
}

export async function listSectionRevisions(sectionId: string) {
	const rows = await prisma.learnSectionRevision.findMany({
		where: { sectionId },
		orderBy: { createdAt: 'desc' },
		take: REVISION_KEEP,
		select: { id: true, title: true, reason: true, createdAt: true },
	});
	return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

export async function restoreSectionRevision(
	sectionId: string,
	revisionId: string,
): Promise<LearnStudioSection> {
	const revision = await prisma.learnSectionRevision.findFirst({
		where: { id: revisionId, sectionId },
	});
	if (!revision) throw new AppError('Không tìm thấy bản lưu', 404);
	await snapshotSection(sectionId, 'restore', true);
	const current = await prisma.learnSection.findUnique({
		where: { id: sectionId },
		select: { type: true, durationMinutes: true },
	});
	if (!current) throw new AppError('Không tìm thấy mục học', 404);
	const section = await prisma.learnSection.update({
		where: { id: sectionId },
		data: {
			title: revision.title,
			summary: revision.summary,
			markdown: revision.markdown,
			keyTakeaways: revision.keyTakeaways,
			checkpoint:
				revision.checkpoint === null
					? Prisma.DbNull
					: (revision.checkpoint as Prisma.InputJsonValue),
			quiz: revision.quiz === null ? Prisma.DbNull : (revision.quiz as Prisma.InputJsonValue),
			discussion:
				revision.discussion === null
					? Prisma.DbNull
					: (revision.discussion as Prisma.InputJsonValue),
			estimatedMinutes: sectionMinutes({
				type: current.type as LearnSection['type'],
				durationMinutes: current.durationMinutes,
				markdown: revision.markdown,
				quiz: readQuiz(revision.quiz),
				discussion: readDiscussion(revision.discussion),
			}),
		},
	});
	return mapStudioSection(section);
}
