/**
 * Reads the conventions discussion prompts are written in, so the learner view can give each part its own
 * weight without changing what is stored:
 *
 *   ## Phần 1. …                      → part (carried to later questions by the viewer)
 *   Áp dụng — Nhóm bạn đá bóng …      → level + title (also as a ### heading)
 *   Tình huống: … / Câu hỏi: …        → labelled blocks, also written as `> [!EXAMPLE] Tình huống:`
 *   Nhắc lại bài học: … / Điều rút ra: …   or `### Nhắc lại bài học:` / `> [!IMPORTANT] Điều rút ra:`
 *
 * Anything that does not follow them falls through as plain markdown.
 */

export interface DiscussionBlock {
	label: string | null;
	markdown: string;
}

export interface DiscussionQuestionView {
	part: string | null;
	level: string | null;
	title: string | null;
	blocks: DiscussionBlock[];
}

/** Accepts an optional `Câu N ·` prefix that the discussion prompts now carry. */
const LEVEL_RE = /^(?:Câu\s+\d+\s*·\s*)?(Nhớ|Hiểu|Áp dụng|Vận dụng|Phân tích|Đánh giá|Sáng tạo)\s*(?:\(([^)]+)\))?\s+[—–]\s+(\S.*)$/i;

export const QUESTION_LABELS = ['Tình huống', 'Bối cảnh', 'Case', 'Câu hỏi', 'Yêu cầu'];
export const ANSWER_LABELS = [
	'Nhắc lại bài học',
	'Kiến thức cần dùng',
	'Gợi nhớ',
	'Cùng suy nghĩ từng bước',
	'Lời giải',
	'Điều rút ra',
	'Kết luận',
	'Ghi nhớ',
];
/** Labels whose block is the one thing a learner should ask for or keep. */
export const ASK_LABELS = ['Câu hỏi', 'Yêu cầu'];
export const TAKEAWAY_LABELS = ['Điều rút ra', 'Kết luận', 'Ghi nhớ'];
/** Recap of the lesson: quieter than the question and the takeaway. */
export const RECALL_LABELS = ['Nhắc lại bài học', 'Kiến thức cần dùng', 'Gợi nhớ'];
/** Worked steps, written with `#### Bước N`. */
export const STEP_LABELS = ['Cùng suy nghĩ từng bước', 'Lời giải'];

function escape(text: string) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Splits at paragraphs that open with one of `labels` followed by a colon, written plain, as a ###/####
 * heading, or as a callout title (`> [!EXAMPLE] Tình huống:`), in which case the callout body is unquoted.
 * Fenced code is never split.
 */
export function splitLabelled(markdown: string, labels: string[]): DiscussionBlock[] {
	const labelRe = new RegExp(
		`^(>\\s*\\[![A-Za-z]+\\]\\s*|#{2,4}\\s+)?(?:\\*\\*)?(${labels.map(escape).join('|')})(?:\\*\\*)?\\s*[:：]\\s*(?:\\*\\*)?\\s*(.*)$`,
		'i',
	);
	const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
	const blocks: Array<{ label: string | null; lines: string[] }> = [{ label: null, lines: [] }];
	let fenced = false;
	let quoted = false;

	lines.forEach((line, index) => {
		if (!line.trim()) quoted = false;
		if (quoted) {
			blocks[blocks.length - 1].lines.push(line.replace(/^\s*>\s?/, ''));
			return;
		}
		if (/^\s*(`{3,}|~{3,})/.test(line)) fenced = !fenced;
		const atParagraphStart = index === 0 || !lines[index - 1].trim();
		const match = !fenced && atParagraphStart ? line.trim().match(labelRe) : null;
		if (match) {
			const label = labels.find((item) => item.toLowerCase() === match[2].toLowerCase()) ?? match[2];
			quoted = Boolean(match[1]?.startsWith('>'));
			blocks.push({ label, lines: match[3] ? [match[3]] : [] });
			return;
		}
		blocks[blocks.length - 1].lines.push(line);
	});

	return blocks
		.map((block) => ({ label: block.label, markdown: block.lines.join('\n').trim() }))
		.filter((block) => block.label || block.markdown);
}

export function discussionQuestionView(markdown: string): DiscussionQuestionView {
	let rest = markdown.replace(/\r\n?/g, '\n').trim();
	let part: string | null = null;
	let level: string | null = null;
	let title: string | null = null;

	const heading = rest.match(/^##\s+(.+)\n*/);
	if (heading) {
		part = heading[1].trim();
		rest = rest.slice(heading[0].length).trim();
	}

	const [first = '', ...others] = rest.split(/\n\s*\n/);
	const heading3 = first.match(/^#{3,4}\s+(\S.*)$/);
	const leadLine = heading3 ? heading3[1].trim() : first.trim();
	const lead = !first.includes('\n') ? leadLine.match(LEVEL_RE) : null;
	if (others.length && (lead || heading3)) {
		level = lead ? (lead[2] ? `${lead[1]} · ${lead[2]}` : lead[1]) : null;
		title = lead ? lead[3].trim() : leadLine;
		rest = others.join('\n\n').trim();
	}

	return { part, level, title, blocks: splitLabelled(rest, QUESTION_LABELS) };
}

/** A part heading sits on the first question of each part only; later questions inherit it. */
export function discussionQuestionViews(questions: string[]): DiscussionQuestionView[] {
	const views: DiscussionQuestionView[] = [];
	for (const question of questions) {
		const view = discussionQuestionView(question);
		views.push({ ...view, part: view.part ?? views.at(-1)?.part ?? null });
	}
	return views;
}
