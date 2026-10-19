import 'server-only';

import { prisma } from '@/lib/prisma';

import type { FeedbackSubmission } from '../domain/submission';

export async function recordFeedback(input: FeedbackSubmission): Promise<{ id: string }> {
	return prisma.unreleasedGiftResponse.create({
		data: { ...input, comment: input.comment || null },
		select: { id: true },
	});
}

export async function hasFeedback(id: string): Promise<boolean> {
	const response = await prisma.unreleasedGiftResponse.findUnique({
		where: { id },
		select: { id: true },
	});
	return response !== null;
}

export async function listFeedback() {
	return prisma.unreleasedGiftResponse.findMany({ orderBy: { createdAt: 'desc' } });
}
