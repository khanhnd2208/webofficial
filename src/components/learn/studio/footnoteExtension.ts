'use client';

import { mergeAttributes, Node } from '@tiptap/core';

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		learnFootnote: {
			insertFootnote: () => ReturnType;
		};
	}
}

/** `[^id]` inside a paragraph. The definition is a separate block so a save cannot turn it into a link. */
export const FootnoteRef = Node.create({
	name: 'footnoteRef',
	group: 'inline',
	inline: true,
	atom: true,

	addAttributes() {
		return { id: { default: '1' } };
	},

	parseHTML() {
		return [{ tag: 'sup[data-footnote]' }];
	},

	renderHTML({ node }) {
		return ['sup', mergeAttributes({ 'data-footnote': node.attrs.id }), node.attrs.id];
	},

	markdownTokenizer: {
		name: 'footnoteRef',
		level: 'inline',
		start: (src: string) => src.indexOf('[^'),
		tokenize(src: string) {
			const match = /^\[\^([^\]]+)](?!:)/.exec(src);
			if (!match) return undefined;
			return { type: 'footnoteRef', raw: match[0], id: match[1] };
		},
	},

	parseMarkdown(token, helpers) {
		return helpers.createNode('footnoteRef', { id: token.id });
	},

	renderMarkdown(node) {
		return `[^${String(node.attrs?.id ?? '1')}]`;
	},
});

/** `[^id]: Nguồn.` kept as its own block, including a following indented continuation line. */
export const FootnoteDef = Node.create({
	name: 'footnoteDef',
	group: 'block',
	atom: true,

	addAttributes() {
		return {
			id: { default: '1' },
			text: { default: '' },
		};
	},

	parseHTML() {
		return [
			{
				tag: 'li[data-footnote-def]',
				getAttrs: (element) => ({
					id: (element as HTMLElement).dataset.footnoteDef ?? '1',
					text: (element as HTMLElement).textContent ?? '',
				}),
			},
		];
	},

	renderHTML({ node }) {
		return ['li', mergeAttributes({ 'data-footnote-def': node.attrs.id }), node.attrs.text];
	},

	markdownTokenizer: {
		name: 'footnoteDef',
		level: 'block',
		start: (src: string) => {
			const match = /^\[\^[^\]]+]:/m.exec(src);
			return match?.index ?? -1;
		},
		tokenize(src: string) {
			const match = /^\[\^([^\]]+)]:[ \t]*([^\n]*)(?:\n[ \t]+[^\n]*)*/.exec(src);
			if (!match) return undefined;
			const text = match[0]
				.replace(/^\[\^[^\]]+]:[ \t]*/, '')
				.split('\n')
				.map((line) => line.replace(/^[ \t]+/, ''))
				.join(' ')
				.trim();
			return { type: 'footnoteDef', raw: match[0], id: match[1], text };
		},
	},

	parseMarkdown(token, helpers) {
		return helpers.createNode('footnoteDef', { id: token.id, text: token.text ?? '' });
	},

	renderMarkdown(node) {
		return `[^${String(node.attrs?.id ?? '1')}]: ${String(node.attrs?.text ?? '').trim()}`;
	},

	addCommands() {
		return {
			insertFootnote:
				() =>
				({ state, chain }) => {
					const ids = new Set<string>();
					state.doc.descendants((node) => {
						if (node.type.name === 'footnoteRef' || node.type.name === 'footnoteDef') {
							ids.add(String(node.attrs.id));
						}
					});
					let next = 1;
					while (ids.has(String(next))) next += 1;
					const id = String(next);
					return chain()
						.insertContent([
							{ type: 'footnoteRef', attrs: { id } },
							{ type: 'footnoteDef', attrs: { id, text: '' } },
						])
						.run();
				},
		};
	},
});
