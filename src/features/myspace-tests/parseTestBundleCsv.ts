/**
 * Parse a My Space Test *bundle* CSV: one file = one test + its questions.
 *
 * With requireMeta=true (file import):
 *   Required: test_title, subject, topic, stem, option_a–d, correct_option
 * With requireMeta=false (smart import questions-only):
 *   Required: topic, stem, option_a–d, correct_option
 *   Meta columns may be blank / omitted.
 */
import { parse } from 'csv-parse/sync';

import { mapMcqRow, type CsvRowError } from './parseMcqCsv';
import type { McqQuestionInput } from './types';

export type BundlePublishStatus = 'DRAFT' | 'PUBLISHED';

export interface TestBundleMeta {
	title: string;
	slug: string | null;
	description: string;
	subject: string;
	/** Explicit sample size; null = use question count */
	questionCount: number | null;
	status: BundlePublishStatus;
}

export interface ParseTestBundleResult {
	meta: TestBundleMeta | null;
	questions: McqQuestionInput[];
	errors: CsvRowError[];
	/** True when meta itself is inconsistent (mixed title/subject, bad status, etc.) */
	metaErrors: string[];
}

export interface ParseTestBundleOptions {
	/** When true, require consistent test_title + subject across rows. Default true. */
	requireMeta?: boolean;
}

function cell(row: Record<string, string>, ...keys: string[]): string {
	for (const key of keys) {
		const value = row[key];
		if (value !== undefined && value !== null) return String(value).trim();
	}
	return '';
}

function isBlankRow(r: Record<string, string>): boolean {
	const keys = [
		'test_title',
		'title',
		'subject',
		'topic',
		'stem',
		'question',
		'option_a',
		'optionA',
		'a',
		'option_b',
		'optionB',
		'b',
		'option_c',
		'optionC',
		'c',
		'option_d',
		'optionD',
		'd',
		'correct_option',
		'correctOption',
		'answer',
	];
	return keys.every((k) => !cell(r, k));
}

