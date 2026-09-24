import { describe, expect, it } from 'vitest';

import { resolveCalloutKind } from './callouts';
import { estimateReadingMinutes, gradeQuiz, normalizeEditorMarkdown, quizForLearner, readQuiz } from './content';
import { autoSectionRawText, parseLessonMarkdown } from './lessonImport';
import { parseQuizPaste } from './quizImport';
import { LEARN_MAX_MARKDOWN } from './schemas';
import type { LearnQuiz } from './types';

describe('parseLessonMarkdown', () => {
	it('splits NDK sections with title, duration and summary', () => {
		const parsed = parseLessonMarkdown(
			[
				'# Bài 3: Quy luật mâu thuẫn',
				'> Hạt nhân của phép biện chứng.',
				'',
				'=== SECTION: 1. Khái niệm | 6 phút ===',
				'> Mâu thuẫn là nguồn gốc của vận động.',
				'',
				'## Bản chất',
				'',
				'> [!DEFINITION] Mâu thuẫn biện chứng',
				'> Trạng thái vừa thống nhất vừa đấu tranh.',
				'',
				'=== SECTION: 2. Ý nghĩa ===',
				'Nội dung.',
			].join('\n'),
		);

		expect(parsed.lessonTitle).toBe('Bài 3: Quy luật mâu thuẫn');
		expect(parsed.lessonDescription).toBe('Hạt nhân của phép biện chứng.');
		expect(parsed.sections).toHaveLength(2);
		expect(parsed.sections[0]).toMatchObject({
			title: '1. Khái niệm',
			durationMinutes: 6,
			summary: 'Mâu thuẫn là nguồn gốc của vận động.',
		});
		expect(parsed.sections[0].markdown).toContain('> [!DEFINITION] Mâu thuẫn biện chứng');
		expect(parsed.sections[1]).toMatchObject({ title: '2. Ý nghĩa', durationMinutes: null, summary: '' });
		expect(parsed.warnings).toEqual([]);
	});

	it('only treats a leading quote as the section summary', () => {
		const parsed = parseLessonMarkdown('# T\n\n=== SECTION: A ===\nĐoạn mở đầu.\n\n> Trích giữa bài');
		expect(parsed.sections[0].summary).toBe('');
		expect(parsed.sections[0].markdown).toContain('> Trích giữa bài');
	});

	it('falls back to ## headings, then to a single section', () => {
		const byHeading = parseLessonMarkdown('# T\n\n## Một\nA\n\n## Hai\nB');
		expect(byHeading.sections.map((section) => section.title)).toEqual(['Một', 'Hai']);
		expect(byHeading.warnings).toHaveLength(1);

		const single = parseLessonMarkdown('Chỉ một đoạn văn.');
		expect(single.sections).toHaveLength(1);
		expect(single.sections[0].markdown).toBe('Chỉ một đoạn văn.');
	});

	it('ignores a SECTION-shaped line inside a fenced code block', () => {
		const parsed = parseLessonMarkdown(
			[
				'# T',
				'',
				'=== SECTION: A ===',
				'',
				'```',
				'=== SECTION: fake ===',
				'```',
				'',
				'=== SECTION: B ===',
				'x',
			].join('\n'),
		);
		expect(parsed.sections.map((section) => section.title)).toEqual(['A', 'B']);
		expect(parsed.sections[0].markdown).toContain('=== SECTION: fake ===');
	});

	it('turns a preamble before the first section into a Giới thiệu section instead of dropping it', () => {
		const parsed = parseLessonMarkdown(
			['# T', '> Mô tả', '', 'Đoạn mở đầu dài.', '', '=== SECTION: A ===', 'thân'].join('\n'),
		);
		expect(parsed.lessonDescription).toBe('Mô tả');
		expect(parsed.sections.map((section) => section.title)).toEqual(['Giới thiệu', 'A']);
		expect(parsed.sections[0].markdown).toBe('Đoạn mở đầu dài.');
		expect(parsed.warnings).not.toContain('Có đoạn văn trước mục đầu tiên. Đoạn này không được nhập.');
	});

	it('warns when an imported section is too long to ever be saved', () => {
		const body = 'x'.repeat(LEARN_MAX_MARKDOWN + 1);
		const parsed = parseLessonMarkdown(`# T\n\n=== SECTION: A ===\n${body}`);
		expect(parsed.warnings.some((warning) => warning.includes('vượt giới hạn'))).toBe(true);
	});

	it('escapes a year-like line so it is not parsed as an ordered list start', () => {
		const parsed = parseLessonMarkdown('# T\n\n=== SECTION: A ===\n1945. Năm lịch sử\n\n2. Không phải list?');
		expect(parsed.sections[0].markdown).toContain('1945\\. Năm lịch sử');
	});
});

