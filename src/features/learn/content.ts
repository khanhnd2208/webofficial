import { learnCheckpointSchema, learnDiscussionSchema, learnQuizSchema } from './schemas';
import type {
	LearnCheckpoint,
	LearnDiscussion,
	LearnQuiz,
	LearnQuizForLearner,
	LearnQuizResult,
	LearnQuizReview,
	LearnSectionKind,
} from './types';

/** Deep reading of academic prose runs slower than skimming. */
const WORDS_PER_MINUTE = 180;

export function countWords(markdown: string): number {
	return markdown
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/[#>*_`|[\]()-]/g, ' ')
		.split(/\s+/)
		.filter(Boolean).length;
}

/** Tidy editor output: drop empty-paragraph `&nbsp;` lines and runs of blank lines. */
export function normalizeEditorMarkdown(markdown: string): string {
	return markdown
		.split('\n')
		.filter((line) => line.trim() !== '&nbsp;')
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

export function estimateReadingMinutes(markdown: string): number {
	return Math.max(1, Math.round(countWords(markdown) / WORDS_PER_MINUTE));
}

export function sectionMinutes(section: {
	type: LearnSectionKind;
	durationMinutes: number | null;
	markdown: string;
	quiz: LearnQuiz | null;
	discussion?: LearnDiscussion | null;
}): number {
	if (section.durationMinutes) return section.durationMinutes;
	if (section.type === 'QUIZ') {
		return section.quiz?.timeLimitMinutes ?? Math.max(1, section.quiz?.questions.length ?? 1);
	}
	if (section.type === 'PRACTICE') return Math.max(1, section.quiz?.questions.length ?? 1);
	if (section.type === 'DISCUSSION') {
		const text = (section.discussion?.questions ?? []).map((item) => `${item.question}\n${item.answer}`).join('\n');
		return estimateReadingMinutes(text);
	}
	return estimateReadingMinutes(section.markdown);
}

export function formatMinutes(minutes: number): string {
	if (minutes < 60) return `${minutes} phút`;
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`;
}

/** JSON columns are written through zod, but read defensively in case of manual edits. */
export function readCheckpoint(value: unknown): LearnCheckpoint | null {
	if (!value) return null;
	const parsed = learnCheckpointSchema.safeParse(value);
	return parsed.success ? parsed.data : null;
}

export function readQuiz(value: unknown): LearnQuiz | null {
	if (!value) return null;
	const parsed = learnQuizSchema.safeParse(value);
	return parsed.success ? parsed.data : null;
}

export function readDiscussion(value: unknown): LearnDiscussion | null {
	if (!value) return null;
	const parsed = learnDiscussionSchema.safeParse(value);
	return parsed.success ? parsed.data : null;
}

export function readQuizResult(value: unknown): LearnQuizResult | null {
	if (!value || typeof value !== 'object') return null;
	const row = value as Partial<LearnQuizResult>;
	if (typeof row.score !== 'number' || typeof row.total !== 'number') return null;
	return {
		score: row.score,
		total: row.total,
		percentage: typeof row.percentage === 'number' ? row.percentage : 0,
		passed: Boolean(row.passed),
		answers: row.answers && typeof row.answers === 'object' ? row.answers : {},
		completedAt: typeof row.completedAt === 'string' ? row.completedAt : '',
	};
}

export function quizForLearner(quiz: LearnQuiz): LearnQuizForLearner {
	return {
		passingScorePercent: quiz.passingScorePercent,
		timeLimitMinutes: quiz.timeLimitMinutes,
		questions: quiz.questions.map(({ id, question, options }) => ({ id, question, options })),
	};
}

export function quizKey(quiz: LearnQuiz): LearnQuizReview['key'] {
	return quiz.questions.map(({ id, correctIndex, explanation }) => ({
		id,
		correctIndex,
		explanation,
	}));
}

export function gradeQuiz(
	quiz: LearnQuiz,
	answers: Record<string, number>,
	now = new Date(),
): LearnQuizResult {
	const total = quiz.questions.length;
	const kept: Record<string, number> = {};
	let score = 0;
	for (const question of quiz.questions) {
		const answer = answers[question.id];
		if (typeof answer !== 'number' || answer < 0 || answer >= question.options.length) continue;
		kept[question.id] = answer;
		if (answer === question.correctIndex) score += 1;
	}
	const percentage = total ? Math.round((score / total) * 100) : 0;
	return {
		score,
		total,
		percentage,
		passed: total > 0 && percentage >= quiz.passingScorePercent,
		answers: kept,
		completedAt: now.toISOString(),
	};
}

export function newQuestionId(): string {
	return `q_${Math.random().toString(36).slice(2, 10)}`;
}
