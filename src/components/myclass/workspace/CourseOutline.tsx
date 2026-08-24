'use client';

import {
	useEffect,
	useId,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	type CSSProperties,
	type KeyboardEvent,
	type ReactNode,
	type TransitionEvent,
} from 'react';
import type { MyClassCourseDetail, MyClassTestListItem, MyClassTestScope, MyClassVocabSetCard } from '@/features/my-class/types';
import { routes } from '@/config/routes';
import Link from 'next/link';
import type { StoredTestScore } from '@/features/my-class/client/testScoreStore';
import type { MyClassOutlineItem } from '@/features/my-class/domain/learnerState';
import { isPublishedAuthoring } from '@/features/my-class/domain/attachTarget';
import {
	outlineTestKey,
	testsForOutline,
	unpublishedOutlineTests,
} from '@/features/my-class/domain/outlineTests';
import { moveOrderedIds } from '@/features/my-class/domain/reorderCourseTree';
import TestEntryCard from '@/components/myclass/TestEntryCard';
import { McButton, McIcon } from '@/components/myclass/ui';
import {
	OutlineCourseMenu,
	OutlineDragHandle,
	OutlineRowMenu,
	OutlineTestMenu,
	OutlineVocabMenu,
} from '@/components/myclass/workspace/edit/OutlineEditControls';
import {
	OutlineDnd,
	OutlineSortableItem,
	OutlineSortableList,
	parentTypeOf,
	sortableId,
	type OutlineDragData,
} from '@/components/myclass/workspace/edit/OutlineDnd';
import { useOptionalEditMode } from '@/components/myclass/workspace/edit/EditModeContext';

const EXPAND_KEY = (courseId: string) => `my-class:outline-expand:${courseId}`;

type ExpandState = {
	lessons: Record<string, boolean>;
	sections: Record<string, boolean>;
};

type DragFocus = { type: 'lesson' } | { type: 'section'; parentId: string } | null;

function readExpand(courseId: string): ExpandState {
	try {
		const raw = localStorage.getItem(EXPAND_KEY(courseId));
		if (!raw) return { lessons: {}, sections: {} };
		const parsed = JSON.parse(raw) as ExpandState;
		return {
			lessons: parsed.lessons ?? {},
			sections: parsed.sections ?? {},
		};
	} catch {
		return { lessons: {}, sections: {} };
	}
}

function writeExpand(courseId: string, state: ExpandState) {
	try {
		localStorage.setItem(EXPAND_KEY(courseId), JSON.stringify(state));
	} catch {
		/* private mode */
	}
}

export function useCourseOutlineExpand(courseId: string) {
	const [state, setState] = useState<ExpandState>({ lessons: {}, sections: {} });

	useEffect(() => {
		setState(readExpand(courseId));
	}, [courseId]);

	function toggleLesson(id: string, currentlyOpen: boolean) {
		setState((prev) => {
			const next = { ...prev, lessons: { ...prev.lessons, [id]: !currentlyOpen } };
			writeExpand(courseId, next);
			return next;
		});
	}

	function toggleSection(id: string, currentlyOpen: boolean) {
		setState((prev) => {
			const next = { ...prev, sections: { ...prev.sections, [id]: !currentlyOpen } };
			writeExpand(courseId, next);
			return next;
		});
	}

	function collapseAll(lessonIds: string[], sectionIds: string[]) {
		setState(() => {
			const next = {
				lessons: Object.fromEntries(lessonIds.map((id) => [id, false])),
				sections: Object.fromEntries(sectionIds.map((id) => [id, false])),
			};
			writeExpand(courseId, next);
			return next;
		});
	}

	function expandAll(lessonIds: string[], sectionIds: string[]) {
		setState(() => {
			const next = {
				lessons: Object.fromEntries(lessonIds.map((id) => [id, true])),
				sections: Object.fromEntries(sectionIds.map((id) => [id, true])),
			};
			writeExpand(courseId, next);
			return next;
		});
	}

	/** Free toggle — stored preference wins. Pass `fallback` only when never toggled. */
	function isLessonOpen(id: string, fallback = false) {
		return state.lessons[id] ?? fallback;
	}

	function isSectionOpen(id: string, fallback = false) {
		return state.sections[id] ?? fallback;
	}

	/** Open ancestors after navigation so the active row can mount and scroll into view. User may still collapse freely. */
	function ensureOpen(lessonId: string, sectionId?: string | null) {
		setState((prev) => {
			const lessons = { ...prev.lessons };
			const sections = { ...prev.sections };
			let changed = false;
			if (lessons[lessonId] !== true) {
				lessons[lessonId] = true;
				changed = true;
			}
			if (sectionId && sections[sectionId] !== true) {
				sections[sectionId] = true;
				changed = true;
			}
			if (!changed) return prev;
			const next = { lessons, sections };
			writeExpand(courseId, next);
			return next;
		});
	}

	return {
		isLessonOpen,
		isSectionOpen,
		toggleLesson,
		toggleSection,
		ensureOpen,
		collapseAll,
		expandAll,
	};
}

