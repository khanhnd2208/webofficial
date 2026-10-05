import { discussionQuestionViews } from './discussionView';

export const PROMPT_SNIPPETS = {
	title: '### Áp dụng — ',
	situation: '> [!EXAMPLE] Tình huống:\n> ',
	ask: '> [!REFLECT] Câu hỏi:\n> ',
} as const;

export const ANSWER_SNIPPETS = {
	recall: '### Nhắc lại bài học:\n',
	steps: '### Cùng suy nghĩ từng bước:\n\n#### Bước 1 —\n',
	solution: '### Lời giải:\n',
	takeaway: '> [!IMPORTANT] Điều rút ra:\n> ',
} as const;

export function insertAtCaret(value: string, start: number, end: number, snippet: string) {
	const next = `${value.slice(0, start)}${snippet}${value.slice(end)}`;
	return { value: next, caret: start + snippet.length };
}

export function nextPartSnippet(questions: string[]) {
	const used = new Set(
		discussionQuestionViews(questions)
			.map((view) => view.part)
			.filter((part): part is string => Boolean(part)),
	);
	return `## Phần ${used.size + 1}. `;
}

export function nextStepSnippet(answer: string) {
	const numbers = [...answer.matchAll(/####\s+Bước\s+(\d+)/g)].map((match) => Number(match[1]));
	const next = numbers.reduce((max, value) => Math.max(max, value), 0) + 1;
	return `#### Bước ${next} —\n`;
}
