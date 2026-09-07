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
};

function tooLong(value: string, max: number) {
	return recallVisibleLength(value) > max;
}

export function prepareRecallCardsForSave(cards: RecallCardDraftInput[]): PreparedRecallCard[] {
	const prepared: PreparedRecallCard[] = [];
	const fields: Record<string, string> = {};

	cards.forEach((card, index) => {
		const question = recallImportToStoredHtml(card.question ?? '');
		const answer = recallImportToStoredHtml(card.answer ?? '');
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
		prepared.push({ id: card.id, question, answer });
	});

	if (Object.keys(fields).length > 0) {
		throw new AppError('Một số thẻ chưa đủ câu hỏi và đáp án', 422, 'VALIDATION', fields);
	}
	return prepared;
}