export function parseTestBundleRows(
	rawRows: Record<string, string>[],
	options: ParseTestBundleOptions = {},
): ParseTestBundleResult {
	const requireMeta = options.requireMeta !== false;
	const questions: McqQuestionInput[] = [];
	const errors: CsvRowError[] = [];
	const metaErrors: string[] = [];

	let title: string | null = null;
	let subject: string | null = null;
	let slug: string | null = null;
	let description = '';
	let questionCount: number | null = null;
	let status: BundlePublishStatus = 'PUBLISHED';
	let statusSeen = false;

	rawRows.forEach((r, idx) => {
		const rowNum = idx + 2;
		if (isBlankRow(r)) return;

		const rowTitle = cell(r, 'test_title', 'title');
		const rowSubject = cell(r, 'subject');
		const rowSlug = cell(r, 'test_slug', 'slug');
		const rowDesc = cell(r, 'test_description', 'description');
		const rowQc = cell(r, 'question_count', 'questionCount');
		const rowStatus = cell(r, 'status').toUpperCase();

		if (requireMeta) {
			if (!rowTitle) {
				errors.push({
					row: rowNum,
					missing: ['test_title'],
					message: 'Thiếu test_title',
				});
			} else if (title === null) {
				title = rowTitle;
			} else if (rowTitle !== title) {
				errors.push({
					row: rowNum,
					missing: ['test_title'],
					message: `test_title không khớp ("${rowTitle}" ≠ "${title}")`,
				});
			}

			if (!rowSubject) {
				errors.push({
					row: rowNum,
					missing: ['subject'],
					message: 'Thiếu subject',
				});
			} else if (subject === null) {
				subject = rowSubject;
			} else if (rowSubject !== subject) {
				errors.push({
					row: rowNum,
					missing: ['subject'],
					message: `subject không khớp ("${rowSubject}" ≠ "${subject}")`,
				});
			}
		} else {
			if (rowTitle) {
				if (title === null) title = rowTitle;
				else if (rowTitle !== title) {
					errors.push({
						row: rowNum,
						missing: ['test_title'],
						message: `test_title không khớp ("${rowTitle}" ≠ "${title}")`,
					});
				}
			}
			if (rowSubject) {
				if (subject === null) subject = rowSubject;
				else if (rowSubject !== subject) {
					errors.push({
						row: rowNum,
						missing: ['subject'],
						message: `subject không khớp ("${rowSubject}" ≠ "${subject}")`,
					});
				}
			}
		}

		if (rowSlug) {
			if (slug === null) slug = rowSlug;
			else if (rowSlug !== slug) {
				errors.push({
					row: rowNum,
					missing: ['test_slug'],
					message: `test_slug không khớp ("${rowSlug}" ≠ "${slug}")`,
				});
			}
		}

		if (rowDesc) {
			if (!description) description = rowDesc;
			else if (rowDesc !== description) {
				errors.push({
					row: rowNum,
					missing: ['test_description'],
					message: 'test_description không khớp giữa các dòng',
				});
			}
		}

		if (rowQc) {
			const n = Number.parseInt(rowQc, 10);
			if (!Number.isFinite(n) || n < 1 || n > 200) {
				errors.push({
					row: rowNum,
					missing: ['question_count'],
					message: `question_count không hợp lệ ("${rowQc}")`,
				});
			} else if (questionCount === null) {
				questionCount = n;
			} else if (questionCount !== n) {
				errors.push({
					row: rowNum,
					missing: ['question_count'],
					message: `question_count không khớp (${n} ≠ ${questionCount})`,
				});
			}
		}

		if (rowStatus) {
			if (rowStatus !== 'DRAFT' && rowStatus !== 'PUBLISHED') {
				errors.push({
					row: rowNum,
					missing: ['status'],
					message: `status phải là DRAFT|PUBLISHED (nhận được "${rowStatus}")`,
				});
			} else if (!statusSeen) {
				status = rowStatus;
				statusSeen = true;
			} else if (rowStatus !== status) {
				errors.push({
					row: rowNum,
					missing: ['status'],
					message: `status không khớp ("${rowStatus}" ≠ "${status}")`,
				});
			}
		}

		const mapped = mapMcqRow(r);
		const { _missing, _message, _subjectName: _name, ...question } = mapped;

		if (_missing.length > 0) {
			errors.push({
				row: rowNum,
				missing: _missing,
				message: _message,
			});
			return;
		}

		questions.push(question);
	});

	if (requireMeta) {
		if (title === null || subject === null) {
			if (title === null) metaErrors.push('Thiếu test_title');
			if (subject === null) metaErrors.push('Thiếu subject');
			return { meta: null, questions: [], errors, metaErrors };
		}
	}

	if (questions.length === 0) {
		metaErrors.push('Không có câu hỏi hợp lệ nào trong file');
	}

	if (questionCount !== null && questions.length > 0 && questionCount > questions.length) {
		metaErrors.push(
			`question_count (${questionCount}) lớn hơn số câu hợp lệ (${questions.length})`,
		);
	}

	const meta: TestBundleMeta | null =
		title || subject
			? {
					title: title ?? '',
					slug,
					description,
					subject: subject ?? '',
					questionCount,
					status,
				}
			: null;

	return {
		meta,
		questions,
		errors,
		metaErrors,
	};
}

export function parseTestBundleCsvText(
	text: string,
	options?: ParseTestBundleOptions,
): ParseTestBundleResult {
	const rawRows = parse(text, {
		columns: true,
		skip_empty_lines: true,
		trim: true,
		relax_column_count: true,
	}) as Record<string, string>[];
	return parseTestBundleRows(rawRows, options);
}

export async function parseTestBundleCsvFile(
	file: File,
	options?: ParseTestBundleOptions,
): Promise<ParseTestBundleResult> {
	const text = await file.text();
	return parseTestBundleCsvText(text, options);
}