function depthStyle(depth: number): CSSProperties {
	return { '--depth': depth } as CSSProperties;
}

function CaretIcon({ open }: { open?: boolean }) {
	return (
		<McIcon
			name="chevron_right"
			size={20}
			className={`mc-outline-caret text-ink-tertiary ${open ? 'mc-outline-caret-open' : ''}`}
		/>
	);
}

function StatusSlot({ done, active }: { done: boolean; active: boolean }) {
	if (done) {
		return (
			<span className="mc-outline-slot text-mc-done" aria-hidden>
				<McIcon name="check" size={16} />
			</span>
		);
	}
	if (active) return null;
	return <span className="mc-outline-slot" aria-hidden />;
}

function OutlineBranch({
	open,
	instant,
	railDepth,
	children,
}: {
	open: boolean;
	instant: boolean;
	railDepth: number;
	children: ReactNode;
}) {
	const [rendered, setRendered] = useState(open && instant);
	const [expanded, setExpanded] = useState(open && instant);

	useLayoutEffect(() => {
		let expandFrame: number | null = null;
		const renderFrame = window.requestAnimationFrame(() => {
			if (open) {
				setRendered(true);
				if (instant) {
					setExpanded(true);
					return;
				}
				expandFrame = window.requestAnimationFrame(() => setExpanded(true));
				return;
			}
			setExpanded(false);
			if (instant) setRendered(false);
		});
		return () => {
			window.cancelAnimationFrame(renderFrame);
			if (expandFrame !== null) window.cancelAnimationFrame(expandFrame);
		};
	}, [open, instant]);

	function onTransitionEnd(event: TransitionEvent<HTMLDivElement>) {
		if (event.target !== event.currentTarget) return;
		if (!open) setRendered(false);
	}

	if (!rendered && !open) return null;

	return (
		<div
			className="mc-outline-branch"
			data-open={expanded ? 'true' : 'false'}
			data-instant={instant ? 'true' : 'false'}
			onTransitionEnd={onTransitionEnd}
		>
			<div className="mc-outline-branch-clip">
				<div className="mc-outline-branch-rail" style={depthStyle(railDepth)}>
					{children}
				</div>
			</div>
		</div>
	);
}

function LearnerHiddenHint({ show }: { show: boolean }) {
	if (!show) return null;
	return (
		<p className="mc-meta m-0 px-[var(--mc-out-pad)] py-1">Sẽ không hiện với học viên</p>
	);
}

function OutlineTests({
	tests,
	scope,
	editing,
	courseSlug,
	testScores,
	onOpenTest,
	hiddenFromLearners = false,
}: {
	tests: MyClassTestListItem[];
	scope: MyClassTestScope;
	editing: boolean;
	courseSlug: string;
	testScores?: Record<string, StoredTestScore>;
	onOpenTest: (test: MyClassTestListItem) => void;
	hiddenFromLearners?: boolean;
}) {
	const published = testsForOutline(tests, scope);
	const drafts = editing ? unpublishedOutlineTests(tests, scope) : [];
	if (!published.length && !drafts.length) return null;

	function row(test: MyClassTestListItem) {
		return (
			<TestEntryCard
				key={outlineTestKey(test)}
				courseSlug={courseSlug}
				test={test}
				score={testScores?.[test.slug]}
				onOpen={onOpenTest}
				density="compact"
				depth={0}
				trailing={
					editing && test.id ? (
						<OutlineTestMenu testId={test.id} placementId={test.placementId} />
					) : null
				}
			/>
		);
	}

	return (
		<div className="mc-outline-test-group">
			{published.map(row)}
			{drafts.length ? (
				<div className="mc-outline-test-drafts">
					<p className="mc-eyebrow m-0 px-[var(--mc-out-pad)] py-1 font-bold tracking-wider text-ink-tertiary">
						Bản nháp · chưa hiện với học viên
					</p>
					{drafts.map(row)}
				</div>
			) : null}
			<LearnerHiddenHint show={editing && hiddenFromLearners && published.length > 0} />
		</div>
	);
}

