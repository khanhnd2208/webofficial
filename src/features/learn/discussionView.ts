/**
 * Reads the conventions discussion prompts are written in, so the learner view can give each part its own
 * weight without changing what is stored:
 *
 *   ## Phần 1. …                      → part (carried to later questions by the viewer)
 *   Áp dụng — Nhóm bạn đá bóng …      → level + title
 *   Tình huống: … / Câu hỏi: …        → labelled blocks
 *   Nhắc lại bài học: … / Điều rút ra: …
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

const LEVEL_RE = /^(Nhớ|Hiểu|Áp dụng|Vận dụng|Phân tích|Đánh giá|Sáng tạo)\s*(?:\(([^)]+)\))?\s+[—–]\s+(\S.*)$/i;

export const QUESTION_LABELS = ['Tình huống', 'Bối cảnh', 'Câu hỏi', 'Yêu cầu'];
export const ANSWER_LABELS = ['Nhắc lại bài học', 'Cùng suy nghĩ từng bước', 'Lời giải', 'Điều rút ra'];

function escape(text: string) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Splits at paragraphs that open with one of `labels` followed by a colon; fenced code is never split. */
export function splitLabelled(markdown: string, labels: string[]): DiscussionBlock[] {
	const labelRe = new RegExp(`^(?:\\*\\*)?(${labels.map(escape).join('|')})(?:\\*\\*)?\\s*[:：]\\s*(?:\\*\\*)?\\s*(.*)$`, 'i');
	const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
	const blocks: Array<{ label: string | null; lines: string[] }> = [{ label: null, lines: [] }];
	let fenced = false;

	lines.forEach((line, index) => {
		if (/^\s*(`{3,}|~{3,})/.test(line)) fenced = !fenced;
		const atParagraphStart = index === 0 || !lines[index - 1].trim();
		const match = !fenced && atParagraphStart ? line.trim().match(labelRe) : null;
		if (match) {
			const label = labels.find((item) => item.toLowerCase() === match[1].toLowerCase()) ?? match[1];
			blocks.push({ label, lines: match[2] ? [match[2]] : [] });
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

	const [first, ...others] = rest.split(/\n\s*\n/);
	const lead = first && !first.includes('\n') ? first.trim().match(LEVEL_RE) : null;
	if (lead && others.length) {
		level = lead[2] ? `${lead[1]} · ${lead[2]}` : lead[1];
		title = lead[3].trim();
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
