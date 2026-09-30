import { parse } from 'csv-parse/sync';
import type { Prisma } from '@prisma/client';

import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';

import { normalizeSlug } from '../domain/normalize';
import { sanitizeMyClassHtml } from '../domain/sanitize';
import { optionKeySchema, mcqOptionsSchema, questionTypeSchema } from '../schemas';
import type {
	AnswerSpec,
	MyClassQuestionType,
	QuestionOption,
	TestQuestionCsvPreview,
} from '../types';
import * as repo from '../repositories/assessmentRepository';
import { TEST_QUESTION_CSV_TEMPLATE } from './testQuestionCsvTemplate';

export { TEST_QUESTION_CSV_TEMPLATE };
export { TEST_QUESTION_CSV_COLUMNS } from './testQuestionCsvTemplate';

const OPTION_KEYS = ['a', 'b', 'c', 'd', 'e', 'f'] as const;

export type ParsedTestQuestionRow = {
	row: number;
	type: MyClassQuestionType;
	stem: string;
	options: QuestionOption[];
	answer: AnswerSpec;
	explanation: string;
	difficulty: number;
	slug: string;
	tags: string[];
	errors: string[];
};

function foldHeader(value: string): string {
	return value
		.replace(/đ/g, 'd')
		.replace(/Đ/g, 'd')
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.replace(/[_-]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function canonicalHeader(raw: string): string {
	const folded = foldHeader(raw);
	const compact = folded.replace(/\s+/g, '');
	if (['stem', 'cauhoi', 'cau hoi', 'question'].includes(folded) || compact === 'cauhoi')
		return 'stem';
	for (const key of OPTION_KEYS) {
		if (folded === key || folded === `option ${key}` || compact === `option${key}`)
			return `option_${key}`;
		if (folded === `feedback ${key}` || compact === `feedback${key}`) return `feedback_${key}`;
	}
	if (
		[
			'correct option',
			'correctoption',
			'correct',
			'answer',
			'dap an',
			'dapan',
			'correct options',
		].includes(folded)
	) {
		return 'correct_option';
	}
	if (['explanation', 'giai thich', 'giaithich'].includes(folded) || compact === 'giaithich')
		return 'explanation';
	if (['difficulty', 'do kho', 'dokho', 'bloom'].includes(folded) || compact === 'dokho')
		return 'difficulty';
	if (folded === 'type' || folded === 'loai') return 'type';
	if (folded === 'tags' || folded === 'nhan') return 'tags';
	if (folded.startsWith('blank ') || compact.startsWith('blank'))
		return folded.replace(/\s+/g, '_');
	return folded.replace(/\s+/g, '_');
}

function detectDelimiter(csv: string): ',' | ';' | '\t' {
	const firstLine = csv.split(/\r?\n/).find((line) => line.trim()) ?? '';
	let inQuotes = false;
	const counts = { ',': 0, ';': 0, '\t': 0 };
	for (const char of firstLine) {
		if (char === '"') {
			inQuotes = !inQuotes;
			continue;
		}
		if (!inQuotes && (char === ',' || char === ';' || char === '\t')) counts[char] += 1;
	}
	if (counts['\t'] === 0 && counts[';'] === 0 && counts[','] === 0) return ',';
	if (counts['\t'] >= counts[';'] && counts['\t'] >= counts[',']) return '\t';
	if (counts[';'] > counts[',']) return ';';
	return ',';
}

function cell(row: Record<string, string>, key: string): string {
	return String(row[key] ?? '').trim();
}

function optionsFromRow(row: Record<string, string>): QuestionOption[] {
	const options: QuestionOption[] = [];
	for (const key of OPTION_KEYS) {
		const text = cell(row, `option_${key}`);
		if (!text) continue;
		const feedback = cell(row, `feedback_${key}`);
		options.push({
			key: key.toUpperCase() as QuestionOption['key'],
			text,
			...(feedback ? { feedback } : {}),
		});
	}
	return options;
}

export function uniqueQuestionSlug(stem: string, used: Set<string>): string {
	const base = normalizeSlug(stem.slice(0, 80), 'question').slice(0, 60) || 'question';
	let slug = base;
	let n = 2;
	while (used.has(slug)) {
		const suffix = `-${n}`;
		slug = `${base.slice(0, Math.max(1, 60 - suffix.length))}${suffix}`;
		n += 1;
	}
	used.add(slug);
	return slug;
}

export function allocateQuestionSlugs(stems: string[], reserved: Iterable<string> = []): string[] {
	const used = new Set(reserved);
	return stems.map((stem) => uniqueQuestionSlug(stem, used));
}

function parseType(raw: string): MyClassQuestionType {
	const value = raw
		.trim()
		.toUpperCase()
		.replace(/[\s-]+/g, '_');
	if (value === 'MCQ' || value === 'SINGLE' || !value) return 'MCQ_SINGLE';
	if (value === 'MULTI' || value === 'MULTIPLE') return 'MCQ_MULTI';
	if (value === 'FILL' || value === 'BLANK' || value === 'FILL_IN_THE_BLANK') return 'FILL_BLANK';
	const parsed = questionTypeSchema.safeParse(value);
	return parsed.success ? parsed.data : 'MCQ_SINGLE';
}

export function parseTestQuestionCsv(
	csv: string,
	reservedSlugs: Iterable<string> = [],
): ParsedTestQuestionRow[] {
	const delimiter = detectDelimiter(csv);
	const records = parse(csv, {
		columns: true,
		skip_empty_lines: true,
		trim: true,
		relax_column_count: true,
		delimiter,
		bom: true,
	}) as Record<string, string>[];

	const normalized = records.map((record) => {
		const mapped: Record<string, string> = {};
		for (const [key, value] of Object.entries(record)) {
			mapped[canonicalHeader(key)] = String(value ?? '');
		}
		return mapped;
	});

	const stems = normalized.map((record) => cell(record, 'stem'));
	const slugs = allocateQuestionSlugs(stems, reservedSlugs);

	return normalized.map((record, index) => {
		const errors: string[] = [];
		const stem = cell(record, 'stem');
		if (!stem) errors.push('Thiếu stem');
		const type = parseType(cell(record, 'type'));
		const options = optionsFromRow(record);
		const difficultyRaw = cell(record, 'difficulty');
		const difficulty = difficultyRaw ? Number(difficultyRaw) : 2;
		if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 6) {
			errors.push('difficulty/bloom phải từ 1–6');
		}
		const tags = cell(record, 'tags')
			.split(/[|,]/)
			.map((item) => item.trim())
			.filter(Boolean);
		let answer: AnswerSpec = { type: 'MCQ_SINGLE', correctKey: 'A' };
		if (type === 'FILL_BLANK') {
			const blanks = [];
			for (let n = 1; n <= 12; n += 1) {
				const acceptedRaw = cell(record, `blank_${n}_answers`) || cell(record, `blank_${n}`);
				if (!acceptedRaw) continue;
				const length = Number(
					cell(record, `blank_${n}_length`) || acceptedRaw.split('|')[0]?.length || 4,
				);
				blanks.push({
					id: String(n),
					length: Number.isInteger(length) && length > 0 ? length : 4,
					accepted: acceptedRaw
						.split('|')
						.map((item) => item.trim())
						.filter(Boolean),
					caseSensitive: false,
					ignoreDiacritics: true,
				});
			}
			if (!blanks.length) errors.push('Fill-blank cần blank_1_answers');
			answer = { type: 'FILL_BLANK', scoring: 'ALL_OR_NOTHING', blanks };
		} else {
			const optionsParsed = mcqOptionsSchema.safeParse(options);
			if (!optionsParsed.success) errors.push('Cần từ 2 đến 6 đáp án');
			const correctRaw = cell(record, 'correct_option').toUpperCase();
			const keys = correctRaw
				.split(/[|,]/)
				.map((item) => item.trim())
				.filter(Boolean);
			if (type === 'MCQ_MULTI') {
				if (keys.length < 2) errors.push('MCQ nhiều đáp án cần ít nhất 2 correct_option');
				answer = {
					type: 'MCQ_MULTI',
					correctKeys: keys as AnswerSpec extends { type: 'MCQ_MULTI' } ? never : never,
					scoring: 'ALL_OR_NOTHING',
				} as AnswerSpec;
				if (answer.type === 'MCQ_MULTI') {
					answer = {
						type: 'MCQ_MULTI',
						correctKeys: keys.filter((key) => optionKeySchema.safeParse(key).success) as Array<
							'A' | 'B' | 'C' | 'D' | 'E' | 'F'
						>,
						scoring: 'ALL_OR_NOTHING',
					};
				}
			} else {
				const correct = keys[0] ?? '';
				if (
					!optionKeySchema.safeParse(correct).success ||
					!options.some((option) => option.key === correct)
				) {
					errors.push('correct_option không hợp lệ');
				}
				answer = { type: 'MCQ_SINGLE', correctKey: (correct || 'A') as 'A' };
			}
		}
		return {
			row: index + 2,
			type,
			stem,
			options,
			answer,
			explanation: cell(record, 'explanation'),
			difficulty: Number.isInteger(difficulty) ? difficulty : 2,
			slug: slugs[index] ?? uniqueQuestionSlug(stem || 'question', new Set()),
			tags,
			errors,
		};
	});
}

function toPreview(rows: ParsedTestQuestionRow[]): TestQuestionCsvPreview {
	const mapped = rows.map((item) => ({
		row: item.row,
		stem: item.stem,
		type: item.type,
		optionCount: item.options.length,
		correctKey:
			item.answer.type === 'MCQ_SINGLE'
				? item.answer.correctKey
				: item.answer.type === 'MCQ_MULTI'
					? item.answer.correctKeys.join('|')
					: '',
		difficulty: item.difficulty,
		ok: item.errors.length === 0,
		errors: item.errors,
	}));
	return {
		rows: mapped,
		summary: {
			total: mapped.length,
			valid: mapped.filter((row) => row.ok).length,
			invalid: mapped.filter((row) => !row.ok).length,
		},
	};
}

async function allocateSlugsAgainstDb(
	rows: ParsedTestQuestionRow[],
): Promise<ParsedTestQuestionRow[]> {
	const reserved = new Set<string>();
	let slugs = rows.map((row) => row.slug);
	for (let attempt = 0; attempt < 6; attempt += 1) {
		const existing = await repo.findQuestionSlugs(slugs);
		if (!existing.length) break;
		for (const item of existing) reserved.add(item.slug);
		slugs = allocateQuestionSlugs(
			rows.map((row) => row.stem || 'question'),
			reserved,
		);
	}
	return rows.map((row, index) => ({ ...row, slug: slugs[index] ?? row.slug }));
}

export async function previewTestQuestionCsv(
	testId: string,
	csv: string,
): Promise<TestQuestionCsvPreview> {
	const test = await repo.findAdminTest(testId);
	if (!test) throw new AppError('Không tìm thấy Test', 404);
	const parsed = await allocateSlugsAgainstDb(parseTestQuestionCsv(csv));
	return toPreview(parsed);
}

export async function importTestQuestionCsv(
	testId: string,
	csv: string,
	strategy: 'append' | 'replace' = 'append',
) {
	const test = await repo.findAdminTest(testId);
	if (!test) throw new AppError('Không tìm thấy Test', 404);
	const parsed = await allocateSlugsAgainstDb(parseTestQuestionCsv(csv));
	if (!parsed.length) throw new AppError('CSV không có câu hỏi', 422);
	if (parsed.some((row) => row.errors.length > 0)) {
		throw new AppError('CSV còn lỗi, không thể commit', 422);
	}
	return prisma.$transaction(async (tx) => {
		if (strategy === 'replace') await repo.unlinkAllTestQuestions(testId, tx);
		for (const row of parsed) {
			await repo.appendTestQuestion(
				testId,
				{
					slug: row.slug,
					type: row.type,
					stem: row.stem,
					options: row.options as unknown as Prisma.InputJsonValue,
					answer: row.answer as unknown as Prisma.InputJsonValue,
					explanation: sanitizeMyClassHtml(row.explanation),
					difficulty: row.difficulty,
					tags: row.tags,
					knowledgeUnitIds: [],
				},
				tx,
			);
		}
		return { created: parsed.length, strategy };
	});
}
