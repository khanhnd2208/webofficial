import { Editor } from '@tiptap/core';
import { describe, expect, it } from 'vitest';

import { normalizeEditorMarkdown } from '@/features/learn/content';

import { learnEditorExtensions } from './editorExtensions';
import { markdownFromPaste } from './markdownPaste';

function editorWith(markdown: string) {
	return new Editor({
		extensions: learnEditorExtensions(),
		content: markdown,
		contentType: 'markdown',
	});
}

describe('markdown paste into the visual editor', () => {
	it('treats Markdown copied as plain text as Markdown', () => {
		expect(markdownFromPaste('## Mục\n\nĐoạn.', '')).toBe('## Mục\n\nĐoạn.');
		expect(
			markdownFromPaste('> [!NOTE] Ghi chú\n> nội dung', '<div><span>&gt; [!NOTE]</span></div>'),
		).not.toBeNull();
		expect(markdownFromPaste('| A | B |\n|---|---|\n| 1 | 2 |', '')).not.toBeNull();
		expect(markdownFromPaste('- một\n- hai', '')).not.toBeNull();
		expect(markdownFromPaste('Xem:\n````markdown\n## Mục\n````', '')).toBe('## Mục');
	});

	it('keeps the default paste for prose and for rich HTML', () => {
		expect(markdownFromPaste('Một đoạn văn bình thường.', '')).toBeNull();
		expect(markdownFromPaste('Một câu có dấu - gạch ngang.', '')).toBeNull();
		expect(markdownFromPaste('## Mục', '<h2>Mục</h2>')).toBeNull();
	});

	it('inserts the parsed blocks', () => {
		const editor = editorWith('');
		const markdown = markdownFromPaste(
			'## Mục\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n> [!NOTE] Ghi chú\n> nội dung\n\n![Sơ đồ]()',
			'',
		)!;
		editor.chain().insertContent(markdown, { contentType: 'markdown' }).run();
		const out = normalizeEditorMarkdown(editor.getMarkdown());
		expect(out).toContain('## Mục');
		expect(out).toMatch(/^\| A +\| B +\|$/m);
		expect(out).toContain('> [!NOTE] Ghi chú');
		expect(out).toContain('![Sơ đồ]()');
		editor.destroy();
	});
});
