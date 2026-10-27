import { describe, expect, it } from 'vitest';

import { parseDiscussionPaste } from './discussionImport';
import { discussionImportReport, lessonImportReport } from './importChecks';
import { cleanAiPaste, parseCourseMarkdown } from './lessonImport';

function discussion(raw: string, existingCount = 0) {
	const cleaned = cleanAiPaste(raw);
	const parsed = parseDiscussionPaste(cleaned.markdown);
	return discussionImportReport({
		markdown: cleaned.markdown,
		pasteWarnings: cleaned.warnings,
		questions: parsed.questions,
		parseWarnings: parsed.warnings,
		existingCount,
	});
}

const GOOD = [
	'## Phần 1. Nền tảng',
	'',
	'Câu 1:',
	'### Hiểu — Tiêu đề',
	'',
	'> [!EXAMPLE] Tình huống:',
	'> Một nhóm bạn.',
	'',
	'> [!REFLECT] Câu hỏi:',
	'> Vì sao?',
	'',
	'Đáp án mẫu:',
	'',
	'### Cùng suy nghĩ từng bước:',
	'',
	'#### Bước 1 —',
	'Nhìn lại.',
	'',
	'> [!IMPORTANT] Điều rút ra:',
	'> Kết.',
].join('\n');

describe('discussionImportReport', () => {
	it('passes a paste that follows the format prompt', () => {
		expect(discussion(GOOD)).toEqual({ issues: [], errors: 0, warnings: 0 });
	});

	it('flags a missing answer and a missing question block per question', () => {
		const report = discussion('Câu 1:\n### Hiểu — Một\n\nVì sao?');
		expect(report.errors).toBe(0);
		expect(report.issues.map((issue) => [issue.question, issue.text])).toEqual([
			[1, 'Chưa có đáp án mẫu.'],
			[1, 'Chưa có khối Câu hỏi, học viên không thấy rõ câu cần trả lời.'],
		]);
	});

	it('flags ## inside a question and steps left in plain paragraphs', () => {
		const raw = GOOD.replace('#### Bước 1 —\nNhìn lại.', 'Bước 1 — Nhìn lại.\n\n## Lạc đề');
		const texts = discussion(raw).issues.map((issue) => issue.text);
		expect(texts).toContain('Có dòng ## giữa câu, sẽ hiện như tiêu đề nhóm.');
		expect(texts).toContain('"Bước n —" còn dính đầu đoạn, các bước không tách nhau.');
	});

	it('ignores step-like lines inside code fences', () => {
		const raw = GOOD.replace('#### Bước 1 —\nNhìn lại.', '```\nBước 1 — ví dụ\n```');
		expect(discussion(raw).issues).toEqual([]);
	});

	it('blocks saving when the answer line is missing and the question grows too long', () => {
		const report = discussion(`Câu 1:\n> [!REFLECT] Câu hỏi:\n> ${'x'.repeat(8_001)}`);
		expect(report.errors).toBe(1);
		expect(report.issues[0]).toMatchObject({ level: 'error', question: 1 });
	});

	it('blocks a paste with no question and a section over the question limit', () => {
		expect(discussion('Chỉ là một đoạn văn.').issues[0]).toMatchObject({
			level: 'error',
			text: 'Không tìm thấy câu nào.',
		});
		expect(discussion(GOOD, 200).errors).toBe(1);
	});

	it('tells the admin to ask for the rest of a truncated answer', () => {
		const report = discussion(`\`\`\`\`markdown\n${GOOD}\n\`\`\`\`\n<<<CÒN TIẾP>>>`);
		expect(report.issues).toEqual([
			expect.objectContaining({ level: 'warn', fix: expect.stringContaining("'tiếp'") }),
		]);
	});

	it('counts images that still need uploading', () => {
		const report = discussion(`${GOOD}\n\n![Sơ đồ](hinh-1.png)`);
		expect(report.issues).toEqual([
			expect.objectContaining({ text: '1 ảnh chưa tải lên, học viên sẽ không thấy.' }),
		]);
	});
});

describe('lessonImportReport', () => {
	function lesson(raw: string, merging = false) {
		const cleaned = cleanAiPaste(raw);
		const parsed = parseCourseMarkdown(cleaned.markdown);
		return lessonImportReport({
			markdown: cleaned.markdown,
			parsed: { ...parsed, warnings: [...cleaned.warnings, ...parsed.warnings] },
			merging,
		});
	}

	it('passes a sectioned lesson', () => {
		expect(lesson('# Bài\n\n=== SECTION: Mở đầu ===\n\nNội dung.').issues).toEqual([]);
	});

	it('explains how to add section markers', () => {
		const [issue] = lesson('# Bài\n\nNội dung.').issues;
		expect(issue).toMatchObject({ level: 'warn', fix: expect.stringContaining('=== SECTION') });
	});

	it('warns before merging several lessons into one', () => {
		const report = lesson(
			'# Một\n\n=== SECTION: A ===\n\nx\n\n# Hai\n\n=== SECTION: B ===\n\ny',
			true,
		);
		expect(report.issues.map((issue) => issue.text)).toContain(
			'Có nhiều dòng # — chế độ này sẽ gộp nhiều bài vào một bài.',
		);
	});
});

describe('answer left in the prompt', () => {
	it('blocks saving when the answer line was missed', () => {
		const cleaned = cleanAiPaste(
			'Câu 1:\n> [!REFLECT] Câu hỏi:\n> Vì sao?\n\nGợi ý trả lời\n\n### Nhắc lại bài học:\nLời giải.',
		);
		const parsed = parseDiscussionPaste(cleaned.markdown);
		const report = discussionImportReport({
			markdown: cleaned.markdown,
			pasteWarnings: cleaned.warnings,
			questions: parsed.questions,
			parseWarnings: parsed.warnings,
		});
		expect(report.errors).toBe(1);
		expect(report.issues[0].text).toMatch(/Lời giải đang nằm trong đề bài/);
	});
});

describe('captions without a picture', () => {
	it('warns where pasted text still names a picture', () => {
		const raw = '# Bài 1\n\n## Mục\n\nNội dung.\n\nHình 1: Quy trình\n\n[Hình ảnh: sơ đồ]';
		const report = lessonImportReport({ markdown: raw, parsed: parseCourseMarkdown(raw) });
		expect(report.errors).toBe(0);
		expect(report.issues.map((issue) => issue.text)).toContain(
			'2 chỗ có chú thích hoặc ghi chú hình nhưng chưa có ảnh.',
		);
	});
});
