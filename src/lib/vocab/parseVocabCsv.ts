/* ════════════════════════════════════════════════════════════════════════
   parseVocabCsv.ts
   Parses a pasted CSV vocabulary list for My Class lesson import.

   Canonical header:
     term,pronunciation,part_of_speech,meaning_en,meaning_vi,explanation,example,hints_hard,hints_medium,hints_easy

   Required: term + at least one of meaning_vi / meaning_en.
   Hints in a cell are separated with "||".
   ════════════════════════════════════════════════════════════════════════ */
import { parse } from 'csv-parse/sync';
import type { CreateWordInput } from '@/types/vocab';
import { isBlankVocabRow, mapCanonicalVocabRow } from './normalizeVocabRow';
import { canonicalVocabHeader, detectDelimiter } from './vocabHeaders';

export { canonicalVocabHeader, detectDelimiter } from './vocabHeaders';

export type VocabCsvRowError = {
	row: number;
	missing: string[];
	message?: string;
};

export type VocabCsvParseResult = {
	words: CreateWordInput[];
	errors: VocabCsvRowError[];
	wordCount: number;
};

export const VOCAB_CSV_COLUMNS = [
	'term',
	'pronunciation',
	'part_of_speech',
	'meaning_en',
	'meaning_vi',
	'explanation',
	'example',
	'hints_hard',
	'hints_medium',
	'hints_easy',
] as const;

export const VOCAB_CSV_TEMPLATE = `${VOCAB_CSV_COLUMNS.join(',')}
resilient,/rɪˈzɪliənt/,adjective,able to recover quickly from difficulties,có khả năng phục hồi; bền bỉ,"Đặc tính giúp con người hoặc hệ thống trở lại trạng thái ban đầu sau biến cố","She is resilient enough to overcome any obstacle.",vật liệu đàn hồi trở về hình dạng ban đầu,khả năng vượt qua nghịch cảnh và phục hồi,có thể phục hồi nhanh sau thất bại
`;

export function parseVocabCsv(csv: string): VocabCsvParseResult {
	const text = csv.replace(/^\uFEFF/, '').trim();
	if (!text) {
		return { words: [], errors: [{ row: 1, missing: ['csv'], message: 'CSV trống' }], wordCount: 0 };
	}
	const delimiter = detectDelimiter(text);
	let rawRows: Record<string, string>[];
	try {
		rawRows = parse(text, {
			columns: (header: string[]) => header.map(canonicalVocabHeader),
			skip_empty_lines: true,
			trim: true,
			relax_column_count: true,
			delimiter,
			bom: true,
		}) as Record<string, string>[];
	} catch {
		return {
			words: [],
			errors: [{ row: 1, missing: ['csv'], message: 'Không đọc được CSV' }],
			wordCount: 0,
		};
	}

	const words: CreateWordInput[] = [];
	const errors: VocabCsvRowError[] = [];
	rawRows.forEach((r, idx) => {
		const { _missing, ...word } = mapCanonicalVocabRow(r);
		if (isBlankVocabRow(word)) return;
		if (_missing.length > 0) {
			errors.push({
				row: idx + 2,
				missing: _missing,
				message: `thiếu ${_missing.join(', ')}`,
			});
			return;
		}
		words.push(word);
	});

	return { words, errors, wordCount: words.length };
}
