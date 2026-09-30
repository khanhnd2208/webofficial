import { parse } from 'csv-parse/sync';
import type { Prisma } from '@prisma/client';

import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';

import { normalizeSlug } from '../domain/normalize';
import { optionKeySchema, questionOptionsSchema } from '../schemas';
import type { QuestionCsvPreviewRow, QuestionOption } from '../types';
import { QUESTION_CSV_TEMPLATE } from './questionCsvTemplate';

export { QUESTION_CSV_TEMPLATE };

function cell(row: Record<string, string>, key: string): string {
	return String(row[key] ?? '').trim();
}

function optionsFromRow(row: Record<string, string>): QuestionOption[] {
	const keys = ['a', 'b', 'c', 'd', 'e', 'f'] as const;
	const options: QuestionOption[] = [];
	for (const key of keys) {
		const text = cell(row, `option_${key}`);
		if (!text) continue;
		options.push({ key: key.toUpperCase() as QuestionOption['key'], text });
	}
	return options;
}

export function parseQuestionCsv(
	csv: string,
): Array<{ row: number; record: Record<string, string> }> {
	const records = parse(csv, {
		columns: true,
		skip_empty_lines: true,
		trim: true,
		relax_column_count: true,
	}) as Record<string, string>[];
	return records.map((record, index) => ({ record, row: index + 2 }));
}

export async function previewQuestionCsv(csv: string): Promise<QuestionCsvPreviewRow[]> {
	const rows = parseQuestionCsv(csv);
	const seen = new Set<string>();
	const result: QuestionCsvPreviewRow[] = [];
	for (const { row, record } of rows) {
		const testSlug = cell(record, 'test_slug');
		const questionSlug = normalizeSlug(cell(record, 'question_slug'), '');
		const errors: string[] = [];
		if (!testSlug) errors.push('Thiếu test_slug');
		if (!questionSlug) errors.push('Thiếu question_slug');
		if (!cell(record, 'stem')) errors.push('Thiếu stem');
		const options = optionsFromRow(record);
		const optionsParsed = questionOptionsSchema.safeParse(options);
		if (!optionsParsed.success) errors.push('Options không hợp lệ');
		const correct = cell(record, 'correct_option').toUpperCase();
		if (
			!optionKeySchema.safeParse(correct).success ||
			!options.some((option) => option.key === correct)
		) {
			errors.push('correct_option không hợp lệ');
		}
		const difficulty = Number(cell(record, 'difficulty') || '2');
		if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 6)
			errors.push('difficulty phải từ 1–6');
		const kuSlugs = cell(record, 'ku_slugs')
			.split(/[|,]/)
			.map((item) => normalizeSlug(item.trim(), ''))
			.filter(Boolean);
		if (new Set(kuSlugs).size !== kuSlugs.length) errors.push('KU bị trùng trong row');
		if (kuSlugs.length === 0) errors.push('Cần ít nhất một KU');
		if (questionSlug && seen.has(questionSlug)) errors.push('slug trùng trong file');
		if (questionSlug) seen.add(questionSlug);
		if (testSlug) {
			const test = await prisma.myClassTest.findUnique({
				where: { slug: testSlug },
				include: { placements: { select: { courseId: true } } },
			});
			if (!test) errors.push('Test không tồn tại');
			if (test) {
				const courseIds = test.placements.map((row) => row.courseId);
				for (const slug of kuSlugs) {
					const unit = await prisma.knowledgeUnit.findUnique({
						where: { slug },
						select: { id: true },
					});
					if (unit && courseIds.length) {
						const mapped = await prisma.myClassSectionKnowledgeUnit.findFirst({
							where: {
								knowledgeUnitId: unit.id,
								section: { lesson: { courseId: { in: courseIds } } },
							},
							select: { id: true },
						});
						if (!mapped) errors.push(`KU ngoài Course của Test: ${slug}`);
					}
				}
			}
		}
		if (questionSlug) {
			const existing = await prisma.myClassQuestion.findUnique({ where: { slug: questionSlug } });
			if (existing) errors.push('Question slug đã tồn tại');
		}
		for (const slug of kuSlugs) {
			const unit = await prisma.knowledgeUnit.findUnique({ where: { slug } });
			if (!unit) errors.push(`KU không tồn tại: ${slug}`);
		}
		result.push({ row, testSlug, questionSlug, ok: errors.length === 0, errors });
	}
	return result;
}

export async function importQuestionCsv(csv: string) {
	const preview = await previewQuestionCsv(csv);
	if (preview.some((row) => !row.ok)) {
		throw new AppError('CSV còn lỗi, không thể commit', 422);
	}
	const rows = parseQuestionCsv(csv);
	return prisma.$transaction(async (tx) => {
		const created: string[] = [];
		for (const { record } of rows) {
			const questionSlug = normalizeSlug(cell(record, 'question_slug'));
			const options = optionsFromRow(record);
			const kuSlugs = cell(record, 'ku_slugs')
				.split(/[|,]/)
				.map((item) => normalizeSlug(item.trim(), ''))
				.filter(Boolean);
			const units = await tx.knowledgeUnit.findMany({ where: { slug: { in: kuSlugs } } });
			if (units.length !== kuSlugs.length) throw new AppError('KU không tồn tại', 422);
			const question = await tx.myClassQuestion.create({
				data: {
					slug: questionSlug,
					type: 'MCQ_SINGLE',
					stem: cell(record, 'stem'),
					options: options as unknown as Prisma.InputJsonValue,
					answer: {
						type: 'MCQ_SINGLE',
						correctKey: cell(record, 'correct_option').toUpperCase(),
					} as unknown as Prisma.InputJsonValue,
					explanation: cell(record, 'explanation'),
					difficulty: Number(cell(record, 'difficulty') || '2'),
					knowledgeUnits: { create: units.map((unit) => ({ knowledgeUnitId: unit.id })) },
				},
			});
			const test = await tx.myClassTest.findUnique({ where: { slug: cell(record, 'test_slug') } });
			if (!test) throw new AppError('Test không tồn tại', 422);
			const max = await tx.myClassTestQuestion.aggregate({
				where: { testId: test.id },
				_max: { position: true },
			});
			await tx.myClassTestQuestion.create({
				data: { testId: test.id, questionId: question.id, position: (max._max.position ?? -1) + 1 },
			});
			created.push(question.id);
		}
		return { created: created.length };
	});
}
