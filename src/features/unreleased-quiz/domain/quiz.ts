/**
 * UNRELEASED pre-workshop quiz: branching and grouping.
 *
 * Pure logic, no UI. The question text lives in ../content/questions.ts and the
 * result text in ../content/results.ts. See the unit test for every branch.
 */

export type QuestionId = 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7';
export type OptionKey = 'A' | 'B' | 'C' | 'D' | 'E';
export type Answers = Partial<Record<QuestionId, OptionKey>>;

export type GroupId = 'chua-chon-bai' | 'ban-nhap' | 'doi-giong' | 'dung-bai';

/** Why someone lands in "Chưa chọn bài". Each variant shows its own copy. */
export type UnchosenVariant =
	| 'no-direction' // Q1 = C/D
	| 'no-jd' // Q1 = A/B, Q2 = B/C
	| 'unclear-job' // Q5 = D
	| 'unclear-requirements'; // Q7 = D

export type MismatchNote = 'more-than-you-think' | 'no-clear-example' | 'one-is-not-all';

export type QuizResult = {
	group: GroupId;
	variant: UnchosenVariant | null;
	/** Shown only for the three scored groups. At most one. */
	note: MismatchNote | null;
	/** Unclear-requirements only: they named an example (Q6 A/B) but cannot read the JD yet. */
	hasExampleButUnclearJd: boolean;
	/** Questions that decided the group, in order, for "Vì sao mình nhận được kết quả này?". */
	decidingQuestions: QuestionId[];
};

const LEVEL: Record<'q5' | 'q6' | 'q7', Partial<Record<OptionKey, 0 | 1 | 2>>> = {
	q5: { A: 0, B: 1, C: 2 },
	q6: { A: 2, B: 1, C: 0, D: 0 },
	q7: { A: 2, B: 1, C: 0 },
};

const GROUP_BY_LEVEL: Record<0 | 1 | 2, GroupId> = {
	0: 'ban-nhap',
	1: 'doi-giong',
	2: 'dung-bai',
};

const hasDirection = (answers: Answers) => answers.q1 === 'A' || answers.q1 === 'B';

/**
 * The questions this person is asked, given what they have answered so far.
 * Q3 and Q4 are always asked. The list grows as answers come in.
 */
export function questionPath(answers: Answers): QuestionId[] {
	const path: QuestionId[] = ['q1'];
	if (!answers.q1) return path;
	if (hasDirection(answers)) path.push('q2');
	path.push('q3', 'q4');
	if (!hasDirection(answers)) return path;
	if (!answers.q2 || answers.q2 !== 'A') return path;
	path.push('q5');
	if (!answers.q5 || answers.q5 === 'D') return path;
	path.push('q6', 'q7');
	return path;
}

/** Best guess of how many questions this person will answer, for the progress bar. */
export function expectedLength(answers: Answers): number {
	if (!answers.q1) return 7;
	if (!hasDirection(answers)) return 3;
	if (!answers.q2) return 7;
	if (answers.q2 !== 'A') return 4;
	if (answers.q5 === 'D') return 5;
	return 7;
}

/** The next unanswered question, or null when the quiz is complete. */
export function nextQuestion(answers: Answers): QuestionId | null {
	return questionPath(answers).find((id) => !answers[id]) ?? null;
}

function median(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[1];
}

/** Group for a complete set of answers. Throws if the quiz is not finished. */
export function computeResult(answers: Answers): QuizResult {
	if (nextQuestion(answers) !== null) throw new Error('Quiz is not complete');

	const unchosen = (
		variant: UnchosenVariant,
		decidingQuestions: QuestionId[],
		hasExampleButUnclearJd = false,
	): QuizResult => ({
		group: 'chua-chon-bai',
		variant,
		note: null,
		hasExampleButUnclearJd,
		decidingQuestions,
	});

	if (!hasDirection(answers)) return unchosen('no-direction', ['q1']);
	if (answers.q2 !== 'A') return unchosen('no-jd', ['q1', 'q2']);
	if (answers.q5 === 'D') return unchosen('unclear-job', ['q2', 'q5']);
	if (answers.q7 === 'D') {
		const hasExample = answers.q6 === 'A' || answers.q6 === 'B';
		return unchosen('unclear-requirements', ['q2', 'q6', 'q7'], hasExample);
	}

	const q5 = LEVEL.q5[answers.q5!]!;
	const q6 = LEVEL.q6[answers.q6!]!;
	const q7 = LEVEL.q7[answers.q7!]!;
	const level = median([q5, q6, q7]) as 0 | 1 | 2;

	let note: MismatchNote | null = null;
	if (q5 < level) note = 'more-than-you-think';
	else if (q5 > level) note = 'no-clear-example';
	else if (answers.q6 === 'A' && answers.q7 === 'C') note = 'one-is-not-all';

	return {
		group: GROUP_BY_LEVEL[level],
		variant: null,
		note,
		hasExampleButUnclearJd: false,
		decidingQuestions: ['q5', 'q6', 'q7'],
	};
}
