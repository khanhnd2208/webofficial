import { previewRecallImport } from '@/features/active-recall/parser';
import { recallHasContent, recallImportToStoredHtml } from '@/features/active-recall/richText';
import { ACTIVE_RECALL_MAX_CARDS } from '@/features/active-recall/schemas';

export type ImportDraftCard = {
	id?: string;
	question: string;
	answer: string;
	questionVi: string;
	answerVi: string;
};

// Compare all four stored faces so translations and formatting are never discarded.
function fingerprint(card: Omit<ImportDraftCard, 'id'>) {
	return JSON.stringify(
		[card.question, card.answer, card.questionVi, card.answerVi].map(recallImportToStoredHtml),
	);
}

export function previewDraftImport(
	text: string,
	cards: ImportDraftCard[],
	mode: 'append' | 'replace',
) {
	const result = previewRecallImport(text);
	const existing = cards.filter(
		(card) =>
			card.id ||
			[card.question, card.answer, card.questionVi, card.answerVi].some(recallHasContent),
	);
	const byId = new Map(existing.filter((card) => card.id).map((card) => [card.id, card]));
	const seen = new Set(mode === 'append' ? existing.map(fingerprint) : []);
	let count = mode === 'append' ? existing.length : 0;
	for (const row of result.rows) {
		if (row.errors.length) continue;
		if (row.id && !byId.has(row.id)) {
			row.errors.push('ID thẻ không thuộc bộ này. Xóa cột ID nếu muốn tạo thẻ mới.');
			continue;
		}
		const key = fingerprint({
			question: row.question,
			answer: row.answer,
			questionVi: row.questionVi ?? '',
			answerVi: row.answerVi ?? '',
		});
		if (row.id) row.action = mode === 'append' ? 'update' : 'create';
		else row.action = seen.has(key) ? 'skip' : 'create';
		if (row.action === 'create') count += 1;
		seen.add(key);
		if (count > ACTIVE_RECALL_MAX_CARDS)
			row.errors.push(
				`Tối đa ${ACTIVE_RECALL_MAX_CARDS} thẻ mỗi bộ. Hãy chia dữ liệu thành nhiều bộ.`,
			);
	}
	result.summary.valid = result.rows.filter((row) => !row.errors.length).length;
	result.summary.invalid = result.rows.length - result.summary.valid;
	result.summary.duplicates = result.rows.filter((row) => row.action === 'skip').length;
	return result;
}
