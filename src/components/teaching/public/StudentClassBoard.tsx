'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react';

import { TeachingMark } from '@/components/site/TeachingMark';
import { GroupBoardWorkspaceLoader } from '@/components/teaching/groups/GroupBoardWorkspaceLoader';
import {
	PUBLIC_TUTORIAL_ALL,
	resolvePublicTutorialId,
} from '@/features/teaching/domain/publicBoardFilter';
import type { PublicClassBoard } from '@/features/teaching/types';

import { TeachingIcon } from '../ui/TeachingIcon';
import { ClassGradebook } from './ClassGradebook';
import { ClassInfoList } from './ClassInfoList';
import { ClassNotesWorkspace } from './ClassNotesWorkspace';
import { LearningExperienceWorkspace } from './LearningExperienceWorkspace';
import { RecallDeckList } from './RecallDeckList';
import { readStudentIdentity, writeStudentIdentity } from './studentIdentity';

type PublicTab = 'attendance' | 'cp' | 'summary' | 'groups' | 'learning' | 'notes' | 'recall';

function resolvePublicTab(value?: string | null): PublicTab {
	return value === 'cp' ||
		value === 'summary' ||
		value === 'groups' ||
		value === 'learning' ||
		value === 'notes' ||
		value === 'recall'
		? value
		: 'attendance';
}

function resolveAvailableTab(
	requested: PublicTab,
	groupBoardEnabled: boolean,
	notesEnabled: boolean,
	recallEnabled: boolean,
): PublicTab {
	if (requested === 'groups' && !groupBoardEnabled) return 'attendance';
	if (requested === 'notes' && !notesEnabled) return 'attendance';
	if (requested === 'recall' && !recallEnabled) return 'attendance';
	return requested;
}

export function StudentClassBoard({
	board,
	groupBoardEnabled = false,
	notesEnabled = false,
	manageHref,
	initialTab,
	initialTutorialId,
}: {
	board: PublicClassBoard;
	groupBoardEnabled?: boolean;
	notesEnabled?: boolean;
	manageHref?: string;
	initialTab?: string;
	initialTutorialId?: string;
}) {
	const recallEnabled = (board.recallDecks ?? []).length > 0;
	const [tab, setTab] = useState<PublicTab>(() =>
		resolveAvailableTab(
			resolvePublicTab(initialTab),
			groupBoardEnabled,
			notesEnabled,
			recallEnabled,
		),
	);
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
	const [chosenMe, setChosenMe] = useState<{ slug: string; id: string | null } | null>(null);
	const storedMeId = useSyncExternalStore(
		() => () => {},
		() => readStudentIdentity(board.slug),
		() => null,
	);
	const meId = chosenMe?.slug === board.slug ? chosenMe.id : storedMeId;
	const gridWrapRef = useRef<HTMLDivElement>(null);
	const tabBarRef = useRef<HTMLElement>(null);

	useEffect(() => {
		const sync = () => {
			const requested = resolvePublicTab(new URLSearchParams(window.location.search).get('tab'));
			const nextTab = resolveAvailableTab(
				requested,
				groupBoardEnabled,
				notesEnabled,
				recallEnabled,
			);
			if (nextTab === 'learning') setLearningVisited(true);
			setTab(nextTab);
		};
		window.addEventListener('popstate', sync);
		return () => window.removeEventListener('popstate', sync);
	}, [groupBoardEnabled, notesEnabled, recallEnabled]);

	function chooseMe(enrollmentId: string) {
		const next = enrollmentId || null;
		setChosenMe({ slug: board.slug, id: next });
		writeStudentIdentity(board.slug, next);
	}

	useEffect(() => {
		const tabBar = tabBarRef.current;
		const active = tabBar?.querySelector<HTMLElement>("[data-active='true']");
		if (!tabBar || !active || typeof tabBar.scrollTo !== 'function') return;
		tabBar.scrollTo({
			left: active.offsetLeft - (tabBar.clientWidth - active.clientWidth) / 2,
			behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
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
		window.history.replaceState(
			null,
			'',
			`${window.location.pathname}${params.toString() ? `?${params}` : ''}`,
		);
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

	return (
		<div className="teaching-public-board min-w-0 space-y-3">
			<header className="teaching-public-header flex flex-wrap items-end justify-between gap-3 border-b border-mc-rule pb-3">
				<div className="flex min-w-0 items-center gap-3">
					<TeachingMark className="teaching-header-mark" />
					<div className="min-w-0">
						<p className="mc-eyebrow">
							{board.courseCode} · Lớp {board.classCode ?? board.groupNo} · {board.term}
						</p>
						<h1 className="teaching-public-title mt-1 break-words text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
							{board.title}
						</h1>
					</div>
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

			<ClassInfoList board={board} />

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
					<TeachingIcon name="attendance" size={18} /> Điểm danh
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
					<TeachingIcon name="cp" size={18} /> Điểm CP
				</button>
				<button
					type="button"
					role="tab"
					id="public-tab-summary"
					aria-controls="public-panel-summary"
					aria-selected={tab === 'summary'}
					tabIndex={tab === 'summary' ? 0 : -1}
					data-active={tab === 'summary'}
					onClick={() => changeTab('summary')}
				>
					<TeachingIcon name="summary" size={18} /> Tổng kết
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
						<TeachingIcon name="groups" size={18} /> Xếp nhóm
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
					<TeachingIcon name="students" size={18} /> Trải nghiệm học tập
				</button>
				{notesEnabled ? (
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
						<TeachingIcon name="notes" size={18} /> Ghi chú lớp
					</button>
				) : null}
				{recallEnabled ? (
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
						<TeachingIcon name="recall" size={18} /> Ôn tập
					</button>
				) : null}
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
			{notesEnabled && tab === 'notes' ? (
				<div
					id="public-panel-notes"
					role="tabpanel"
					aria-labelledby="public-tab-notes"
					className="public-notes-panel"
				>
					<ClassNotesWorkspace notes={board.notes ?? []} />
				</div>
			) : null}
			{recallEnabled && tab === 'recall' ? (
				<RecallDeckList slug={board.slug} decks={board.recallDecks!} />
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
			) : tab === 'attendance' || tab === 'cp' || tab === 'summary' ? (
				<ClassGradebook
					board={board}
					tab={tab}
					tutorialId={tutorialId}
					onTutorialChange={changeTutorial}
					query={query}
					onQueryChange={setQuery}
					meId={meId}
					onChooseMe={chooseMe}
					gridWrapRef={gridWrapRef}
				/>
			) : null}
		</div>
	);
}
