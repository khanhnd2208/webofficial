'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react';

import { TeachingMark } from '@/components/site/TeachingMark';
import { GroupBoardWorkspaceLoader } from '@/components/teaching/groups/GroupBoardWorkspaceLoader';
import { Dialog, Toast } from '@/components/ui/Dialog';
import {
	PUBLIC_TUTORIAL_ALL,
	resolvePublicTutorialId,
} from '@/features/teaching/domain/publicBoardFilter';
import type { LearningExperienceChoice, PublicClassBoard } from '@/features/teaching/types';

import { TeachingIcon, type TeachingIconName } from '../ui/TeachingIcon';
import { ClassGradebook } from './ClassGradebook';
import { ClassNotesWorkspace } from './ClassNotesWorkspace';
import { LearningExperienceWorkspace } from './LearningExperienceWorkspace';
import {
	getPublicNavSections,
	resolvePublicBoardRoute,
	toPublicTabParam,
	type GradebookView,
	type PublicSection,
} from './publicBoardNav';
import { RecallDeckList } from './RecallDeckList';
import { StudentHome } from './StudentHome';
import { readStudentIdentity, writeStudentIdentity } from './studentIdentity';

const SECTION_META: Record<PublicSection, { label: string; icon: TeachingIconName }> = {
	me: { label: 'Của tôi', icon: 'students' },
	gradebook: { label: 'Bảng điểm', icon: 'attendance' },
	groups: { label: 'Nhóm', icon: 'groups' },
	recall: { label: 'Ôn tập', icon: 'recall' },
	notes: { label: 'Ghi chú lớp', icon: 'notes' },
};

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
	const recallDecks = board.recallDecks ?? [];
	const recallEnabled = recallDecks.length > 0;
	const navOptions = useMemo(
		() => ({ groupBoardEnabled, notesEnabled, recallEnabled }),
		[groupBoardEnabled, notesEnabled, recallEnabled],
	);
	const navSections = useMemo(() => getPublicNavSections(navOptions), [navOptions]);
	const initialRoute = resolvePublicBoardRoute(initialTab, navOptions);

	const [section, setSection] = useState<PublicSection>(initialRoute.section);
	const [gradebookView, setGradebookView] = useState<GradebookView>(initialRoute.view);
	const [learningOpen, setLearningOpen] = useState(initialRoute.openLearning);
	const [savedChoices, setSavedChoices] = useState<Record<string, LearningExperienceChoice>>({});
	const [toast, setToast] = useState('');
	const [tutorialOverride, setTutorialOverride] = useState<string | null>(() =>
		initialTutorialId !== undefined
			? resolvePublicTutorialId({
					tutorials: board.tutorials,
					students: board.students,
					initialTutorialId,
				})
			: null,
	);
	const [query, setQuery] = useState('');
	const [chosenMe, setChosenMe] = useState<{ slug: string; id: string | null } | null>(null);
	const storedMeId = useSyncExternalStore(
		() => () => {},
		() => readStudentIdentity(board.slug),
		() => null,
	);
	const meId = chosenMe?.slug === board.slug ? chosenMe.id : storedMeId;
	const me = useMemo(
		() => board.students.find((student) => student.enrollmentId === meId) ?? null,
		[board.students, meId],
	);
	const tutorialId = useMemo(() => {
		if (tutorialOverride !== null) return tutorialOverride;
		return resolvePublicTutorialId({
			tutorials: board.tutorials,
			students: board.students,
			initialTutorialId: me?.tutorialClassId ?? undefined,
		});
	}, [board.students, board.tutorials, me?.tutorialClassId, tutorialOverride]);
	const effectiveLearningChoice = me
		? (savedChoices[me.enrollmentId] ?? me.learningExperience ?? null)
		: null;
	const tabBarRef = useRef<HTMLElement>(null);
	const boardRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const sync = () => {
			const next = resolvePublicBoardRoute(
				new URLSearchParams(window.location.search).get('tab'),
				navOptions,
			);
			setSection(next.section);
			if (next.section === 'gradebook') setGradebookView(next.view);
			setLearningOpen(next.openLearning);
		};
		window.addEventListener('popstate', sync);
		return () => window.removeEventListener('popstate', sync);
	}, [navOptions]);

	function pushTabUrl(nextSection: PublicSection, nextView: GradebookView, nextLearning = false) {
		const params = new URLSearchParams(window.location.search);
		const tabValue = toPublicTabParam(nextSection, nextView, nextLearning);
		if (!tabValue) params.delete('tab');
		else params.set('tab', tabValue);
		const queryString = params.toString();
		window.history.pushState(
			null,
			'',
			`${window.location.pathname}${queryString ? `?${queryString}` : ''}`,
		);
	}

	function chooseMe(enrollmentId: string) {
		const next = enrollmentId || null;
		setChosenMe({ slug: board.slug, id: next });
		writeStudentIdentity(board.slug, next);
	}

	/** Picking a name from a long list leaves the page scrolled; bring the new status into view. */
	function selectMeFromList(enrollmentId: string) {
		chooseMe(enrollmentId);
		const root = boardRef.current;
		if (!root || typeof window.scrollTo !== 'function') return;
		const top = root.getBoundingClientRect().top + window.scrollY - 16;
		if (window.scrollY <= top) return;
		window.scrollTo({
			top,
			behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
		});
	}

	useEffect(() => {
		const tabBar = tabBarRef.current;
		const active = tabBar?.querySelector<HTMLElement>("[data-active='true']");
		if (!tabBar || !active || typeof tabBar.scrollTo !== 'function') return;
		tabBar.scrollTo({
			left: active.offsetLeft - (tabBar.clientWidth - active.clientWidth) / 2,
			behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
		});
	}, [section]);

	function changeSection(next: PublicSection, nextView: GradebookView = gradebookView) {
		setSection(next);
		setGradebookView(nextView);
		setLearningOpen(false);
		pushTabUrl(next, nextView, false);
	}

	function openLearningSheet() {
		setSection('me');
		setLearningOpen(true);
		pushTabUrl('me', gradebookView, true);
	}

	function closeLearningSheet() {
		setLearningOpen((open) => {
			if (!open) return false;
			const params = new URLSearchParams(window.location.search);
			if (params.get('tab') === 'learning') {
				pushTabUrl('me', gradebookView, false);
			}
			return false;
		});
	}

	function handleLearningSaved(choice: LearningExperienceChoice, enrollmentId?: string) {
		const targetId = enrollmentId ?? meId;
		if (targetId) {
			setSavedChoices((current) => ({ ...current, [targetId]: choice }));
			if (!meId && board.students.some((student) => student.enrollmentId === targetId)) {
				chooseMe(targetId);
			}
		}
		setLearningOpen(false);
		pushTabUrl('me', gradebookView, false);
		setToast(
			choice === 'CHALLENGE'
				? 'Đã lưu phong cách học: Teach me a lesson.'
				: 'Đã lưu phong cách học: Prince / Princess treatment.',
		);
	}

	function changeTutorial(next: string) {
		setTutorialOverride(next);
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

	const learningStudents = useMemo(
		() =>
			board.students.map((student) => ({
				enrollmentId: student.enrollmentId,
				studentCode: student.studentCode,
				fullName: `${student.familyName} ${student.givenName}`.trim(),
				accessMode: student.hasDateOfBirth ? ('DOB_PASSWORD' as const) : ('OPEN' as const),
			})),
		[board.students],
	);

	return (
		<div ref={boardRef} className="teaching-public-board min-w-0 space-y-4">
			<header className="teaching-public-header flex flex-wrap items-center justify-between gap-3 pb-1">
				<div className="flex min-w-0 items-center gap-3">
					<TeachingMark className="teaching-header-mark" />
					<div className="min-w-0">
						<h1 className="teaching-public-title break-words text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
							{board.title}
						</h1>
						<p className="mt-0.5 break-words text-xs leading-5 text-ink-secondary sm:text-sm">
							{board.courseCode} · Lớp {board.classCode ?? board.groupNo} · {board.term}
						</p>
					</div>
				</div>
				{manageHref ? (
					<Link
						href={manageHref}
						className="inline-flex min-h-11 shrink-0 items-center text-xs font-semibold text-accent hover:underline"
					>
						Quản lý lớp ↗
					</Link>
				) : null}
			</header>

			<div className="teaching-public-nav sticky top-[calc(var(--site-header-height)+env(safe-area-inset-top))] z-30 border-b border-mc-rule bg-canvas/95 backdrop-blur-sm">
				<nav
					ref={tabBarRef}
					onKeyDown={handleTabKeyDown}
					className="mc-tabbar"
					role="tablist"
					aria-label="Mục lớp học"
				>
					{navSections.map((item) => {
						const meta = SECTION_META[item];
						const active = section === item;
						return (
							<button
								key={item}
								type="button"
								role="tab"
								id={`public-tab-${item}`}
								aria-controls={`public-panel-${item}`}
								aria-selected={active}
								tabIndex={active ? 0 : -1}
								data-active={active}
								onClick={() => changeSection(item)}
							>
								<TeachingIcon name={meta.icon} size={18} className="teaching-public-tab-icon" />
								<span>{meta.label}</span>
							</button>
						);
					})}
				</nav>
			</div>

			{section === 'me' ? (
				<StudentHome
					board={board}
					me={me}
					learningChoice={effectiveLearningChoice}
					groupBoardEnabled={groupBoardEnabled}
					recallCount={recallDecks.length}
					onSelectMe={selectMeFromList}
					onClearMe={() => chooseMe('')}
					onOpenGradebook={() => changeSection('gradebook', 'attendance')}
					onOpenGroups={() => changeSection('groups')}
					onOpenRecall={() => changeSection('recall')}
					onOpenLearning={openLearningSheet}
				/>
			) : null}

			{notesEnabled && section === 'notes' ? (
				<div
					id="public-panel-notes"
					role="tabpanel"
					aria-labelledby="public-tab-notes"
					className="public-notes-panel"
				>
					<ClassNotesWorkspace notes={board.notes ?? []} />
				</div>
			) : null}

			{recallEnabled && section === 'recall' ? (
				<RecallDeckList slug={board.slug} decks={recallDecks} />
			) : null}

			{groupBoardEnabled && section === 'groups' ? (
				<div
					id="public-panel-groups"
					role="tabpanel"
					aria-labelledby="public-tab-groups"
					className="public-groups-panel"
				>
					<GroupBoardWorkspaceLoader
						slug={board.slug}
						tutorials={board.tutorials}
						highlightedEnrollmentId={meId}
						initialTutorialId={me?.tutorialClassId ?? undefined}
					/>
				</div>
			) : null}

			{section === 'gradebook' ? (
				<ClassGradebook
					board={board}
					view={gradebookView}
					onViewChange={(nextView) => changeSection('gradebook', nextView)}
					tutorialId={tutorialId}
					onTutorialChange={changeTutorial}
					query={query}
					onQueryChange={setQuery}
					meId={meId}
					onOpenMe={() => changeSection('me')}
				/>
			) : null}

			<Dialog
				open={learningOpen}
				onClose={closeLearningSheet}
				title="Phong cách học"
				className="max-md:mt-auto max-md:mb-0 max-md:max-h-[92dvh] max-md:w-full max-md:max-w-none max-md:rounded-b-none max-md:rounded-t-2xl md:max-h-[90dvh] md:w-[min(100%-2rem,56rem)]"
			>
				{learningOpen ? (
					<LearningExperienceWorkspace
						key={meId ?? 'guest'}
						slug={board.slug}
						courseName={board.courseName}
						students={learningStudents}
						initialEnrollmentId={meId}
						onChoiceSaved={handleLearningSaved}
					/>
				) : null}
			</Dialog>

			<Toast message={toast} visible={Boolean(toast)} onDismiss={() => setToast('')} />
		</div>
	);
}
