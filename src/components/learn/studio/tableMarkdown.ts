import { Table } from '@tiptap/extension-table';

/**
 * @tiptap/extension-table's `renderTableToMarkdown` collapses each cell's inline markdown
 * but never escapes a literal `|`, so a cell like "a | b" adds a phantom column the next
 * time the table is parsed back. This is that renderer with the one missing escape added.
 */
const DEFAULT_CELL_LINE_SEPARATOR = '';

function collapseWhitespace(value: string): string {
	return (value || '').replace(/\s+/g, ' ').trim();
}

function escapeCellPipes(value: string): string {
	return value.replace(/\\?\|/g, (match) => (match === '\\|' ? match : '\\|'));
}

export const LearnTable = Table.extend({
	renderMarkdown(node, h) {
		const cellSep = DEFAULT_CELL_LINE_SEPARATOR;
		if (!node?.content || node.content.length === 0) return '';

		const rows: Array<Array<{ text: string; isHeader: boolean }>> = [];
		node.content.forEach((rowNode) => {
			const cells: Array<{ text: string; isHeader: boolean }> = [];
			rowNode.content?.forEach((cellNode) => {
				let raw = '';
				if (cellNode.content && Array.isArray(cellNode.content) && cellNode.content.length > 1) {
					raw = cellNode.content.map((child) => h.renderChildren([child])).join(cellSep);
				} else {
					raw = cellNode.content ? h.renderChildren(cellNode.content) : '';
				}
				const text = escapeCellPipes(collapseWhitespace(raw));
				cells.push({ text, isHeader: cellNode.type === 'tableHeader' });
			});
			rows.push(cells);
		});

		const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
		if (columnCount === 0) return '';

		const colWidths = new Array(columnCount).fill(0);
		rows.forEach((row) => {
			for (let i = 0; i < columnCount; i += 1) {
				const length = (row[i]?.text || '').length;
				if (length > colWidths[i]) colWidths[i] = length;
				if (colWidths[i] < 3) colWidths[i] = 3;
			}
		});

		const pad = (value: string, width: number) => value + ' '.repeat(Math.max(0, width - value.length));
		const headerRow = rows[0];
		const hasHeader = headerRow.some((cell) => cell.isHeader);
		const headerTexts = new Array(columnCount)
			.fill(0)
			.map((_, i) => (hasHeader ? headerRow[i]?.text || '' : ''));

		let out = '\n';
		out += `| ${headerTexts.map((text, i) => pad(text, colWidths[i])).join(' | ')} |\n`;
		out += `| ${colWidths.map((width) => '-'.repeat(Math.max(3, width))).join(' | ')} |\n`;

		const body = hasHeader ? rows.slice(1) : rows;
		body.forEach((row) => {
			out += `| ${new Array(columnCount).fill(0).map((_, i) => pad(row[i]?.text || '', colWidths[i])).join(' | ')} |\n`;
		});

		return out;
	},
});
