'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { AttendanceGrid } from '../admin/AttendanceGrid';
import { ParticipationGrid } from '../admin/ParticipationGrid';
import { GroupBoardWorkspaceLoader } from '@/components/teaching/groups/GroupBoardWorkspaceLoader';
import { LearningExperienceWorkspace } from './LearningExperienceWorkspace';
import { ClassNotesWorkspace } from './ClassNotesWorkspace';
import { Sheet } from '@/components/ui/Dialog';
import type { BoardGridStudent } from '../board/gridTypes';
import { getCpPolicyText } from '@/features/teaching/types';
import type { PublicClassBoard } from '@/features/teaching/types';

type PublicTab = 'attendance' | 'cp' | 'groups' | 'learning' | 'notes';

function resolvePublicTab(value?: string | null): PublicTab {
	return value === 'cp' || value === 'groups' || value === 'learning' || value === 'notes'
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
}: {
	board: PublicClassBoard;
	groupBoardEnabled?: boolean;
	manageHref?: string;
	initialTab?: string;
}) {
	const [tab, setTab] = useState<PublicTab>(() => {
		const requested = resolvePublicTab(initialTab);
		return requested === 'groups' && !groupBoardEnabled ? 'attendance' : requested;
	});
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
	const students = useMemo(() => board.students.map(toGridStudent), [board.students]);
	const filteredStudents = useMemo(() => {
		const value = query.trim().toLowerCase();
		if (!value) return students;
		return students.filter((student) =>
			`${student.studentCode} ${student.familyName} ${student.givenName}`
				.toLowerCase()
				.includes(value),
		);
	}, [query, students]);
	const classRules = board.rules.trim();
	const commonRules = getCpPolicyText(board.policy);
	const summary = board.summary.trim();
	const description = board.description.trim();
	const announcement = board.announcement.trim();
	const hasPublicContent = Boolean(summary || description || announcement || board.links.length);

	return (
		<div className="space-y-3">
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

			{hasPublicContent ? (
				<section className="mc-surface overflow-hidden" aria-label="Thông tin lớp">
					{announcement ? (
						<div className="border-b border-mc-rule bg-accent-subtle px-4 py-3" role="note">
							<p className="mc-eyebrow">Thông báo</p>
							<p className="mt-1 whitespace-pre-wrap text-sm font-medium leading-6 text-ink">
								{announcement}
							</p>
						</div>
					) : null}
					{summary || description ? (
						<div className="space-y-2 px-4 py-4">
							<h2 className="text-sm font-semibold text-ink">Thông tin lớp</h2>
							{summary ? <p className="text-sm font-medium text-ink">{summary}</p> : null}
							{description ? (
								<p className="whitespace-pre-wrap text-sm leading-6 text-ink-secondary">
									{description}
								</p>
							) : null}
						</div>
					) : null}
					{board.links.length ? (
						<div className="border-t border-mc-rule px-4 py-4">
							<h2 className="text-sm font-semibold text-ink">Tài nguyên lớp</h2>
							<ul className="mt-2 grid gap-2 sm:grid-cols-2">
								{board.links.map((link) => (
									<li key={link.id}>
										<a
											href={link.url}
											target="_blank"
											rel="noopener noreferrer"
											className="block rounded-[var(--mc-r-sm)] border border-mc-rule px-3 py-2 text-sm text-ink transition hover:border-accent"
										>
											<strong className="font-semibold text-accent">{link.label} ↗</strong>
											{link.description ? (
												<span className="mt-1 block text-xs leading-5 text-ink-secondary">
													{link.description}
												</span>
											) : null}
										</a>
									</li>
								))}
							</ul>
						</div>
					) : null}
				</section>
			) : null}

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
			</nav>

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
					{tab === 'attendance' ? (
						<div ref={gridWrapRef}>
							<AttendanceGrid
								students={filteredStudents}
								sessions={board.sessions}
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
								sessions={board.sessions}
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
