export type PublicSection = 'me' | 'gradebook' | 'groups' | 'recall' | 'notes';
export type GradebookView = 'attendance' | 'cp' | 'summary';

export interface PublicBoardNavOptions {
	groupBoardEnabled: boolean;
	notesEnabled: boolean;
	recallEnabled: boolean;
}

export interface PublicBoardRoute {
	section: PublicSection;
	view: GradebookView;
	openLearning: boolean;
}

const DEFAULT_ROUTE: PublicBoardRoute = {
	section: 'me',
	view: 'attendance',
	openLearning: false,
};

export function resolvePublicBoardRoute(
	tab: string | null | undefined,
	options: PublicBoardNavOptions,
): PublicBoardRoute {
	switch (tab) {
		case 'attendance':
		case 'cp':
		case 'summary':
			return { section: 'gradebook', view: tab, openLearning: false };
		case 'groups':
			return options.groupBoardEnabled
				? { section: 'groups', view: 'attendance', openLearning: false }
				: DEFAULT_ROUTE;
		case 'recall':
			return options.recallEnabled
				? { section: 'recall', view: 'attendance', openLearning: false }
				: DEFAULT_ROUTE;
		case 'notes':
			return options.notesEnabled
				? { section: 'notes', view: 'attendance', openLearning: false }
				: DEFAULT_ROUTE;
		case 'learning':
			return { section: 'me', view: 'attendance', openLearning: true };
		case 'me':
		default:
			return DEFAULT_ROUTE;
	}
}

export function toPublicTabParam(
	section: PublicSection,
	view: GradebookView,
	openLearning = false,
): string | null {
	if (section === 'me') return openLearning ? 'learning' : null;
	if (section === 'gradebook') return view;
	return section;
}

export function getPublicNavSections(options: PublicBoardNavOptions): PublicSection[] {
	const sections: PublicSection[] = ['me', 'gradebook'];
	if (options.groupBoardEnabled) sections.push('groups');
	if (options.recallEnabled) sections.push('recall');
	if (options.notesEnabled) sections.push('notes');
	return sections;
}
