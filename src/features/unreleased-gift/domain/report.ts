export type FeedbackRow = {
	id: string;
	createdAt: Date;
	overall: number;
	usefulness: number;
	clarity: number;
	comment: string | null;
};

export const RATING_LABELS = {
	overall: 'Cảm nhận tổng quan',
	usefulness: 'Kiến thức hữu ích',
	clarity: 'Truyền đạt dễ hiểu',
} as const;

export function feedbackSummary(rows: FeedbackRow[]) {
	const count = rows.length;
	const average = (key: 'overall' | 'usefulness' | 'clarity') =>
		count ? rows.reduce((sum, row) => sum + row[key], 0) / count : null;
	return {
		count,
		comments: rows.filter((row) => Boolean(row.comment?.trim())).length,
		averages: {
			overall: average('overall'),
			usefulness: average('usefulness'),
			clarity: average('clarity'),
		},
	};
}

/** Quote CSV cells and neutralize spreadsheet formulas in free-text comments. */
function csvCell(value: string): string {
	const safe = /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
	return `"${safe.replaceAll('"', '""')}"`;
}

export function feedbackToCsv(rows: FeedbackRow[]): string {
	const lines = ['createdAt,overall,usefulness,clarity,comment'];
	for (const row of rows) {
		lines.push(
			[
				row.createdAt.toISOString(),
				String(row.overall),
				String(row.usefulness),
				String(row.clarity),
				row.comment ?? '',
			]
				.map(csvCell)
				.join(','),
		);
	}
	return `${lines.join('\n')}\n`;
}
