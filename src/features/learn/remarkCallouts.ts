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

const MARKER_RE = /^\s*\[!([^\]\n]{1,24})\][ \t]*/;

/** Title inlines stay in the header, including `**đậm**` that remark already split into their own nodes. */
function splitTitle(children: MdNode[], markerLength: number): { title: MdNode[]; rest: MdNode[] } {
	const title: MdNode[] = [];
	const rest: MdNode[] = [];
	let inTitle = true;
	children.forEach((child, index) => {
		if (!inTitle) {
			rest.push(child);
			return;
		}
		if (child.type === 'break') {
			inTitle = false;
			return;
		}
		if (child.type === 'text' && typeof child.value === 'string') {
			const value = index === 0 ? child.value.slice(markerLength) : child.value;
			const newline = value.indexOf('\n');
			if (newline >= 0) {
				const head = value.slice(0, newline).trimEnd();
				const tail = value.slice(newline + 1).replace(/^\n/, '');
				if (head) title.push({ type: 'text', value: head });
				if (tail) rest.push({ type: 'text', value: tail });
				inTitle = false;
				return;
			}
			if (value) title.push({ type: 'text', value });
			return;
		}
		title.push(child);
	});
	return { title, rest };
}

function transformBlockquote(node: MdNode) {
	const paragraph = node.children?.[0];
	const text = paragraph?.type === 'paragraph' ? paragraph.children?.[0] : undefined;
	if (!paragraph?.children || text?.type !== 'text' || typeof text.value !== 'string') return;

	const match = text.value.match(MARKER_RE);
	const kind = match ? resolveCalloutKind(match[1]) : null;
	if (!match || !kind) return;

	const { title, rest } = splitTitle(paragraph.children, match[0].length);
	if (rest.length) node.children![0] = { ...paragraph, children: rest };
	else node.children!.shift();

	const header: MdNode = {
		type: 'learnCalloutHeader',
		data: { hName: 'div', hProperties: { className: ['ln-callout__head'] } },
		children: [
			{
				type: 'learnCalloutLabel',
				data: { hName: 'span', hProperties: { className: ['ln-callout__label'] } },
				children: [{ type: 'text', value: CALLOUT_LABELS[kind] }],
			},
			...(title.length
				? [
						{
							type: 'learnCalloutTitle',
							data: { hName: 'span', hProperties: { className: ['ln-callout__title'] } },
							children: title,
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
