import 'server-only';

import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';

import { summarizeResponses, type ResponseRow } from '../domain/report';
import { scoreSubmission, type Submission } from '../domain/submission';

/** Plenty for honest retakes; stops one browser from flooding the table. */
const MAX_RUNS_PER_RESPONDENT = 30;

export async function recordResponse(input: Submission): Promise<{ id: string }> {
	const result = scoreSubmission(input.answers);
	if (!result) throw new AppError('Câu trả lời không hợp lệ', 400);

	const runs = await prisma.unreleasedQuizResponse.count({
		where: { respondentId: input.respondentId },
	});
	if (runs >= MAX_RUNS_PER_RESPONDENT) throw new AppError('Bạn đã làm quiz nhiều lần rồi', 429);

	const { answers } = input;
	const created = await prisma.unreleasedQuizResponse.create({
		data: {
			respondentId: input.respondentId,
			group: result.group,
			variant: result.variant,
			note: result.note,
			q1: answers.q1,
			q2: answers.q2 ?? null,
			q3: answers.q3,
			q4: answers.q4,
			q5: answers.q5 ?? null,
			q6: answers.q6 ?? null,
			q7: answers.q7 ?? null,
		},
		select: { id: true },
	});
	return created;
}

/** First click only; the response id is an unguessable uuid held by that browser. */
export async function markRegisterClick(id: string, respondentId: string): Promise<void> {
	await prisma.unreleasedQuizResponse.updateMany({
		where: { id, respondentId, registerClickedAt: null },
		data: { registerClickedAt: new Date() },
	});
}

export async function listResponses(): Promise<ResponseRow[]> {
	return prisma.unreleasedQuizResponse.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function getQuizReport() {
	const rows = await listResponses();
	return { report: summarizeResponses(rows), recent: rows.slice(0, 50) };
}
