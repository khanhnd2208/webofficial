/**
 * Bulk-paste parser for discussion prompts:
 *
 *   ## Nhóm (optional, attached to the next question — never use ## inside an item)
 *
 *   Câu 1:
 *   ### Tiêu đề
 *   > [!EXAMPLE] Tình huống:
 *   > …
 *   > [!REFLECT] Câu hỏi:
 *   > …
 *
 *   Đáp án mẫu:
 *   ### Nhắc lại bài học:
 *   #### Bước 1 —
 *   > [!IMPORTANT] Điều rút ra:
 *
 *   Câu 2: …
 */

import { newQuestionId } from './content';
import type { LearnDiscussion, LearnDiscussionQuestion } from './types';

export interface DiscussionPasteResult {
	questions: LearnDiscussionQuestion[];
	warnings: string[];
}

const QUESTION_RE = /^(?:\*\*)?(?:câu(?:\s+hỏi)?|question)\s*(\d+)\s*[:.)]\s*(?:\*\*)?\s*(.*)$/i;
const ANSWER_RE =
	/^(?:\*\*)?(?:đáp\s*án\s*mẫu|gợi\s*ý\s*(?:trả\s*lời|đáp\s*án)|hướng\s*dẫn(?:\s*trả\s*lời)?|trả\s*lời|đáp\s*án|sample\s*answer|answer)\s*[:：]\s*(?:\*\*)?\s*(.*)$/i;

interface Draft {
	question: string[];
	answer: string[];
	stage: 'question' | 'answer';
}

function fenceMask(lines: string[]): boolean[] {
	const mask = new Array<boolean>(lines.length).fill(false);
	let open = false;
	for (let i = 0; i < lines.length; i++) {
		if (/^\s*(`{3,}|~{3,})/.test(lines[i])) {
			mask[i] = true;
			open = !open;
			continue;
		}
		mask[i] = open;
	}
	return mask;
}

function questionNumber(line: string): { n: number; rest: string } | null {
	const match = line.trim().match(QUESTION_RE);
	if (!match) return null;
	return { n: Number(match[1]), rest: match[2] };
}

/** A `##` heading sitting immediately above the next question belongs to that question. */
function headingFor(
	lines: string[],
	mask: boolean[],
	index: number,
	expected: number,
): string | null {
	const trimmed = lines[index].trim();
	if (!/^##\s+\S/.test(trimmed)) return null;
	let next = index + 1;
	while (next < lines.length && !lines[next].trim()) next += 1;
	if (next >= lines.length || mask[next]) return null;
	const question = questionNumber(lines[next]);
	return question?.n === expected ? trimmed : null;
}

export function parseDiscussionPaste(raw: string): DiscussionPasteResult {
	const warnings: string[] = [];
	const questions: LearnDiscussionQuestion[] = [];
	const lines = raw.replace(/\r\n?/g, '\n').split('\n');
	const mask = fenceMask(lines);
	let draft: Draft | null = null;
	let expected = 1;

	const flush = () => {
		if (!draft) return;
		const question = draft.question.join('\n').trim();
		const answer = draft.answer
			.join('\n')
			.replace(/\n{3,}/g, '\n\n')
			.trim();
		const label = `Câu ${questions.length + 1}`;
		if (!question) warnings.push(`${label}: chưa có câu hỏi.`);
		else {
			if (!answer) warnings.push(`${label}: thiếu đáp án mẫu.`);
			questions.push({ id: newQuestionId(), question, answer });
		}
		draft = null;
	};

	for (let index = 0; index < lines.length; index++) {
		const line = lines[index];
		if (mask[index]) {
			if (draft) (draft.stage === 'answer' ? draft.answer : draft.question).push(line);
			continue;
		}

		const heading = headingFor(lines, mask, index, expected);
		if (heading) {
			flush();
			draft = { question: [heading, ''], answer: [], stage: 'question' };
			continue;
		}
		if (
			draft?.question[0]?.startsWith('## ') &&
			!line.trim() &&
			draft.stage === 'question' &&
			draft.question.length <= 2
		) {
			continue;
		}

		const atParagraphStart = index === 0 || lines[index - 1].trim() === '' || mask[index - 1];
		const question = questionNumber(line);
		const headingWaiting =
			draft?.stage === 'question' &&
			draft.question[0]?.startsWith('## ') &&
			draft.question.every((item) => !item.trim() || item.startsWith('## '));
		if (question && question.n !== expected && atParagraphStart && !headingWaiting) {
			warnings.push(`Câu ${question.n} không nối tiếp Câu ${expected}.`);
			flush();
			draft = { question: question.rest ? [question.rest] : [], answer: [], stage: 'question' };
			expected = question.n + 1;
			continue;
		}
		if (question && question.n === expected && (atParagraphStart || !draft || headingWaiting)) {
			if (!headingWaiting) flush();
			if (!draft) draft = { question: [], answer: [], stage: 'question' };
			if (question.rest) draft.question.push(question.rest);
			draft.stage = 'question';
			expected += 1;
			continue;
		}

		// Only the first label opens the answer; later "Hướng dẫn:" or "Trả lời:" lines are answer text.
		const answer = draft?.stage === 'question' ? line.trim().match(ANSWER_RE) : null;
		if (answer && draft) {
			draft.stage = 'answer';
			if (answer[1]) draft.answer.push(answer[1]);
			continue;
		}

		if (!draft) continue;
		(draft.stage === 'answer' ? draft.answer : draft.question).push(line);
	}
	flush();

	return { questions, warnings };
}

export function discussionMarkdown(discussion: LearnDiscussion): string {
	return discussion.questions
		.map((item, index) => {
			const heading = item.question.match(/^(##\s+.+)\n+([\s\S]*)$/);
			const question = heading ? heading[2].trim() : item.question.trim();
			const head = heading ? `${heading[1]}\n\n` : '';
			return `${head}Câu ${index + 1}: ${question}\n\nĐáp án mẫu:\n${item.answer.trim()}`.trim();
		})
		.join('\n\n');
}
