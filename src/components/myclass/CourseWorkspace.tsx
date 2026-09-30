'use client';

import CourseLanding from '@/components/myclass/CourseLanding';
import CourseVocabHub from '@/components/myclass/vocab/CourseVocabHub';
import { McAppHeader, McButton, McIcon, McSheet, McToast } from '@/components/myclass/ui';
import CommandJump from '@/components/myclass/workspace/CommandJump';
import CourseOutline, {
	useCourseOutlineExpand,
} from '@/components/myclass/workspace/CourseOutline';
import CourseTopBar from '@/components/myclass/workspace/CourseTopBar';
import OnThisPage from '@/components/myclass/workspace/OnThisPage';
import Reader from '@/components/myclass/workspace/Reader';
import TestSheet from '@/components/myclass/workspace/TestSheet';
import EditToggle from '@/components/myclass/workspace/edit/EditToggle';
import AttachPicker from '@/components/myclass/workspace/edit/AttachPicker';
import VocabImportDialog from '@/components/myclass/workspace/edit/VocabImportDialog';
import ReaderEditor from '@/components/myclass/workspace/edit/ReaderEditor';
import {
	EditModeProvider,
	useOptionalEditMode,
} from '@/components/myclass/workspace/edit/EditModeContext';
import { routes } from '@/config/routes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	dequeueComplete,
	enqueueComplete,
	flushCompleteQueue,
	mergeLearnerState,
	pendingCount,
	postComplete,
	readLocalCompleted,
	setStorageScope,
	writeLocalCompleted,
} from '@/features/my-class/client/progressStore';
import {
	nextUnfinishedAfter,
	outlineItemsForDisplay,
	seedsFromCourseOutline,
	toOutlineItemLink,
	type MyClassLearnerState,
	type MyClassOutlineItem,
} from '@/features/my-class/domain/learnerState';
import {
	htmlForReadingLevel,
	READING_LEVEL_ORDER,
	READING_LEVEL_STORAGE_KEY,
	type ReadingLevel,
} from '@/features/my-class/domain/readingLevel';
import { prepareReaderHtml } from '@/features/my-class/domain/readerHtml';
import type { ReaderPosition } from '@/components/myclass/workspace/Reader';
import { testsForOutline } from '@/features/my-class/domain/outlineTests';
import { withEditFlag } from '@/features/my-class/domain/workspaceUrl';
import {
	readCourseTestScores,
	type StoredTestScore,
} from '@/features/my-class/client/testScoreStore';
import type {
	MyClassCourseDetail,
	MyClassKnowledgeUnit,
	MyClassTestListItem,
	MyClassVocabSetCard,
} from '@/features/my-class/types';

type ContentPayload = {
	unit: MyClassKnowledgeUnit;
	progress: MyClassLearnerState;
};

const SIDEBAR_KEY = (courseId: string) => `my-class:sidebar-collapsed:${courseId}`;

function useDesktop() {
	const [desktop, setDesktop] = useState(false);
	useEffect(() => {
		const media = window.matchMedia('(min-width: 1024px)');
		const apply = () => setDesktop(media.matches);
		apply();
		media.addEventListener('change', apply);
		return () => media.removeEventListener('change', apply);
	}, []);
	return desktop;
}

function mergeUnit(
	previous: MyClassKnowledgeUnit | undefined,
	next: MyClassKnowledgeUnit,
): MyClassKnowledgeUnit {
	if (!previous) return next;
	return {
		...next,
		foundationHtml: next.foundationHtml || previous.foundationHtml,
		academicHtml: next.academicHtml || previous.academicHtml,
		expertHtml: next.expertHtml || previous.expertHtml,
	};
}

function hasLevelHtml(unit: MyClassKnowledgeUnit, level: ReadingLevel) {
	return Boolean(htmlForReadingLevel(unit, level)?.trim());
}