describe('autoSectionRawText', () => {
	it('promotes academic headings to section delimiters without rewriting text', () => {
		const out = autoSectionRawText('# Bài 1\nMở đầu.\nI. Khái niệm\nNội dung một.\nII. Ý nghĩa\nNội dung hai.');
		expect(out).toContain('=== SECTION: Giới thiệu ===');
		expect(out).toContain('=== SECTION: I. Khái niệm ===');
		expect(out).toContain('Nội dung hai.');
		expect(parseLessonMarkdown(out).sections).toHaveLength(3);
	});
});

describe('parseQuizPaste', () => {
	it('reads options, answer lines, star markers and explanations', () => {
		const { questions, warnings } = parseQuizPaste(
			[
				'Câu 1: Mâu thuẫn biện chứng là gì?',
				'A. Sai sót tư duy',
				'B. Động lực phát triển',
				'Đáp án: B',
				'Giải thích: Đây là nguồn gốc vận động.',
				'',
				'Câu 2: Chọn ý đúng',
				'A. Một',
				'*B. Hai',
				'C. Ba',
			].join('\n'),
		);
		expect(warnings).toEqual([]);
		expect(questions).toHaveLength(2);
		expect(questions[0]).toMatchObject({
			question: 'Mâu thuẫn biện chứng là gì?',
			options: ['Sai sót tư duy', 'Động lực phát triển'],
			correctIndex: 1,
			explanation: 'Đây là nguồn gốc vận động.',
		});
		expect(questions[1]).toMatchObject({ options: ['Một', 'Hai', 'Ba'], correctIndex: 1 });
	});

	it('warns about missing answers and skips questions without options', () => {
		const { questions, warnings } = parseQuizPaste('Câu 1: Hỏi?\nA. X\nB. Y\n\nCâu 2: Không có phương án');
		expect(questions).toHaveLength(1);
		expect(questions[0].correctIndex).toBe(0);
		expect(warnings).toHaveLength(2);
	});

	it('falls back to A and warns when the marked answer letter has no matching option', () => {
		const { questions, warnings } = parseQuizPaste('Câu 1: Hỏi?\nA. a\nB. b\nC. c\nĐáp án: E');
		expect(questions).toHaveLength(1);
		expect(questions[0].correctIndex).toBe(0);
		expect(warnings.some((warning) => warning.includes('không khớp phương án'))).toBe(true);
	});
});

describe('quiz grading', () => {
	const quiz: LearnQuiz = {
		passingScorePercent: 60,
		timeLimitMinutes: null,
		questions: [
			{ id: 'a', question: 'A?', options: ['x', 'y'], correctIndex: 1, explanation: '' },
			{ id: 'b', question: 'B?', options: ['x', 'y'], correctIndex: 0, explanation: 'vì x' },
		],
	};

	it('scores answers, drops out-of-range ones and applies the pass mark', () => {
		const result = gradeQuiz(quiz, { a: 1, b: 7 }, new Date('2026-01-01T00:00:00Z'));
		expect(result).toMatchObject({ score: 1, total: 2, percentage: 50, passed: false, answers: { a: 1 } });
		expect(gradeQuiz(quiz, { a: 1, b: 0 }).passed).toBe(true);
	});

	it('never sends the answer key to the learner view', () => {
		const learner = quizForLearner(quiz);
		expect(JSON.stringify(learner)).not.toContain('correctIndex');
		expect(JSON.stringify(learner)).not.toContain('vì x');
	});

	it('rejects malformed stored quizzes', () => {
		expect(readQuiz({ questions: [{ id: 'a', options: ['x'], correctIndex: 0 }] })).toBeNull();
		expect(readQuiz(quiz)).not.toBeNull();
	});
});

describe('helpers', () => {
	it('resolves Vietnamese callout aliases', () => {
		expect(resolveCalloutKind('định nghĩa')).toBe('definition');
		expect(resolveCalloutKind('QUOTE')).toBe('quote');
		expect(resolveCalloutKind('nope')).toBeNull();
	});

	it('drops empty editor paragraphs and extra blank lines', () => {
		expect(normalizeEditorMarkdown('A\n\n\n| t |\n\n\n&nbsp;\n')).toBe('A\n\n| t |');
	});

	it('estimates reading time with a one-minute floor', () => {
		expect(estimateReadingMinutes('ngắn')).toBe(1);
		expect(estimateReadingMinutes(Array(900).fill('từ').join(' '))).toBe(5);
	});
});
