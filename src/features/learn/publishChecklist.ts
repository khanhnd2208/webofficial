import { unresolvedSectionImages } from './sectionImages';
import { discussionIssues } from './questionHealth';
import { discussionQuestionViews } from './discussionView';
import type { LearnStudioLesson } from './types';

export interface CheckItem {
	id: string;
	sectionId: string | null;
	message: string;
}

const DEFAULT_TITLES = new Set(['Mục mới', 'Bài học mới', 'Câu hỏi phản biện']);

export function publishChecklist(input: { description: string; lessons: LearnStudioLesson[] }): {
	blockers: CheckItem[];
	warnings: CheckItem[];
} {
	const blockers: CheckItem[] = [];
	const warnings: CheckItem[] = [];
	const sections = input.lessons.flatMap((lesson) =>
		lesson.sections.map((section) => ({ section, lessonTitle: lesson.title })),
	);

	if (!sections.length) {
		blockers.push({ id: 'empty-course', sectionId: null, message: 'Khóa chưa có mục nào' });
	}
	if (!input.description.trim()) {
		warnings.push({ id: 'description', sectionId: null, message: 'Khóa thiếu mô tả' });
	}

	for (const lesson of input.lessons) {
		if (DEFAULT_TITLES.has(lesson.title.trim())) {
			warnings.push({
				id: `lesson-title-${lesson.id}`,
				sectionId: lesson.sections[0]?.id ?? null,
				message: `Bài "${lesson.title}" vẫn là tên mặc định`,
			});
		}
	}

	for (const { section, lessonTitle } of sections) {
		const where = `${lessonTitle} · ${section.title}`;
		if (DEFAULT_TITLES.has(section.title.trim())) {
			warnings.push({
				id: `title-${section.id}`,
				sectionId: section.id,
				message: `${where}: tên mặc định`,
			});
		}
		const images = unresolvedSectionImages(section);
		if (images.length) {
			warnings.push({
				id: `images-${section.id}`,
				sectionId: section.id,
				message: `${where}: ${images.length} ảnh chưa tải lên`,
			});
		}
		if (section.type === 'READING' && !section.markdown.trim()) {
			warnings.push({
				id: `empty-${section.id}`,
				sectionId: section.id,
				message: `${where}: mục đọc trống`,
			});
		}
		if (section.type === 'DISCUSSION') {
			const questions = section.discussion?.questions ?? [];
			if (!questions.length) {
				blockers.push({
					id: `disc-empty-${section.id}`,
					sectionId: section.id,
					message: `${where}: chưa có câu phản biện`,
				});
			}
			const views = discussionQuestionViews(questions.map((item) => item.question));
			questions.forEach((question, index) => {
				for (const issue of discussionIssues(question, views[index])) {
					warnings.push({
						id: `disc-${section.id}-${question.id}-${issue}`,
						sectionId: section.id,
						message: `${where}: câu ${index + 1} — ${issue}`,
					});
				}
			});
		}
	}

	return { blockers, warnings };
}
