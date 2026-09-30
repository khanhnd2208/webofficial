/**
 * `[^id]` and `[^id]: source` become a superscript plus a list the reader can style.
 * Definitions are removed from the flow and rendered once, at the end of the tree.
 */

interface MdNode {
	type: string;
	value?: string;
	children?: MdNode[];
	data?: Record<string, unknown>;
	url?: string;
}

const REF_RE = /\[\^([^\]]+)](?!:)/g;

function textNode(value: string): MdNode {
	return { type: 'text', value };
}

function splitRefs(node: MdNode, notes: Map<string, string>): MdNode[] {
	if (node.type !== 'text' || typeof node.value !== 'string' || !node.value.includes('[^'))
		return [node];
	const parts: MdNode[] = [];
	let last = 0;
	for (const match of node.value.matchAll(REF_RE)) {
		const index = match.index ?? 0;
		if (index > last) parts.push(textNode(node.value.slice(last, index)));
		const id = match[1];
		notes.set(id, notes.get(id) ?? '');
		parts.push({
			type: 'footnoteReference',
			data: { hName: 'sup', hProperties: { className: ['ln-fn'], id: `fnref-${id}` } },
			children: [
				{
					type: 'link',
					url: `#fn-${id}`,
					children: [textNode(id)],
				},
			],
		});
		last = index + match[0].length;
	}
	if (last < node.value.length) parts.push(textNode(node.value.slice(last)));
	return parts;
}

function isDefinition(node: MdNode): { id: string; text: string } | null {
	if (node.type !== 'paragraph' || node.children?.[0]?.type !== 'text') return null;
	const value = node.children[0].value ?? '';
	const match = /^\[\^([^\]]+)]:\s*(.*)$/.exec(value);
	if (!match) return null;
	const rest = node.children
		.slice(1)
		.map((child) => (child.type === 'text' ? (child.value ?? '') : ''))
		.join('');
	return { id: match[1], text: `${match[2]}${rest}`.trim() };
}

function walk(node: MdNode, notes: Map<string, string>): MdNode | null {
	const definition = isDefinition(node);
	if (definition) {
		notes.set(definition.id, definition.text);
		return null;
	}
	if (node.children) {
		node.children = node.children.flatMap((child) => {
			if (child.type === 'text') return splitRefs(child, notes);
			const next = walk(child, notes);
			return next ? [next] : [];
		});
	}
	return node;
}

export default function remarkLearnFootnotes() {
	return (tree: MdNode) => {
		const notes = new Map<string, string>();
		walk(tree, notes);
		if (!notes.size || !tree.children) return;
		tree.children.push({
			type: 'footnoteList',
			data: { hName: 'ol', hProperties: { className: ['ln-footnotes'] } },
			children: [...notes.entries()].map(([id, text]) => ({
				type: 'footnoteItem',
				data: { hName: 'li', hProperties: { id: `fn-${id}` } },
				children: [textNode(text || id)],
			})),
		});
	};
}