function OutlineVocab({
	sets,
	courseSlug,
	editing,
	hiddenFromLearners = false,
}: {
	sets: MyClassVocabSetCard[];
	courseSlug: string;
	editing: boolean;
	hiddenFromLearners?: boolean;
}) {
	const visible = sets.filter((set) => editing || !set.isArchived);
	if (!visible.length) return null;
	return (
		<div className="mc-outline-test-group">
			{visible.map((set) => (
				<div key={set.assignmentId} className="mc-outline-row flex items-center" data-kind="vocab">
					<Link
						href={routes.myClassVocab(courseSlug, set.vocabSetId)}
						className="mc-outline-row mc-focus-ring flex min-h-11 flex-1 items-center px-[var(--mc-out-pad)] text-left"
					>
						<McIcon name="menu_book" size={16} className="mr-2 text-mc-vocab" />
						<span className="min-w-0 flex-1 truncate text-[14px] leading-5 text-ink-secondary hover:text-ink">
							{set.title}
						</span>
						<span className="mc-meta ml-2 shrink-0">{set.wordCount} từ</span>
					</Link>
					{editing ? <OutlineVocabMenu assignmentId={set.assignmentId} vocabSetId={set.vocabSetId} /> : null}
				</div>
			))}
			<LearnerHiddenHint show={editing && hiddenFromLearners} />
		</div>
	);
}

function CourseAssets({
	course,
	editing,
	needle,
	testScores,
	onOpenTest,
}: {
	course: MyClassCourseDetail;
	editing: boolean;
	needle: string;
	testScores?: Record<string, StoredTestScore>;
	onOpenTest: (test: MyClassTestListItem) => void;
}) {
	const courseVocab = course.vocabSets.filter((set) => set.scope === 'course');
	const hasAssets = course.tests.length > 0 || courseVocab.length > 0;
	const matchesNeedle =
		!needle ||
		course.tests.some((test) => test.title.toLowerCase().includes(needle)) ||
		courseVocab.some((set) => set.title.toLowerCase().includes(needle));
	if (!hasAssets || !matchesNeedle) return null;
	return (
		<div data-outline-course-assets>
			<p className="mc-eyebrow m-0 px-[var(--mc-out-pad)] py-2 font-bold tracking-wider text-ink-tertiary">
				Toàn khóa
			</p>
			<OutlineTests
				tests={course.tests}
				scope="COURSE"
				editing={editing}
				courseSlug={course.slug}
				testScores={testScores}
				onOpenTest={onOpenTest}
				hiddenFromLearners={!isPublishedAuthoring(course.authoring?.status)}
			/>
			<OutlineVocab
				sets={courseVocab}
				courseSlug={course.slug}
				editing={editing}
				hiddenFromLearners={!isPublishedAuthoring(course.authoring?.status)}
			/>
		</div>
	);
}

