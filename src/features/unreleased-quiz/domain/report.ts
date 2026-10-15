import type { GroupId, QuestionId } from './quiz';

export type ResponseRow = {
	id: string;
	respondentId: string;
	createdAt: Date;
	group: string;
	variant: string | null;
	note: string | null;
	q1: string;
	q2: string | null;
	q3: string;
	q4: string;
	q5: string | null;
	q6: string | null;
	q7: string | null;
	registerClickedAt: Date | null;
};

export type QuizReport = {
	responses: number;
	people: number;
	retakes: number;
	registerClickPeople: number;
	groups: Record<GroupId, number>;
	variants: Record<string, number>;
	notes: Record<string, number>;
	/** Per question: option letter → people whose latest answer was that letter. */
	answers: Record<QuestionId, Record<string, number>>;
	/** Completions per local day (Asia/Ho_Chi_Minh), oldest first. */
	daily: { day: string; responses: number }[];
};

const QUESTION_IDS: QuestionId[] = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'];

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
	timeZone: 'Asia/Ho_Chi_Minh',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
});

export const localDay = (date: Date) => dayFormatter.format(date);

/**
 * Group and answer counts use each person's latest run, so a retake does not
 * count twice. Response and daily counts include every run.
 */
export function summarizeResponses(rows: ResponseRow[]): QuizReport {
	const latest = new Map<string, ResponseRow>();
	const clicked = new Set<string>();
	const daily = new Map<string, number>();

	for (const row of rows) {
		const current = latest.get(row.respondentId);
		if (!current || row.createdAt > current.createdAt) latest.set(row.respondentId, row);
		if (row.registerClickedAt) clicked.add(row.respondentId);
		const day = localDay(row.createdAt);
		daily.set(day, (daily.get(day) ?? 0) + 1);
	}

	const groups: Record<GroupId, number> = {
		'chua-chon-bai': 0,
		'ban-nhap': 0,
		'doi-giong': 0,
		'dung-bai': 0,
	};
	const variants: Record<string, number> = {};
	const notes: Record<string, number> = {};
	const answers = Object.fromEntries(QUESTION_IDS.map((id) => [id, {}])) as QuizReport['answers'];

	for (const row of latest.values()) {
		if (row.group in groups) groups[row.group as GroupId] += 1;
		if (row.variant) variants[row.variant] = (variants[row.variant] ?? 0) + 1;
		if (row.note) notes[row.note] = (notes[row.note] ?? 0) + 1;
		for (const id of QUESTION_IDS) {
			const key = row[id];
			if (key) answers[id][key] = (answers[id][key] ?? 0) + 1;
		}
	}

	return {
		responses: rows.length,
		people: latest.size,
		retakes: rows.length - latest.size,
		registerClickPeople: clicked.size,
		groups,
		variants,
		notes,
		answers,
		daily: [...daily.entries()]
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([day, responses]) => ({ day, responses })),
	};
}

const CSV_COLUMNS: (keyof ResponseRow)[] = [
	'createdAt',
	'respondentId',
	'group',
	'variant',
	'note',
	'q1',
	'q2',
	'q3',
	'q4',
	'q5',
	'q6',
	'q7',
	'registerClickedAt',
];

const csvCell = (value: unknown) => {
	if (value === null || value === undefined) return '';
	const text = value instanceof Date ? value.toISOString() : String(value);
	return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export function responsesToCsv(rows: ResponseRow[]): string {
	const lines = [CSV_COLUMNS.join(',')];
	for (const row of rows) lines.push(CSV_COLUMNS.map((column) => csvCell(row[column])).join(','));
	return `${lines.join('\n')}\n`;
}
