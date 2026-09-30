'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { routes } from '@/config/routes';
import {
	mergeLearnerState,
	enqueueComplete,
	postComplete,
	readLocalCompleted,
	writeLocalCompleted,
} from '@/features/my-class/client/progressStore';
import { knowledgeExplanation } from '@/features/my-class/domain/knowledgeContent';
import {
	outlineItemsForDisplay,
	seedsFromCourseOutline,
	type MyClassLearnerState,
	type MyClassOutlineItem,
} from '@/features/my-class/domain/learnerState';
import { prepareReaderHtml } from '@/features/my-class/domain/readerHtml';
import type {
	ExplanationMode,
	MyClassCourseDetail,
	MyClassKnowledgeUnit,
} from '@/features/my-class/types';

type ContentDetail = {
	unit: MyClassKnowledgeUnit;
	progress: MyClassLearnerState;
	context?: unknown;
	related?: Array<{ slug: string; title: string; href?: string }>;
	next?: {
		slug: string;
		title: string;
		lessonSlug: string;
		sectionId: string;
		sectionSlug?: string;
	} | null;
};

function resolveMode(courseSlug: string, fallback: ExplanationMode) {
	if (typeof window === 'undefined') return fallback;
	const value = window.localStorage.getItem(`knowledge:explanation-mode:${courseSlug}`);
	return value === 'deep' || value === 'short' ? value : fallback;
}