export const SAMPLE_TEST_BUNDLE_CSV = `test_title,test_slug,test_description,subject,question_count,status,topic,stem,option_a,option_b,option_c,option_d,correct_option,difficulty,aacsb,learning_objective,classification
Principles of Management — Sample Quiz,principles-of-management-sample,"Bài mẫu từ Chapters 1–3. Mỗi lần làm, hệ thống chọn ngẫu nhiên và phân bổ đều theo topic / độ khó.",Principles of Management,8,PUBLISHED,Chapter 1 Managers and You in the Workplace,"In today's workplace, ________.",women are more likely than men to be promoted into management,many employees perform work that in the past was considered managerial activities,women tend to be more effective supervisors than men,most organizations have eliminated the title of manager,B,2,Reflective thinking,"LO 1.1: Describe who managers are and where they work.",Concept
Principles of Management — Sample Quiz,principles-of-management-sample,"Bài mẫu từ Chapters 1–3. Mỗi lần làm, hệ thống chọn ngẫu nhiên và phân bổ đều theo topic / độ khó.",Principles of Management,8,PUBLISHED,Chapter 1 Managers and You in the Workplace,A manager is someone who ________.,works independently without coordinating others,"coordinates and oversees the work of other people so organizational goals can be accomplished",only works in for-profit organizations,avoids planning and controlling activities,B,1,Reflective thinking,"LO 1.1: Describe who managers are and where they work.",Concept
Principles of Management — Sample Quiz,principles-of-management-sample,"Bài mẫu từ Chapters 1–3. Mỗi lần làm, hệ thống chọn ngẫu nhiên và phân bổ đều theo topic / độ khó.",Principles of Management,8,PUBLISHED,Chapter 1 Managers and You in the Workplace,First-line managers are responsible for ________.,making organization-wide decisions,managing the work of nonmanagerial employees,translating goals set by top managers into plans,setting the overall direction of the company,B,1,Reflective thinking,"LO 1.1: Describe who managers are and where they work.",Concept
Principles of Management — Sample Quiz,principles-of-management-sample,"Bài mẫu từ Chapters 1–3. Mỗi lần làm, hệ thống chọn ngẫu nhiên và phân bổ đều theo topic / độ khó.",Principles of Management,8,PUBLISHED,Chapter 1 Managers and You in the Workplace,Efficiency is concerned with ________.,doing the right things,goal attainment,reducing resource costs,employee satisfaction only,C,2,Reflective thinking,"LO 1.2: Explain why managers are important to organizations.",Concept
Principles of Management — Sample Quiz,principles-of-management-sample,"Bài mẫu từ Chapters 1–3. Mỗi lần làm, hệ thống chọn ngẫu nhiên và phân bổ đều theo topic / độ khó.",Principles of Management,8,PUBLISHED,Chapter 2 Making Decisions,A decision is ________.,a choice among two or more alternatives,always made by top management,never involving risk,the same as a goal,A,1,Reflective thinking,"LO 2.1: Describe the decision-making process.",Concept
Principles of Management — Sample Quiz,principles-of-management-sample,"Bài mẫu từ Chapters 1–3. Mỗi lần làm, hệ thống chọn ngẫu nhiên và phân bổ đều theo topic / độ khó.",Principles of Management,8,PUBLISHED,Chapter 2 Making Decisions,Programmed decisions are ________.,repetitive and routine,unique and nonrecurring,made only under crisis,avoided by managers,A,2,Reflective thinking,"LO 2.3: Describe types of decisions and decision-making conditions.",Concept
Principles of Management — Sample Quiz,principles-of-management-sample,"Bài mẫu từ Chapters 1–3. Mỗi lần làm, hệ thống chọn ngẫu nhiên và phân bổ đều theo topic / độ khó.",Principles of Management,8,PUBLISHED,Chapter 3 Managing the External Environment and Organizational Culture,The external environment includes ________.,only the board of directors,factors and forces outside the organization that affect its performance,employee handbooks exclusively,internal accounting policies only,B,1,Reflective thinking,"LO 3.1: Contrast the actions of managers according to the omnipotent and symbolic views.",Concept
Principles of Management — Sample Quiz,principles-of-management-sample,"Bài mẫu từ Chapters 1–3. Mỗi lần làm, hệ thống chọn ngẫu nhiên và phân bổ đều theo topic / độ khó.",Principles of Management,8,PUBLISHED,Chapter 3 Managing the External Environment and Organizational Culture,Organizational culture is best described as ________.,"the shared values, principles, and ways of doing things that influence employee behavior",the legal charter of incorporation,a temporary marketing campaign,the physical layout of offices only,A,2,Reflective thinking,"LO 3.3: Define organizational culture and explain its impact on managers.",Concept
`;

/** Questions-only CSV sample for smart-import AI output */
export const SAMPLE_SMART_QUESTIONS_CSV = `topic,stem,option_a,option_b,option_c,option_d,correct_option,difficulty,aacsb,learning_objective,classification
Chapter 1 Managers and You in the Workplace,"In today's workplace, ________.",women are more likely than men to be promoted into management,many employees perform work that in the past was considered managerial activities,women tend to be more effective supervisors than men,most organizations have eliminated the title of manager,B,2,Reflective thinking,"LO 1.1: Describe who managers are and where they work.",Concept
Chapter 1 Managers and You in the Workplace,A manager is someone who ________.,works independently without coordinating others,"coordinates and oversees the work of other people so organizational goals can be accomplished",only works in for-profit organizations,avoids planning and controlling activities,B,1,Reflective thinking,"LO 1.1: Describe who managers are and where they work.",Concept
`;
