import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveCalloutKind } from './callouts';
import { estimateReadingMinutes, normalizeEditorMarkdown, sectionMinutes } from './content';
import { discussionMarkdown, parseDiscussionPaste } from './discussionImport';
import {
	ANSWER_LABELS,
	discussionQuestionView,
	discussionQuestionViews,
	splitLabelled,
} from './discussionView';
import {
	cleanAiPaste,
	exportCourseMarkdown,
	exportLessonMarkdown,
	parseCourseMarkdown,
	parseLessonMarkdown,
	planContentReplace,
	unwrapAiPaste,
} from './lessonImport';
import { LEARN_MAX_MARKDOWN } from './schemas';
import { readingOutline } from './outline';
import { compareLectureText, lectureWords } from './textFidelity';

const originalLecture = readFileSync(
	path.join(import.meta.dirname, '__fixtures__/sample-lecture.original.txt'),
	'utf8',
);
const aiLecture = readFileSync(
	path.join(import.meta.dirname, '__fixtures__/sample-lecture.ai.md'),
	'utf8',
);

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
		expect(parsed.sections[1]).toMatchObject({
			title: '2. Ý nghĩa',
			durationMinutes: null,
			summary: '',
		});
		expect(parsed.warnings).toEqual([]);
	});

	it('only treats a leading quote as the section summary', () => {
		const parsed = parseLessonMarkdown(
			'# T\n\n=== SECTION: A ===\nĐoạn mở đầu.\n\n> Trích giữa bài',
		);
		expect(parsed.sections[0].summary).toBe('');
		expect(parsed.sections[0].markdown).toContain('> Trích giữa bài');
	});

	it('falls back to ## headings, then to a single section', () => {
		const byHeading = parseLessonMarkdown('# T\n\n## Một\nA\n\n## Hai\nB');
		expect(byHeading.sections.map((section) => section.title)).toEqual(['Một', 'Hai']);
		expect(byHeading.warnings).toHaveLength(0);

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
		expect(parsed.warnings).not.toContain(
			'Có đoạn văn trước mục đầu tiên. Đoạn này không được nhập.',
		);
	});

	it('warns when an imported section is too long to ever be saved', () => {
		const body = 'x'.repeat(LEARN_MAX_MARKDOWN + 1);
		const parsed = parseLessonMarkdown(`# T\n\n=== SECTION: A ===\n${body}`);
		expect(parsed.warnings.some((warning) => warning.includes('vượt giới hạn'))).toBe(true);
	});

	it('skips a retired quiz block and a checkpoint but keeps takeaways and duration', () => {
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
		expect(parsed.sections[0].checkpoint).toBeNull();
		expect(parsed.sections).toHaveLength(1);
		expect(parsed.warnings.some((warning) => warning.includes('câu hỏi nhanh'))).toBe(true);
		expect(parsed.warnings.some((warning) => warning.includes('"Kiểm tra": đã bỏ qua'))).toBe(true);
	});
	it('escapes a year-like line so it is not parsed as an ordered list start', () => {
		const parsed = parseLessonMarkdown(
			'# T\n\n=== SECTION: A ===\n1945. Năm lịch sử\n\n2. Không phải list?',
		);
		expect(parsed.sections[0].markdown).toContain('1945\\. Năm lịch sử');
	});
});