export default function KnowledgeWorkspace({
	course,
	initialState,
	initialLessonSlug,
	initialUnitSlug,
	initialSectionSlug,
	initialContent,
	initialMode = 'short',
}: {
	course: MyClassCourseDetail;
	initialState: MyClassLearnerState;
	initialLessonSlug: string;
	initialUnitSlug: string;
	initialSectionSlug?: string | null;
	initialContent: ContentDetail | null;
	initialMode?: ExplanationMode;
}) {
	const seeds = useMemo(() => seedsFromCourseOutline(course), [course]);
	const [state, setState] = useState(initialState);
	const [selected, setSelected] = useState<MyClassOutlineItem | null>(() =>
		seeds.find(
			(item) => item.lessonSlug === initialLessonSlug && item.knowledgeUnitSlug === initialUnitSlug,
		)
			? (outlineItemsForDisplay(seeds, initialState).find(
					(item) =>
						item.lessonSlug === initialLessonSlug && item.knowledgeUnitSlug === initialUnitSlug,
				) ?? null)
			: null,
	);
	const [content, setContent] = useState<ContentDetail | null>(initialContent);
	const [mode, setMode] = useState<ExplanationMode>(initialMode);
	const [openModules, setOpenModules] = useState<string[]>(
		initialSectionSlug ? [initialSectionSlug] : [],
	);
	const [mobileOutline, setMobileOutline] = useState(false);
	const [loading, setLoading] = useState(false);
	const [loadError, setLoadError] = useState(false);
	const cache = useRef(new Map<string, ContentDetail>());
	const requestController = useRef<AbortController | null>(null);
	const displayItems = useMemo(() => outlineItemsForDisplay(seeds, state), [seeds, state]);
	const modules = useMemo(
		() =>
			course.lessons.flatMap((lesson) =>
				lesson.sections.map((section) => ({
					lesson,
					section,
					items: displayItems.filter((item) => item.sectionId === section.id),
				})),
			),
		[course, displayItems],
	);
	const explanation = content
		? knowledgeExplanation(content.unit)
		: { shortHtml: '', deepHtml: '', availableModes: [] as ExplanationMode[] };
	const effectiveMode =
		mode === 'deep' && !explanation.availableModes.includes('deep') ? 'short' : mode;
	const html = prepareReaderHtml(
		effectiveMode === 'deep' ? explanation.deepHtml : explanation.shortHtml,
	).html;

	useEffect(() => {
		const local = readLocalCompleted(course.id);
		if (local.length) setState((current) => mergeLearnerState(course, current, local));
		setMode(resolveMode(course.slug, initialMode));
	}, [course, initialMode]);
	useEffect(() => {
		const onPop = () => {
			const parts = window.location.pathname.split('/').filter(Boolean);
			const index = parts.indexOf(course.slug);
			const lessonSlug = index >= 0 ? parts[index + 1] : null;
			const unitSlug = index >= 0 ? parts[index + 2] : null;
			const item = displayItems.find(
				(candidate) =>
					candidate.lessonSlug === lessonSlug && candidate.knowledgeUnitSlug === unitSlug,
			);
			if (item) void selectItem(item, 'none');
		};
		window.addEventListener('popstate', onPop);
		return () => {
			window.removeEventListener('popstate', onPop);
			requestController.current?.abort();
		};
	});

	async function selectItem(item: MyClassOutlineItem, history: 'push' | 'none' = 'push') {
		setSelected(item);
		setOpenModules((current) =>
			current.includes(item.sectionSlug) ? current : [...current, item.sectionSlug],
		);
		setMobileOutline(false);
		if (history === 'push')
			window.history.pushState(
				{},
				'',
				routes.myClassUnit(course.slug, item.lessonSlug, item.knowledgeUnitSlug, {
					sectionSlug: item.sectionSlug,
				}),
			);
		if (content?.unit.slug === item.knowledgeUnitSlug) return;
		const cached = cache.current.get(
			`${item.lessonSlug}:${item.sectionId}:${item.knowledgeUnitSlug}`,
		);
		if (cached) {
			setContent(cached);
			setLoadError(false);
			return;
		}
		setLoading(true);
		setLoadError(false);
		requestController.current?.abort();
		const controller = new AbortController();
		requestController.current = controller;
		try {
			const response = await fetch(
				`/api/my-class/courses/${course.slug}/knowledge/${item.knowledgeUnitSlug}?lesson=${encodeURIComponent(item.lessonSlug)}&section=${encodeURIComponent(item.sectionId)}`,
				{ signal: controller.signal },
			);
			if (!response.ok) throw new Error('knowledge_fetch_failed');
			const json = (await response.json()) as { data?: ContentDetail };
			if (json.data?.unit) {
				cache.current.set(
					`${item.lessonSlug}:${item.sectionId}:${item.knowledgeUnitSlug}`,
					json.data,
				);
				setContent(json.data);
			} else throw new Error('knowledge_payload_failed');
		} catch (error) {
			if (!(error instanceof DOMException && error.name === 'AbortError')) setLoadError(true);
		} finally {
			if (requestController.current === controller) setLoading(false);
		}
	}

	async function completeSelected() {
		if (!selected || selected.status === 'done') return;
		const local = [...new Set([...state.completedUnitIds, selected.knowledgeUnitId])];
		writeLocalCompleted(course.id, local);
		setState(
			mergeLearnerState(course, state, [selected.knowledgeUnitId], selected.knowledgeUnitId),
		);
		enqueueComplete({
			courseId: course.id,
			knowledgeUnitId: selected.knowledgeUnitId,
			courseSlug: course.slug,
			kuSlug: selected.knowledgeUnitSlug,
			lessonSlug: selected.lessonSlug,
			sectionId: selected.sectionId,
		});
		const result = await postComplete({
			courseSlug: course.slug,
			kuSlug: selected.knowledgeUnitSlug,
			lessonSlug: selected.lessonSlug,
			sectionId: selected.sectionId,
		});
		if (result.ok) setState(result.data.learnerState);
		const moduleItems = displayItems.filter((item) => item.sectionId === selected.sectionId);
		const next =
			moduleItems.find((item) => item.position > selected.position && item.status !== 'done') ??
			null;
		if (next) await selectItem(next);
		else
			window.location.href = routes.myClassModule(
				course.slug,
				selected.lessonSlug,
				selected.sectionSlug,
			);
	}

	return (
		<div className="mc-reader-workspace" data-testid="knowledge-workspace">
			<div className="mc-workspace-toolbar">
				<Link href={routes.myClassCourse(course.slug)} className="mc-header-link">
					← {course.title}
				</Link>
				<button
					type="button"
					className="mc-button mc-button-secondary mc-mobile-outline-button"
					onClick={() => setMobileOutline(true)}
				>
					Mục lục
				</button>
			</div>
			<div className="mc-reader-grid">
				<aside
					className={`mc-outline ${mobileOutline ? 'is-mobile-open' : ''}`}
					aria-label="Mục lục bài học và module"
				>
					<div className="mc-outline-head">
						<span className="mc-eyebrow">MỤC LỤC</span>
						<button
							type="button"
							className="mc-outline-close"
							onClick={() => setMobileOutline(false)}
							aria-label="Đóng mục lục"
						>
							×
						</button>
					</div>
					{modules.map(({ lesson, section, items }) => {
						const open = openModules.includes(section.slug);
						return (
							<section
								key={section.id}
								className="mc-outline-module"
								data-open={open ? 'true' : 'false'}
							>
								<button
									type="button"
									className="mc-outline-module-toggle"
									aria-expanded={open}
									onClick={() =>
										setOpenModules((current) =>
											open
												? current.filter((id) => id !== section.slug)
												: [...current, section.slug],
										)
									}
								>
									<span>
										<small>{lesson.title}</small>
										<strong>{section.title}</strong>
									</span>
									<span>
										{items.filter((item) => item.status === 'done').length}/{items.length}
									</span>
								</button>
								{open ? (
									<div className="mc-outline-items">
										{items.map((item) => (
											<Link
												key={`${item.lessonSlug}:${item.sectionSlug}:${item.knowledgeUnitSlug}`}
												href={routes.myClassUnit(
													course.slug,
													item.lessonSlug,
													item.knowledgeUnitSlug,
													{ sectionSlug: item.sectionSlug },
												)}
												className={`mc-outline-item ${selected?.knowledgeUnitId === item.knowledgeUnitId ? 'is-active' : ''}`}
												aria-current={
													selected?.knowledgeUnitId === item.knowledgeUnitId ? 'page' : undefined
												}
												data-active={
													selected?.knowledgeUnitId === item.knowledgeUnitId ? 'true' : 'false'
												}
												data-done={item.status === 'done' ? 'true' : 'false'}
												onClick={(event) => {
													if (
														event.button !== 0 ||
														event.metaKey ||
														event.ctrlKey ||
														event.shiftKey ||
														event.altKey
													)
														return;
													event.preventDefault();
													void selectItem(item);
												}}
											>
												<span>{item.status === 'done' ? '✓' : '○'}</span>
												<span>{item.title}</span>
											</Link>
										))}
									</div>
								) : null}
							</section>
						);
					})}
				</aside>
				{mobileOutline ? (
					<button
						type="button"
						className="mc-outline-backdrop"
						onClick={() => setMobileOutline(false)}
						aria-label="Đóng mục lục"
					/>
				) : null}
				<main className="mc-reader-column">
					<article className="mc-reader">
						<nav className="mc-breadcrumb" aria-label="Đường dẫn">
							<Link href={routes.myClassCourse(course.slug)}>{course.title}</Link>
							<span>→</span>
							<Link
								href={
									selected
										? routes.myClassModule(course.slug, selected.lessonSlug, selected.sectionSlug)
										: routes.myClassCourse(course.slug)
								}
							>
								{selected?.sectionTitle}
							</Link>
							<span>→</span>
							<span>{selected?.title}</span>
						</nav>
						<p className="mc-eyebrow">{selected?.lessonTitle}</p>
						<h1>{selected?.title ?? 'Chưa có ý kiến thức'}</h1>
						{selected?.summary ? <p className="mc-lead">{selected.summary}</p> : null}
						{explanation.availableModes.length > 1 ? (
							<div className="mc-mode-tabs" role="tablist" aria-label="Mức giải thích">
								{(['short', 'deep'] as const).map((tab) => (
									<button
										key={tab}
										type="button"
										role="tab"
										aria-selected={effectiveMode === tab}
										className={effectiveMode === tab ? 'is-active' : ''}
										onClick={() => {
											setMode(tab);
											window.localStorage.setItem(`knowledge:explanation-mode:${course.slug}`, tab);
										}}
									>
										{tab === 'short' ? 'Giải thích ngắn' : 'Giải thích sâu'}
									</button>
								))}
							</div>
						) : null}
						{loading ? (
							<p>Đang tải nội dung…</p>
						) : loadError ? (
							<div className="mc-empty">
								<p>Không tải được nội dung.</p>
								<button
									type="button"
									className="mc-button mc-button-secondary"
									onClick={() => selected && void selectItem(selected, 'none')}
								>
									Thử lại
								</button>
							</div>
						) : (
							<div className="mc-prose" dangerouslySetInnerHTML={{ __html: html }} />
						)}
						<footer className="mc-reader-footer">
							<span>{selected?.status === 'done' ? 'Đã học' : 'Đánh dấu sau khi học xong'}</span>
							<button
								type="button"
								className="mc-button mc-button-primary"
								onClick={() => void completeSelected()}
								disabled={!selected || selected.status === 'done'}
							>
								Đã học &amp; tiếp tục
							</button>
						</footer>
					</article>
				</main>
				<aside className="mc-context-rail" aria-label="Thông tin liên quan">
					<Link
						className="mc-context-block"
						href={
							selected
								? routes.myClassModule(course.slug, selected.lessonSlug, selected.sectionSlug)
								: routes.myClassCourse(course.slug)
						}
					>
						<span className="mc-eyebrow">MODULE HIỆN TẠI</span>
						<strong>{selected?.sectionTitle}</strong>
						<small>Xem overview module →</small>
					</Link>
					{selected ? (
						<div className="mc-context-block">
							<span className="mc-eyebrow">BÀI HỌC / CHỦ ĐỀ</span>
							<strong>{selected.lessonTitle}</strong>
						</div>
					) : null}
					{content?.related?.length ? (
						<div className="mc-context-block">
							<span className="mc-eyebrow">Ý LIÊN QUAN</span>
							{content.related.map((item) =>
								item.href ? (
									<Link key={item.slug} href={item.href}>
										{item.title}
									</Link>
								) : null,
							)}
						</div>
					) : null}
					{selected &&
					course.lessons
						.find((lesson) => lesson.slug === selected.lessonSlug)
						?.sections.find((section) => section.slug === selected.sectionSlug)?.tests.length ? (
						<div className="mc-context-block">
							<span className="mc-eyebrow">CHECKPOINT</span>
							<Link
								href={routes.myClassTest(
									course.slug,
									course.lessons
										.find((lesson) => lesson.slug === selected.lessonSlug)!
										.sections.find((section) => section.slug === selected.sectionSlug)!.tests[0]!
										.slug,
								)}
							>
								Làm bài test module →
							</Link>
						</div>
					) : null}
				</aside>
			</div>
		</div>
	);
}
