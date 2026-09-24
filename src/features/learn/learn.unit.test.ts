import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveCalloutKind } from './callouts';
import { estimateReadingMinutes, gradeQuiz, normalizeEditorMarkdown, quizForLearner, readQuiz } from './content';
import { autoSectionRawText, cleanAiPaste, exportCourseMarkdown, exportLessonMarkdown, parseCourseMarkdown, parseLessonMarkdown, planContentReplace } from './lessonImport';
import { parseQuizPaste } from './quizImport';
import { LEARN_MAX_MARKDOWN } from './schemas';
import { readingOutline } from './outline';
import { compareLectureText, lectureWords } from './textFidelity';
import type { LearnQuiz } from './types';

const originalLecture = readFileSync(path.join(import.meta.dirname, '__fixtures__/sample-lecture.original.txt'), 'utf8');
const aiLecture = readFileSync(path.join(import.meta.dirname, '__fixtures__/sample-lecture.ai.md'), 'utf8');

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

	it('reads a quiz section, takeaways, a checkpoint and an hour-long duration', () => {
		const parsed = parseLessonMarkdown(
			[
				'# Bài',
				'',
				'=== SECTION: Khái niệm | 1 giờ ===',
				'> [!TAKEAWAYS]',
				'> - Nắm khái niệm',
				'> [!CHECKPOINT]',
				'> Mâu thuẫn là gì?',
				'> A. Sai',
				'> B. Đúng',
				'> Đáp án: B',
				'Thân bài.',
				'',
				'=== QUIZ: Kiểm tra | 10 phút ===',
				'Câu 1: Hỏi?',
				'A. a',
				'B. b',
				'Đáp án: A',
			].join('\n'),
		);
		expect(parsed.sections[0]).toMatchObject({
			durationMinutes: 60,
			keyTakeaways: ['Nắm khái niệm'],
			markdown: 'Thân bài.',
		});
		expect(parsed.sections[0].checkpoint).toMatchObject({ question: 'Mâu thuẫn là gì?', correctIndex: 1 });
		expect(parsed.sections[1].type).toBe('QUIZ');
		expect(parsed.sections[1].quiz?.questions[0].correctIndex).toBe(0);
		expect(parsed.sections[1].quiz?.timeLimitMinutes).toBe(10);
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

describe('course markdown exchange', () => {
	it('splits a file into one lesson per top-level heading', () => {
		const parsed = parseCourseMarkdown('# Một\n\n=== SECTION: A ===\nna\n\n# Hai\n\n=== SECTION: B ===\nbb');
		expect(parsed.lessons.map((lesson) => lesson.lessonTitle)).toEqual(['Một', 'Hai']);
		expect(parsed.lessons[1].sections[0].title).toBe('B');
	});

	it('round-trips a lesson that has a quiz, takeaways and a checkpoint', () => {
		const source = [
			'# Bài',
			'> Mô tả',
			'',
			'=== SECTION: Khái niệm | 6 phút ===',
			'> Tóm tắt',
			'',
			'> [!TAKEAWAYS]',
			'> - Ý một',
			'',
			'> [!CHECKPOINT]',
			'> Câu hỏi?',
			'> A. Sai',
			'> B. Đúng',
			'> Đáp án: B',
			'',
			'Thân.',
			'',
			'=== QUIZ: Kiểm tra | 10 phút ===',
			'',
			'Câu 1: Hỏi?',
			'A. a',
			'B. b',
			'Đáp án: A',
			'',
		].join('\n');
		const lesson = parseLessonMarkdown(source);
		const again = parseLessonMarkdown(
			exportCourseMarkdown([
				{
					title: lesson.lessonTitle,
					description: lesson.lessonDescription,
					sections: lesson.sections,
				},
			]),
		);
		expect(again.lessonTitle).toBe('Bài');
		expect(again.sections[0].keyTakeaways).toEqual(['Ý một']);
		expect(again.sections[0].checkpoint?.correctIndex).toBe(1);
		expect(again.sections[0].markdown).toBe('Thân.');
		expect(again.sections[1].quiz?.questions[0].question).toBe('Hỏi?');
	});

	it('updates matched sections in place and only deletes the ones left over', () => {
		const incoming = parseLessonMarkdown('# Bài\n\n=== SECTION: Giữ ===\nx\n\n=== SECTION: Mới ===\ny').sections;
		const plan = planContentReplace(
			[
				{ id: 'a', title: 'Giữ' },
				{ id: 'b', title: 'Cũ' },
			],
			incoming,
		);
		expect(plan.updates.map((item) => item.id)).toEqual(['a', 'b']);
		expect(plan.updates[1].section.title).toBe('Mới');
		expect(plan.deletes).toEqual([]);
		expect(plan.creates).toEqual([]);
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

	it('cleans an AI paste, joins continuations, and keeps an unlabeled code fence', () => {
		const pasted = [
			'Xin chào, đây là bài.',
			'````markdown',
			'# Bài',
			'',
			'=== SECTION: A ===',
			'```',
			'giữ nguyên dòng này',
			'```',
			'````',
			'<<<CÒN TIẾP>>>',
			'````md',
			'=== SECTION: B ===',
			'phần hai',
			'````',
		].join('\n');
		const cleaned = cleanAiPaste(pasted);
		expect(cleaned.markdown).toContain('giữ nguyên dòng này');
		expect(cleaned.markdown).toContain('=== SECTION: B ===');
		expect(cleaned.markdown).not.toContain('Xin chào');
		expect(cleaned.markdown).not.toContain('CÒN TIẾP');
		expect(cleaned.warnings).toEqual([]);

		const unfinished = cleanAiPaste('````markdown\n# Bài\n\n=== SECTION: A ===\nx\n````\n<<<CÒN TIẾP>>>');
		expect(unfinished.warnings[0]).toMatch(/chưa trả hết bài/);
		expect(unfinished.markdown).not.toContain('CÒN TIẾP');
	});

	it('keeps every word of the sample lecture and reports a one-word edit', () => {
		const match = compareLectureText(originalLecture, aiLecture);
		expect(match.hunks).toEqual([]);
		expect(match.matchPercent).toBe(100);

		const cleaned = cleanAiPaste(aiLecture).markdown;
		const swapped = cleaned.replace('kanban', 'jidoka');
		const changed = compareLectureText(originalLecture, swapped);
		expect(changed.hunks).toEqual([
			expect.objectContaining({ kind: 'removed', words: ['kanban.'] }),
			expect.objectContaining({ kind: 'added', words: ['jidoka.'] }),
		]);

		const dropped = cleaned.replace('Toyota áp dụng kanban.\n', '');
		expect(compareLectureText(originalLecture, dropped).hunks).toEqual([
			expect.objectContaining({ kind: 'removed', words: ['Toyota', 'áp', 'dụng', 'kanban.'] }),
		]);

		const added = cleaned.replace('Toyota áp dụng kanban.', 'Toyota áp dụng kanban. Thêm một câu.');
		expect(compareLectureText(originalLecture, added).hunks).toEqual([
			expect.objectContaining({ kind: 'added', words: ['Thêm', 'một', 'câu.'] }),
		]);
	});

	it('parses the sample lecture and round-trips the export', () => {
		const parsed = parseCourseMarkdown(aiLecture);
		expect(parsed.lessons).toHaveLength(1);
		expect(parsed.lessons[0].sections.map((section) => section.type)).toEqual(['READING', 'QUIZ']);
		expect(parsed.lessons[0].sections[0].markdown).toContain('> [!DEFINITION] Mâu thuẫn biện chứng');
		expect(parsed.lessons[0].sections[0].markdown).toContain('[^1]:');
		expect(parsed.lessons[0].sections[1].quiz?.questions).toHaveLength(1);
		const exported = exportLessonMarkdown({
			title: parsed.lessons[0].lessonTitle,
			description: parsed.lessons[0].lessonDescription,
			sections: parsed.lessons[0].sections,
		});
		const again = exportLessonMarkdown({
			title: parseLessonMarkdown(exported).lessonTitle,
			description: parseLessonMarkdown(exported).lessonDescription,
			sections: parseLessonMarkdown(exported).sections,
		});
		expect(again).toBe(exported);
		expect(lectureWords(exported).length).toBeGreaterThan(10);
	});

	it('ignores mermaid diagrams and a Docs byline when the description repeats the lecture', () => {
		const original = ['Bài', '24 thg 9, 2026 · @Nguyen Duy Khanh', 'flowchart TD', '    A["Nút"] --> B["Nút hai"]', 'Đoạn văn.'].join('\n');
		const formatted = ['# Bài', '> Đoạn văn.', '', 'Đoạn văn.', '', '```mermaid', 'flowchart TD', '    A["Sơ đồ mới"] --> B["Không tính"]', '```'].join('\n');
		expect(compareLectureText(original, formatted).hunks).toEqual([]);
		expect(compareLectureText(original, formatted.replace('> Đoạn văn.', '> Câu AI tự viết thêm.')).hunks.length).toBeGreaterThan(0);
	});

	it('warns about an unfenced diagram, a flattened table, and a byline description', () => {
		const raw = ['# Bài', '> 24 thg 9, 2026 · @Ten', '', '=== SECTION: A ===', 'flowchart TD', '    A --> B', '', '```text', 'Cột', 'Một', 'Hai', 'Ba', '```'].join('\n');
		const warnings = parseCourseMarkdown(raw).warnings;
		expect(warnings).toContain('Có sơ đồ chưa bọc trong khối ```mermaid');
		expect(warnings).toContain('Có khối mã trông như bảng bị dàn phẳng. Hãy để AI dựng lại thành bảng');
		expect(warnings).toContain('Dòng mô tả là tên tác giả/ngày, không phải mô tả');
	});

	it('parses the ITM lesson without changing a word', () => {
		const root = path.join(import.meta.dirname, '../../../content/learn/itm');
		const original = readFileSync(path.join(root, 'bai-1.original.txt'), 'utf8');
		const markdown = readFileSync(path.join(root, 'bai-1.md'), 'utf8');
		const parsed = parseCourseMarkdown(markdown);
		expect(parsed.warnings).toEqual([]);
		expect(parsed.lessons[0].sections.map((section) => section.title)).toEqual([
			'Mở đầu: Vì sao một tổ chức có thể sụp đổ dù không ai phá nó?',
			'Phần 1. Nhà quản trị là ai, và họ làm việc ở đâu?',
			'Phần 2. Vì sao tổ chức cần nhà quản trị?',
			'Phần 3. Quản trị là gì, và nhà quản trị thực sự làm gì?',
			'Phần 4. Điều gì đang thay đổi công việc của nhà quản trị?',
			'Phần 5. Nghề quản trị và những kỹ năng cần có',
			'Phần 6. Không định làm sếp, có cần học quản trị không?',
			'Góc đọc thêm',
			'Tổng kết bài 1',
		]);
		expect(parsed.lessons[0].lessonDescription).toBe(
			'Cách một nhóm người được điều phối quyết định rất nhiều đến việc nhóm đó thành công hay thất bại.',
		);
		expect(parsed.lessons[0].sections.find((section) => section.title === 'Góc đọc thêm')?.summary).toMatch(/không bắt buộc/);
		expect(compareLectureText(original, markdown)).toEqual({ matchPercent: 100, hunks: [] });
		expect(markdown.match(/^\| ---/gm)).toHaveLength(7);
		expect(markdown.match(/```mermaid/g)).toHaveLength(3);
		expect(markdown).not.toContain('```text');
		const byTitle = (title: string) => parsed.lessons[0].sections.find((section) => section.title === title)?.markdown ?? '';
		expect(readingOutline(byTitle('Phần 4. Điều gì đang thay đổi công việc của nhà quản trị?')).length).toBeGreaterThanOrEqual(3);
		expect(readingOutline(byTitle('Phần 6. Không định làm sếp, có cần học quản trị không?')).length).toBeGreaterThanOrEqual(3);
	});

	it('estimates reading time with a one-minute floor', () => {
		expect(estimateReadingMinutes('ngắn')).toBe(1);
		expect(estimateReadingMinutes(Array(900).fill('từ').join(' '))).toBe(5);
	});
});
