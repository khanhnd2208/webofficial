import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Editor } from '@tiptap/core';
import { describe, expect, it } from 'vitest';

import { normalizeEditorMarkdown } from '@/features/learn/content';
import { cleanAiPaste, parseCourseMarkdown } from '@/features/learn/lessonImport';
import { lectureWords } from '@/features/learn/textFidelity';

import { learnEditorExtensions } from './editorExtensions';

/** Markdown → studio editor → markdown, using the exact extension set the studio ships. */
function roundTrip(markdown: string): string {
	const editor = new Editor({
		extensions: learnEditorExtensions(),
		content: markdown,
		contentType: 'markdown',
	});
	const out = normalizeEditorMarkdown(editor.getMarkdown());
	editor.destroy();
	return out;
}

describe('studio editor markdown round-trip', () => {
	it('keeps an image with alt and title', () => {
		const md = '![Sơ đồ](/uploads/a.png "Hình 1")';
		expect(roundTrip(md)).toBe(md);
	});

	it('keeps a sized image with its caption', () => {
		const md = '![Sơ đồ](/uploads/a.webp#w=50 "Hình 1")';
		expect(roundTrip(md)).toBe(md);
	});

	it('keeps a footnote reference and its definition', () => {
		const md = 'Câu[^1] tiếp.\n\n[^1]: Nguồn.';
		expect(roundTrip(md)).toBe(md);
	});

	it('escapes a literal pipe inside a table cell instead of dropping it', () => {
		const md = ['| A | B |', '| --- | --- |', '| a \\| b | 2 |'].join('\n');
		const once = roundTrip(md);
		expect(once).toContain('a \\| b');
		// Must stay stable: re-running through the editor should not re-corrupt or double-escape it.
		expect(roundTrip(once)).toBe(once);
	});

	it('keeps a nested ordered list nested after a save', () => {
		const md = '1. Một\n2. Hai\n   1. Hai-một\n   2. Hai-hai\n3. Ba';
		const once = roundTrip(md);
		expect(once).toMatch(/\n {4}1\. Hai-một/);
		// A second pass must not lose another level of indent.
		expect(roundTrip(once)).toBe(once);
	});

	it('round-trips an empty callout back to just its header, no stray &nbsp;', () => {
		const md = '> [!IMPORTANT] Chỉ có tiêu đề';
		expect(roundTrip(md)).toBe(md);
	});

	it('keeps callout body text intact next to an empty one', () => {
		const md = '> [!NOTE] A\n> một\n\n> [!TIP] B\n> hai';
		const once = roundTrip(md);
		expect(once).toContain('một');
		expect(once).toContain('hai');
	});

	it('keeps lecture words for each reading section of the sample lecture', () => {
		const ai = readFileSync(
			path.join(import.meta.dirname, '../../../features/learn/__fixtures__/sample-lecture.ai.md'),
			'utf8',
		);
		const reading = parseCourseMarkdown(ai).lessons[0].sections.filter(
			(section) => section.type === 'READING',
		);
		expect(reading.length).toBeGreaterThan(0);
		for (const section of reading) {
			expect(lectureWords(roundTrip(section.markdown))).toEqual(lectureWords(section.markdown));
		}
		const body = cleanAiPaste(ai).markdown;
		expect(body).toContain('> [!QUOTE]');
		expect(body).toContain('[^1]:');
		expect(body).toContain('a \\| b');
	});

	it('keeps a mermaid fence and an empty table cell', () => {
		const md = [
			'```mermaid',
			'flowchart TD',
			'    A["Kim tự tháp"] --> B["Cấp dưới"]',
			'```',
			'',
			'|  | B |',
			'| --- | --- |',
			'| một | hai |',
		].join('\n');
		const once = roundTrip(md);
		expect(once).toContain('```mermaid');
		expect(once).toContain('flowchart TD');
		expect(once).toMatch(/\|\s+\|\s+B\s+\|/);
		expect(once).not.toContain('&nbsp;');
		expect(roundTrip(once)).toBe(once);
	});

	it('keeps a multi-paragraph callout', () => {
		const md = '> [!EXAMPLE] Toyota\n> Đoạn một.\n>\n> Đoạn hai.';
		expect(lectureWords(roundTrip(md))).toEqual(lectureWords(md));
	});

	it('is stable across two passes for a mixed document', () => {
		const md = [
			'## Khái niệm',
			'',
			'Đoạn văn **đậm** và *nghiêng*.',
			'',
			'![Sơ đồ](/uploads/a.png "Hình 1")',
			'',
			'> [!DEFINITION] Quản trị',
			'> Quản trị là quá trình **hoạch định**.',
			'',
			'| Cột A | Cột B |',
			'| --- | --- |',
			'| 1 | a \\| b |',
		].join('\n');
		const once = roundTrip(md);
		expect(roundTrip(once)).toBe(once);
	});
});
