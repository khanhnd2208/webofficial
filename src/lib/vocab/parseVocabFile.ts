/* ════════════════════════════════════════════════════════════════════════
   parseVocabFile.ts
   Parses a CSV or Excel (.xlsx/.xls) vocabulary upload file.

   Required columns  : term / word + at least one of meaning_vi / meaning_en / definition
   Optional columns  : pronunciation, part_of_speech, explanation / ndk_explanation,
                       example, hints_hard, hints_medium, hints_easy

   Hints are separated with "||" inside a single cell.
   ════════════════════════════════════════════════════════════════════════ */
import { parse } from 'csv-parse/sync';
import { readSheet } from 'read-excel-file/browser';
import writeXlsxFile from 'write-excel-file/browser';
import type { CreateWordInput } from '@/types/vocab';

import { isBlankVocabRow, normalizeVocabRow } from './normalizeVocabRow';
import { canonicalVocabHeader, detectDelimiter } from './vocabHeaders';

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

const MAX_SPREADSHEET_BYTES = 5 * 1024 * 1024;

/**
 * Maps a raw row object (from CSV or XLSX sheet_to_json) to a vocab word.
 * Returns the word plus a `_missing` list so the caller can decide what to do.
 */
export function mapRow(r: Record<string, string>): CreateWordInput & { _missing: string[] } {
	return normalizeVocabRow(r);
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

		if (isBlankVocabRow(word)) return;

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
	if (file.size > MAX_SPREADSHEET_BYTES) {
		throw new Error('File quá lớn (tối đa 5 MB).');
	}
	const isExcel = /\.xlsx$/i.test(file.name);
	if (!isExcel && /\.xls$/i.test(file.name)) {
		throw new Error(
			'Định dạng .xls cũ không được hỗ trợ. Vui lòng lưu lại thành .xlsx rồi thử lại.',
		);
	}

	let rawRows: Record<string, string>[];

	if (isExcel) {
		const bytes = new Uint8Array(await file.arrayBuffer());
		if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error('File .xlsx không hợp lệ.');
		const rows = await readSheet(file);
		const [header, ...dataRows] = rows;
		const headers = (header ?? []).map((cell) => canonicalVocabHeader(String(cell ?? '')));
		rawRows = dataRows
			.slice(0, 2000)
			.map(
				(row) =>
					Object.fromEntries(
						headers.map((key, index) => [key, String(row[index] ?? '')]),
					) as Record<string, string>,
			);
	} else {
		const text = await file.text();
		rawRows = parse(text, {
			columns: (header: string[]) => header.map(canonicalVocabHeader),
			skip_empty_lines: true,
			trim: true,
			relax_column_count: true,
			delimiter: detectDelimiter(text),
			bom: true,
		}) as Record<string, string>[];
	}

	return parseVocabRows(rawRows);
}

// ── Sample workbook generator ──────────────────────────────────────────────────
/** Returns an ArrayBuffer containing a sample .xlsx file for download */
export async function buildSampleWorkbook(): Promise<Blob> {
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

	return writeXlsxFile([header, ...rows], {
		sheet: 'Từ vựng',
		columns: header.map((_, i) => ({ width: i < 3 ? 32 : 20 })),
	}).toBlob();
}