export default function CourseOutline({
	course,
	items,
	selected,
	onOpen,
	onPrefetch,
	onOpenTest,
	testScores,
	revealActive,
	expand,
}: {
	course: MyClassCourseDetail;
	items: MyClassOutlineItem[];
	selected: MyClassOutlineItem | null;
	onOpen: (item: MyClassOutlineItem) => void;
	onPrefetch: (item: MyClassOutlineItem) => void;
	onOpenTest: (test: MyClassTestListItem) => void;
	testScores?: Record<string, StoredTestScore>;
	revealActive?: boolean;
	expand: ReturnType<typeof useCourseOutlineExpand>;
}) {
	const edit = useOptionalEditMode();
	const outlineId = useId();
	const activeRef = useRef<HTMLButtonElement | null>(null);
	const filterRef = useRef<HTMLInputElement | null>(null);
	const [query, setQuery] = useState('');
	const [filterOpen, setFilterOpen] = useState(false);
	const [animateIds, setAnimateIds] = useState<Set<string>>(() => new Set());
	const [dragFocus, setDragFocus] = useState<DragFocus>(null);
	const needle = query.trim().toLowerCase();

	function markAnimated(id: string) {
		setAnimateIds((prev) => {
			if (prev.has(id)) return prev;
			const next = new Set(prev);
			next.add(id);
			return next;
		});
	}

	const lessonStats = useMemo(() => {
		const map = new Map<string, { done: number; total: number }>();
		for (const lesson of course.lessons) {
			const lessonItems = items.filter((item) => item.lessonSlug === lesson.slug);
			const unique = [...new Map(lessonItems.map((item) => [item.knowledgeUnitId, item])).values()];
			map.set(lesson.id, {
				done: unique.filter((item) => item.status === 'done').length,
				total: unique.length,
			});
		}
		return map;
	}, [course.lessons, items]);

	const visibleLessons = useMemo(() => {
		if (!needle) return course.lessons;
		return course.lessons.filter((lesson) => {
			if (lesson.title.toLowerCase().includes(needle)) return true;
			if (lesson.tests.some((test) => test.title.toLowerCase().includes(needle))) return true;
			if (
				course.vocabSets.some(
					(set) => set.lessonId === lesson.id && set.title.toLowerCase().includes(needle),
				)
			) {
				return true;
			}
			return lesson.sections.some(
				(section) =>
					section.title.toLowerCase().includes(needle) ||
					section.knowledgeUnits.some((unit) => unit.title.toLowerCase().includes(needle)) ||
					section.tests.some((test) => test.title.toLowerCase().includes(needle)),
			);
		});
	}, [course.lessons, course.vocabSets, needle]);
	const courseAssetsMatch = useMemo(() => {
		const courseVocab = course.vocabSets.filter((set) => set.scope === 'course');
		if (!course.tests.length && !courseVocab.length) return false;
		if (!needle) return true;
		return (
			course.tests.some((test) => test.title.toLowerCase().includes(needle)) ||
			courseVocab.some((set) => set.title.toLowerCase().includes(needle))
		);
	}, [course.tests, course.vocabSets, needle]);
	const editing = Boolean(edit?.enabled);
	const dndLocked = Boolean(edit?.busyKey);

	const anyExpanded = visibleLessons.some((lesson) => {
		if (expand.isLessonOpen(lesson.id, selected?.lessonId === lesson.id)) return true;
		return lesson.sections.some((section) =>
			expand.isSectionOpen(section.id, selected?.sectionId === section.id),
		);
	});

	function handleReorder({
		type,
		parentId,
		activeId,
		overId,
	}: {
		type: OutlineDragData['type'];
		parentId: string;
		activeId: string;
		overId: string;
	}) {
		if (!edit) return;
		const orderedIds =
			type === 'lesson'
				? course.lessons.map((item) => item.id)
				: type === 'section'
					? (course.lessons.find((item) => item.id === parentId)?.sections.map((item) => item.id) ?? [])
					: (course.lessons
							.flatMap((item) => item.sections)
							.find((item) => item.id === parentId)
							?.knowledgeUnits.map((item) => item.id) ?? []);
		const next = moveOrderedIds(orderedIds, activeId, overId);
		if (!next) return;
		void edit.reorder(parentTypeOf(type), parentId, next);
	}

	const activeLessonOpen = selected
		? Boolean(needle) ||
			(dragFocus?.type !== 'lesson' && expand.isLessonOpen(selected.lessonId, true))
		: false;
	const activeSectionOpen = selected
		? Boolean(needle) ||
			(dragFocus?.type !== 'lesson' &&
				!(dragFocus?.type === 'section' && dragFocus.parentId === selected.lessonId) &&
				expand.isSectionOpen(selected.sectionId, true))
		: false;

	useEffect(() => {
		if (!selected) return;
		expand.ensureOpen(selected.lessonId, selected.sectionId);
		// Re-open only when the lesson/section changes — not on every unit advance,
		// so a user who collapsed the active branch stays collapsed.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selected?.lessonId, selected?.sectionId]);

	useEffect(() => {
		if (!edit?.focusOutline) return;
		const lessonId = edit.focusOutline.lessonId;
		const focusCourseAssets = edit.focusOutline.focusCourseAssets;
		if (lessonId) expand.ensureOpen(lessonId, edit.focusOutline.sectionId);
		edit.clearFocusOutline();
		if (!focusCourseAssets) return;
		const frame = window.requestAnimationFrame(() => {
			document
				.querySelector('[data-outline-course-assets]')
				?.scrollIntoView({ block: 'nearest' });
		});
		return () => window.cancelAnimationFrame(frame);
		// expand + clear are stable enough for a one-shot reveal after attach.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [edit?.focusOutline]);

	useEffect(() => {
		if (!revealActive || !selected || !activeLessonOpen || !activeSectionOpen) return;
		const frame = window.requestAnimationFrame(() => {
			const target = activeRef.current;
			if (!target) return;
			const scroller = target.closest('[data-outline-scroll]');
			if (scroller instanceof HTMLElement) {
				const scrollerRect = scroller.getBoundingClientRect();
				const targetRect = target.getBoundingClientRect();
				const fullyVisible =
					targetRect.top >= scrollerRect.top && targetRect.bottom <= scrollerRect.bottom;
				if (!fullyVisible) {
					target.scrollIntoView({ block: 'center', behavior: 'auto' });
					return;
				}
			}
			target.scrollIntoView({ block: 'nearest', behavior: 'auto' });
		});
		return () => window.cancelAnimationFrame(frame);
	}, [
		revealActive,
		selected?.knowledgeUnitId,
		selected?.sectionId,
		selected?.lessonId,
		selected,
		activeLessonOpen,
		activeSectionOpen,
	]);

	useEffect(() => {
		if (!filterOpen) return;
		const frame = window.requestAnimationFrame(() => filterRef.current?.focus());
		return () => window.cancelAnimationFrame(frame);
	}, [filterOpen]);

	function closeFilter() {
		setQuery('');
		setFilterOpen(false);
	}

	function onOutlineKeyDown(event: KeyboardEvent<HTMLElement>) {
		const target = event.target as HTMLElement | null;
		if (!target?.hasAttribute('data-outline-row')) return;
		const key = event.key;
		if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return;
		const root = event.currentTarget;
		const rows = [...root.querySelectorAll<HTMLElement>('[data-outline-row]')];
		if (!rows.length) return;
		const index = rows.indexOf(target);
		event.preventDefault();

		if (key === 'ArrowDown') rows[Math.min(index + 1, rows.length - 1)]?.focus();
		if (key === 'ArrowUp') rows[Math.max(index - 1, 0)]?.focus();
		if (key === 'Home') rows[0]?.focus();
		if (key === 'End') rows[rows.length - 1]?.focus();

		if (key === 'ArrowRight' || key === 'ArrowLeft') {
			const expanded = target.getAttribute('aria-expanded');
			const toggle =
				target.closest('.mc-outline-row')?.querySelector<HTMLElement>('[data-outline-toggle]') ??
				target;
			if (key === 'ArrowRight') {
				if (expanded === 'false') toggle.click();
				else rows[Math.min(index + 1, rows.length - 1)]?.focus();
			} else if (expanded === 'true') {
				toggle.click();
			} else {
				const parentLi = target.closest('li')?.parentElement?.closest('li');
				parentLi?.querySelector<HTMLElement>('[data-outline-row]')?.focus();
			}
		}
	}

	const tree = (
		<OutlineSortableList
			enabled={editing}
			items={visibleLessons.map((lesson) => sortableId('lesson', lesson.id))}
		>
			<ol className="mc-outline-list">
				{visibleLessons.map((lesson) => {
					const stats = lessonStats.get(lesson.id) ?? { done: 0, total: 0 };
					const lessonActive = selected?.lessonId === lesson.id;
					const open =
						Boolean(needle) ||
						(dragFocus?.type !== 'lesson' && expand.isLessonOpen(lesson.id, lessonActive));
					const lessonNumber = String(lesson.position + 1).padStart(2, '0');
					const lessonIndex = lesson.position + 1;
					const lessonInstant = Boolean(needle) || !animateIds.has(lesson.id);
					const lessonComplete = stats.total > 0 && stats.done === stats.total;
					const sectionIds = lesson.sections.map((section) => sortableId('section', section.id));
					return (
						<OutlineSortableItem
							key={lesson.id}
							enabled={editing}
							id={sortableId('lesson', lesson.id)}
							data={{
								type: 'lesson',
								id: lesson.id,
								parentId: course.id,
								title: `${lessonNumber} ${lesson.title}`,
							}}
							disabled={dndLocked}
						>
							{({ setNodeRef, style, handleListeners, handleAttributes, isDragging, dropEdge }) => (
								<li
									ref={setNodeRef}
									style={style}
									data-dragging={isDragging ? 'true' : undefined}
									data-drop={dropEdge ?? undefined}
								>
									<div
										className="mc-outline-row"
										data-kind="lesson"
										data-active={lessonActive ? 'true' : undefined}
										data-open={open ? 'true' : undefined}
										data-dragging={isDragging ? 'true' : undefined}
										data-drop={dropEdge ?? undefined}
										style={depthStyle(0)}
									>
										{editing ? (
											<OutlineDragHandle
												listeners={handleListeners}
												attributes={handleAttributes}
												locked={dndLocked}
											/>
										) : null}
										<button
											type="button"
											className="mc-outline-chevron mc-focus-ring"
											aria-expanded={open}
											data-outline-toggle=""
											onClick={() => {
												markAnimated(lesson.id);
												expand.toggleLesson(lesson.id, open);
											}}
											aria-label={open ? `Thu gọn ${lesson.title}` : `Mở ${lesson.title}`}
										>
											<CaretIcon open={open} />
										</button>
										<button
											type="button"
											aria-expanded={open}
											data-outline-row=""
											data-kind="lesson"
											aria-label={`Mở bài ${lessonNumber}: ${lesson.title}. ${stats.done}/${stats.total} nội dung.`}
											onClick={() => {
												if (!open) {
													markAnimated(lesson.id);
													expand.toggleLesson(lesson.id, false);
												}
												const first = items.find((item) => item.lessonSlug === lesson.slug);
												if (first) onOpen(first);
											}}
											className="mc-focus-ring flex min-h-[var(--mc-out-row)] min-w-0 flex-1 items-center gap-2 self-stretch bg-transparent py-0 text-left"
										>
											<span className="min-w-0 flex-1">
												<span className="block line-clamp-2 text-[14px] font-bold leading-5 text-ink">
													<span className="mc-outline-lesson-num">{lessonNumber}</span>{' '}
													{lesson.title}
												</span>
											</span>
											<span
												className={`mc-num shrink-0 text-[12px] font-semibold leading-4 ${
													lessonComplete ? 'text-mc-done' : 'text-ink-secondary'
												}`}
											>
												{stats.done}/{stats.total}
											</span>
										</button>
										{editing ? (
											<OutlineRowMenu
												kind="lesson"
												id={lesson.id}
												parentId={course.id}
												title={lesson.title}
												updatedAt={lesson.authoring?.updatedAt}
												status={lesson.authoring?.status}
											/>
										) : null}
									</div>
									<OutlineBranch open={open} instant={lessonInstant} railDepth={0}>
										<div className="mc-outline-lesson-body">
											<OutlineSortableList enabled={editing} items={sectionIds}>
												<ol>
													{lesson.sections.map((section) => {
														const sectionItems = section.knowledgeUnits
															.map((unit) =>
																items.find(
																	(item) =>
																		item.sectionId === section.id &&
																		item.knowledgeUnitId === unit.id,
																),
															)
															.filter((item): item is MyClassOutlineItem => Boolean(item));
														const sectionDone = sectionItems.filter(
															(item) => item.status === 'done',
														).length;
														const sectionComplete =
															sectionItems.length > 0 && sectionDone === sectionItems.length;
														const sectionActive = selected?.sectionId === section.id;
														const sectionMatches =
															!needle ||
															section.title.toLowerCase().includes(needle) ||
															section.knowledgeUnits.some((unit) =>
																unit.title.toLowerCase().includes(needle),
															) ||
															section.tests.some((test) =>
																test.title.toLowerCase().includes(needle),
															);
														if (!sectionMatches) return null;
														const sectionOpen =
															Boolean(needle) ||
															(dragFocus?.type !== 'lesson' &&
																!(
																	dragFocus?.type === 'section' &&
																	dragFocus.parentId === lesson.id
																) &&
																expand.isSectionOpen(section.id, sectionActive));
														const sectionNumber = `${lessonIndex}.${section.position + 1}`;
														const sectionInstant =
															Boolean(needle) || !animateIds.has(section.id);
														const unitIds = section.knowledgeUnits.map((unit) =>
															sortableId('unit', unit.id, section.id),
														);
														return (
															<OutlineSortableItem
																key={section.id}
																enabled={editing}
																id={sortableId('section', section.id)}
																data={{
																	type: 'section',
																	id: section.id,
																	parentId: lesson.id,
																	title: `${sectionNumber} ${section.title}`,
																}}
																disabled={dndLocked}
															>
																{({
																	setNodeRef,
																	style,
																	handleListeners,
																	handleAttributes,
																	isDragging,
																	dropEdge,
																}) => (
																	<li
																		ref={setNodeRef}
																		style={style}
																		data-dragging={isDragging ? 'true' : undefined}
																		data-drop={dropEdge ?? undefined}
																	>
																		<div
																			className="mc-outline-row"
																			data-kind="section"
																			data-active={sectionActive ? 'true' : undefined}
																			data-dragging={isDragging ? 'true' : undefined}
																			data-drop={dropEdge ?? undefined}
																		>
																			{editing ? (
																				<OutlineDragHandle
																					listeners={handleListeners}
																					attributes={handleAttributes}
																					locked={dndLocked}
																				/>
																			) : null}
																			<button
																				type="button"
																				aria-expanded={sectionOpen}
																				data-outline-row=""
																				data-outline-toggle=""
																				data-kind="section"
																				data-active={sectionActive ? 'true' : undefined}
																				aria-label={`${sectionOpen ? 'Thu gọn' : 'Mở'} phần ${sectionNumber}: ${section.title}. ${sectionDone}/${sectionItems.length} nội dung.`}
																				onClick={() => {
																					markAnimated(section.id);
																					expand.toggleSection(section.id, sectionOpen);
																				}}
																				className="mc-focus-ring flex min-h-[var(--mc-out-row)] min-w-0 flex-1 items-center gap-2 self-stretch bg-transparent py-0 text-left"
																			>
																				<span
																					className="mc-outline-slot text-ink-tertiary"
																					aria-hidden
																				>
																					<CaretIcon open={sectionOpen} />
																				</span>
																				<span className="mc-outline-section-title line-clamp-2 min-w-0 flex-1">
																					{sectionNumber} {section.title}
																				</span>
																				{sectionComplete ? (
																					<span
																						className="mc-outline-slot text-mc-done"
																						aria-hidden
																					>
																						<McIcon name="check" size={16} />
																					</span>
																				) : null}
																			</button>
																			{editing ? (
																				<OutlineRowMenu
																					kind="section"
																					id={section.id}
																					parentId={lesson.id}
																					title={section.title}
																					updatedAt={section.authoring?.updatedAt}
																					status={section.authoring?.status}
																				/>
																			) : null}
																		</div>
																		<OutlineBranch
																			open={sectionOpen}
																			instant={sectionInstant}
																			railDepth={1}
																		>
																			<div className="mc-outline-unit-rail">
																				<OutlineSortableList enabled={editing} items={unitIds}>
																					<ol>
																						{section.knowledgeUnits.map((unit) => {
																							const item = items.find(
																								(row) =>
																									row.sectionId === section.id &&
																									row.knowledgeUnitId === unit.id,
																							);
																							if (!item && !editing) return null;
																							if (
																								needle &&
																								!unit.title.toLowerCase().includes(needle) &&
																								!section.title.toLowerCase().includes(needle) &&
																								!lesson.title.toLowerCase().includes(needle)
																							) {
																								return null;
																							}
																							const active =
																								selected?.sectionId === section.id &&
																								selected.knowledgeUnitId === unit.id;
																							return (
																								<OutlineSortableItem
																									key={`${unit.id}-${section.id}`}
																									enabled={editing}
																									id={sortableId('unit', unit.id, section.id)}
																									data={{
																										type: 'unit',
																										id: unit.id,
																										parentId: section.id,
																										title: unit.title,
																									}}
																									disabled={dndLocked}
																								>
																									{({
																										setNodeRef,
																										style,
																										handleListeners,
																										handleAttributes,
																										isDragging,
																										dropEdge,
																									}) => (
																										<li
																											ref={setNodeRef}
																											style={style}
																											data-dragging={isDragging ? 'true' : undefined}
																											data-drop={dropEdge ?? undefined}
																										>
																											<div
																												className="mc-outline-row"
																												data-kind="unit"
																												data-dragging={isDragging ? 'true' : undefined}
																												data-drop={dropEdge ?? undefined}
																											>
																												{editing ? (
																													<OutlineDragHandle
																														listeners={handleListeners}
																														attributes={handleAttributes}
																														locked={dndLocked}
																													/>
																												) : null}
																												<button
																													ref={active ? activeRef : undefined}
																													type="button"
																													aria-current={active ? 'page' : undefined}
																													data-outline-row=""
																													data-kind="unit"
																													data-active={active ? 'true' : undefined}
																													onClick={() => {
																														if (item) onOpen(item);
																													}}
																													onPointerEnter={() => {
																														if (item) onPrefetch(item);
																													}}
																													onFocus={() => {
																														if (item) onPrefetch(item);
																													}}
																													aria-label={`${item?.status === 'done' ? 'Đã hoàn thành' : active ? 'Đang đọc' : 'Mở'}: ${unit.title}`}
																													className="mc-outline-row mc-focus-ring touch-manipulation flex-1"
																												>
																													<StatusSlot
																														done={item?.status === 'done'}
																														active={active}
																													/>
																													<span
																														className={`min-w-0 flex-1 line-clamp-2 text-[14px] leading-5 ${
																															active
																																? 'font-medium text-accent'
																																: 'text-ink-secondary hover:text-ink'
																														}`}
																													>
																														{unit.title}
																													</span>
																												</button>
																												{editing ? (
																													<OutlineRowMenu
																														kind="unit"
																														id={unit.id}
																														parentId={section.id}
																														title={unit.title}
																														updatedAt={unit.authoring?.updatedAt}
																														status={unit.authoring?.status}
																														hasDraft={unit.authoring?.hasDraft}
																													/>
																												) : null}
																											</div>
																										</li>
																									)}
																								</OutlineSortableItem>
																							);
																						})}
																					</ol>
																				</OutlineSortableList>
																				<OutlineTests
																					tests={section.tests}
																					scope="SECTION"
																					editing={editing}
																					courseSlug={course.slug}
																					testScores={testScores}
																					onOpenTest={onOpenTest}
																					hiddenFromLearners={!isPublishedAuthoring(section.authoring?.status) || !isPublishedAuthoring(lesson.authoring?.status)}
																				/>
																			</div>
																		</OutlineBranch>
																	</li>
																)}
															</OutlineSortableItem>
														);
													})}
												</ol>
											</OutlineSortableList>
											<OutlineTests
												tests={lesson.tests}
												scope="LESSON"
												editing={editing}
												courseSlug={course.slug}
												testScores={testScores}
												onOpenTest={onOpenTest}
												hiddenFromLearners={!isPublishedAuthoring(lesson.authoring?.status)}
											/>
											<OutlineVocab
												sets={course.vocabSets.filter((set) => set.lessonId === lesson.id)}
												courseSlug={course.slug}
												editing={editing}
												hiddenFromLearners={!isPublishedAuthoring(lesson.authoring?.status)}
											/>
										</div>
									</OutlineBranch>
								</li>
							)}
						</OutlineSortableItem>
					);
				})}
			</ol>
		</OutlineSortableList>
	);

	return (
		<nav
			data-testid="my-class-outline"
			aria-labelledby={outlineId}
			className="mc-outline flex h-full min-h-0 flex-col"
			onKeyDown={onOutlineKeyDown}
		>
			<div className="mc-outline-head">
				<h2
					id={outlineId}
					className={filterOpen ? 'sr-only' : 'mc-eyebrow m-0 font-bold tracking-wider text-ink-tertiary'}
				>
					Nội dung khóa học
				</h2>
				{filterOpen ? (
					<label className="min-w-0 flex-1">
						<span className="sr-only">Lọc mục lục</span>
						<input
							ref={filterRef}
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							onKeyDown={(event) => {
								if (event.key !== 'Escape') return;
								event.stopPropagation();
								closeFilter();
							}}
							placeholder="Lọc bài, phần, nội dung…"
							className="mc-outline-filter"
						/>
					</label>
				) : null}
				<button
					type="button"
					className="mc-outline-icon-btn mc-focus-ring"
					aria-expanded={filterOpen}
					aria-label={filterOpen ? 'Đóng bộ lọc' : 'Lọc mục lục'}
					onClick={() => (filterOpen ? closeFilter() : setFilterOpen(true))}
				>
					{filterOpen ? <McIcon name="close" size={18} /> : <McIcon name="search" size={18} />}
				</button>
				{visibleLessons.length ? (
					<button
						type="button"
						className="mc-outline-icon-btn mc-focus-ring"
						aria-label={anyExpanded ? 'Thu gọn tất cả' : 'Mở tất cả'}
						onClick={() => {
							const lessonIds = visibleLessons.map((lesson) => lesson.id);
							const sectionIds = visibleLessons.flatMap((lesson) =>
								lesson.sections.map((section) => section.id),
							);
							if (anyExpanded) expand.collapseAll(lessonIds, sectionIds);
							else expand.expandAll(lessonIds, sectionIds);
						}}
					>
						<McIcon name={anyExpanded ? 'unfold_less' : 'unfold_more'} size={18} />
					</button>
				) : null}
				{editing ? (
					<>
						<McButton
							size="sm"
							variant="quiet"
							onClick={() => void edit?.createLesson()}
							disabled={Boolean(edit?.busyKey)}
						>
							<McIcon name="add" size={16} />
							Bài
						</McButton>
						<OutlineCourseMenu />
					</>
				) : null}
			</div>

			<div data-outline-scroll className="mc-outline-scroll">
				{needle && visibleLessons.length === 0 && !courseAssetsMatch ? (
					<div className="mc-outline-empty">
						<p className="text-sm text-ink-secondary">
							Không có kết quả cho &ldquo;{query.trim()}&rdquo;
						</p>
						<button
							type="button"
							className="mt-3 text-sm font-semibold text-ink hover:text-accent"
							onClick={closeFilter}
						>
							Xóa bộ lọc
						</button>
					</div>
				) : (
					<OutlineDnd
						enabled={editing}
						onDragStart={(data) => {
							if (data.type === 'lesson') setDragFocus({ type: 'lesson' });
							if (data.type === 'section') setDragFocus({ type: 'section', parentId: data.parentId });
						}}
						onDragFinished={() => setDragFocus(null)}
						onReorder={handleReorder}
					>
						{tree}
						<CourseAssets
							course={course}
							editing={editing}
							needle={needle}
							testScores={testScores}
							onOpenTest={onOpenTest}
						/>
					</OutlineDnd>
				)}
			</div>
		</nav>
	);
}
