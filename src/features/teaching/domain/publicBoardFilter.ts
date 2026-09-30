export const PUBLIC_TUTORIAL_ALL = '';
export const PUBLIC_TUTORIAL_UNASSIGNED = '__unassigned__';

export function hasUnassignedPublicStudents(students: Array<{ tutorialClassId: string | null }>) {
	return students.some((student) => !student.tutorialClassId);
}

export function resolvePublicTutorialId(input: {
	tutorials: Array<{ id: string }>;
	students: Array<{ tutorialClassId: string | null }>;
	initialTutorialId?: string;
}) {
	const hasUnassigned = hasUnassignedPublicStudents(input.students);
	if (input.initialTutorialId === PUBLIC_TUTORIAL_UNASSIGNED) {
		return hasUnassigned ? PUBLIC_TUTORIAL_UNASSIGNED : PUBLIC_TUTORIAL_ALL;
	}
	if (
		input.initialTutorialId &&
		input.tutorials.some((tutorial) => tutorial.id === input.initialTutorialId)
	) {
		return input.initialTutorialId;
	}
	if (hasUnassigned) return PUBLIC_TUTORIAL_ALL;
	return input.tutorials[0]?.id ?? PUBLIC_TUTORIAL_ALL;
}

export function studentMatchesPublicTutorial(
	student: { tutorialClassId: string | null },
	tutorialId: string,
) {
	if (tutorialId === PUBLIC_TUTORIAL_UNASSIGNED) return !student.tutorialClassId;
	if (!tutorialId) return true;
	return student.tutorialClassId === tutorialId;
}

export function sessionMatchesPublicTutorial(
	session: { tutorialClassId: string },
	tutorialId: string,
) {
	if (tutorialId === PUBLIC_TUTORIAL_UNASSIGNED) return false;
	if (!tutorialId) return true;
	return session.tutorialClassId === tutorialId;
}

export function shouldShowPublicTutorialFilter(input: {
	tutorialCount: number;
	hasUnassigned: boolean;
}) {
	return input.tutorialCount > 1 || input.hasUnassigned;
}
