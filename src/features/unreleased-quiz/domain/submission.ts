import { z } from 'zod';

import { QUESTIONS } from '../content/questions';
import { computeResult, nextQuestion, questionPath, type Answers, type QuestionId } from './quiz';

const QUESTION_IDS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'] as const;
const optionKey = z.enum(['A', 'B', 'C', 'D', 'E']);

/** A random id kept in the browser. Never a name, email or account id. */
export const respondentIdSchema = z.string().regex(/^[A-Za-z0-9-]{8,64}$/, 'Mã phiên không hợp lệ');

export const submissionSchema = z.object({
	respondentId: respondentIdSchema,
	answers: z
		.object({
			q1: optionKey,
			q2: optionKey.optional(),
			q3: optionKey,
			q4: optionKey,
			q5: optionKey.optional(),
			q6: optionKey.optional(),
			q7: optionKey.optional(),
		})
		.strict(),
});

export type Submission = z.infer<typeof submissionSchema>;

/**
 * Checks that the answers follow the quiz's own branches and every letter is an
 * option of its question, then recomputes the result on the server so a client
 * cannot write a group it did not earn. Returns null for an impossible sheet.
 */
export function scoreSubmission(answers: Submission['answers']) {
	const sheet: Answers = answers;
	if (nextQuestion(sheet) !== null) return null;
	const path = new Set<QuestionId>(questionPath(sheet));
	for (const id of QUESTION_IDS) {
		const key = sheet[id];
		if (path.has(id) !== Boolean(key)) return null;
		if (key && !QUESTIONS[id].options.some((option) => option.key === key)) return null;
	}
	return computeResult(sheet);
}
