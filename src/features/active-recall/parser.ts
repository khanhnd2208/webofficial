import { parse } from 'csv-parse/sync';

import {
	recallHasContent,
	recallHtmlToMarkdown,
	recallImportToStoredHtml,
	recallVisibleLength,
} from './richText';
import {
	ACTIVE_RECALL_MAX_ANSWER_LENGTH,
	ACTIVE_RECALL_MAX_QUESTION_LENGTH,
} from './schemas';
import type { RecallImportPreview, RecallImportRow } from './types';

type ParsedImport = Omit<RecallImportPreview, 'summary'> & { orphanAnswers: number };

const QUESTION = /^(?:q|question|câu\s*hỏi)\s*:\s*(.*)$/i;
const ANSWER = /^(?:a|answer|đáp\s*án)\s*:\s*(.*)$/i;
const SEPARATOR = /^---+\s*$/;
const INLINE_ANSWER = /\s+(?:a|answer|đáp\s*án)\s*:\s*/i;

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

function firstLineHeaders(text: string) {
	const first = text.replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0] ?? '';
	const delimiter = detectDelimiter(text);
	return first.split(delimiter).map(headerKey);
}

function hasDelimitedHeaders(text: string) {
	const headers = firstLineHeaders(text);
	return headers.includes('question') && headers.includes('answer');
}

function rowErrors(question: string, answer: string) {
	const errors: string[] = [];
	if (!recallHasContent(question)) errors.push('Thiếu câu hỏi');
	if (!recallHasContent(answer)) errors.push('Thiếu đáp án');
	if (recallVisibleLength(question) > ACTIVE_RECALL_MAX_QUESTION_LENGTH) {
		errors.push(`Câu hỏi vượt quá ${ACTIVE_RECALL_MAX_QUESTION_LENGTH} ký tự`);
	}
	if (recallVisibleLength(answer) > ACTIVE_RECALL_MAX_ANSWER_LENGTH) {
		errors.push(`Đáp án vượt quá ${ACTIVE_RECALL_MAX_ANSWER_LENGTH} ký tự`);
	}
	return errors;
}

function preview(rows: RecallImportRow[], format: RecallImportPreview['format'], orphanAnswers = 0): RecallImportPreview {
	for (const row of rows) {
		row.question = recallImportToStoredHtml(row.question);
		row.answer = recallImportToStoredHtml(row.answer);
		row.errors.push(...rowErrors(row.question, row.answer));
	}
	const seenIds = new Map<string, number>();
	for (const row of rows) {
		if (!row.id) continue;
		const previous = seenIds.get(row.id);
		if (previous) {
			row.errors.push('ID thẻ bị trùng trong file import');
		} else {
			seenIds.set(row.id, row.row);
		}
	}
	const valid = rows.filter((row) => row.errors.length === 0).length;
	const duplicates = rows.filter((row) => row.action === 'skip').length;
	return {
		rows,
		format,
		summary: {
			total: rows.length,
			valid,
			invalid: rows.length - valid,
			duplicates,
			orphanAnswers,
		},
	};
}

function unescapePasteLine(line: string) {
	return line.startsWith('\\') && (QUESTION.test(line.slice(1)) || ANSWER.test(line.slice(1)) || SEPARATOR.test(line.slice(1)))
		? line.slice(1)
		: line;
}

function splitInlineAnswer(value: string) {
	const match = INLINE_ANSWER.exec(value);
	if (!match || match.index === undefined) return null;
	return {
		question: value.slice(0, match.index).trimEnd(),
		answer: value.slice(match.index + match[0].length),
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
		rows.push({ row: current.row, question, answer, errors: [] });
		current = null;
	};

	text.replace(/\r\n/g, '\n').split('\n').forEach((rawLine, index) => {
		const line = unescapePasteLine(rawLine);
		const question = line.match(QUESTION);
		const answer = line.match(ANSWER);
		if (SEPARATOR.test(line) && line === rawLine) {
			finish();
			return;
		}
		if (question && line === rawLine) {
			finish();
			const inlineAnswer = splitInlineAnswer(unescapePasteLine(question[1] ?? ''));
			current = {
				row: index + 1,
				question: [inlineAnswer?.question ?? unescapePasteLine(question[1] ?? '')],
				answer: inlineAnswer ? [inlineAnswer.answer] : [],
				field: inlineAnswer ? 'answer' : 'question',
			};
			return;
		}
		if (answer && line === rawLine) {
			if (!current) {
				orphanAnswers += 1;
				return;
			}
			current.answer.push(unescapePasteLine(answer[1] ?? ''));
			current.field = 'answer';
			return;
		}
		if (!current || !current.field) return;
		current[current.field].push(unescapePasteLine(rawLine));
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
		rows.push({
			row: index + (hasHeader ? 2 : 1),
			id: cells[idIndex]?.trim() || undefined,
			question,
			answer,
			order,
			errors: [],
		});
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
		const rawOrder = record.order?.trim();
		if (rawOrder && !/^\d+$/.test(rawOrder)) errors.push('Thứ tự phải là số nguyên không âm');
		return {
			row: index + 2,
			id: record.id?.trim() || undefined,
			question,
			answer,
			order: rawOrder ? Number(rawOrder) : undefined,
			errors,
		};
	});
	return { rows, format: 'csv', orphanAnswers: 0 };
}

export function previewRecallImport(text: string): RecallImportPreview {
	const likelyTsv = text.split(/\r?\n/).filter(Boolean).every((line) => line.includes('\t'));
	const parsed = hasDelimitedHeaders(text)
		? detectDelimiter(text) === '\t' || likelyTsv
			? parseTsv(text)
			: parseCsv(text)
		: text.split(/\r?\n/).some((line) => QUESTION.test(line) || ANSWER.test(line))
			? parsePaste(text)
			: likelyTsv
				? parseTsv(text)
				: parseCsv(text);
	return preview(parsed.rows, parsed.format, parsed.orphanAnswers);
}

export function toRecallCsv(rows: Array<{ id: string; question: string; answer: string; position: number }>) {
	const quote = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
	return `\uFEFFid,question,answer,order\r\n${rows
		.map((row) =>
			[row.id, recallHtmlToMarkdown(row.question), recallHtmlToMarkdown(row.answer), row.position]
				.map(quote)
				.join(','),
		)
		.join('\r\n')}\r\n`;
}

function escapePasteBody(value: string) {
	return value
		.split('\n')
		.map((line) =>
			QUESTION.test(line) || ANSWER.test(line) || SEPARATOR.test(line) ? `\\${line}` : line,
		)
		.join('\n');
}

export function toRecallPaste(rows: Array<{ question: string; answer: string }>) {
	return rows
		.map((row) => {
			const question = escapePasteBody(recallHtmlToMarkdown(row.question));
			const answer = escapePasteBody(recallHtmlToMarkdown(row.answer));
			return `Q: ${question}\nA: ${answer}`;
		})
		.join('\n---\n');
}
