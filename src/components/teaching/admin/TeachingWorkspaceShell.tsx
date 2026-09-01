import { routes } from '@/config/routes';
import type {
	TeachingAttendanceBoardConfig,
	TeachingGradebook,
	TeachingGroupBoard,
	TeachingPublicPageConfig,
	TeachingRosterStudent,
	TeachingClassNoteRecord,
} from '@/features/teaching/types';

import { AttendanceBoardPanel } from './AttendanceBoardPanel';
import { GroupBoardWorkspaceLoader } from '@/components/teaching/groups/GroupBoardWorkspaceLoader';
import { GradebookWorkspace } from './GradebookWorkspace';
import { PublicPageEditor } from './PublicPageEditor';
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

export function TeachingWorkspaceShell({
	gradebook,
	roster,
	board,
	publicPage,
	groupBoard,
	groupBoardEnabled,
	tab,
	notes,
}: {
	gradebook: TeachingGradebook;
	roster?: { class: TeachingGradebook['class']; students: TeachingRosterStudent[] };
	board: TeachingAttendanceBoardConfig;
	publicPage?: TeachingPublicPageConfig;
	groupBoard?: TeachingGroupBoard;
	groupBoardEnabled: boolean;
	tab?: string;
	notes?: TeachingClassNoteRecord[];
}) {
	const activeTab = resolveTeachingWorkspaceTab(tab, groupBoardEnabled);
	const isGradebookTab = activeTab === 'attendance' || activeTab === 'cp';
	const groupNumberByEnrollment = groupBoardEnabled ? Object.fromEntries(
		(groupBoard?.groups ?? []).flatMap((group) =>
			group.assignments.map((assignment) => [assignment.enrollmentId, assignment.groupOrder + 1]),
		),
	) : undefined;

	return (
		<TeachingWorkspacePending>
			<div className={`teaching-workspace-shell py-2 sm:py-3 ${isGradebookTab ? 'teaching-workspace-shell-gradebook' : ''}`} data-teaching-shell>
				<TeachingAppHeader
					backHref={routes.admin.teaching}
					backLabel="Các lớp"
					eyebrow={`${gradebook.class.courseCode} · Mã lớp ${gradebook.class.classCode ?? gradebook.class.groupNo} · ${gradebook.class.term}`}
					title={gradebook.class.courseName}
					description={
						<div className="teaching-class-meta flex flex-wrap items-center gap-1.5">
							<span className="mc-meta">{gradebook.stats.studentCount} học viên</span>
							<span className="teaching-status" data-tone={gradebook.class.status === 'ACTIVE' ? 'ok' : 'muted'}>{gradebook.class.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã lưu trữ'}</span>
							<span className="teaching-status" data-tone={board.attendanceVisible ? 'ok' : 'muted'}>{board.attendanceVisible ? 'Đang chia sẻ' : 'Chưa chia sẻ'}</span>
						</div>
					}
					actions={<TeachingManagementMenu classId={gradebook.class.id} activeTab={activeTab} publicPath={board.publicPath} />}
					tabs={<TeachingCoreTabs classId={gradebook.class.id} activeTab={activeTab} groupBoardEnabled={groupBoardEnabled} />}
				/>

				<TeachingPendingBody className={`mt-4 ${isGradebookTab ? 'teaching-workspace-content' : ''}`}>
					{isGradebookTab ? <GradebookWorkspace initial={gradebook} initialView={activeTab === 'cp' ? 'participation' : 'attendance'} groupNumberByEnrollment={groupNumberByEnrollment} /> : null}
					{groupBoardEnabled && activeTab === 'groups' ? <GroupBoardWorkspaceLoader classId={gradebook.class.id} slug={gradebook.class.publicSlug ?? undefined} initial={groupBoard} admin /> : null}
					{activeTab === 'notes' ? <ClassNotesAdminWorkspace classId={gradebook.class.id} initial={notes ?? []} /> : null}
					{activeTab === 'students' ? <RosterWorkspace classId={gradebook.class.id} tutorials={gradebook.tutorials} students={roster?.students ?? []} /> : null}
					{activeTab === 'setup' ? (
						<div className="space-y-4">
							<SettingsForm teachingClass={gradebook.class} />
							<SessionsWorkspace classId={gradebook.class.id} tutorials={gradebook.tutorials} />
							{publicPage ? (
								<details className="mc-surface p-4">
									<summary className="cursor-pointer text-sm font-semibold text-ink">Trang công khai và tài nguyên</summary>
									<PublicPageEditor initial={publicPage} />
								</details>
							) : null}
						</div>
					) : null}
					{activeTab === 'share' ? <AttendanceBoardPanel initial={board} /> : null}
				</TeachingPendingBody>
			</div>
		</TeachingWorkspacePending>
	);
}