describe('course markdown exchange', () => {
	it('splits a file into one lesson per top-level heading', () => {
		const parsed = parseCourseMarkdown(
			'# Một\n\n=== SECTION: A ===\nna\n\n# Hai\n\n=== SECTION: B ===\nbb',
		);
		expect(parsed.lessons.map((lesson) => lesson.lessonTitle)).toEqual(['Một', 'Hai']);
		expect(parsed.lessons[1].sections[0].title).toBe('B');
	});

	it('round-trips a lesson with takeaways and a discussion intro, dropping a checkpoint', () => {
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
			'=== SECTION: Cách dùng bộ câu hỏi ===',
			'',
			'Tự trả lời trước.',
			'',
			'=== DISCUSSION: Câu hỏi phản biện ===',
			'',
			'Câu 1:',
			'### Hiểu — Một',
			'> [!REFLECT] Câu hỏi:',
			'> Hỏi?',
			'',
			'Đáp án mẫu:',
			'Đáp.',
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
		expect(again.sections[0].checkpoint).toBeNull();
		expect(again.sections[0].markdown).toBe('Thân.');
		expect(
			exportCourseMarkdown([
				{
					title: lesson.lessonTitle,
					description: lesson.lessonDescription,
					sections: lesson.sections,
				},
			]),
		).not.toContain('CHECKPOINT');
		// The how-to section folds into the discussion, both on import and after an export.
		expect(lesson.sections.map((section) => section.type)).toEqual(['READING', 'DISCUSSION']);
		expect(again.sections).toHaveLength(2);
		expect(again.sections[1].markdown).toBe('Tự trả lời trước.');
		expect(again.sections[1].discussion?.questions[0].answer).toContain('Đáp.');
	});

	it('updates matched sections in place and only deletes the ones left over', () => {
		const incoming = parseLessonMarkdown(
			'# Bài\n\n=== SECTION: Giữ ===\nx\n\n=== SECTION: Mới ===\ny',
		).sections;
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

		const unfinished = cleanAiPaste(
			'````markdown\n# Bài\n\n=== SECTION: A ===\nx\n````\n<<<CÒN TIẾP>>>',
		);
		expect(unfinished.warnings[0]).toMatch(/chưa trả hết bài/);
		expect(unfinished.markdown).not.toContain('CÒN TIẾP');
	});

	it('unwraps an AI reply on paste so its images stay outside code', () => {
		expect(unwrapAiPaste('# Bài\n\n## Mục\n![Hình]()')).toBeNull();
		expect(unwrapAiPaste('Đây:\n````markdown\n# Bài\n\n![Hình]()\n````\nChúc vui')).toBe(
			'# Bài\n\n![Hình]()',
		);
		const unfinished = unwrapAiPaste('````markdown\n# Bài\n````\n<<<CÒN TIẾP>>>');
		expect(unfinished).toBe('# Bài\n\n<<<CÒN TIẾP>>>');
		expect(cleanAiPaste(unfinished!).warnings[0]).toMatch(/chưa trả hết bài/);
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
		// The fixture still ends with a quiz block, which the import now skips.
		expect(parsed.lessons[0].sections.map((section) => section.type)).toEqual(['READING']);
		expect(parsed.lessons[0].sections[0].markdown).toContain(
			'> [!DEFINITION] Mâu thuẫn biện chứng',
		);
		expect(parsed.lessons[0].sections[0].markdown).toContain('[^1]:');
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
		const original = [
			'Bài',
			'24 thg 9, 2026 · @Nguyen Duy Khanh',
			'flowchart TD',
			'    A["Nút"] --> B["Nút hai"]',
			'Đoạn văn.',
		].join('\n');
		const formatted = [
			'# Bài',
			'> Đoạn văn.',
			'',
			'Đoạn văn.',
			'',
			'```mermaid',
			'flowchart TD',
			'    A["Sơ đồ mới"] --> B["Không tính"]',
			'```',
		].join('\n');
		expect(compareLectureText(original, formatted).hunks).toEqual([]);
		expect(
			compareLectureText(original, formatted.replace('> Đoạn văn.', '> Câu AI tự viết thêm.')).hunks
				.length,
		).toBeGreaterThan(0);
	});

	it('warns about an unfenced diagram, a flattened table, and a byline description', () => {
		const raw = [
			'# Bài',
			'> 24 thg 9, 2026 · @Ten',
			'',
			'=== SECTION: A ===',
			'flowchart TD',
			'    A --> B',
			'',
			'```text',
			'Cột',
			'Một',
			'Hai',
			'Ba',
			'```',
		].join('\n');
		const warnings = parseCourseMarkdown(raw).warnings;
		expect(warnings).toContain('Có sơ đồ chưa bọc trong khối ```mermaid');
		expect(warnings).toContain(
			'Có khối mã trông như bảng bị dàn phẳng. Hãy để AI dựng lại thành bảng',
		);
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
		expect(
			parsed.lessons[0].sections.find((section) => section.title === 'Góc đọc thêm')?.summary,
		).toMatch(/không bắt buộc/);
		expect(compareLectureText(original, markdown)).toEqual({ matchPercent: 100, hunks: [] });
		expect(markdown.match(/^\| ---/gm)).toHaveLength(7);
		expect(markdown.match(/```mermaid/g)).toHaveLength(3);
		expect(markdown).not.toContain('```text');
		const byTitle = (title: string) =>
			parsed.lessons[0].sections.find((section) => section.title === title)?.markdown ?? '';
		expect(
			readingOutline(byTitle('Phần 4. Điều gì đang thay đổi công việc của nhà quản trị?')).length,
		).toBeGreaterThanOrEqual(3);
		expect(
			readingOutline(byTitle('Phần 6. Không định làm sếp, có cần học quản trị không?')).length,
		).toBeGreaterThanOrEqual(3);
	});

	it('skips a practice block, imports a discussion and round-trips it', () => {
		const source = [
			'# Bài',
			'',
			'=== PRACTICE: Luyện tập | 4 phút ===',
			'Câu 1: Dòng một',
			'tiếp',
			'A. Sai',
			'B. Đúng',
			'Đáp án: B',
			'Giải thích: Vì đúng.',
			'',
			'Đoạn hai.',
			'',
			'=== PHẢN BIỆN: Câu hỏi phản biện ===',
			'## Nhóm A',
			'',
			'Câu 1: Vì sao?',
			'',
			'Đáp án mẫu:',
			'Vì nguồn gốc.',
			'',
			'- Ý một',
			'',
			'Nhắc lại Câu 1: không tách.',
			'',
			'Câu 2: Câu kế?',
			'',
			'Gợi ý trả lời:',
			'| A | B |',
			'| --- | --- |',
			'| 1 | 2 |',
		].join('\n');
		const parsed = parseLessonMarkdown(source);
		expect(parsed.sections.map((section) => section.type)).toEqual(['DISCUSSION']);
		const [discussion] = parsed.sections;
		expect(discussion.discussion?.questions[0].question).toContain('## Nhóm A');
		expect(discussion.discussion?.questions[0].question).toContain('Vì sao?');
		expect(discussion.discussion?.questions[0].answer).toContain('Nhắc lại Câu 1: không tách.');
		expect(discussion.discussion?.questions[1].answer).toContain('| 1 | 2 |');
		expect(discussion.discussion?.questions).toHaveLength(2);
		const exported = exportLessonMarkdown({
			title: parsed.lessonTitle,
			description: parsed.lessonDescription,
			sections: parsed.sections,
		});
		const again = parseLessonMarkdown(exported);
		expect(again.sections[0].discussion?.questions[1].answer).toContain('| 1 | 2 |');
		expect(
			sectionMinutes({
				type: 'DISCUSSION',
				durationMinutes: null,
				markdown: '',
				discussion: discussion.discussion,
			}),
		).toBeGreaterThan(0);
	});

	it('keeps a discussion answer that mentions an earlier question number', () => {
		const { questions, warnings } = parseDiscussionPaste(
			'Câu 1: Hỏi?\n\nĐáp án:\nXem lại Câu 1: trong thân.\n\nCâu 2: Tiếp?\n\nTrả lời:',
		);
		expect(questions).toHaveLength(2);
		expect(questions[0].answer).toContain('Câu 1: trong thân.');
		expect(warnings.some((warning) => warning.includes('Câu 2'))).toBe(true);
		expect(discussionMarkdown({ questions }).includes('Đáp án mẫu:')).toBe(true);
	});

	it('warns when a pasted question number skips ahead', () => {
		const { questions, warnings } = parseDiscussionPaste(
			'Câu 1: Một\n\nĐáp án mẫu: A\n\nCâu 3: Ba\n\nĐáp án mẫu: C',
		);
		expect(questions).toHaveLength(2);
		expect(questions[0].question).not.toContain('Câu 3');
		expect(warnings.some((warning) => warning.includes('không nối tiếp'))).toBe(true);
	});

	it('ignores question labels when comparing a formatted quiz to its source', () => {
		const original = '1) Hỏi gì\na) Một\nb) Hai\nĐáp án: B';
		const formatted = 'Câu 1: Hỏi gì\nA. Một\nB. Hai\nĐáp án: B';
		expect(compareLectureText(original, formatted, { questions: true }).hunks).toEqual([]);
		expect(
			compareLectureText(original, formatted.replace('Hai', 'Ba'), { questions: true }).hunks,
		).toEqual([
			expect.objectContaining({ kind: 'removed', words: ['Hai'] }),
			expect.objectContaining({ kind: 'added', words: ['Ba'] }),
		]);
	});

	it('keeps later answer-like labels inside a discussion answer', () => {
		const { questions } = parseDiscussionPaste(
			'Câu 1: Phân tích.\n\nĐáp án mẫu:\nÝ một.\n\nHướng dẫn: nêu ví dụ cụ thể.\n\nTrả lời: đây là trích dẫn.',
		);
		expect(questions[0].answer).toBe(
			'Ý một.\n\nHướng dẫn: nêu ví dụ cụ thể.\n\nTrả lời: đây là trích dẫn.',
		);
	});

	it('keeps "## Luyện tập:" and "### Kiểm tra:" subheadings inside a reading section', () => {
		const parsed = parseLessonMarkdown(
			'# Bài\n\n=== SECTION: I. Mở đầu ===\nĐoạn.\n\n## Luyện tập: Vận dụng\nĐoạn.\n\n### Kiểm tra: hiểu bài\nĐoạn.\n\n=== LUYỆN TẬP: Ôn ===\nCâu 1: Hỏi?\nA. a\nB. b\nĐáp án: A',
		);
		expect(parsed.sections.map((section) => section.type)).toEqual(['READING']);
		expect(parsed.sections[0].markdown).toContain('## Luyện tập: Vận dụng');
		expect(parsed.sections[0].markdown).not.toContain('Câu 1: Hỏi?');
	});

	it('does not count renamed answer labels or a key letter glued to a word as edits', () => {
		const original =
			'Câu 1: Vì sao?\nTrả lời: Bởi vì A.\n\n**Câu 2.** Ra sao?\nGợi ý đáp án: Được.';
		const formatted =
			'Câu 1: Vì sao?\n\nĐáp án mẫu:\nBởi vì A.\n\nCâu 2: Ra sao?\n\nĐáp án mẫu:\nĐược.';
		expect(compareLectureText(original, formatted, { questions: true }).hunks).toEqual([]);
		expect(
			compareLectureText('Câu 1: X?\nĐáp án: Bởi Y.', 'Câu 1: X?\n\nĐáp án mẫu:\nBởi Y.', {
				questions: true,
			}).hunks,
		).toEqual([]);
	});

	it('estimates reading time with a one-minute floor', () => {
		expect(estimateReadingMinutes('ngắn')).toBe(1);
		expect(estimateReadingMinutes(Array(900).fill('từ').join(' '))).toBe(5);
	});
});

describe('discussionQuestionView', () => {
	it('lifts the part, level and title and labels the situation and the ask', () => {
		const view = discussionQuestionView(
			'## Phần 1. Tổ chức là gì\n\nÁp dụng — Nhóm bạn đá bóng\n\nTình huống: 15 người đá bóng.\nAi rảnh thì đến.\n\nCâu hỏi: Đã là tổ chức chưa?',
		);
		expect(view).toEqual({
			part: 'Phần 1. Tổ chức là gì',
			level: 'Áp dụng',
			title: 'Nhóm bạn đá bóng',
			blocks: [
				{ label: 'Tình huống', markdown: '15 người đá bóng.\nAi rảnh thì đến.' },
				{ label: 'Câu hỏi', markdown: 'Đã là tổ chức chưa?' },
			],
		});
		expect(
			discussionQuestionView('Đánh giá (đọc thêm) — Đừng dạy hết nghề\n\nCâu hỏi: Vì sao?').level,
		).toBe('Đánh giá · đọc thêm');
		expect(
			discussionQuestionView('### Câu 1 · Hiểu — Nhân sự chỉ là giấy tờ\n\nCâu hỏi: Vì sao?'),
		).toMatchObject({
			level: 'Hiểu',
			title: 'Nhân sự chỉ là giấy tờ',
		});
	});

	it('carries a part heading to the questions that follow it', () => {
		const parts = discussionQuestionViews([
			'## Phần 1\n\nCâu hỏi: A?',
			'Câu hỏi: B?',
			'## Phần 2\n\nCâu hỏi: C?',
		]).map((view) => view.part);
		expect(parts).toEqual(['Phần 1', 'Phần 1', 'Phần 2']);
	});

	it('reads the callout and heading format the discussion prompt now asks for', () => {
		const view = discussionQuestionView(
			'### Hiểu — Ba tiệm bánh\n\n> [!EXAMPLE] Tình huống:\n> Tiệm A làm nhanh.\n>\n> Tiệm B làm đúng.\n\n> [!REFLECT] Câu hỏi:\n> Tiệm nào hiệu quả?',
		);
		expect(view.level).toBe('Hiểu');
		expect(view.title).toBe('Ba tiệm bánh');
		expect(view.blocks).toEqual([
			{ label: 'Tình huống', markdown: 'Tiệm A làm nhanh.\n\nTiệm B làm đúng.' },
			{ label: 'Câu hỏi', markdown: 'Tiệm nào hiệu quả?' },
		]);
		const answer = splitLabelled(
			'### Nhắc lại bài học:\nĐịnh nghĩa.\n\n### Cùng suy nghĩ từng bước:\n\n#### Bước 1 —\nSo sánh.\n\n> [!IMPORTANT] Điều rút ra:\n> Một câu.',
			ANSWER_LABELS,
		);
		expect(answer).toEqual([
			{ label: 'Nhắc lại bài học', markdown: 'Định nghĩa.' },
			{ label: 'Cùng suy nghĩ từng bước', markdown: '#### Bước 1 —\nSo sánh.' },
			{ label: 'Điều rút ra', markdown: 'Một câu.' },
		]);
		expect(
			splitLabelled(
				'### Cùng suy nghĩ từng bước — phần (a):\n\n#### Bước 1 —\nXem.\n\n### Kết luận (a):\nĐây là kết luận.',
				ANSWER_LABELS,
			).map((block) => [block.label, block.markdown.split('\n')[0]]),
		).toEqual([
			['Cùng suy nghĩ từng bước', '— phần (a)'],
			['Kết luận', '(a)'],
		]);
	});

	it('leaves free-form prompts as plain markdown', () => {
		expect(discussionQuestionView('Vì sao nhóm trễ hạn — theo bạn?')).toEqual({
			part: null,
			level: null,
			title: null,
			blocks: [{ label: null, markdown: 'Vì sao nhóm trễ hạn — theo bạn?' }],
		});
	});

	it('splits answers at paragraph-leading labels only, never inside code fences', () => {
		const blocks = splitLabelled(
			'Nhắc lại bài học: Định nghĩa.\n\nCùng suy nghĩ từng bước:\n\nBước 1 — Điều rút ra: chưa phải nhãn.\n\n```\nĐiều rút ra: trong code\n```\n\nĐiều rút ra: Một câu.',
			ANSWER_LABELS,
		);
		expect(blocks.map((block) => block.label)).toEqual([
			'Nhắc lại bài học',
			'Cùng suy nghĩ từng bước',
			'Điều rút ra',
		]);
		expect(blocks[1].markdown).toContain('Điều rút ra: trong code');
	});
});
