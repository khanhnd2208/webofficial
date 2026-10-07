import { exportLessonMarkdown, type ExportableSection } from './lessonImport';

/** Plain text of a section, so studio can diff a lecture and a discussion the same way. */
export function sectionPlainText(section: ExportableSection): string {
	return exportLessonMarkdown({
		title: section.title,
		description: '',
		sections: [section],
	});
}
