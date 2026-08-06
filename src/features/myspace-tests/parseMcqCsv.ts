/**
 * Parse normalized My Space Tests CSV rows into McqQuestion inputs.
 *
 * Required columns:
 *   topic, stem, option_a, option_b, correct_option
 * Optional:
 *   option_c, option_d (empty for True/False 2-option questions),
 *   subject (ignored for FK — assigned at save), difficulty (default 2),
 *   aacsb, learning_objective, classification
 */
import { parse } from 'csv-parse/sync';

import type { McqCorrectOption } from './schemas';
import type { McqQuestionInput } from './types';

export interface CsvRowError {
	/** 1-based row number (row 1 = header) */
	row: number;
	missing: string[];
	message?: string;
}

export interface ParseMcqCsvResult {
	questions: McqQuestionInput[];
	errors: CsvRowError[];
}

const CORRECT_OPTIONS = new Set(['A', 'B', 'C', 'D']);

function cell(row: Record<string, string>, ...keys: string[]): string {
	for (const key of keys) {
		const value = row[key];
		if (value !== undefined && value !== null) return String(value).trim();
	}
	return '';
}

export function mapMcqRow(r: Record<string, string>): McqQuestionInput & {
	_missing: string[];
	_message?: string;
	_subjectName: string;
} {
	const subjectName = cell(r, 'subject');
	const topic = cell(r, 'topic');
	const stem = cell(r, 'stem', 'question');
	const optionA = cell(r, 'option_a', 'optionA', 'a');
	const optionB = cell(r, 'option_b', 'optionB', 'b');
	const optionC = cell(r, 'option_c', 'optionC', 'c');
	const optionD = cell(r, 'option_d', 'optionD', 'd');
	const correctRaw = cell(r, 'correct_option', 'correctOption', 'answer').toUpperCase();
	const difficultyRaw = cell(r, 'difficulty', 'diff');
	const aacsb = cell(r, 'aacsb');
	const learningObjective = cell(r, 'learning_objective', 'learningObjective', 'learning_obj');
	const classification = cell(r, 'classification');

	const missing: string[] = [];
	if (!topic) missing.push('topic');
	if (!stem) missing.push('stem');
	if (!optionA) missing.push('option_a');
	if (!optionB) missing.push('option_b');
	if (!correctRaw) missing.push('correct_option');

	let message: string | undefined;
	let correctOption: McqCorrectOption = 'A';
	if (correctRaw && !CORRECT_OPTIONS.has(correctRaw)) {
		message = `correct_option phải là A|B|C|D (nhận được "${correctRaw}")`;
		missing.push('correct_option');
	} else if (CORRECT_OPTIONS.has(correctRaw)) {
		correctOption = correctRaw as McqCorrectOption;
	}

	// Validate correct_option against available options (2–4)
	if (CORRECT_OPTIONS.has(correctRaw) && missing.length === 0) {
		if (correctOption === 'C' && !optionC) {
			message = 'correct_option=C nhưng option_c trống';
			missing.push('option_c');
		} else if (correctOption === 'D' && !optionD) {
			message = 'correct_option=D nhưng option_d trống';
			missing.push('option_d');
		} else if (!optionC && !optionD && correctOption !== 'A' && correctOption !== 'B') {
			message = `Câu 2 đáp án chỉ chấp nhận correct_option A|B (nhận được "${correctOption}")`;
			missing.push('correct_option');
		}
	}

	let difficulty = 2;
	if (difficultyRaw) {
		const n = Number.parseInt(difficultyRaw, 10);
		if (!Number.isFinite(n) || n < 1 || n > 10) {
			message = message ?? `difficulty không hợp lệ ("${difficultyRaw}")`;
			missing.push('difficulty');
		} else {
			difficulty = n;
		}
	}

	return {
		subjectId: null,
		topic,
		stem,
		optionA,
		optionB,
		optionC,
		optionD,
		correctOption,
		difficulty,
		aacsb,
		learningObjective,
		classification,
		_missing: missing,
		_message: message,
		_subjectName: subjectName,
	};
}

export function parseMcqCsvRows(rawRows: Record<string, string>[]): ParseMcqCsvResult {
	const questions: McqQuestionInput[] = [];
	const errors: CsvRowError[] = [];

	rawRows.forEach((r, idx) => {
		const mapped = mapMcqRow(r);
		const { _missing, _message, _subjectName: _name, ...question } = mapped;

		const blank =
			!mapped._subjectName &&
			!question.topic &&
			!question.stem &&
			!question.optionA &&
			!question.optionB &&
			!question.optionC &&
			!question.optionD &&
			!cell(r, 'correct_option', 'correctOption', 'answer');

		if (blank) return;

		if (_missing.length > 0) {
			errors.push({ row: idx + 2, missing: _missing, message: _message });
		} else {
			questions.push(question);
		}
	});

	return { questions, errors };
}

export function parseMcqCsvText(text: string): ParseMcqCsvResult {
	const rawRows = parse(text, {
		columns: true,
		skip_empty_lines: true,
		trim: true,
		relax_column_count: true,
	}) as Record<string, string>[];
	return parseMcqCsvRows(rawRows);
}

export async function parseMcqCsvFile(file: File): Promise<ParseMcqCsvResult> {
	const text = await file.text();
	return parseMcqCsvText(text);
}

export const SAMPLE_MCQ_CSV = `topic,stem,option_a,option_b,option_c,option_d,correct_option,difficulty,aacsb,learning_objective,classification
Chapter 1 Managers and You in the Workplace,"In today's workplace, ________.",women are more likely than men to be promoted into management,many employees perform work that in the past was considered managerial activities,women tend to be more effective supervisors than men,most organizations have eliminated the title of manager,B,2,Reflective thinking,"LO 1.1: Describe who managers are and where they work.",Concept
Chapter 1 Managers and You in the Workplace,A manager is someone who ________.,works independently without coordinating others,"coordinates and oversees the work of other people so organizational goals can be accomplished",only works in for-profit organizations,avoids planning and controlling activities,B,1,Reflective thinking,"LO 1.1: Describe who managers are and where they work.",Concept
Chapter 1 Managers and You in the Workplace,Many traditional nonmanagerial jobs now include managerial activities.,True,False,,,A,1,Diverse and multicultural work environments,"LO 1.1: Describe who managers are and where they work.",Concept
`;
