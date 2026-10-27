import { Editor } from '@tiptap/core';
import { describe, expect, it } from 'vitest';

import { normalizeEditorMarkdown } from '@/features/learn/content';

import { addEditorImageSlots } from './editorImageHints';
import { learnEditorExtensions } from './editorExtensions';

describe('image slots in the visual editor', () => {
	it('adds a slot above captions and replaces picture notes', () => {
		const editor = new Editor({
			extensions: learnEditorExtensions(),
			contentType: 'markdown',
			content:
				'Mở đầu.\n\n*Hình 1: Quy trình*\n\n[Hình ảnh: sơ đồ]\n\nĐoạn.\n\n![Có rồi](/a.webp)\n\nHình 2: đã có ảnh',
		});
		expect(addEditorImageSlots(editor)).toBe(2);
		expect(normalizeEditorMarkdown(editor.getMarkdown())).toBe(
			'Mở đầu.\n\n![Hình 1: Quy trình]()\n\n*Hình 1: Quy trình*\n\n![Hình ảnh: sơ đồ]()\n\nĐoạn.\n\n![Có rồi](/a.webp)\n\nHình 2: đã có ảnh',
		);
		expect(addEditorImageSlots(editor)).toBe(0);
		editor.destroy();
	});
});
