import { hasHtmlContent } from './normalize';
import type { PublishIssue } from '../types';

export function validateKnowledgeUnitPublish(input: {
	title: string;
	foundationHtml: string;
	academicHtml: string;
	expertHtml: string;
	requireShortAndDeep?: boolean;
}): PublishIssue[] {
	const issues: PublishIssue[] = [];
	if (!input.title.trim()) {
		issues.push({ code: 'KU_TITLE', message: 'Knowledge Unit cần tiêu đề trước khi publish', path: 'title' });
	}
	const hasLevel =
		hasHtmlContent(input.foundationHtml) ||
		hasHtmlContent(input.academicHtml) ||
		hasHtmlContent(input.expertHtml);
	if (!hasLevel) {
		issues.push({
			code: 'KU_CONTENT',
			message: 'Cần nội dung ở ít nhất một cấp Foundation, Academic hoặc Expert',
			path: 'content',
		});
	}
	if (input.requireShortAndDeep && !hasHtmlContent(input.foundationHtml)) {
		issues.push({ code: 'KU_SHORT_REQUIRED', message: 'Cần phần Giải thích ngắn gọn trước khi publish', path: 'foundationHtml' });
	}
	if (input.requireShortAndDeep && !hasHtmlContent(input.expertHtml)) {
		issues.push({ code: 'KU_DEEP_REQUIRED', message: 'Cần phần Giải thích sâu trước khi publish', path: 'expertHtml' });
	}
	return issues;
}

export function validateTestPublish(input: {
	questionCount: number;
	inactiveQuestionCount: number;
	unpublishedKuTitles: string[];
	outOfCourseKuTitles?: string[];
}): PublishIssue[] {
	const issues: PublishIssue[] = [];
	if (input.questionCount === 0) {
		issues.push({ code: 'TEST_EMPTY', message: 'Test cần ít nhất một câu hỏi active', path: 'questions' });
	}
	if (input.inactiveQuestionCount > 0) {
		issues.push({
			code: 'TEST_INACTIVE_QUESTION',
			message: 'Test không thể publish khi còn câu hỏi đã archive',
			path: 'questions',
		});
	}
	if (input.unpublishedKuTitles.length > 0) {
		issues.push({
			code: 'TEST_KU_UNPUBLISHED',
			message: `Câu hỏi đang map KU chưa publish: ${input.unpublishedKuTitles.join(', ')}`,
			path: 'knowledgeUnits',
		});
	}
	if ((input.outOfCourseKuTitles ?? []).length > 0) {
		issues.push({
			code: 'TEST_KU_OUT_OF_COURSE',
			message: `Câu hỏi map KU ngoài Course: ${input.outOfCourseKuTitles!.join(', ')}`,
			path: 'knowledgeUnits',
			severity: 'warning',
		});
	}
	return issues;
}

export function validatePlacementPublish(input: {
	outOfCourseKuTitles: string[];
}): PublishIssue[] {
	if (input.outOfCourseKuTitles.length === 0) return [];
	return [
		{
			code: 'TEST_KU_OUT_OF_COURSE',
			message: `Câu hỏi map KU ngoài Course: ${input.outOfCourseKuTitles.join(', ')}`,
			path: 'placements',
			severity: 'warning',
		},
	];
}

export function validateCoursePublish(input: {
	title: string;
	lessons: Array<{
		id: string;
		title: string;
		status: string;
		sections: Array<{
			id: string;
			title: string;
			status: string;
			publishedKuCount: number;
		}>;
	}>;
}): PublishIssue[] {
	const issues: PublishIssue[] = [];
	if (!input.title.trim()) {
		issues.push({
			code: 'COURSE_TITLE',
			message: 'Course cần tiêu đề',
			path: 'title',
			severity: 'error',
			nodeType: 'course',
			nodeId: '',
		});
	}
	const publishedLessons = input.lessons.filter((lesson) => lesson.status === 'PUBLISHED');
	if (publishedLessons.length === 0) {
		issues.push({
			code: 'COURSE_NO_LESSON',
			message: 'Cần ít nhất một Lesson đã publish với Section và Knowledge Unit hợp lệ',
			path: 'lessons',
			severity: 'error',
			nodeType: 'course',
			nodeId: '',
		});
	}
	for (const lesson of input.lessons) {
		if (lesson.status !== 'PUBLISHED') continue;
		const publishedSections = lesson.sections.filter((section) => section.status === 'PUBLISHED');
		if (publishedSections.length === 0) {
			issues.push({
				code: 'LESSON_NO_SECTION',
				message: `Lesson “${lesson.title}” không còn Section hợp lệ`,
				path: `lessons.${lesson.id}`,
				severity: 'error',
				nodeType: 'lesson',
				nodeId: lesson.id,
			});
			continue;
		}
		for (const section of publishedSections) {
			if (section.publishedKuCount === 0) {
				issues.push({
					code: 'SECTION_NO_KU',
					message: `Section “${section.title}” trong “${lesson.title}” không còn Knowledge Unit hợp lệ`,
					path: `sections.${section.id}`,
					severity: 'error',
					nodeType: 'section',
					nodeId: section.id,
				});
			}
		}
	}
	return issues;
}
