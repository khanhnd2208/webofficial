import { discussionQuestionViews, type DiscussionQuestionView } from './discussionView';
import type { LearnQuizQuestion, LearnStudioSection } from './types';

export function quizIssues(question: LearnQuizQuestion): string[] {
	const issues: string[] = [];
	const options = question.options.map((option) => option.trim());
	if (options.length < 2) issues.push('Cần ít nhất 2 phương án');
	const correct = options[question.correctIndex] ?? '';
	if (!correct) issues.push('Đáp án đúng đang trống');
	if (options.some((option, index) => index !== question.correctIndex && !option)) {
		issues.push('Phương án trống');
	}
	return issues;
}

export function discussionIssues(
	question: { question: string; answer: string },
	view: DiscussionQuestionView,
): string[] {
	const issues: string[] = [];
	if (!question.question.trim()) issues.push('Thiếu đề bài');
	if (!question.answer.trim()) issues.push('Thiếu đáp án mẫu');
	const hasAsk = view.blocks.some(
		(block) => block.label === 'Câu hỏi' || block.label === 'Yêu cầu',
	);
	if (question.question.trim() && !hasAsk) issues.push('Chưa có khối Câu hỏi');
	return issues;
}

export function sectionHint(section: LearnStudioSection): { text: string; warn: boolean } | null {
	if (section.type === 'READING') {
		return section.markdown.trim() ? null : { text: 'Trống', warn: true };
	}
	if (section.type === 'QUIZ' || section.type === 'PRACTICE') {
		const questions = section.quiz?.questions ?? [];
		return {
			text: `${questions.length} câu`,
			warn: questions.length === 0 || questions.some((question) => quizIssues(question).length > 0),
		};
	}
	if (section.type === 'DISCUSSION') {
		const questions = section.discussion?.questions ?? [];
		const views = discussionQuestionViews(questions.map((item) => item.question));
		return {
			text: `${questions.length} câu`,
			warn:
				questions.length === 0 ||
				questions.some((question, index) => discussionIssues(question, views[index]).length > 0),
		};
	}
	return null;
}
