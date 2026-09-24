import { Editor } from '@tiptap/core';
import { describe, expect, it } from 'vitest';

import { normalizeEditorMarkdown } from '@/features/learn/content';

import { learnEditorExtensions } from './editorExtensions';

/** Markdown → studio editor → markdown, using the exact extension set the studio ships. */
function roundTrip(markdown: string): string {
	const editor = new Editor({ extensions: learnEditorExtensions(), content: markdown, contentType: 'markdown' });
	const out = normalizeEditorMarkdown(editor.getMarkdown());
	editor.destroy();
	return out;
}

describe('studio editor markdown round-trip', () => {
	it('keeps an image with alt and title', () => {
		const md = '![Sơ đồ](/uploads/a.png "Hình 1")';
		expect(roundTrip(md)).toBe(md);
	});

	it('keeps an inline image between text', () => {
		const md = 'Xem hình ![icon](/uploads/b.png) bên cạnh';
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
