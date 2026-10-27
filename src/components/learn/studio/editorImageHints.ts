import type { Editor } from '@tiptap/core';
import type { Node as ProseNode } from '@tiptap/pm/model';

import { imageHintFor, type ImageHintKind } from '@/features/learn/imageHints';

const FIGURE_NODES = new Set(['image', 'codeBlock']);

function isFigure(node: ProseNode | null): boolean {
	return Boolean(node && FIGURE_NODES.has(node.type.name));
}

/**
 * The visual-editor twin of addImageSlots: top-level paragraphs are the standalone lines
 * findImageHints reads from markdown. Returns how many slots were added.
 */
export function addEditorImageSlots(editor: Editor): number {
	const { doc, schema } = editor.state;
	const found: Array<{ pos: number; size: number; kind: ImageHintKind; alt: string }> = [];
	doc.forEach((node, pos, index) => {
		if (node.type.name !== 'paragraph') return;
		const hint = imageHintFor(node.textContent);
		if (!hint) return;
		const before = index > 0 ? doc.child(index - 1) : null;
		const after = index + 1 < doc.childCount ? doc.child(index + 1) : null;
		if (isFigure(before) || isFigure(after)) return;
		found.push({ pos, size: node.nodeSize, ...hint });
	});
	if (!found.length) return 0;
	const tr = editor.state.tr;
	for (const item of found.reverse()) {
		const slot = schema.nodes.image.create({ src: '', alt: item.alt });
		if (item.kind === 'placeholder') tr.replaceWith(item.pos, item.pos + item.size, slot);
		else tr.insert(item.pos, slot);
	}
	editor.view.dispatch(tr);
	return found.length;
}
