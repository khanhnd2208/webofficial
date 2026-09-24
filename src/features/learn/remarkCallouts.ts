/**
 * remark plugin: `> [!KIND] Title` blockquotes → `<aside class="ln-callout" data-kind>`
 * with a label/title header. Unknown tags stay ordinary blockquotes.
 */

import { CALLOUT_LABELS, resolveCalloutKind } from './callouts';

interface MdNode {
	type: string;
	value?: string;
	children?: MdNode[];
	data?: Record<string, unknown>;
}

const MARKER_RE = /^\s*\[!([^\]\n]{1,24})\][ \t]*([^\n]*)(?:\n|$)/;

function transformBlockquote(node: MdNode) {
	const paragraph = node.children?.[0];
	const text = paragraph?.type === 'paragraph' ? paragraph.children?.[0] : undefined;
	if (!paragraph || text?.type !== 'text' || typeof text.value !== 'string') return;

	const match = text.value.match(MARKER_RE);
	const kind = match ? resolveCalloutKind(match[1]) : null;
	if (!match || !kind) return;

	text.value = text.value.slice(match[0].length);
	if (!text.value) paragraph.children!.shift();
	if (paragraph.children![0]?.type === 'break') paragraph.children!.shift();
	if (!paragraph.children!.length) node.children!.shift();

	const title = match[2].trim();
	const header: MdNode = {
		type: 'learnCalloutHeader',
		data: { hName: 'div', hProperties: { className: ['ln-callout__head'] } },
		children: [
			{
				type: 'learnCalloutLabel',
				data: { hName: 'span', hProperties: { className: ['ln-callout__label'] } },
				children: [{ type: 'text', value: CALLOUT_LABELS[kind] }],
			},
			...(title
				? [
						{
							type: 'learnCalloutTitle',
							data: { hName: 'span', hProperties: { className: ['ln-callout__title'] } },
							children: [{ type: 'text', value: title }],
						},
					]
				: []),
		],
	};
	node.children!.unshift(header);
	node.data = {
		...(node.data ?? {}),
		hName: 'aside',
		hProperties: { className: ['ln-callout'], 'data-kind': kind },
	};
}

function walk(node: MdNode) {
	if (node.type === 'blockquote') transformBlockquote(node);
	node.children?.forEach(walk);
}

export default function remarkLearnCallouts() {
	return (tree: MdNode) => walk(tree);
}
