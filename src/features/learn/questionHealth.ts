import { discussionQuestionViews, type DiscussionQuestionView } from './discussionView';
import type { LearnStudioSection } from './types';

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
