import { redirect } from 'next/navigation';

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
	getGroupNumbersByEnrollment,
	getClassNotes,
	listClassRecallAssignments,
	listRoster,
} from '@/features/teaching';
import { isTeachingGroupBoardEnabled } from '@/features/teaching/groupBoardAvailability';
import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

export default async function MySpaceTeachingClassPage({
	params,
	searchParams,
}: {
	params: Promise<{ classId: string }>;
	searchParams?: Promise<{ tab?: string; week?: string; tutorial?: string }>;
}) {
	const { classId } = await params;
	const query = await searchParams;
	const requestedTab = query?.tab;
	const week = Number(query?.week || '') || null;
	const tutorialId = query?.tutorial || undefined;
	const groupBoardEnabled = isTeachingGroupBoardEnabled();
	if (requestedTab === 'groups' && !groupBoardEnabled)
		redirect(routes.mySpaceTeachingClass(classId));
	const tab = resolveTeachingWorkspaceTab(requestedTab, groupBoardEnabled);
	const [gradebook, board, roster, publicPage, , groupNumbersByTutorial, notes, recallAssignments] =
		await Promise.all([
			getGradebook(classId),
			getAttendanceBoardConfig(classId),
			teachingTabNeedsRoster(tab) ? listRoster(classId) : Promise.resolve(undefined),
			teachingTabNeedsPublicPage(tab)
				? ensureTeachingPublicDefaults(classId)
				: Promise.resolve(undefined),
			Promise.resolve(undefined as Awaited<ReturnType<typeof getGroupBoard>> | undefined),
			teachingTabNeedsGroupBoard(tab, groupBoardEnabled) && tab !== 'groups'
				? getGroupNumbersByEnrollment(classId)
				: Promise.resolve(undefined),
			tab === 'notes' ? getClassNotes(classId) : Promise.resolve(undefined),
			tab === 'recall' ? listClassRecallAssignments(classId) : Promise.resolve(undefined),
		]);
	const initialGroupBoard =
		tab === 'groups' && groupBoardEnabled && gradebook.tutorials.length === 1
			? await getGroupBoard(classId, gradebook.tutorials[0]!.id)
			: undefined;
	return (
		<TeachingWorkspaceShell
			gradebook={gradebook}
			roster={roster}
			board={board}
			publicPage={publicPage}
			groupBoard={initialGroupBoard}
			groupNumbersByTutorial={groupNumbersByTutorial}
			groupBoardEnabled={groupBoardEnabled}
			notes={notes}
			recallAssignments={recallAssignments}
			tab={tab}
			week={week}
			tutorialId={tutorialId}
		/>
	);
}
