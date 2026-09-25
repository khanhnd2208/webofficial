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
	/** Question ids whose answer was missing or did not match an option. */
	missingAnswer: string[];
}

const QUESTION_RE = /^(?:\*\*)?(?:câu(?:\s+hỏi)?\s*\d+|question\s*\d+|q\d*|\d+)\s*[:.)]\s*(?:\*\*)?\s*(.*)$/i;
const LABELLED_QUESTION_RE = /^(?:\*\*)?(?:câu(?:\s+hỏi)?|question)\s*\d+\s*[:.)]/i;
const OPTION_RE = /^([*✓✔]\s*)?([A-Ha-h])\s*[.)]\s+(.*)$/;
const ANSWER_RE = /^(?:\*\*)?(?:đáp\s*án(?:\s*đúng)?|answer|correct)\s*[:：]\s*(?:\*\*)?\s*([A-Ha-h]|\?)\b/i;
const EXPLANATION_RE = /^(?:\*\*)?(?:giải\s*thích|explanation|lý\s*do)\s*[:：]\s*(?:\*\*)?\s*(.*)$/i;
const CORRECT_SUFFIX_RE = /\s*(?:\((?:đúng|correct)\)|✓|✔)\s*$/i;

interface Draft {
	question: string[];
	options: string[];
	correctIndex: number;
	explanation: string[];
	stage: 'question' | 'options' | 'explanation';
	missingAnswer: boolean;
}

function emptyDraft(firstLine = ''): Draft {
	return {
		question: firstLine ? [firstLine] : [],
		options: [],
		correctIndex: -1,
		explanation: [],
		stage: 'question',
		missingAnswer: false,
	};
}

export function parseQuizPaste(raw: string): QuizPasteResult {
	const warnings: string[] = [];
	const questions: LearnQuizQuestion[] = [];
	const missingAnswer: string[] = [];
	let draft: Draft | null = null;

	const flush = () => {
		if (!draft) return;
		const question = draft.question.join('\n').trim();
		if (!question && !draft.options.length) {
			draft = null;
			return;
		}
		const label = `Câu ${questions.length + 1}`;
		if (draft.options.length < 2) {
			warnings.push(`${label}: cần ít nhất 2 phương án, đã bỏ qua.`);
		} else {
			let correctIndex = draft.correctIndex;
			let unanswered = draft.missingAnswer;
			if (correctIndex < 0) {
				warnings.push(`${label}: thiếu đáp án.`);
				correctIndex = 0;
				unanswered = true;
			} else if (correctIndex >= draft.options.length) {
				const letter = String.fromCharCode(65 + correctIndex);
				warnings.push(`${label}: đáp án "${letter}" không khớp phương án nào.`);
				correctIndex = 0;
				unanswered = true;
			}
			const id = newQuestionId();
			if (unanswered) missingAnswer.push(id);
			questions.push({
				id,
				question,
				options: draft.options,
				correctIndex,
				explanation: draft.explanation.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
			});
		}
		draft = null;
	};

	const lines = raw.replace(/\r\n?/g, '\n').split('\n');
	// Once a paste numbers its questions "Câu n:", a bare "1." is a statement inside a stem
	// ("Cho các nhận định sau: 1. … 2. …") and "A." inside an explanation is prose, not a new question.
	const labelled = lines.some((line) => LABELLED_QUESTION_RE.test(line.trim()));

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) {
			if (draft?.stage === 'explanation') draft.explanation.push('');
			continue;
		}

		const answer = line.match(ANSWER_RE);
		if (answer && draft) {
			if (answer[1] === '?') draft.missingAnswer = true;
			else draft.correctIndex = answer[1].toUpperCase().charCodeAt(0) - 65;
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

		const matched = line.match(QUESTION_RE);
		const question = matched && (!labelled || LABELLED_QUESTION_RE.test(line)) ? matched : null;
		if (question || !draft || draft.stage !== 'question') {
			if (draft?.stage === 'explanation' && !question && (labelled || !option)) {
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

	return { questions, warnings, missingAnswer };
}
