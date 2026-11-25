import { describe, expect, it } from 'vitest';

import rehypeTableLabels from './rehypeTableLabels';

type Node = {
	type: string;
	tagName?: string;
	value?: string;
	properties?: Record<string, unknown>;
	children?: Node[];
};

const text = (value: string): Node => ({ type: 'text', value });
const el = (tagName: string, children: Node[] = []): Node => ({
	type: 'element',
	tagName,
	properties: {},
	children,
});

describe('rehypeTableLabels', () => {
	it('labels each body cell with its column header and keeps table roles', () => {
		const row = el('tr', [el('td', [text('Hiểu')]), el('td', [text('Vì sao…')])]);
		const table = el('table', [
			el('thead', [el('tr', [el('th', [text('Mức')]), el('th', [text('Dạng câu hỏi')])])]),
			el('tbody', [row]),
		]);
		rehypeTableLabels()({ type: 'root', children: [table] });
		expect(row.children?.map((cell) => cell.properties)).toEqual([
			{ dataLabel: 'Mức', role: 'cell' },
			{ dataLabel: 'Dạng câu hỏi', role: 'cell' },
		]);
		expect(table.properties).toEqual({ role: 'table' });
	});

	it('leaves a table without headers alone', () => {
		const row = el('tr', [el('td', [text('a')])]);
		const table = el('table', [el('tbody', [row])]);
		rehypeTableLabels()({ type: 'root', children: [table] });
		expect(row.children?.[0].properties).toEqual({});
	});
});
