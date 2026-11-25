/**
 * Copies each column header onto its body cells as `data-label`, so a narrow screen can show a
 * table row as a small card ("Mức: Hiểu") instead of squeezing three or four columns into 320px.
 */
interface HastNode {
	type: string;
	tagName?: string;
	value?: string;
	properties?: Record<string, unknown>;
	children?: HastNode[];
}

function textOf(node: HastNode): string {
	if (node.type === 'text') return node.value ?? '';
	return (node.children ?? []).map(textOf).join('');
}

function elements(node: HastNode, tagName: string): HastNode[] {
	return (node.children ?? []).filter(
		(child) => child.type === 'element' && child.tagName === tagName,
	);
}

// Screens that show rows as cards drop the table display, which some screen readers read as
// "not a table"; explicit roles keep the table semantics.
const ROLES: Record<string, string> = {
	table: 'table',
	thead: 'rowgroup',
	tbody: 'rowgroup',
	tr: 'row',
	th: 'columnheader',
	td: 'cell',
};

function addRoles(node: HastNode) {
	if (node.type === 'element' && node.tagName && ROLES[node.tagName]) {
		node.properties = { ...node.properties, role: ROLES[node.tagName] };
	}
	for (const child of node.children ?? []) addRoles(child);
}

function labelTable(table: HastNode) {
	const head = elements(table, 'thead')[0];
	const headRow = head ? elements(head, 'tr')[0] : undefined;
	if (!headRow) return;
	const labels = elements(headRow, 'th').map((cell) => textOf(cell).trim());
	if (!labels.some(Boolean)) return;
	addRoles(table);
	for (const body of elements(table, 'tbody')) {
		for (const row of elements(body, 'tr')) {
			elements(row, 'td').forEach((cell, index) => {
				if (labels[index]) cell.properties = { ...cell.properties, dataLabel: labels[index] };
			});
		}
	}
}

function walk(node: HastNode) {
	if (node.type === 'element' && node.tagName === 'table') labelTable(node);
	for (const child of node.children ?? []) walk(child);
}

export default function rehypeTableLabels() {
	return (tree: HastNode) => walk(tree);
}
