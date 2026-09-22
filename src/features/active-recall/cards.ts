import { AppError } from '@/lib/appError';

import {
	ACTIVE_RECALL_MAX_ANSWER_LENGTH,
	ACTIVE_RECALL_MAX_QUESTION_LENGTH,
	type RecallCardDraftInput,
} from './schemas';
import { recallHasContent, recallImportToStoredHtml, recallVisibleLength } from './richText';

export type PreparedRecallCard = {
	id?: string;
	question: string;
	answer: string;
	questionVi: string;
	answerVi: string;
};

export type ExistingStoredRecallCard = {
	id: string;
	question: string;
	answer: string;
	questionVi: string;
	answerVi: string;
};

function unchangedStoredCard(
	card: RecallCardDraftInput,
	existing: ExistingStoredRecallCard | undefined,
): PreparedRecallCard | null {
	if (!existing) return null;
	if (
		card.question === existing.question &&
		card.answer === existing.answer &&
		(card.questionVi ?? '') === existing.questionVi &&
		(card.answerVi ?? '') === existing.answerVi
	) {
		return {
			id: card.id,
			question: existing.question,
			answer: existing.answer,
			questionVi: existing.questionVi,
			answerVi: existing.answerVi,
		};
	}
	return null;
}

function tooLong(value: string, max: number) {
	return recallVisibleLength(value) > max;
}

export function prepareRecallCardsForSave(
	cards: RecallCardDraftInput[],
	existingById?: ReadonlyMap<string, ExistingStoredRecallCard>,
): PreparedRecallCard[] {
	const prepared: PreparedRecallCard[] = [];
	const fields: Record<string, string> = {};

	cards.forEach((card, index) => {
		const unchanged = card.id ? unchangedStoredCard(card, existingById?.get(card.id)) : null;
		if (unchanged) {
			prepared.push(unchanged);
			return;
		}
		const question = recallImportToStoredHtml(card.question ?? '');
		const answer = recallImportToStoredHtml(card.answer ?? '');
		const questionVi = recallImportToStoredHtml(card.questionVi ?? '');
		const answerVi = recallImportToStoredHtml(card.answerVi ?? '');
		const hasQuestion = recallHasContent(question);
		const hasAnswer = recallHasContent(answer);
		if (!hasQuestion && !hasAnswer) return;
		if (!hasQuestion) {
			fields[`cards.${index}.question`] = 'Thẻ thiếu câu hỏi';
			return;
		}
		if (!hasAnswer) {
			fields[`cards.${index}.answer`] = 'Thẻ thiếu đáp án';
			return;
		}
		if (tooLong(question, ACTIVE_RECALL_MAX_QUESTION_LENGTH)) {
			fields[`cards.${index}.question`] = 'Câu hỏi quá dài';
			return;
		}
		if (tooLong(answer, ACTIVE_RECALL_MAX_ANSWER_LENGTH)) {
			fields[`cards.${index}.answer`] = 'Đáp án quá dài';
			return;
		}
		if (tooLong(questionVi, ACTIVE_RECALL_MAX_QUESTION_LENGTH)) {
			fields[`cards.${index}.questionVi`] = 'Câu hỏi (Tiếng Việt) quá dài';
			return;
		}
		if (tooLong(answerVi, ACTIVE_RECALL_MAX_ANSWER_LENGTH)) {
			fields[`cards.${index}.answerVi`] = 'Đáp án (Tiếng Việt) quá dài';
			return;
		}
		prepared.push({ id: card.id, question, answer, questionVi, answerVi });
	});

	if (Object.keys(fields).length > 0) {
		throw new AppError('Một số thẻ chưa đủ câu hỏi và đáp án', 422, 'VALIDATION', fields);
	}
	return prepared;
}
