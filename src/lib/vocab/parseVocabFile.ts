/* ════════════════════════════════════════════════════════════════════════
   parseVocabFile.ts
   Parses a CSV or Excel (.xlsx/.xls) vocabulary upload file.

   Required columns  : word / term, definition, ndk_explanation
   Optional columns  : partOfSpeech / part_of_speech, example,
                       hints_hard, hints_medium, hints_easy

   Hints are separated with "||" inside a single cell.
   ════════════════════════════════════════════════════════════════════════ */
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import type { CreateWordInput } from '@/types/vocab';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface RowError {
	/** 1-based row number in the uploaded file (row 1 = header) */
	row: number;
	missing: string[];
}

export interface ParseResult {
	words: CreateWordInput[];
	/** Rows that were skipped due to missing required fields */
	errors: RowError[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function parseHints(val: string | undefined): string[] {
	return val ? val.split('||').map((s) => s.trim()).filter(Boolean) : [];
}

/**
 * Maps a raw row object (from CSV or XLSX sheet_to_json) to a vocab word.
 * Returns the word plus a `_missing` list so the caller can decide what to do.
 */
export function mapRow(r: Record<string, string>): CreateWordInput & { _missing: string[] } {
	const term = (r.word ?? r.term ?? '').trim();
	const definition = (r.definition ?? '').trim();
	const ndkExplanation =
		(r.ndk_explanation ?? r.ndkExplanation ?? '').trim() || null;

	const missing: string[] = [];
	if (!term) missing.push('word/term');
	if (!definition) missing.push('definition');
	if (!ndkExplanation) missing.push('ndk_explanation');

	return {
		term,
		definition,
		partOfSpeech: (r.partOfSpeech ?? r.part_of_speech ?? '').trim(),
		example: (r.example ?? '').trim(),
		ndkExplanation,
		hintsHard: parseHints(r.hints_hard),
		hintsMedium: parseHints(r.hints_medium),
		hintsEasy: parseHints(r.hints_easy),
		_missing: missing,
	};
}

/**
 * Pure function: validates and converts raw row objects into words.
 * Completely empty rows (all required fields absent) are silently skipped.
 */
export function parseVocabRows(rawRows: Record<string, string>[]): ParseResult {
	const words: CreateWordInput[] = [];
	const errors: RowError[] = [];

	rawRows.forEach((r, idx) => {
		const { _missing, ...word } = mapRow(r);

		// Silently skip rows that are completely blank
		if (!word.term && !word.definition && !word.ndkExplanation) return;

		if (_missing.length > 0) {
			errors.push({ row: idx + 2, missing: _missing }); // +2: row 1 = header
		} else {
			words.push(word);
		}
	});

	return { words, errors };
}

/**
 * Reads a File (CSV or XLSX) and returns parsed words + row-level errors.
 */
export async function parseVocabFile(file: File): Promise<ParseResult> {
	const isExcel = /\.(xlsx|xls)$/i.test(file.name);

	let rawRows: Record<string, string>[];

	if (isExcel) {
		const buffer = await file.arrayBuffer();
		const wb = XLSX.read(buffer, { type: 'array' });
		const ws = wb.Sheets[wb.SheetNames[0]];
		rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
	} else {
		const text = await file.text();
		rawRows = parse(text, {
			columns: true,
			skip_empty_lines: true,
			trim: true,
		}) as Record<string, string>[];
	}

	return parseVocabRows(rawRows);
}

// ── Sample workbook generator ──────────────────────────────────────────────────
/** Returns an ArrayBuffer containing a sample .xlsx file for download */
export function buildSampleWorkbook(): ArrayBuffer {
	const header = [
		'word',
		'definition',
		'ndk_explanation',
		'partOfSpeech',
		'example',
		'hints_hard',
		'hints_medium',
		'hints_easy',
	];

	const rows = [
		[
			'resilient',
			'(adj) có khả năng phục hồi, bền bỉ',
			'Đặc tính giúp con người hoặc vật liệu trở lại trạng thái ban đầu sau biến cố khó khăn',
			'adjective',
			'She is resilient enough to overcome any obstacle.',
			'vật liệu đàn hồi trở về hình dạng ban đầu',
			'khả năng vượt qua nghịch cảnh và phục hồi',
			'có thể phục hồi nhanh sau thất bại, căng thẳng hoặc khủng hoảng',
		],
		[
			'ambiguous',
			'(adj) mơ hồ, có nhiều nghĩa',
			'Câu hoặc tình huống không rõ ràng, có thể hiểu theo nhiều cách khác nhau',
			'adjective',
			'The instructions were ambiguous and confused everyone.',
			'tối nghĩa, không rõ ràng',
			'không chắc chắn về ý nghĩa hoặc mục đích',
			'có thể được giải thích theo nhiều hơn một cách',
		],
		[
			'meticulous',
			'(adj) tỉ mỉ, cẩn thận đến từng chi tiết',
			'Thái độ làm việc chú ý đến từng chi tiết nhỏ, không bỏ sót bất cứ điều gì',
			'adjective',
			'She was meticulous in her research.',
			'cực kỳ chú ý, cẩn thận',
			'luôn kiểm tra kỹ lưỡng từng bước',
			'rất chú ý và cẩn thận trong từng chi tiết nhỏ nhất',
		],
	];

	const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);

	// Style the header row bold (basic column widths for readability)
	ws['!cols'] = header.map((_, i) => ({ wch: i < 3 ? 32 : 20 }));

	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, 'Từ vựng');
	const bytes = new Uint8Array(XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as number[]);
	return bytes.buffer.slice(0) as ArrayBuffer;
}
