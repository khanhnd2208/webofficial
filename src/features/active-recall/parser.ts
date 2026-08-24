import { parse } from 'csv-parse/sync';

import {
	ACTIVE_RECALL_MAX_ANSWER_LENGTH,
	ACTIVE_RECALL_MAX_QUESTION_LENGTH,
} from './schemas';
import type { RecallImportPreview, RecallImportRow } from './types';

type ParsedImport = Omit<RecallImportPreview, 'summary'> & { orphanAnswers: number };

const QUESTION = /^(?:q|question|câu\s*hỏi)\s*:\s*(.*)$/i;
const ANSWER = /^(?:a|answer|đáp\s*án)\s*:\s*(.*)$/i;
const SEPARATOR = /^---+\s*$/;

function clean(value: string) {
	return value.replace(/\r\n/g, '\n').split('\n').map((line) => line.replace(/[ \t]+$/g, '')).join('\n').trim();
}

function normalizedHeader(value: string) {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim()
		.toLowerCase()
		.replace(/[ _-]+/g, ' ');
}

function headerKey(value: string) {
	const header = normalizedHeader(value);
	if (['id', 'card id', 'ma'].includes(header)) return 'id';
	if (['question', 'q', 'cau hoi', 'front'].includes(header)) return 'question';
	if (['answer', 'a', 'dap an', 'back'].includes(header)) return 'answer';
	if (['order', 'position', 'thu tu'].includes(header)) return 'order';
	return header;
}

function detectDelimiter(text: string) {
	const first = text.replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0] ?? '';
	const candidates: Array<',' | ';' | '\t'> = [',', ';', '\t'];
	return candidates.reduce((best, value) => (first.split(value).length > first.split(best).length ? value : best), ',');
}

function preview(rows: RecallImportRow[], format: RecallImportPreview['format'], orphanAnswers = 0): RecallImportPreview {
	for (const row of rows) {
		if (row.question.length > ACTIVE_RECALL_MAX_QUESTION_LENGTH) {
			row.errors.push(`Câu hỏi vượt quá ${ACTIVE_RECALL_MAX_QUESTION_LENGTH} ký tự`);
		}
		if (row.answer.length > ACTIVE_RECALL_MAX_ANSWER_LENGTH) {
			row.errors.push(`Đáp án vượt quá ${ACTIVE_RECALL_MAX_ANSWER_LENGTH} ký tự`);
		}
	}
	const valid = rows.filter((row) => row.errors.length === 0).length;
	const duplicates = rows.filter((row) => row.action === 'skip').length;
	return {
		rows,
		format,
		summary: { total: rows.length, valid, invalid: rows.length - valid, duplicates, orphanAnswers },
	};
}

function parsePaste(text: string): ParsedImport {
	const rows: RecallImportRow[] = [];
	let orphanAnswers = 0;
	let current: { row: number; question: string[]; answer: string[]; field: 'question' | 'answer' | null } | null = null;
	const finish = () => {
		if (!current) return;
		const question = clean(current.question.join('\n'));
		const answer = clean(current.answer.join('\n'));
		const errors: string[] = [];
		if (!question) errors.push('Thiếu câu hỏi');
		if (!answer) errors.push('Thiếu đáp án');
		rows.push({ row: current.row, question, answer, errors });
		current = null;
	};

	text.replace(/\r\n/g, '\n').split('\n').forEach((line, index) => {
		const question = line.match(QUESTION);
		const answer = line.match(ANSWER);
		if (SEPARATOR.test(line)) {
			finish();
			return;
		}
		if (question) {
			finish();
			current = { row: index + 1, question: [question[1] ?? ''], answer: [], field: 'question' };
			return;
		}
		if (answer) {
			if (!current) {
				orphanAnswers += 1;
				return;
			}
			current.answer.push(answer[1] ?? '');
			current.field = 'answer';
			return;
		}
		if (!current || !current.field) return;
		current[current.field].push(line);
	});
	finish();
	return { rows, format: 'paste', orphanAnswers };
}

function parseTsv(text: string): ParsedImport {
	const rows: RecallImportRow[] = [];
	const lines = text.replace(/\r\n/g, '\n').split('\n').filter((line) => line.trim());
	const header = lines[0]?.split('\t').map(headerKey) ?? [];
	const hasHeader = header.includes('question') && header.includes('answer');
	const questionIndex = hasHeader ? header.indexOf('question') : 0;
	const answerIndex = hasHeader ? header.indexOf('answer') : 1;
	const idIndex = hasHeader ? header.indexOf('id') : -1;
	const orderIndex = hasHeader ? header.indexOf('order') : -1;
	lines.slice(hasHeader ? 1 : 0).forEach((line, index) => {
		const cells = line.split('\t');
		const question = clean(cells[questionIndex] ?? '');
		const answer = clean(cells[answerIndex] ?? '');
		const order = orderIndex >= 0 && /^\d+$/.test(cells[orderIndex] ?? '') ? Number(cells[orderIndex]) : undefined;
		const errors: string[] = [];
		if (!question) errors.push('Thiếu câu hỏi');
		if (!answer) errors.push('Thiếu đáp án');
		rows.push({ row: index + (hasHeader ? 2 : 1), id: cells[idIndex]?.trim() || undefined, question, answer, order, errors });
	});
	return { rows, format: 'tsv', orphanAnswers: 0 };
}

function parseCsv(text: string): ParsedImport {
	let records: Record<string, string>[];
	try {
		records = parse(text.replace(/^\uFEFF/, ''), {
			columns: (headers: string[]) => headers.map(headerKey),
			skip_empty_lines: true,
			bom: true,
			trim: true,
			delimiter: detectDelimiter(text),
		}) as Record<string, string>[];
	} catch {
		return { rows: [{ row: 1, question: '', answer: '', errors: ['Không đọc được CSV'] }], format: 'csv', orphanAnswers: 0 };
	}
	const rows = records.map((record, index) => {
		const question = clean(record.question ?? '');
		const answer = clean(record.answer ?? '');
		const errors: string[] = [];
		if (!question) errors.push('Thiếu câu hỏi');
		if (!answer) errors.push('Thiếu đáp án');
		const rawOrder = record.order?.trim();
		if (rawOrder && !/^\d+$/.test(rawOrder)) errors.push('Thứ tự phải là số nguyên không âm');
		return { row: index + 2, id: record.id?.trim() || undefined, question, answer, order: rawOrder ? Number(rawOrder) : undefined, errors };
	});
	return { rows, format: 'csv', orphanAnswers: 0 };
}

export function previewRecallImport(text: string): RecallImportPreview {
	const hasMarkers = text.split(/\r?\n/).some((line) => QUESTION.test(line) || ANSWER.test(line));
	const likelyTsv = !hasMarkers && text.split(/\r?\n/).filter(Boolean).every((line) => line.includes('\t'));
	const parsed = hasMarkers ? parsePaste(text) : likelyTsv ? parseTsv(text) : parseCsv(text);
	return preview(parsed.rows, parsed.format, parsed.orphanAnswers);
}

export function toRecallCsv(rows: Array<{ id: string; question: string; answer: string; position: number }>) {
	const quote = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
	return `\uFEFFid,question,answer,order\r\n${rows.map((row) => [row.id, row.question, row.answer, row.position].map(quote).join(',')).join('\r\n')}\r\n`;
}

export function toRecallPaste(rows: Array<{ question: string; answer: string }>) {
	return rows.map((row) => `Q: ${row.question}\nA: ${row.answer}`).join('\n---\n');
}