function parseWorkspaceLocation(courseSlug: string) {
	const prefix = `/my-space/my-class/${courseSlug}`;
	const pathname = window.location.pathname;
	const params = new URLSearchParams(window.location.search);
	if (!pathname.startsWith(prefix)) {
		return {
			lessonSlug: null,
			unitSlug: null,
			sectionSlug: null,
			view: 'content' as const,
			edit: params.get('edit') === '1',
		};
	}
	const rest = pathname.slice(prefix.length).replace(/^\//, '');
	const parts = rest.split('/').filter(Boolean);
	if (parts.length >= 2 && parts[0] !== 'tests' && parts[0] !== 'vocab') {
		return {
			lessonSlug: parts[0] ?? null,
			unitSlug: parts[1] ?? null,
			sectionSlug: params.get('s'),
			view: 'content' as const,
			edit: params.get('edit') === '1',
		};
	}
	return {
		lessonSlug: params.get('lesson'),
		unitSlug: params.get('unit'),
		sectionSlug: params.get('s'),
		view: params.get('view') === 'vocab' ? ('vocab' as const) : ('content' as const),
		edit: params.get('edit') === '1',
	};
}

function cacheKeyFor(item: { knowledgeUnitId: string; sectionId: string }) {
	return `${item.knowledgeUnitId}:${item.sectionId}`;
}

export default function CourseWorkspace({
	course,
	initialState,
	vocabSets = [],
	isAdmin = false,
	editMode = false,
	initialLessonSlug = null,
	initialUnitSlug = null,
	initialSectionSlug = null,
	initialContent = null,
	view: initialView = 'content',
}: {
	course: MyClassCourseDetail;
	initialState: MyClassLearnerState;
	vocabSets?: MyClassVocabSetCard[];
	isAdmin?: boolean;
	editMode?: boolean;
	initialLessonSlug?: string | null;
	initialUnitSlug?: string | null;
	initialSectionSlug?: string | null;
	initialLevel?: ReadingLevel | null;
	initialContent?: ContentPayload | null;
	view?: 'content' | 'vocab';
}) {
	const body = (
		<CourseWorkspaceBody
			course={course}
			initialState={initialState}
			vocabSets={vocabSets}
			isAdmin={isAdmin}
			editMode={editMode}
			initialLessonSlug={initialLessonSlug}
			initialUnitSlug={initialUnitSlug}
			initialSectionSlug={initialSectionSlug}
			initialContent={initialContent}
			initialView={initialView}
		/>
	);
	if (!editMode) return body;
	return (
		<EditModeProvider enabled initialCourse={course}>
			{body}
		</EditModeProvider>
	);
}

function CourseWorkspaceBody({
	course: courseProp,
	initialState,
	vocabSets = [],
	isAdmin = false,
	editMode = false,
	initialLessonSlug = null,
	initialUnitSlug = null,
	initialSectionSlug = null,
	initialContent = null,
	initialView = 'content',
}: {
	course: MyClassCourseDetail;
	initialState: MyClassLearnerState;
	vocabSets?: MyClassVocabSetCard[];
	isAdmin?: boolean;
	editMode?: boolean;
	initialLessonSlug?: string | null;
	initialUnitSlug?: string | null;
	initialSectionSlug?: string | null;
	initialContent?: ContentPayload | null;
	initialView?: 'content' | 'vocab';
}) {
	const router = useRouter();
	const desktop = useDesktop();
	const edit = useOptionalEditMode();
	const course = edit?.course ?? courseProp;
	const [clientReady, setClientReady] = useState(false);
	useEffect(() => setClientReady(true), []);
	const seeds = useMemo(() => seedsFromCourseOutline(course), [course]);
	const [view, setView] = useState<'content' | 'vocab'>(initialView);
	const [lessonSlug, setLessonSlug] = useState<string | null>(initialLessonSlug);
	const [unitSlug, setUnitSlug] = useState<string | null>(initialUnitSlug);
	const [sectionSlug, setSectionSlug] = useState<string | null>(initialSectionSlug);
	const [state, setState] = useState<MyClassLearnerState>(initialState);
	const [pending, setPending] = useState(0);
	const [tocOpen, setTocOpen] = useState(false);
	const [jumpOpen, setJumpOpen] = useState(false);
	const [outlineCollapsed, setOutlineCollapsed] = useState(false);
	useEffect(() => {
		try {
			setOutlineCollapsed(localStorage.getItem(SIDEBAR_KEY(course.id)) === '1');
		} catch {
			/* private mode */
		}
	}, [course.id]);
	const [content, setContent] = useState<ContentPayload | null>(initialContent);
	const [loading, setLoading] = useState(!initialContent && Boolean(initialUnitSlug));
	const [switching, setSwitching] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [toast, setToast] = useState('');
	const [retryKey, setRetryKey] = useState(0);
	const [completeBusy, setCompleteBusy] = useState(false);
	const [activeTest, setActiveTest] = useState<MyClassTestListItem | null>(null);
	const [testScores, setTestScores] = useState<Record<string, StoredTestScore>>({});
	const cacheRef = useRef<Map<string, ContentPayload> | null>(null);
	if (cacheRef.current === null) {
		cacheRef.current = new Map();
		if (initialContent) {
			const seed = seeds.find(
				(item) =>
					item.knowledgeUnitSlug === initialUnitSlug &&
					(!initialSectionSlug || item.sectionSlug === initialSectionSlug) &&
					(!initialLessonSlug || item.lessonSlug === initialLessonSlug),
			);
			if (seed) cacheRef.current.set(cacheKeyFor(seed), initialContent);
		}
	}
	const abortRef = useRef<AbortController | null>(null);
	const completionVersionRef = useRef(0);
	const completionInFlightRef = useRef(new Set<string>());
	const headingRef = useRef<HTMLHeadingElement | null>(null);

	useEffect(() => setState(initialState), [initialState]);

	const items = useMemo(() => outlineItemsForDisplay(seeds, state), [seeds, state]);
	const selected = useMemo(() => {
		return (
			items.find(
				(item) =>
					item.knowledgeUnitSlug === unitSlug &&
					(!sectionSlug || item.sectionSlug === sectionSlug) &&
					(!lessonSlug || item.lessonSlug === lessonSlug),
			) ??
			items.find(
				(item) =>
					item.knowledgeUnitSlug === unitSlug && (!lessonSlug || item.lessonSlug === lessonSlug),
			) ??
			null
		);
	}, [items, lessonSlug, sectionSlug, unitSlug]);

	const selectedKey = selected ? cacheKeyFor(selected) : null;
	const expand = useCourseOutlineExpand(course.id);

	const position = useMemo((): ReaderPosition | null => {
		if (!selected) return null;
		const lesson = course.lessons.find((row) => row.slug === selected.lessonSlug);
		const lessonNumber = String((lesson?.position ?? 0) + 1).padStart(2, '0');
		const sectionUnits = [
			...new Map(
				items
					.filter((item) => item.sectionId === selected.sectionId)
					.map((item) => [item.knowledgeUnitId, item]),
			).values(),
		];
		const index = sectionUnits.findIndex(
			(item) => item.knowledgeUnitId === selected.knowledgeUnitId,
		);
		return {
			lessonNumber,
			lessonTitle: selected.lessonTitle,
			sectionTitle: selected.sectionTitle,
			indexInSection: index >= 0 ? index + 1 : 0,
			sectionTotal: sectionUnits.length,
		};
	}, [course.lessons, items, selected]);

	const nextItem = useMemo(() => {
		if (!selected) return state.afterResumeItem;
		return nextUnfinishedAfter(selected.knowledgeUnitId, seeds, state.completedUnitIds);
	}, [selected, seeds, state.afterResumeItem, state.completedUnitIds]);

	const available = useMemo(
		() => content?.unit.availableLevels ?? selected?.availableLevels ?? [],
		[content?.unit.availableLevels, selected?.availableLevels],
	);
	const blocks = useMemo(() => {
		if (!content) return [];
		return READING_LEVEL_ORDER.filter(
			(level) => available.includes(level) && hasLevelHtml(content.unit, level),
		).map((level) => {
			const prepared = prepareReaderHtml(htmlForReadingLevel(content.unit, level));
			return {
				level,
				html: prepared.html,
				headings: prepared.headings,
			};
		});
	}, [available, content]);

	const [preferredLevel, setPreferredLevel] = useState<ReadingLevel | null>(null);
	useEffect(() => {
		try {
			const raw = localStorage.getItem(`${READING_LEVEL_STORAGE_KEY}:${course.slug}`);
			if (raw && (READING_LEVEL_ORDER as string[]).includes(raw)) {
				setPreferredLevel(raw as ReadingLevel);
			} else {
				setPreferredLevel(null);
			}
		} catch {
			setPreferredLevel(null);
		}
	}, [course.slug]);

	const activeLevel =
		(preferredLevel && available.includes(preferredLevel) ? preferredLevel : available[0]) ?? null;

	function selectReadingLevel(level: ReadingLevel) {
		setPreferredLevel(level);
		try {
			localStorage.setItem(`${READING_LEVEL_STORAGE_KEY}:${course.slug}`, level);
		} catch {
			/* private mode */
		}
	}

	const allTestSlugs = useMemo(() => {
		const slugs = new Set<string>();
		for (const test of course.tests) slugs.add(test.slug);
		for (const lesson of course.lessons) {
			for (const test of lesson.tests) slugs.add(test.slug);
			for (const section of lesson.sections) {
				for (const test of section.tests) slugs.add(test.slug);
			}
		}
		return [...slugs];
	}, [course]);

	const sectionTests = useMemo(() => {
		if (!selected) return [];
		const lesson = course.lessons.find((item) => item.slug === selected.lessonSlug);
		const section = lesson?.sections.find((item) => item.id === selected.sectionId);
		return testsForOutline(section?.tests ?? [], 'SECTION');
	}, [course.lessons, selected]);

	const navigateToItem = useCallback(
		(item: MyClassOutlineItem, history: 'push' | 'replace' = 'push') => {
			const link = toOutlineItemLink(item, seeds);
			const href = withEditFlag(link.href, editMode);
			setActiveTest(null);
			setLessonSlug(item.lessonSlug);
			setUnitSlug(item.knowledgeUnitSlug);
			setSectionSlug(item.sectionSlug);
			setView('content');
			if (history === 'replace') window.history.replaceState(window.history.state, '', href);
			else window.history.pushState(window.history.state, '', href);
		},
		[editMode, seeds],
	);

	const postView = useCallback(
		(item: MyClassOutlineItem) => {
			if (editMode) return;
			void fetch(`/api/my-class/progress/knowledge/${item.knowledgeUnitId}/view`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					courseId: course.id,
					lessonSlug: item.lessonSlug,
					sectionId: item.sectionId,
				}),
			}).catch(() => undefined);
		},
		[course.id, editMode],
	);

	function knowledgeUrl(item: MyClassOutlineItem) {
		const params = new URLSearchParams({
			lesson: item.lessonSlug,
			section: item.sectionId,
		});
		const base = editMode
			? `/api/admin/my-class/authoring/courses/${course.slug}/knowledge/${item.knowledgeUnitSlug}`
			: `/api/my-class/courses/${course.slug}/knowledge/${item.knowledgeUnitSlug}`;
		return `${base}?${params.toString()}`;
	}

	const prefetchItem = useCallback(
		(item: MyClassOutlineItem) => {
			const key = cacheKeyFor(item);
			const cached = cacheRef.current?.get(key);
			const levels = cached?.unit.availableLevels ?? item.availableLevels;
			if (cached && (editMode || levels.every((level) => hasLevelHtml(cached.unit, level)))) return;
			void fetch(knowledgeUrl(item))
				.then((response) => response.json())
				.then((json: { ok: boolean; data?: ContentPayload }) => {
					if (!json.ok || !json.data || !cacheRef.current) return;
					const nextUnit = editMode
						? json.data.unit
						: mergeUnit(cacheRef.current.get(key)?.unit, json.data.unit);
					cacheRef.current.set(key, { ...json.data, unit: nextUnit });
				})
				.catch(() => undefined);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[course.slug, editMode],
	);

	useEffect(() => {
		const sync = async () => {
			const bootstrap = (await fetch('/api/my-class/actor/bootstrap', { method: 'POST' })
				.then((response) => response.json())
				.catch(() => null)) as { data?: { storageScope?: string } } | null;
			if (bootstrap?.data?.storageScope) setStorageScope(bootstrap.data.storageScope);
			const local = readLocalCompleted(course.id);
			if (local.length) {
				setState(mergeLearnerState(course, initialState, local, selected?.knowledgeUnitId ?? null));
			}
			setPending(pendingCount());
			return flushCompleteQueue();
		};
		void sync().then((result) => {
			const next = result.byCourseId[course.id];
			if (next) {
				setState(
					mergeLearnerState(
						course,
						next,
						readLocalCompleted(course.id),
						selected?.knowledgeUnitId ?? null,
					),
				);
			}
			setPending(pendingCount());
		});
		function onOnline() {
			void flushCompleteQueue().then((result) => {
				const next = result.byCourseId[course.id];
				if (next) {
					setState(
						mergeLearnerState(
							course,
							next,
							readLocalCompleted(course.id),
							selected?.knowledgeUnitId ?? null,
						),
					);
				}
				setPending(pendingCount());
			});
		}
		window.addEventListener('online', onOnline);
		window.addEventListener('focus', onOnline);
		return () => {
			window.removeEventListener('online', onOnline);
			window.removeEventListener('focus', onOnline);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [course.id]);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null;
			const typing =
				target &&
				(target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
			if (typing) return;
			if (
				(event.key === '/' ||
					((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')) &&
				!jumpOpen
			) {
				event.preventDefault();
				setJumpOpen(true);
			}
			if ((event.metaKey || event.ctrlKey) && event.key === '\\') {
				event.preventDefault();
				setOutlineCollapsed((value) => {
					const next = !value;
					try {
						localStorage.setItem(SIDEBAR_KEY(course.id), next ? '1' : '0');
					} catch {
						/* private mode */
					}
					return next;
				});
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [course.id, jumpOpen]);

	useEffect(() => {
		const onPop = () => {
			const parsed = parseWorkspaceLocation(course.slug);
			setLessonSlug(parsed.lessonSlug);
			setUnitSlug(parsed.unitSlug);
			setSectionSlug(parsed.sectionSlug);
			setView(parsed.view);
		};
		window.addEventListener('popstate', onPop);
		return () => window.removeEventListener('popstate', onPop);
	}, [course.slug]);

	useEffect(() => {
		if (!selected || view === 'vocab') {
			if (view === 'vocab') {
				setLoadError(null);
			}
			return;
		}
		const cache = cacheRef.current!;
		const cached = cache.get(selectedKey!);
		const levels = cached?.unit.availableLevels ?? selected.availableLevels;
		const needFull = !cached || levels.some((level) => !hasLevelHtml(cached.unit, level));
		if (cached && (editMode || !needFull)) {
			setContent(cached);
			setLoadError(null);
			setLoading(false);
			setSwitching(false);
			postView(selected);
			return;
		}
		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;
		if (cached) {
			setContent(cached);
			setSwitching(true);
			setLoading(false);
		} else if (content) {
			setSwitching(true);
			setLoading(false);
		} else {
			setLoading(true);
		}
		setLoadError(null);
		const requestCompletionVersion = completionVersionRef.current;
		void fetch(knowledgeUrl(selected), { signal: controller.signal })
			.then((response) => response.json())
			.then((json: { ok: boolean; data?: ContentPayload }) => {
				if (!json.ok || !json.data) {
					setLoadError('Không tải được nội dung.');
					return;
				}
				const nextUnit = editMode
					? json.data.unit
					: mergeUnit(cache.get(selectedKey!)?.unit, json.data.unit);
				const payload = { ...json.data, unit: nextUnit };
				cache.set(selectedKey!, payload);
				setContent(payload);
				if (json.data.progress && requestCompletionVersion === completionVersionRef.current) {
					setState(
						mergeLearnerState(
							course,
							json.data.progress,
							readLocalCompleted(course.id),
							selected.knowledgeUnitId,
						),
					);
				}
				postView(selected);
			})
			.catch((error: unknown) => {
				if (error instanceof DOMException && error.name === 'AbortError') return;
				setLoadError('Không tải được nội dung.');
			})
			.finally(() => {
				if (abortRef.current === controller) {
					setLoading(false);
					setSwitching(false);
				}
			});
		return () => controller.abort();
		// selected is read via selectedKey so unit/section identity stays stable.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [course.id, selectedKey, view, retryKey, editMode]);

	useEffect(() => {
		if (!selectedKey || loading || !content) return;
		headingRef.current?.focus({ preventScroll: true });
	}, [selectedKey, loading, content]);

	useEffect(() => {
		if (!nextItem || view === 'vocab') return;
		const timer = window.setTimeout(() => prefetchItem(nextItem), 400);
		return () => window.clearTimeout(timer);
	}, [nextItem, prefetchItem, view]);

	useEffect(() => {
		setTestScores(readCourseTestScores(course.slug, allTestSlugs));
	}, [allTestSlugs, course.slug]);

	function toggleOutline() {
		setOutlineCollapsed((value) => {
			const next = !value;
			try {
				localStorage.setItem(SIDEBAR_KEY(course.id), next ? '1' : '0');
			} catch {
				/* private mode */
			}
			return next;
		});
	}

	function selectLesson(slug: string) {
		const first = items.find((item) => item.lessonSlug === slug);
		if (first) navigateToItem(first);
	}

	async function completeAndNext() {
		if (editMode || !selected || completeBusy) return;
		if (completionInFlightRef.current.has(selected.knowledgeUnitId)) return;
		completionInFlightRef.current.add(selected.knowledgeUnitId);
		setCompleteBusy(true);
		completionVersionRef.current += 1;
		const completedIds = [...new Set([...state.completedUnitIds, selected.knowledgeUnitId])];
		writeLocalCompleted(course.id, [
			...new Set([...readLocalCompleted(course.id), selected.knowledgeUnitId]),
		]);
		setState((prev) =>
			mergeLearnerState(course, prev, readLocalCompleted(course.id), selected.knowledgeUnitId),
		);
		enqueueComplete({
			courseId: course.id,
			courseSlug: course.slug,
			knowledgeUnitId: selected.knowledgeUnitId,
			kuSlug: selected.knowledgeUnitSlug,
			lessonSlug: selected.lessonSlug,
			sectionId: selected.sectionId,
		});
		setPending(pendingCount());

		const optimisticNext = nextUnfinishedAfter(selected.knowledgeUnitId, seeds, completedIds);
		if (optimisticNext) navigateToItem(optimisticNext);

		try {
			const result = await postComplete({
				courseSlug: course.slug,
				kuSlug: selected.knowledgeUnitSlug,
				lessonSlug: selected.lessonSlug,
				sectionId: selected.sectionId,
			});
			dequeueComplete(course.id, selected.knowledgeUnitId);
			if (!result.ok) {
				if (result.retryable) {
					setToast('Đã lưu tạm — sẽ đồng bộ khi có mạng');
				} else {
					setToast(result.message || 'Không thể lưu tiến độ');
					router.refresh();
				}
			} else {
				setState(
					mergeLearnerState(
						course,
						result.data.learnerState,
						readLocalCompleted(course.id),
						selected.knowledgeUnitId,
					),
				);
				if (!optimisticNext) {
					const openItem = result.data.transition?.openItem;
					if (openItem) router.push(openItem.href);
					else setToast('Bạn đã hoàn thành khóa học');
				}
			}
		} catch {
			setToast('Đã lưu tạm — sẽ đồng bộ khi có mạng');
		} finally {
			completionInFlightRef.current.delete(selected.knowledgeUnitId);
			setPending(pendingCount());
			setCompleteBusy(false);
		}
	}

	const jump = (
		<CommandJump
			open={jumpOpen}
			onClose={() => setJumpOpen(false)}
			course={course}
			items={items}
			vocabSets={vocabSets.length ? vocabSets : course.vocabSets}
			onOpenUnit={(item) => navigateToItem(item)}
			onOpenTest={(test) => setActiveTest(test)}
			includeUnpublished={editMode}
		/>
	);

	function rememberTestScore(slug: string, result: StoredTestScore) {
		setTestScores((prev) => ({ ...prev, [slug]: result }));
	}

	const editActions = isAdmin ? (
		<EditToggle courseSlug={course.slug} courseId={course.id} editMode={editMode} />
	) : null;

	const sectionCount = course.lessons.reduce((count, lesson) => count + lesson.sections.length, 0);
	const unitCount = course.lessons.reduce(
		(count, lesson) =>
			count + lesson.sections.reduce((inner, section) => inner + section.knowledgeUnits.length, 0),
		0,
	);
	const statusLabel =
		course.authoring?.status === 'PUBLISHED'
			? 'Đã xuất bản'
			: course.authoring?.status === 'ARCHIVED'
				? 'Lưu trữ'
				: course.authoring?.status === 'DRAFT'
					? 'Nháp'
					: null;
	const editSummary = `${course.lessons.length} bài · ${sectionCount} chủ đề · ${unitCount} nội dung${
		statusLabel ? ` · ${statusLabel}` : ''
	}`;

	const outline = (
		<CourseOutline
			course={course}
			items={items}
			selected={selected}
			onOpen={(item) => navigateToItem(item)}
			onPrefetch={(item) => prefetchItem(item)}
			onOpenTest={(test) => setActiveTest(test)}
			testScores={testScores}
			revealActive
			expand={expand}
		/>
	);

	const visibleVocab = (vocabSets.length ? vocabSets : course.vocabSets).filter(
		(set) => !set.isArchived,
	);

	if (view === 'vocab') {
		return (
			<div
				data-testid="my-class-workspace"
				data-client-ready={clientReady ? 'true' : 'false'}
				data-edit={editMode ? 'true' : undefined}
			>
				<CourseTopBar
					courseSlug={course.slug}
					courseTitle={course.title}
					percent={state.percent}
					completed={state.completedItems}
					total={state.totalItems}
					lessons={course.lessons}
					activeLessonSlug={lessonSlug}
					onSelectLesson={selectLesson}
					outlineCollapsed={outlineCollapsed}
					onToggleOutline={toggleOutline}
					onSearch={() => setJumpOpen(true)}
					desktop={desktop}
					actions={editActions}
					editMode={editMode}
					editSummary={editSummary}
					hasVocab={visibleVocab.length > 0}
				/>
				<div className="mx-auto max-w-3xl px-4 py-6">
					<Link
						href={routes.myClassCourse(course.slug)}
						className="text-sm font-medium text-ink-secondary hover:text-ink"
					>
						← {course.title}
					</Link>
					<CourseVocabHub
						courseSlug={course.slug}
						sets={vocabSets.length ? vocabSets : course.vocabSets}
					/>
				</div>
				{jump}
				<TestSheet
					open={Boolean(activeTest)}
					onClose={() => setActiveTest(null)}
					courseSlug={course.slug}
					test={activeTest}
					onResult={rememberTestScore}
				/>
			</div>
		);
	}

	if (!selected && !editMode) {
		return (
			<div
				data-testid="my-class-workspace"
				data-client-ready={clientReady ? 'true' : 'false'}
				className="min-h-svh bg-canvas"
			>
				<McAppHeader href={routes.myClass} title="My Class" meta="Tất cả khóa học" back />
				<div className="mx-auto max-w-5xl px-4 py-6">
					<CourseLanding
						course={course}
						state={state}
						items={items}
						isAdmin={isAdmin}
						editActions={editActions}
					/>
					{pending ? (
						<p className="mt-4 text-sm text-ink-secondary">Đang đồng bộ tiến độ…</p>
					) : null}
				</div>
				{jump}
				<TestSheet
					open={Boolean(activeTest)}
					onClose={() => setActiveTest(null)}
					courseSlug={course.slug}
					test={activeTest}
					onResult={rememberTestScore}
				/>
			</div>
		);
	}

	return (
		<div
			data-testid="my-class-workspace"
			data-client-ready={clientReady ? 'true' : 'false'}
			data-edit={editMode ? 'true' : undefined}
		>
			<CourseTopBar
				courseSlug={course.slug}
				courseTitle={course.title}
				percent={state.percent}
				completed={state.completedItems}
				total={state.totalItems}
				lessons={course.lessons}
				activeLessonSlug={selected?.lessonSlug ?? lessonSlug}
				onSelectLesson={selectLesson}
				outlineCollapsed={outlineCollapsed}
				onToggleOutline={toggleOutline}
				onSearch={() => setJumpOpen(true)}
				desktop={desktop}
				actions={editActions}
				editMode={editMode}
				editSummary={editSummary}
				hasVocab={visibleVocab.length > 0}
			/>

			<McSheet
				open={tocOpen && !desktop}
				onClose={() => setTocOpen(false)}
				title="Mục lục"
				side="right"
			>
				{tocOpen && !desktop ? (
					<CourseOutline
						course={course}
						items={items}
						selected={selected}
						onOpen={(item) => {
							setTocOpen(false);
							navigateToItem(item);
						}}
						onPrefetch={(item) => prefetchItem(item)}
						onOpenTest={(test) => {
							setTocOpen(false);
							setActiveTest(test);
						}}
						testScores={testScores}
						revealActive={tocOpen}
						expand={expand}
					/>
				) : null}
			</McSheet>

			<div
				className={`mc-workspace ${outlineCollapsed ? 'mc-workspace-collapsed' : ''}`}
				data-edit={editMode ? 'true' : undefined}
			>
				{!outlineCollapsed ? (
					<aside className="mc-workspace-outline hidden lg:flex">{outline}</aside>
				) : null}
				<section className="min-w-0 bg-canvas px-5 py-6 md:px-6 lg:px-10 lg:py-8">
					<div className="mc-reader-column">
						{activeTest ? (
							<TestSheet
								open
								variant="inline"
								onClose={() => setActiveTest(null)}
								courseSlug={course.slug}
								test={activeTest}
								preview={Boolean(editMode && activeTest.authoring?.status !== 'PUBLISHED')}
								onResult={rememberTestScore}
							/>
						) : editMode && selected ? (
							content?.unit ? (
								<ReaderEditor
									unit={content.unit}
									onSaved={(next) => {
										const cache = cacheRef.current;
										if (cache) {
											for (const [key, payload] of cache) {
												if (payload.unit.id === next.id) {
													cache.set(key, { ...payload, unit: next });
												}
											}
											if (selectedKey && !cache.has(selectedKey)) {
												cache.set(selectedKey, {
													unit: next,
													progress: state,
												});
											}
										}
										setContent((prev) =>
											prev ? { ...prev, unit: next } : { unit: next, progress: state },
										);
									}}
								/>
							) : (
								<p className="mc-meta">Đang tải nội dung…</p>
							)
						) : selected ? (
							<Reader
								selected={selected}
								headingRef={headingRef}
								loading={loading}
								switching={switching}
								loadError={loadError}
								onRetry={() => setRetryKey((value) => value + 1)}
								blocks={blocks}
								activeLevel={activeLevel}
								onSelectLevel={selectReadingLevel}
								onComplete={() => void completeAndNext()}
								completeBusy={completeBusy}
								nextTitle={nextItem?.title ?? null}
								estimatedMinutes={content?.unit.estimatedMinutes ?? selected.estimatedMinutes}
								desktop={desktop}
								contentKey={selected.knowledgeUnitId}
								position={position}
							/>
						) : (
							<CourseLanding
								course={course}
								state={state}
								items={items}
								isAdmin={isAdmin}
								editActions={editActions}
							/>
						)}
					</div>
				</section>
				<div className="mc-workspace-rail hidden 2xl:block">
					<OnThisPage
						courseSlug={course.slug}
						sectionTests={sectionTests}
						testScores={testScores}
						onOpenTest={(test) => setActiveTest(test)}
						estimatedMinutes={content?.unit.estimatedMinutes ?? selected?.estimatedMinutes}
					/>
				</div>
			</div>

			{editMode || !selected ? null : (
				<div className="fixed inset-x-0 bottom-0 z-30 border-t border-mc-rule bg-paper px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => setTocOpen(true)}
							className="flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 py-1 text-ink-secondary"
						>
							<McIcon name="menu_book" size={24} />
							<span className="text-[10px] font-medium leading-none">Mục lục</span>
						</button>
						{activeTest ? (
							<McButton
								size="md"
								variant="secondary"
								onClick={() => setActiveTest(null)}
								className="min-h-0 flex-1 !rounded-xl py-3.5 whitespace-nowrap"
							>
								Đóng bài kiểm tra
							</McButton>
						) : selected.status === 'done' && !nextItem ? (
							<p className="min-w-0 flex-1 px-2 text-sm font-semibold text-mc-done">
								Bạn đã hoàn thành nội dung này.
							</p>
						) : (
							<McButton
								size="md"
								onClick={() => void completeAndNext()}
								disabled={loading || Boolean(loadError)}
								loading={completeBusy}
								className="min-h-0 flex-1 !rounded-xl py-3.5 whitespace-nowrap"
							>
								{selected.status === 'done' ? 'Tiếp tục' : 'Đã hiểu'}
								{nextItem ? <McIcon name="arrow_forward" size={20} /> : null}
							</McButton>
						)}
					</div>
				</div>
			)}

			{jump}
			{editMode ? <AttachPicker /> : null}
			{editMode ? <VocabImportDialog /> : null}
			<McToast
				message={edit?.error || edit?.toast || toast}
				visible={Boolean(edit?.error || edit?.toast || toast)}
				className="mc-toast"
				onDismiss={() => {
					setToast('');
					edit?.setToast('');
					edit?.clearError();
				}}
			/>
			{edit?.error ? (
				<p className="sr-only" role="alert">
					{edit.error}
				</p>
			) : null}
			{pending ? (
				<p className="sr-only" role="status">
					Đang đồng bộ tiến độ
				</p>
			) : null}
		</div>
	);
}
