import { parse } from 'csv-parse/sync';

export function detectDelimitedDelimiter(text: string): ',' | ';' | '\t' {
	const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? '';
	let inQuotes = false;
	const counts = { ',': 0, ';': 0, '\t': 0 };
	for (const char of firstLine) {
		if (char === '"') {
			inQuotes = !inQuotes;
			continue;
		}
		if (!inQuotes && (char === ',' || char === ';' || char === '\t')) counts[char] += 1;
	}
	if (counts['\t'] === 0 && counts[';'] === 0 && counts[','] === 0) return ',';
	if (counts['\t'] >= counts[';'] && counts['\t'] >= counts[',']) return '\t';
	if (counts[';'] > counts[',']) return ';';
	return ',';
}

export function parseDelimitedTable(text: string): unknown[][] {
	const source = text.replace(/^\uFEFF/, '');
	if (!source.trim()) return [];
	const rows = parse(source, {
		bom: true,
		relax_quotes: true,
		relax_column_count: true,
		skip_empty_lines: false,
		delimiter: detectDelimitedDelimiter(source),
		columns: false,
		raw: false,
	}) as unknown[][];
	return rows.map((row) => row.map((cell) => (cell == null ? '' : String(cell))));
}

export function isLikelyStudentHeaderRow(row: unknown[]): boolean {
	const labels = row.map((cell) =>
		String(cell ?? '')
			.normalize('NFC')
			.toLowerCase()
			.replace(/\s+/g, ' ')
			.trim(),
	);
	return labels.some((label) => label === 'stt' || label === 'mã sv' || label === 'ma sv');
}
