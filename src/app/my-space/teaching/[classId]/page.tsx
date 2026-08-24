import {
	resolveTeachingWorkspaceTab,
	teachingTabNeedsGroupBoard,
	teachingTabNeedsPublicPage,
	teachingTabNeedsRoster,
} from '@/components/teaching/admin/teachingWorkspaceTab';
import { TeachingWorkspaceShell } from '@/components/teaching/admin/TeachingWorkspaceShell';
import {
	ensureTeachingPublicDefaults,
	getAttendanceBoardConfig,
	getGradebook,
	getGroupBoard,
	listRoster,
} from '@/features/teaching';
import { isTeachingGroupBoardEnabled } from '@/features/teaching/groupBoardAvailability';
import { redirect } from 'next/navigation';
import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

export default async function TeachingClassPage({
	params,
	searchParams,
}: {
	params: Promise<{ classId: string }>;
	searchParams?: Promise<{ tab?: string }>;
}) {
	const { classId } = await params;
	const requestedTab = (await searchParams)?.tab;
	const groupBoardEnabled = isTeachingGroupBoardEnabled();
	if (requestedTab === 'groups' && !groupBoardEnabled) redirect(routes.mySpaceTeachingClass(classId));
	const tab = resolveTeachingWorkspaceTab(requestedTab, groupBoardEnabled);
	const [gradebook, board, roster, publicPage, groupBoard] = await Promise.all([
		getGradebook(classId),
		getAttendanceBoardConfig(classId),
		teachingTabNeedsRoster(tab) ? listRoster(classId) : Promise.resolve(undefined),
		teachingTabNeedsPublicPage(tab) ? ensureTeachingPublicDefaults(classId) : Promise.resolve(undefined),
		teachingTabNeedsGroupBoard(tab, groupBoardEnabled) ? getGroupBoard(classId) : Promise.resolve(undefined),
	]);
	return (
		<TeachingWorkspaceShell
			gradebook={gradebook}
			roster={roster}
			board={board}
			publicPage={publicPage}
			groupBoard={groupBoard}
			groupBoardEnabled={groupBoardEnabled}
			tab={tab}
		/>
	);
}
