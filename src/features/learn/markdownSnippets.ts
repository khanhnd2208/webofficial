import { CALLOUT_KINDS, CALLOUT_LABELS, calloutTag, type CalloutKind } from './callouts';

export interface MarkdownSnippet {
	id: string;
	label: string;
	/** Markdown inserted or copied. `▍` marks where the caret lands; it is removed on insert. */
	text: string;
	/** Inline snippets go inside a line; block snippets get blank lines around them. */
	inline?: boolean;
}

export const CARET = '▍';

const CALLOUT_SAMPLE: Record<CalloutKind, string> = {
	definition: 'Khái niệm',
	quote: '',
	example: 'Tình huống',
	reflect: 'Câu hỏi',
	note: '',
	tip: '',
	warning: '',
	important: 'Điều rút ra',
};

export function calloutSnippet(kind: CalloutKind): MarkdownSnippet {
	const title = CALLOUT_SAMPLE[kind];
	return {
		id: `callout-${kind}`,
		label: CALLOUT_LABELS[kind],
		text: `> [!${calloutTag(kind)}]${title ? ` ${title}` : ''}\n> ${CARET}`,
	};
}

/** Building blocks of a reading section, in the order the insert bar shows them. */
export const READING_SNIPPETS: MarkdownSnippet[] = [
	{ id: 'h2', label: 'Tiêu đề lớn', text: `## ${CARET}` },
	{ id: 'h3', label: 'Tiêu đề nhỏ', text: `### ${CARET}` },
	{ id: 'bold', label: 'In đậm', text: `**${CARET}**`, inline: true },
	{ id: 'list', label: 'Gạch đầu dòng', text: `- ${CARET}\n- ` },
	{ id: 'ordered', label: 'Danh sách số', text: `1. ${CARET}\n2. ` },
	{
		id: 'table',
		label: 'Bảng',
		text: `| Cột 1 | Cột 2 |\n| --- | --- |\n| ${CARET} |  |`,
	},
	{ id: 'image', label: 'Hình', text: `![Mô tả hình${CARET}](ten-anh.png)` },
	{
		id: 'footnote',
		label: 'Chú thích',
		text: `Câu cần dẫn nguồn.[^1]\n\n[^1]: ${CARET}`,
	},
];

export const CALLOUT_SNIPPETS: MarkdownSnippet[] = CALLOUT_KINDS.map(calloutSnippet);

/** Delimiters the "Nhập bằng AI" box understands. */
export const IMPORT_SNIPPETS: MarkdownSnippet[] = [
	{
		id: 'import-section',
		label: 'Mục đọc',
		text: `=== SECTION: Tên mục ===\n\n${CARET}Nội dung mục…`,
	},
	{
		id: 'import-quiz',
		label: 'Bài kiểm tra',
		text: [
			'=== QUIZ: Kiểm tra cuối bài ===',
			'',
			'Câu 1: Câu hỏi?',
			'A. Phương án một',
			'B. Phương án hai',
			'Đáp án: A',
			'Giải thích: Vì sao A đúng.',
		].join('\n'),
	},
	{
		id: 'import-discussion',
		label: 'Câu hỏi phản biện',
		text: [
			'=== DISCUSSION: Câu hỏi phản biện ===',
			'',
			'Câu 1:',
			'### Áp dụng — Tên tình huống',
			'> [!EXAMPLE] Tình huống:',
			'> Mô tả tình huống.',
			'',
			'> [!REFLECT] Câu hỏi:',
			'> Bạn sẽ làm gì?',
			'',
			'Đáp án mẫu:',
			'### Lời giải:',
			'Gợi ý trả lời.',
		].join('\n'),
	},
];

/** Snippet text without the caret marker, for copying. */
export function snippetText(snippet: MarkdownSnippet): string {
	return snippet.text.replace(CARET, '');
}

/**
 * Insert a snippet into `value` at the selection. Block snippets start on their own
 * paragraph. Returns the new text and where the caret should go.
 */
export function insertSnippet(
	value: string,
	start: number,
	end: number,
	snippet: MarkdownSnippet,
): { value: string; caret: number } {
	const before = value.slice(0, start);
	const after = value.slice(end);
	const selected = value.slice(start, end);
	let body = snippet.text;
	if (selected && body.includes(CARET)) body = body.replace(CARET, `${selected}${CARET}`);
	let lead = '';
	let trail = '';
	if (!snippet.inline) {
		if (before && !before.endsWith('\n\n')) lead = before.endsWith('\n') ? '\n' : '\n\n';
		if (after && !after.startsWith('\n\n')) trail = after.startsWith('\n') ? '\n' : '\n\n';
	}
	const marked = `${lead}${body}${trail}`;
	const at = marked.indexOf(CARET);
	const inserted = marked.replace(CARET, '');
	const caret = before.length + (at < 0 ? inserted.length - trail.length : at);
	return { value: `${before}${inserted}${after}`, caret };
}
