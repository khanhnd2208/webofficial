'use client';
import { StudentClassIntro } from './StudentClassIntro';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { AttendanceGrid } from '../admin/AttendanceGrid';
import { ParticipationGrid } from '../admin/ParticipationGrid';
import { GroupBoardWorkspaceLoader } from '@/components/teaching/groups/GroupBoardWorkspaceLoader';
import { LearningExperienceWorkspace } from './LearningExperienceWorkspace';
import { ClassNotesWorkspace } from './ClassNotesWorkspace';
import { Sheet } from '@/components/ui/Dialog';
import { routes } from '@/config/routes';
import type { BoardGridStudent } from '../board/gridTypes';
import { getCpPolicyText } from '@/features/teaching/types';
import type { PublicClassBoard } from '@/features/teaching/types';
import {
	PUBLIC_TUTORIAL_ALL,
	PUBLIC_TUTORIAL_UNASSIGNED,
	hasUnassignedPublicStudents,
	resolvePublicTutorialId,
	sessionMatchesPublicTutorial,
	shouldShowPublicTutorialFilter,
	studentMatchesPublicTutorial,
} from '@/features/teaching/domain/publicBoardFilter';

type PublicTab = 'attendance' | 'cp' | 'groups' | 'learning' | 'notes' | 'recall';

function resolvePublicTab(value?: string | null): PublicTab {
	return value === 'cp' ||
		value === 'groups' ||
		value === 'learning' ||
		value === 'notes' ||
		value === 'recall'
		? value
		: 'attendance';
}

function toGridStudent(student: PublicClassBoard['students'][number]): BoardGridStudent {
	return {
		enrollmentId: student.enrollmentId,
		orderNo: student.orderNo,
		tutorialClassId: student.tutorialClassId,
		enrolledFromWeek: student.enrolledFromWeek,
		studentCode: student.studentCode,
		familyName: student.familyName,
		givenName: student.givenName,
		marks: student.marks,
		participation: student.participation,
		cp: student.cp,
		learningExperience: student.learningExperience,
	};
}

