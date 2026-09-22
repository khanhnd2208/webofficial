import { Prisma } from '@prisma/client';

import type { PreparedRecallCard } from './cards';

export const RECALL_WRITE_TX = { timeout: 60_000, maxWait: 10_000 } as const;

export type ExistingRecallCard = {
	id: string;
	question: string;
	answer: string;
	questionVi: string;
	answerVi: string;
	position: number;
};

export type RecallCardCreate = PreparedRecallCard & {
	id?: string;
	position: number;
};

export type RecallCardUpdate = PreparedRecallCard & {
	id: string;
	position: number;
};

export function planRecallCardWrites(existing: ExistingRecallCard[], next: PreparedRecallCard[]) {
	const existingById = new Map(existing.map((card) => [card.id, card]));
	const keepIds: string[] = [];
	const toCreate: RecallCardCreate[] = [];
	const toUpdate: RecallCardUpdate[] = [];

	next.forEach((card, position) => {
		if (!card.id) {
			toCreate.push({ ...card, position });
			return;
		}
		keepIds.push(card.id);
		const prev = existingById.get(card.id);
		if (
			prev &&
			prev.question === card.question &&
			prev.answer === card.answer &&
			prev.questionVi === card.questionVi &&
			prev.answerVi === card.answerVi &&
			prev.position === position
		) {
			return;
		}
		toUpdate.push({ ...card, id: card.id, position });
	});

	return { keepIds, toCreate, toUpdate };
}

export async function persistRecallCardWrites(
	tx: Prisma.TransactionClient,
	deckId: string,
	plan: ReturnType<typeof planRecallCardWrites>,
	options?: { deleteMissing?: boolean },
) {
	if (options?.deleteMissing !== false) {
		await tx.activeRecallCard.deleteMany({
			where: { deckId, ...(plan.keepIds.length ? { id: { notIn: plan.keepIds } } : {}) },
		});
	}
	if (plan.toCreate.length) {
		await tx.activeRecallCard.createMany({
			data: plan.toCreate.map((card) => ({
				...(card.id ? { id: card.id } : {}),
				deckId,
				question: card.question,
				answer: card.answer,
				questionVi: card.questionVi,
				answerVi: card.answerVi,
				position: card.position,
			})),
		});
	}
	if (plan.toUpdate.length) {
		await bulkUpdateRecallCards(tx, plan.toUpdate);
	}
}

async function bulkUpdateRecallCards(tx: Prisma.TransactionClient, cards: RecallCardUpdate[]) {
	const payload = JSON.stringify(
		cards.map((card) => ({
			id: card.id,
			question: card.question,
			answer: card.answer,
			question_vi: card.questionVi,
			answer_vi: card.answerVi,
			position: card.position,
		})),
	);
	await tx.$executeRaw`
		UPDATE "ActiveRecallCard" AS c
		SET
			question = v.question,
			answer = v.answer,
			"questionVi" = v.question_vi,
			"answerVi" = v.answer_vi,
			position = v.position,
			"updatedAt" = NOW()
		FROM jsonb_to_recordset(${payload}::jsonb)
			AS v(id text, question text, answer text, question_vi text, answer_vi text, position int)
		WHERE c.id = v.id
	`;
}
