import { findImageRefs } from './images';
import type { LearnStudioSection } from './types';

/** Include discussion text so publish warnings cover the whole lesson. */
export function unresolvedSectionImages(section: LearnStudioSection) {
	const texts = [section.markdown];
	for (const question of section.discussion?.questions ?? [])
		texts.push(question.question, question.answer);
	return texts.flatMap(findImageRefs).filter((ref) => ref.status !== 'ready');
}
