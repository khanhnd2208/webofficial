import { exportCourseMarkdown, exportLessonMarkdown } from '@/features/learn/lessonImport';
import { stripRetiredPracticeBlocks } from '@/features/learn/retiredBlocks';
import type { LearnStudioLesson } from '@/features/learn/types';

function exportableLesson(lesson: LearnStudioLesson) {
	return {
		...lesson,
		sections: lesson.sections.map((section) =>
			section.type === 'READING'
				? { ...section, markdown: stripRetiredPracticeBlocks(section.markdown).markdown }
				: section,
		),
	};
}

export function courseExport(slug: string, lessons: LearnStudioLesson[]) {
	return {
		filename: `${slug}.md`,
		text: exportCourseMarkdown(lessons.map(exportableLesson)),
	};
}

export function lessonExport(slug: string, lesson: LearnStudioLesson, number: number) {
	return {
		filename: `${slug}-bai-${number}.md`,
		text: exportLessonMarkdown(exportableLesson(lesson)),
	};
}

export function downloadTextFile(filename: string, text: string) {
	const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}
