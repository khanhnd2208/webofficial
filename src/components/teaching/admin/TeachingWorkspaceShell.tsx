import Link from 'next/link';
import { Suspense } from 'react';

import { routes } from '@/config/routes';
import type {
	TeachingAttendanceBoardConfig,
	TeachingGradebook,
	TeachingGroupBoard,
	GroupNumbersByTutorial,
	TeachingPublicPageConfig,
	TeachingRosterStudent,
	TeachingClassNoteRecord,
	TeachingClassRecallAssignment,
} from '@/features/teaching/types';

import { StudentPageWorkspace } from './StudentPageWorkspace';
import { GroupBoardWorkspaceLoader } from '@/components/teaching/groups/GroupBoardWorkspaceLoader';
import { GradebookWorkspace } from './GradebookWorkspace';
import { RosterWorkspace } from './RosterWorkspace';
import { SessionsWorkspace } from './SessionsWorkspace';
import { SettingsForm } from './SettingsForm';
import { TeachingAppHeader } from './TeachingAppHeader';
import { TeachingManagementMenu } from './TeachingManagementMenu';
import {
	TeachingCoreTabs,
	TeachingPendingBody,
	TeachingWorkspacePending,
} from './TeachingWorkspacePending';
import { resolveTeachingWorkspaceTab } from './teachingWorkspaceTab';
import { ClassNotesAdminWorkspace } from './ClassNotesAdminWorkspace';
import { ClassRecallWorkspace } from './ClassRecallWorkspace';

export function TeachingWorkspaceShell({
	gradebook,
	roster,
	board,
	publicPage,
	groupBoard,
	groupNumbersByTutorial,
	groupBoardEnabled,
	tab,
	notes,
	recallAssignments,
	week,
	tutorialId,
}: {
	gradebook: TeachingGradebook;
	roster?: { class: TeachingGradebook['class']; students: TeachingRosterStudent[] };
	board: TeachingAttendanceBoardConfig;
	publicPage?: TeachingPublicPageConfig;
	groupBoard?: TeachingGroupBoard;
	groupNumbersByTutorial?: GroupNumbersByTutorial;
	groupBoardEnabled: boolean;
	tab?: string;
	notes?: TeachingClassNoteRecord[];
	recallAssignments?: TeachingClassRecallAssignment[];
	week?: number | null;
	tutorialId?: string;
}) {
	const activeTab = resolveTeachingWorkspaceTab(tab, groupBoardEnabled);
	const isGradebookTab = activeTab === 'attendance' || activeTab === 'cp';

	return (
		<TeachingWorkspacePending initialWeek={week}>
			<div className={`teaching-workspace-shell py-2 sm:py-3 ${isGradebookTab ? 'teaching-workspace-shell-gradebook' : ''}`} data-teaching-shell>
				<TeachingAppHeader
					backHref={routes.mySpaceTeaching}
					backLabel="Các lớp"
					eyebrow={
						<>
							<Link
								href={routes.mySpaceTeachingCourse(gradebook.class.courseId)}
								className="underline-offset-2 hover:underline"
								title="Mở trang môn học"
							>
								{gradebook.class.courseCode}
							</Link>
							{` · Mã lớp ${gradebook.class.classCode ?? gradebook.class.groupNo} · ${gradebook.class.term}`}
						</>
					}
					title={gradebook.class.courseName}
					description={
						<div className="teaching-class-meta flex flex-wrap items-center gap-1.5">
							<span className="mc-meta">{gradebook.stats.studentCount} học viên</span>
							<span className="teaching-status" data-tone={gradebook.class.status === 'ACTIVE' ? 'ok' : 'muted'}>{gradebook.class.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã lưu trữ'}</span>
							<span className="teaching-status" data-tone={board.attendanceVisible ? 'ok' : 'muted'}>{board.attendanceVisible ? 'Đang chia sẻ' : 'Chưa chia sẻ'}</span>
						</div>
					}
					actions={<TeachingManagementMenu classId={gradebook.class.id} activeTab={activeTab} publicPath={board.publicPath} />}
					tabs={
						<Suspense>
							<TeachingCoreTabs classId={gradebook.class.id} activeTab={activeTab} groupBoardEnabled={groupBoardEnabled} tutorialId={tutorialId} />
						</Suspense>
					}
				/>

				<TeachingPendingBody className={`mt-4 ${isGradebookTab ? 'teaching-workspace-content' : ''}`}>
					{isGradebookTab ? (
						<GradebookWorkspace
							initial={gradebook}
							initialView={activeTab === 'cp' ? 'participation' : 'attendance'}
							groupNumbersByTutorial={groupBoardEnabled ? groupNumbersByTutorial : undefined}
							initialWeek={week ?? null}
							initialTutorialId={tutorialId}
						/>
					) : null}
					{groupBoardEnabled && activeTab === 'groups' ? (
						<GroupBoardWorkspaceLoader
							classId={gradebook.class.id}
							slug={gradebook.class.publicSlug ?? undefined}
							tutorials={gradebook.tutorials}
							initial={groupBoard}
							admin
						/>
					) : null}
					{activeTab === 'notes' ? <ClassNotesAdminWorkspace classId={gradebook.class.id} initial={notes ?? []} /> : null}
					{activeTab === 'recall' ? (
						<ClassRecallWorkspace
							classId={gradebook.class.id}
							courseId={gradebook.class.courseId}
							initial={recallAssignments ?? []}
						/>
					) : null}
					{activeTab === 'students' ? <RosterWorkspace classId={gradebook.class.id} tutorials={gradebook.tutorials} students={roster?.students ?? []} /> : null}
					{activeTab === 'setup' ? (
						<div className="space-y-4">
							<SettingsForm teachingClass={gradebook.class} />
							<SessionsWorkspace classId={gradebook.class.id} tutorials={gradebook.tutorials} />
						</div>
					) : null}
					{activeTab === 'share' ? (
						<StudentPageWorkspace page={publicPage} board={board} />
					) : null}
				</TeachingPendingBody>
			</div>
		</TeachingWorkspacePending>
	);
}
