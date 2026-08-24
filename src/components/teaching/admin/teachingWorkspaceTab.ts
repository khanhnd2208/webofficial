export type TeachingWorkspaceTab = 'attendance' | 'cp' | 'groups' | 'students' | 'setup' | 'share';

const WORKSPACE_TABS: TeachingWorkspaceTab[] = [
	'attendance',
	'cp',
	'groups',
	'students',
	'setup',
	'share',
];


export function resolveTeachingWorkspaceTab(tab?: string, groupBoardEnabled = false): TeachingWorkspaceTab {
	if (tab === 'groups' && !groupBoardEnabled) return 'attendance';
	return WORKSPACE_TABS.includes(tab as TeachingWorkspaceTab)
		? (tab as TeachingWorkspaceTab)
		: 'attendance';
}

export function teachingTabNeedsGroupBoard(tab: TeachingWorkspaceTab, groupBoardEnabled: boolean) {
	return groupBoardEnabled && (tab === 'attendance' || tab === 'cp' || tab === 'groups');
}

export function teachingTabNeedsRoster(tab: TeachingWorkspaceTab) {
	return tab === 'students';
}

export function teachingTabNeedsPublicPage(tab: TeachingWorkspaceTab) {
	return tab === 'setup';
}
