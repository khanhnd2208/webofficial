import { findImageRefs } from './images';
import type { LearnStudioSection } from './types';

/** Include discussion and checkpoint text so publish warnings cover the whole lesson. */
export function unresolvedSectionImages(section: LearnStudioSection) {
	const texts = [section.markdown];
	for (const question of section.discussion?.questions ?? [])
		texts.push(question.question, question.answer);
	for (const question of section.quiz?.questions ?? [])
		texts.push(question.question, question.explanation, ...question.options);
	if (section.checkpoint)
		texts.push(
			section.checkpoint.question,
			section.checkpoint.explanation,
			...section.checkpoint.options,
		);
	return texts.flatMap(findImageRefs).filter((ref) => ref.status !== 'ready');
}