export function StudentClassBoard({
	board,
	groupBoardEnabled = false,
	manageHref,
	initialTab,
	initialTutorialId,
}: {
	board: PublicClassBoard;
	groupBoardEnabled?: boolean;
	manageHref?: string;
	initialTab?: string;
	initialTutorialId?: string;
}) {
	const [tab, setTab] = useState<PublicTab>(() => {
		const requested = resolvePublicTab(initialTab);
		return requested === 'groups' && !groupBoardEnabled ? 'attendance' : requested;
	});
	const [tutorialId, setTutorialId] = useState(() =>
		resolvePublicTutorialId({
			tutorials: board.tutorials,
			students: board.students,
			initialTutorialId,
		}),
	);
	const [learningVisited, setLearningVisited] = useState(
		() => resolvePublicTab(initialTab) === 'learning',
	);
	const [query, setQuery] = useState('');
	const [rulesOpen, setRulesOpen] = useState(false);
	const gridWrapRef = useRef<HTMLDivElement>(null);
	const tabBarRef = useRef<HTMLElement>(null);

	useEffect(() => {
		const sync = () => {
			const requested = resolvePublicTab(new URLSearchParams(window.location.search).get('tab'));
			const nextTab = requested === 'groups' && !groupBoardEnabled ? 'attendance' : requested;
			if (nextTab === 'learning') setLearningVisited(true);
			setTab(nextTab);
		};
		window.addEventListener('popstate', sync);
		return () => window.removeEventListener('popstate', sync);
	}, [groupBoardEnabled]);

	useEffect(() => {
		const tabBar = tabBarRef.current;
		const active = tabBar?.querySelector<HTMLElement>("[data-active='true']");
		if (!tabBar || !active || typeof tabBar.scrollTo !== 'function') return;
		tabBar.scrollTo({
			left: active.offsetLeft - (tabBar.clientWidth - active.clientWidth) / 2,
			behavior: 'smooth',
		});
	}, [tab]);

	function changeTab(next: PublicTab) {
		if (next === 'learning') setLearningVisited(true);
		setTab(next);
		const params = new URLSearchParams(window.location.search);
		if (next === 'attendance') params.delete('tab');
		else params.set('tab', next);
		const queryString = params.toString();
		window.history.pushState(
			null,
			'',
			`${window.location.pathname}${queryString ? `?${queryString}` : ''}`,
		);
		requestAnimationFrame(() => {
			const wrapper = gridWrapRef.current?.querySelector<HTMLElement>('.mc-grid-wrap');
			wrapper?.scrollTo({ left: 0, behavior: 'auto' });
		});
	}

	function changeTutorial(next: string) {
		setTutorialId(next);
		const params = new URLSearchParams(window.location.search);
		if (next && next !== PUBLIC_TUTORIAL_ALL) params.set('tutorial', next);
		else params.delete('tutorial');
		window.history.replaceState(null, '', `${window.location.pathname}${params.toString() ? `?${params}` : ''}`);
	}

	function handleTabKeyDown(event: KeyboardEvent<HTMLElement>) {
		if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
		const tabs = Array.from(tabBarRef.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? []);
		if (!tabs.length) return;
		const current = tabs.indexOf(document.activeElement as HTMLElement);
		const index = current < 0 ? 0 : current;
		const next =
			event.key === 'Home'
				? 0
				: event.key === 'End'
					? tabs.length - 1
					: (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
		event.preventDefault();
		tabs[next]?.focus();
		tabs[next]?.click();
	}
	const hasUnassigned = useMemo(
		() => hasUnassignedPublicStudents(board.students),
		[board.students],
	);
	const scopedStudents = useMemo(
		() => board.students.filter((student) => studentMatchesPublicTutorial(student, tutorialId)),
		[board.students, tutorialId],
	);
	const scopedSessions = useMemo(
		() => board.sessions.filter((session) => sessionMatchesPublicTutorial(session, tutorialId)),
		[board.sessions, tutorialId],
	);
	const students = useMemo(() => scopedStudents.map(toGridStudent), [scopedStudents]);
	const filteredStudents = useMemo(() => {
		const value = query.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
		if (!value) return students;
		return students.filter((student) =>
			`${student.studentCode} ${student.familyName} ${student.givenName}`
				.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
				.includes(value),
		);
	}, [query, students]);
	const classRules = board.rules.trim();
	const commonRules = getCpPolicyText(board.policy);
	const summary = board.summary.trim();
	const description = board.description.trim();
	const announcement = board.announcement.trim();

	return (
		<div className="teaching-public-board min-w-0 space-y-3">
			<header className="flex flex-wrap items-end justify-between gap-3 border-b border-mc-rule pb-3">
				<div className="min-w-0">
					<p className="mc-eyebrow">
						{board.courseCode} · Lớp {board.classCode ?? board.groupNo} · {board.term}
					</p>
					<h1 className="mt-1 break-words text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
						{board.title}
					</h1>
				</div>
				{manageHref ? (
					<Link
						href={manageHref}
						className="shrink-0 text-xs font-semibold text-accent hover:underline"
					>
						Quản lý lớp ↗
					</Link>
				) : null}
			</header>

			<StudentClassIntro summary={summary} description={description} announcement={announcement} links={board.links} />

			<details className="mc-surface hidden md:block">
				<summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-ink">
					Quy định lớp
				</summary>
				<div className="space-y-4 border-t border-mc-rule px-5 py-4 text-xs leading-5 text-ink-secondary">
					<div>
						<p className="mb-1 font-semibold text-ink">Quy định chung</p>
						<ul className="space-y-1">
							{commonRules.map((rule) => (
								<li key={rule}>• {rule}</li>
							))}
						</ul>
					</div>
					{classRules ? (
						<div>
							<p className="mb-1 font-semibold text-ink">Nội quy lớp</p>
							<p className="whitespace-pre-wrap">{classRules}</p>
						</div>
					) : null}
				</div>
			</details>
			<button
				type="button"
				className="mc-surface flex min-h-11 w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-ink md:hidden"
				onClick={() => setRulesOpen(true)}
			>
				<span>Quy định lớp</span>
				<span aria-hidden>⌄</span>
			</button>
			<Sheet
				open={rulesOpen}
				onClose={() => setRulesOpen(false)}
				title="Quy định lớp"
				side="bottom"
			>
				<div className="space-y-4 text-sm leading-6 text-ink-secondary">
					<div>
						<p className="mb-1 font-semibold text-ink">Quy định chung</p>
						<ul className="space-y-2">
							{commonRules.map((rule) => (
								<li key={rule}>• {rule}</li>
							))}
						</ul>
					</div>
					{classRules ? (
						<div>
							<p className="mb-1 font-semibold text-ink">Nội quy lớp</p>
							<p className="whitespace-pre-wrap">{classRules}</p>
						</div>
					) : null}
				</div>
			</Sheet>

			<nav
				ref={tabBarRef}
				onKeyDown={handleTabKeyDown}
				className="mc-tabbar"
				role="tablist"
				aria-label="Bảng lớp học"
			>
				<button
					type="button"
					role="tab"
					id="public-tab-attendance"
					aria-controls="public-panel-attendance"
					aria-selected={tab === 'attendance'}
					tabIndex={tab === 'attendance' ? 0 : -1}
					data-active={tab === 'attendance'}
					onClick={() => changeTab('attendance')}
				>
					Điểm danh
				</button>
				<button
					type="button"
					role="tab"
					id="public-tab-cp"
					aria-controls="public-panel-cp"
					aria-selected={tab === 'cp'}
					tabIndex={tab === 'cp' ? 0 : -1}
					data-active={tab === 'cp'}
					onClick={() => changeTab('cp')}
				>
					Điểm CP
				</button>
				{groupBoardEnabled ? (
					<button
						type="button"
						role="tab"
						id="public-tab-groups"
						aria-controls="public-panel-groups"
						aria-selected={tab === 'groups'}
						tabIndex={tab === 'groups' ? 0 : -1}
						data-active={tab === 'groups'}
						onClick={() => changeTab('groups')}
					>
						Xếp nhóm
					</button>
				) : null}
				<button
					type="button"
					role="tab"
					id="public-tab-learning"
					aria-controls="public-panel-learning"
					aria-selected={tab === 'learning'}
					tabIndex={tab === 'learning' ? 0 : -1}
					data-active={tab === 'learning'}
					onClick={() => changeTab('learning')}
				>
					Learning Experience
				</button>
				<button
					type="button"
					role="tab"
					id="public-tab-notes"
					aria-controls="public-panel-notes"
					aria-selected={tab === 'notes'}
					tabIndex={tab === 'notes' ? 0 : -1}
					data-active={tab === 'notes'}
					onClick={() => changeTab('notes')}
				>
					Class Notes
				</button>
				<button
					type="button"
					role="tab"
					id="public-tab-recall"
					aria-controls="public-panel-recall"
					aria-selected={tab === 'recall'}
					tabIndex={tab === 'recall' ? 0 : -1}
					data-active={tab === 'recall'}
					onClick={() => changeTab('recall')}
				>
					Active Recall
				</button>
			</nav>
			{shouldShowPublicTutorialFilter({
				tutorialCount: board.tutorials.length,
				hasUnassigned,
			}) && (tab === 'attendance' || tab === 'cp') ? (
				<div className="flex flex-wrap items-center gap-2 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 py-2">
					<label htmlFor="public-tutorial" className="text-xs font-semibold text-ink-secondary">Tutorial</label>
					<select id="public-tutorial" value={tutorialId} onChange={(event) => changeTutorial(event.target.value)} className="min-h-10 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 text-sm text-ink">
						<option value={PUBLIC_TUTORIAL_ALL}>Toàn lớp</option>
						{hasUnassigned ? (
							<option value={PUBLIC_TUTORIAL_UNASSIGNED}>Chưa phân tutorial</option>
						) : null}
						{board.tutorials.map((tutorial) => <option key={tutorial.id} value={tutorial.id}>{tutorial.code} · {tutorial.name}</option>)}
					</select>
				</div>
			) : null}

			{learningVisited ? (
				<div
					id="public-panel-learning"
					role="tabpanel"
					aria-labelledby="public-tab-learning"
					hidden={tab !== 'learning'}
					className="public-learning-panel"
				>
					<LearningExperienceWorkspace
						slug={board.slug}
						courseName={board.courseName}
						students={board.students.map((student) => ({
							enrollmentId: student.enrollmentId,
							studentCode: student.studentCode,
							fullName: `${student.familyName} ${student.givenName}`.trim(),
							accessMode: student.hasDateOfBirth ? 'DOB_PASSWORD' : 'OPEN',
						}))}
					/>
				</div>
			) : null}
			{tab === 'notes' ? (
				<div
					id="public-panel-notes"
					role="tabpanel"
					aria-labelledby="public-tab-notes"
					className="public-notes-panel"
				>
					<ClassNotesWorkspace notes={board.notes ?? []} />
				</div>
			) : null}
			{tab === 'recall' ? (
				<div
					id="public-panel-recall"
					role="tabpanel"
					aria-labelledby="public-tab-recall"
					className="public-notes-panel"
				>
					{(board.recallDecks ?? []).length ? (
						<ul className="space-y-3">
							{board.recallDecks!.map((deck) => (
								<li key={deck.id}>
									<Link
										href={routes.teachingPublicRecallDeck(board.slug, deck.slug)}
										className="mc-surface block px-4 py-4 hover:border-accent"
									>
										<p className="text-xs text-ink-secondary">{deck.lessonLabel || 'Bộ thẻ'}</p>
										<p className="mt-1 text-base font-semibold text-ink">{deck.title}</p>
										{deck.description ? (
											<p className="mt-1 text-sm text-ink-secondary">{deck.description}</p>
										) : null}
										<p className="mt-2 text-xs tabular-nums text-ink-secondary">{deck.cardCount} thẻ →</p>
									</Link>
								</li>
							))}
						</ul>
					) : (
						<p className="mc-surface px-4 py-6 text-sm text-ink-secondary">
							Lớp này chưa mở bộ Active Recall nào.
						</p>
					)}
				</div>
			) : null}
			{groupBoardEnabled && tab === 'groups' ? (
				<div
					id="public-panel-groups"
					role="tabpanel"
					aria-labelledby="public-tab-groups"
					className="public-groups-panel"
				>
					<GroupBoardWorkspaceLoader slug={board.slug} tutorials={board.tutorials} />
				</div>
			) : tab === 'attendance' || tab === 'cp' ? (
				<div
					id={tab === 'attendance' ? 'public-panel-attendance' : 'public-panel-cp'}
					role="tabpanel"
					aria-labelledby={tab === 'attendance' ? 'public-tab-attendance' : 'public-tab-cp'}
					className="mc-surface overflow-hidden"
				>
					<div className="mc-card-head mc-public-grid-head gap-2">
						<div className="flex min-w-0 items-center gap-2">
							<h2 className="text-base font-semibold text-ink">
								{tab === 'attendance' ? 'Bảng điểm danh' : 'Bảng điểm CP'}
							</h2>
							<span className="mc-chip">{filteredStudents.length} SV</span>
						</div>
						<label>
							<span className="sr-only">Mã sinh viên</span>
							<input
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Tìm tên hoặc MSV"
								className="mc-public-grid-search min-h-10 w-44 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 text-xs sm:min-h-8 sm:w-56"
							/>
						</label>
					</div>
					{filteredStudents.length === 0 ? <p role="status" className="p-4 text-sm text-ink-secondary">{students.length === 0 ? (tutorialId === PUBLIC_TUTORIAL_UNASSIGNED ? 'Chưa có học viên chưa phân tutorial.' : tutorialId ? 'Tutorial này chưa có sinh viên.' : 'Lớp này chưa có sinh viên.') : 'Không tìm thấy sinh viên phù hợp. Hãy thử tên hoặc mã khác.'}</p> : null}
					{tab === 'attendance' ? (
						<div ref={gridWrapRef}>
							<AttendanceGrid
								students={filteredStudents}
								sessions={scopedSessions}
								totalWeeks={board.policy.totalWeeks}
								attendanceMaxPoints={board.policy.attendanceMaxPoints}
								readOnly
								publicCompact
								scrollMode="page"
							/>
						</div>
					) : (
						<div ref={gridWrapRef}>
							<ParticipationGrid
								students={filteredStudents}
								sessions={scopedSessions}
								totalWeeks={board.policy.totalWeeks}
								attendanceMaxPoints={board.policy.attendanceMaxPoints}
								cpMaxPoints={board.policy.cpMaxPoints}
								readOnly
								publicCompact
								scrollMode="page"
							/>
						</div>
					)}
				</div>
			) : null}
		</div>
	);
}
