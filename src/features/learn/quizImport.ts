/**
 * Bulk-paste parser for quiz questions, in the shape AI tools and teachers usually write:
 *
 *   Câu 1: Question text?
 *   A. Option
 *   *B. Correct option          (or "B. Option (đúng)", or a later "Đáp án: B")
 *   C. Option
 *   Giải thích: Why B is right.
 */

import { newQuestionId } from './content';
import type { LearnQuizQuestion } from './types';

export interface QuizPasteResult {
	questions: LearnQuizQuestion[];
	warnings: string[];
}

const QUESTION_RE = /^(?:\*\*)?(?:câu(?:\s+hỏi)?\s*\d+|question\s*\d+|q\d*|\d+)\s*[:.)]\s*(?:\*\*)?\s*(.*)$/i;
const OPTION_RE = /^([*✓✔]\s*)?([A-Ha-h])\s*[.)]\s+(.*)$/;
const ANSWER_RE = /^(?:\*\*)?(?:đáp\s*án(?:\s*đúng)?|answer|correct)\s*[:：]\s*(?:\*\*)?\s*([A-Ha-h])\b/i;
const EXPLANATION_RE = /^(?:\*\*)?(?:giải\s*thích|explanation|lý\s*do)\s*[:：]\s*(?:\*\*)?\s*(.*)$/i;
const CORRECT_SUFFIX_RE = /\s*(?:\((?:đúng|correct)\)|✓|✔)\s*$/i;

interface Draft {
	question: string[];
	options: string[];
	correctIndex: number;
	explanation: string[];
	stage: 'question' | 'options' | 'explanation';
}

function emptyDraft(firstLine = ''): Draft {
	return {
		question: firstLine ? [firstLine] : [],
		options: [],
		correctIndex: -1,
		explanation: [],
		stage: 'question',
	};
}

export function parseQuizPaste(raw: string): QuizPasteResult {
	const warnings: string[] = [];
	const questions: LearnQuizQuestion[] = [];
	let draft: Draft | null = null;

	const flush = () => {
		if (!draft) return;
		const question = draft.question.join(' ').trim();
		if (!question && !draft.options.length) {
			draft = null;
			return;
		}
		const label = `Câu ${questions.length + 1}`;
		if (draft.options.length < 2) {
			warnings.push(`${label}: cần ít nhất 2 phương án, đã bỏ qua.`);
		} else {
			let correctIndex = draft.correctIndex;
			if (correctIndex < 0) {
				warnings.push(`${label}: chưa đánh dấu đáp án đúng, tạm chọn A.`);
				correctIndex = 0;
			} else if (correctIndex >= draft.options.length) {
				const letter = String.fromCharCode(65 + correctIndex);
				warnings.push(`${label}: đáp án "${letter}" không khớp phương án nào, tạm chọn A.`);
				correctIndex = 0;
			}
			questions.push({
				id: newQuestionId(),
				question,
				options: draft.options,
				correctIndex,
				explanation: draft.explanation.join(' ').trim(),
			});
		}
		draft = null;
	};

	for (const rawLine of raw.replace(/\r\n?/g, '\n').split('\n')) {
		const line = rawLine.trim();
		if (!line) continue;

		const answer = line.match(ANSWER_RE);
		if (answer && draft) {
			draft.correctIndex = answer[1].toUpperCase().charCodeAt(0) - 65;
			draft.stage = 'explanation';
			continue;
		}

		const explanation = line.match(EXPLANATION_RE);
		if (explanation && draft) {
			draft.explanation.push(explanation[1]);
			draft.stage = 'explanation';
			continue;
		}

		const option = line.match(OPTION_RE);
		if (option && draft && draft.stage !== 'explanation') {
			let text = option[3].trim();
			const markedCorrect = Boolean(option[1]) || CORRECT_SUFFIX_RE.test(text) || /^\*\*.*\*\*$/.test(text);
			text = text.replace(CORRECT_SUFFIX_RE, '').replace(/^\*\*(.*)\*\*$/, '$1').trim();
			if (markedCorrect) draft.correctIndex = draft.options.length;
			draft.options.push(text);
			draft.stage = 'options';
			continue;
		}

		const question = line.match(QUESTION_RE);
		if (question || !draft || draft.stage !== 'question') {
			if (draft?.stage === 'explanation' && !question && !option) {
				draft.explanation.push(line);
				continue;
			}
			flush();
			draft = emptyDraft(question ? question[1].trim() : line);
			continue;
		}

		draft.question.push(line);
	}
	flush();

	return { questions, warnings };
}
