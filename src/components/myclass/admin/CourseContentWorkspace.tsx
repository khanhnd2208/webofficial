'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import KnowledgeUnitFields from '@/components/myclass/admin/KnowledgeUnitFields';
import { Dialog, LiveRegion, Toast } from '@/components/ui/Dialog';
import {
	clearUnitDraft,
	clearWorkspaceDraft,
	dismissWorkspaceDraft,
	isWorkspaceDraftDismissed,
	readUnitDraft,
	readWorkspaceDraft,
	workspaceDraftDiffers,
	writeWorkspaceDraft,
} from '@/features/my-class/client/adminDraft';
import { myClassApi, myClassList } from './api';

type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type Timestamp = string | Date;
type Knowledge = {
	id: string;
	position: number;
	knowledgeUnit: {
		id: string;
		slug: string;
		status: Status;
		updatedAt: Timestamp;
		_count?: { mappings: number };
		currentPublishedRevision: { title: string } | null;
		revisions: Array<{
			title: string;
			summary: string;
			foundationHtml: string;
			academicHtml: string;
			expertHtml: string;
			status: string;
		}>;
		related?: Array<{ id: string; slug: string; title: string }>;
		whereUsed?: Array<{
			courseId: string;
			courseTitle: string;
			lessonTitle: string;
			sectionTitle: string;
			href: string;
		}>;
	};
};
type Section = {
	id: string;
	title: string;
	summary: string;
	status: Status;
	updatedAt: Timestamp;
	knowledge: Knowledge[];
};
type Lesson = {
	id: string;
	title: string;
	slug: string;
	summary: string;
	status: Status;
	updatedAt: Timestamp;
	sections: Section[];
};
type Course = {
	id: string;
	title: string;
	slug: string;
	status: Status;
	updatedAt: Timestamp;
	lessons: Lesson[];
};
type NodeSel = { type: 'lesson' | 'section' | 'unit'; id: string };
type PendingNavigation = { node?: NodeSel; href?: string };
type CreateTarget = { type: 'lesson' | 'section'; parentId?: string } | null;

const STATUS_LABEL: Record<Status, string> = {
	DRAFT: 'Bản nháp',
	PUBLISHED: 'Đã xuất bản',
	ARCHIVED: 'Đã lưu trữ',
};

function iso(value: Timestamp) {
	return value instanceof Date ? value.toISOString() : value;
}

function fieldsFromError(error: unknown): Record<string, string> {
	return (error as { fields?: Record<string, string> })?.fields ?? {};
}

function parseNode(value: string | null): NodeSel | null {
	if (!value) return null;
	const [type, id] = value.split(':');
	if ((type === 'lesson' || type === 'section' || type === 'unit') && id) return { type, id };
	return null;
}

function move(ids: string[], index: number, delta: number) {
	const next = index + delta;
	if (next < 0 || next >= ids.length) return ids;
	const copy = [...ids];
	[copy[index], copy[next]] = [copy[next]!, copy[index]!];
	return copy;
}

export default function CourseContentWorkspace({
	initial,
	node,
}: {
	initial: Course;
	node: string | null;
}) {
	const router = useRouter();
	const [course, setCourse] = useState(initial);
	const selected = parseNode(node);
	const [dirty, setDirty] = useState(false);
	const [pending, setPending] = useState<PendingNavigation | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [conflict, setConflict] = useState(false);
	const [attach, setAttach] = useState<string | null>(null);
	const [search, setSearch] = useState('');
	const [treeSearch, setTreeSearch] = useState('');
	const [results, setResults] = useState<
		Array<{
			id: string;
			slug: string;
			title: string;
			status?: string;
			_count?: { mappings: number };
		}>
	>([]);
	const [narrow, setNarrow] = useState(false);
	const [busyKey, setBusyKey] = useState<string | null>(null);
	const [toast, setToast] = useState('');
	const [createTarget, setCreateTarget] = useState<CreateTarget>(null);
	const [createTitle, setCreateTitle] = useState('');
	const [selectedUnitDetail, setSelectedUnitDetail] = useState<Knowledge['knowledgeUnit'] | null>(
		null,
	);
	const [expandedLessons, setExpandedLessons] = useState<Set<string>>(() => {
		const selectedId = parseNode(node);
		const lesson = initial.lessons.find(
			(item) =>
				item.id === selectedId?.id ||
				item.sections.some(
					(section) =>
						section.id === selectedId?.id ||
						section.knowledge.some((unit) => unit.knowledgeUnit.id === selectedId?.id),
				),
		);
		return new Set(lesson ? [lesson.id] : initial.lessons[0] ? [initial.lessons[0].id] : []);
	});
	const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
		const selectedId = parseNode(node);
		const section = initial.lessons
			.flatMap((item) => item.sections)
			.find(
				(item) =>
					item.id === selectedId?.id ||
					item.knowledge.some((unit) => unit.knowledgeUnit.id === selectedId?.id),
			);
		return new Set(section ? [section.id] : []);
	});
	const saveRef = useRef<(() => Promise<void>) | null>(null);

	useEffect(() => {
		if (selected?.type !== 'unit') {
			setSelectedUnitDetail(null);
			return;
		}
		const selectedItem = course.lessons
			.flatMap((item) => item.sections.flatMap((row) => row.knowledge))
			.find((item) => item.knowledgeUnit.id === selected.id);
		if (!selectedItem) return;
		void myClassApi<Knowledge['knowledgeUnit']>(`/api/admin/my-class/knowledge/${selected.id}`)
			.then(setSelectedUnitDetail)
			.catch(() => setSelectedUnitDetail(selectedItem.knowledgeUnit));
	}, [course, selected?.id, selected?.type]);

	useEffect(() => {
		if (selected || !initial.lessons[0]) return;
		router.replace(
			`/admin/my-class/courses/${course.id}/content?node=lesson:${initial.lessons[0].id}`,
		);
	}, [course.id, initial.lessons, router, selected]);

	useEffect(() => {
		if (!dirty) return;
		const currentUrl = window.location.href;
		const onDocumentClick = (event: MouseEvent) => {
			const target = event.target as HTMLElement | null;
			const link = target?.closest('a[href]') as HTMLAnchorElement | null;
			if (
				!link ||
				link.target === '_blank' ||
				event.metaKey ||
				event.ctrlKey ||
				event.shiftKey ||
				event.altKey ||
				link.hasAttribute('download')
			)
				return;
			const href = link.getAttribute('href');
			if (!href || href.startsWith('#') || href.startsWith('mailto:')) return;
			event.preventDefault();
			setPending({
				href:
					new URL(href, window.location.origin).pathname +
					new URL(href, window.location.origin).search,
			});
		};
		const onPopState = () => {
			const href = window.location.pathname + window.location.search;
			window.history.pushState(null, '', currentUrl);
			setPending({ href });
		};
		document.addEventListener('click', onDocumentClick, true);
		window.addEventListener('popstate', onPopState);
		return () => {
			document.removeEventListener('click', onDocumentClick, true);
			window.removeEventListener('popstate', onPopState);
		};
	}, [dirty]);

	useEffect(() => {
		const onSaveShortcut = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
				event.preventDefault();
				if (dirty) void saveRef.current?.();
			}
		};
		document.addEventListener('keydown', onSaveShortcut);
		return () => document.removeEventListener('keydown', onSaveShortcut);
	}, [dirty]);

	useEffect(() => {
		const media = window.matchMedia('(max-width: 1023px)');
		const apply = () => setNarrow(media.matches);
		apply();
		media.addEventListener('change', apply);
		return () => media.removeEventListener('change', apply);
	}, []);

	useEffect(() => {
		if (!dirty) return;
		const onBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = '';
		};
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	}, [dirty]);

	function choose(next: NodeSel) {
		if (dirty) {
			setPending({ node: next });
			return;
		}
		applySelection(next);
	}

	function applySelection(next: NodeSel) {
		router.replace(`/admin/my-class/courses/${course.id}/content?node=${next.type}:${next.id}`);
	}

	async function refresh(select?: NodeSel) {
		const refreshed = await myClassApi<Course>(`/api/admin/my-class/courses/${course.id}`);
		setCourse(refreshed);
		if (select) applySelection(select);
		router.refresh();
	}

	async function reorder(
		parentType: 'course' | 'lesson' | 'section',
		parentId: string,
		orderedNodeIds: string[],
		previous: string[],
	) {
		if (orderedNodeIds.join() === previous.join()) return;
		const snapshot = course;
		const key = `${parentType}:${parentId}`;
		setBusyKey(key);
		try {
			const data = await myClassApi<{ tree: Course }>(
				`/api/admin/my-class/courses/${course.id}/reorder`,
				{
					method: 'POST',
					body: JSON.stringify({ parentType, parentId, orderedNodeIds }),
				},
			);
			setCourse(data.tree);
			setToast('Đã cập nhật thứ tự');
		} catch (err) {
			setCourse(snapshot);
			setError(err instanceof Error ? err.message : 'Không đổi thứ tự được');
		} finally {
			setBusyKey(null);
		}
	}

	async function createNode() {
		if (!createTarget || !createTitle.trim()) return;
		setBusyKey(`create:${createTarget.type}`);
		try {
			if (createTarget.type === 'lesson') {
				const created = await myClassApi<{ id: string }>(
					`/api/admin/my-class/courses/${course.id}/lessons`,
					{
						method: 'POST',
						body: JSON.stringify({ title: createTitle.trim() }),
					},
				);
				await refresh({ type: 'lesson', id: created.id });
			} else if (createTarget.parentId) {
				const created = await myClassApi<{ id: string }>(
					`/api/admin/my-class/lessons/${createTarget.parentId}/sections`,
					{
						method: 'POST',
						body: JSON.stringify({ title: createTitle.trim() }),
					},
				);
				await refresh({ type: 'section', id: created.id });
			}
			setToast('Đã tạo mục mới');
			setCreateTarget(null);
			setCreateTitle('');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không tạo được mục mới');
		} finally {
			setBusyKey(null);
		}
	}

	const lesson = course.lessons.find((item) => item.id === selected?.id);
	const section = course.lessons
		.flatMap((item) => item.sections)
		.find((item) => item.id === selected?.id);
	const unit = course.lessons
		.flatMap((item) => item.sections.flatMap((row) => row.knowledge))
		.find((item) => item.knowledgeUnit.id === selected?.id);
	const query = treeSearch.trim().toLowerCase();
	const visibleLessons = course.lessons.filter((item) => {
		if (!query) return true;
		return [
			item.title,
			item.slug,
			item.status,
			...item.sections.flatMap((row) => [
				row.title,
				...row.knowledge.map(
					(entry) =>
						entry.knowledgeUnit.currentPublishedRevision?.title ??
						entry.knowledgeUnit.revisions[0]?.title ??
						entry.knowledgeUnit.slug,
				),
			]),
		]
			.join(' ')
			.toLowerCase()
			.includes(query);
	});

	return (
		<div className="relative lg:grid lg:min-h-[calc(100dvh-14rem)] lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6">
			{error ? <p className="mb-3 text-sm text-error lg:col-span-2">{error}</p> : null}
			{conflict ? (
				<p className="mb-3 text-sm text-error lg:col-span-2">
					Dữ liệu đã được người khác cập nhật.{' '}
					<button
						type="button"
						className="underline"
						onClick={() => void refresh().then(() => setConflict(false))}
					>
						Tải lại
					</button>
				</p>
			) : null}
			<aside className="sticky top-4 max-h-[calc(100dvh-7rem)] overflow-auto rounded-[var(--mc-r-md)] border border-mc-rule bg-paper p-3 shadow-[var(--mc-shadow-1)]">
				<div className="mb-3 space-y-2">
					<input
						value={treeSearch}
						onChange={(event) => setTreeSearch(event.target.value)}
						placeholder="Tìm bài, chủ đề hoặc nội dung"
						aria-label="Tìm trong cây nội dung"
						className="min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3 text-sm"
					/>
					<button
						type="button"
						className="min-h-11 rounded-[var(--mc-r-sm)] border px-3 text-xs font-bold uppercase"
						onClick={() => setCreateTarget({ type: 'lesson' })}
					>
						+ Bài
					</button>
				</div>
				<p className="mb-2 text-xs text-muted">
					{visibleLessons.length}/{course.lessons.length} bài
				</p>
				{visibleLessons.map((item) => {
					const index = course.lessons.findIndex((row) => row.id === item.id);
					const lessonSelected =
						(selected?.type === 'lesson' && selected.id === item.id) ||
						item.sections.some(
							(section) =>
								section.id === selected?.id ||
								section.knowledge.some((unit) => unit.knowledgeUnit.id === selected?.id),
						);
					const lessonExpanded = expandedLessons.has(item.id) || lessonSelected;
					return (
						<div key={item.id} className="mb-2">
							<div
								className={`flex items-center gap-1 rounded-[var(--mc-r-sm)] ${selected?.type === 'lesson' && selected.id === item.id ? 'bg-ink text-paper' : lessonSelected ? 'bg-surface-sunken' : ''}`}
							>
								<button
									type="button"
									className="min-h-11 min-w-9"
									aria-label={lessonExpanded ? 'Thu gọn bài' : 'Mở bài'}
									aria-expanded={lessonExpanded}
									onClick={() =>
										setExpandedLessons((current) => {
											const next = new Set(current);
											if (next.has(item.id)) next.delete(item.id);
											else next.add(item.id);
											return next;
										})
									}
								>
									{lessonExpanded ? '⌃' : '⌄'}
								</button>
								<button
									type="button"
									onClick={() => choose({ type: 'lesson', id: item.id })}
									className="min-h-11 flex-1 px-2 text-left text-sm font-semibold"
								>
									<span aria-hidden className="mr-2 text-ink-tertiary">
										⋮⋮
									</span>
									{item.title} · {STATUS_LABEL[item.status]}
								</button>
								<details className="relative">
									<summary
										className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center text-lg"
										aria-label="Thao tác bài"
									>
										⋯
									</summary>
									<div className="absolute right-0 z-10 mt-1 w-48 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper p-1 shadow-lg">
										<button
											type="button"
											disabled={index === 0 || Boolean(busyKey)}
											className="block min-h-10 w-full px-2 text-left text-xs disabled:opacity-40"
											onClick={() =>
												void reorder(
													'course',
													course.id,
													move(
														course.lessons.map((row) => row.id),
														index,
														-1,
													),
													course.lessons.map((row) => row.id),
												)
											}
										>
											Di chuyển lên
										</button>
										<button
											type="button"
											disabled={index === course.lessons.length - 1 || Boolean(busyKey)}
											className="block min-h-10 w-full px-2 text-left text-xs disabled:opacity-40"
											onClick={() =>
												void reorder(
													'course',
													course.id,
													move(
														course.lessons.map((row) => row.id),
														index,
														1,
													),
													course.lessons.map((row) => row.id),
												)
											}
										>
											Di chuyển xuống
										</button>
										<button
											type="button"
											className="block min-h-10 w-full px-2 text-left text-xs"
											onClick={() => setCreateTarget({ type: 'section', parentId: item.id })}
										>
											Thêm chủ đề
										</button>
									</div>
								</details>
							</div>
							{lessonExpanded
								? item.sections.map((sec, secIndex) => {
										const sectionSelected =
											(selected?.type === 'section' && selected.id === sec.id) ||
											sec.knowledge.some((unit) => unit.knowledgeUnit.id === selected?.id);
										const sectionExpanded = expandedSections.has(sec.id) || sectionSelected;
										return (
											<div key={sec.id} className="ml-3 mt-1">
												<div
													className={`flex items-center gap-1 rounded-[var(--mc-r-sm)] ${selected?.type === 'section' && selected.id === sec.id ? 'bg-ink text-paper' : sectionSelected ? 'bg-surface-sunken' : ''}`}
												>
													<button
														type="button"
														className="min-h-11 min-w-9"
														aria-label={sectionExpanded ? 'Thu gọn chủ đề' : 'Mở chủ đề'}
														aria-expanded={sectionExpanded}
														onClick={() =>
															setExpandedSections((current) => {
																const next = new Set(current);
																if (next.has(sec.id)) next.delete(sec.id);
																else next.add(sec.id);
																return next;
															})
														}
													>
														{sectionExpanded ? '⌃' : '⌄'}
													</button>
													<button
														type="button"
														onClick={() => choose({ type: 'section', id: sec.id })}
														className="min-h-11 flex-1 px-2 text-left text-sm"
													>
														<span aria-hidden className="mr-2 text-ink-tertiary">
															⋮⋮
														</span>
														{sec.title} · {STATUS_LABEL[sec.status]}
													</button>
													<details className="relative">
														<summary
															className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center text-lg"
															aria-label="Thao tác chủ đề"
														>
															⋯
														</summary>
														<div className="absolute right-0 z-10 mt-1 w-48 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper p-1 shadow-lg">
															<button
																type="button"
																disabled={secIndex === 0 || Boolean(busyKey)}
																className="block min-h-10 w-full px-2 text-left text-xs disabled:opacity-40"
																onClick={() =>
																	void reorder(
																		'lesson',
																		item.id,
																		move(
																			item.sections.map((row) => row.id),
																			secIndex,
																			-1,
																		),
																		item.sections.map((row) => row.id),
																	)
																}
															>
																Di chuyển lên
															</button>
															<button
																type="button"
																disabled={secIndex === item.sections.length - 1 || Boolean(busyKey)}
																className="block min-h-10 w-full px-2 text-left text-xs disabled:opacity-40"
																onClick={() =>
																	void reorder(
																		'lesson',
																		item.id,
																		move(
																			item.sections.map((row) => row.id),
																			secIndex,
																			1,
																		),
																		item.sections.map((row) => row.id),
																	)
																}
															>
																Di chuyển xuống
															</button>
															<button
																type="button"
																className="block min-h-10 w-full px-2 text-left text-xs"
																onClick={() => setAttach(sec.id)}
															>
																Thêm nội dung
															</button>
														</div>
													</details>
												</div>
												{sectionExpanded
													? sec.knowledge.map((ku, kuIndex) => {
															const title =
																ku.knowledgeUnit.currentPublishedRevision?.title ??
																ku.knowledgeUnit.revisions[0]?.title ??
																ku.knowledgeUnit.slug;
															const active =
																selected?.type === 'unit' && selected.id === ku.knowledgeUnit.id;
															return (
																<div
																	key={ku.id}
																	className={`ml-3 mt-1 flex items-center rounded-[var(--mc-r-sm)] ${active ? 'bg-ink text-paper' : ''}`}
																>
																	<button
																		type="button"
																		onClick={() =>
																			choose({ type: 'unit', id: ku.knowledgeUnit.id })
																		}
																		className="min-h-11 flex-1 px-2 text-left text-sm"
																	>
																		<span aria-hidden className="mr-2 text-ink-tertiary">
																			⋮⋮
																		</span>
																		{title} · {STATUS_LABEL[ku.knowledgeUnit.status]}
																	</button>
																	<details className="relative">
																		<summary
																			className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center text-lg"
																			aria-label="Thao tác nội dung"
																		>
																			⋯
																		</summary>
																		<div className="absolute right-0 z-10 mt-1 w-40 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper p-1 shadow-lg">
																			<button
																				type="button"
																				disabled={kuIndex === 0 || Boolean(busyKey)}
																				className="block min-h-10 w-full px-2 text-left text-xs disabled:opacity-40"
																				onClick={() =>
																					void reorder(
																						'section',
																						sec.id,
																						move(
																							sec.knowledge.map((row) => row.knowledgeUnit.id),
																							kuIndex,
																							-1,
																						),
																						sec.knowledge.map((row) => row.knowledgeUnit.id),
																					)
																				}
																			>
																				Di chuyển lên
																			</button>
																			<button
																				type="button"
																				disabled={
																					kuIndex === sec.knowledge.length - 1 || Boolean(busyKey)
																				}
																				className="block min-h-10 w-full px-2 text-left text-xs disabled:opacity-40"
																				onClick={() =>
																					void reorder(
																						'section',
																						sec.id,
																						move(
																							sec.knowledge.map((row) => row.knowledgeUnit.id),
																							kuIndex,
																							1,
																						),
																						sec.knowledge.map((row) => row.knowledgeUnit.id),
																					)
																				}
																			>
																				Di chuyển xuống
																			</button>
																			<button
																				type="button"
																				disabled={Boolean(busyKey)}
																				className="block min-h-10 w-full px-2 text-left text-xs text-error disabled:opacity-40"
																				onClick={() =>
																					void myClassApi(
																						`/api/admin/my-class/sections/${sec.id}/knowledge/${ku.knowledgeUnit.id}`,
																						{ method: 'DELETE' },
																					).then(() => refresh())
																				}
																			>
																				Tách khỏi phần
																			</button>
																		</div>
																	</details>
																</div>
															);
														})
													: null}
											</div>
										);
									})
								: null}
						</div>
					);
				})}
			</aside>
			<section className="mt-6 lg:mt-0">
				{narrow && selected?.type === 'unit' ? (
					<p className="rounded-[var(--mc-r-md)] border border-dashed border-mc-rule p-6 text-sm text-muted">
						Mở trên màn hình lớn để chỉnh nội dung
					</p>
				) : selected?.type === 'lesson' && lesson ? (
					<MetaEditor
						key={lesson.id}
						courseId={course.id}
						nodeId={lesson.id}
						nodeType="lesson"
						title={lesson.title}
						slug={lesson.slug}
						summary={lesson.summary}
						status={lesson.status}
						onDirty={setDirty}
						registerSave={(fn) => {
							saveRef.current = fn;
						}}
						onSave={async (changes) => {
							await patchNode(
								course.id,
								'lesson',
								lesson.id,
								iso(lesson.updatedAt),
								changes,
								setConflict,
							);
							setDirty(false);
							await refresh();
						}}
						onStatusChange={async (status) => {
							await updateNodeStatus(
								course.id,
								'lesson',
								lesson.id,
								iso(lesson.updatedAt),
								status,
								setConflict,
							);
							await refresh();
						}}
					/>
				) : selected?.type === 'section' && section ? (
					<MetaEditor
						key={section.id}
						courseId={course.id}
						nodeId={section.id}
						nodeType="section"
						title={section.title}
						summary={section.summary}
						status={section.status}
						onDirty={setDirty}
						registerSave={(fn) => {
							saveRef.current = fn;
						}}
						onSave={async (changes) => {
							await patchNode(
								course.id,
								'section',
								section.id,
								iso(section.updatedAt),
								changes,
								setConflict,
							);
							setDirty(false);
							await refresh();
						}}
						onStatusChange={async (status) => {
							await updateNodeStatus(
								course.id,
								'section',
								section.id,
								iso(section.updatedAt),
								status,
								setConflict,
							);
							await refresh();
						}}
					/>
				) : selected?.type === 'unit' && unit ? (
					<UnitPanel
						key={(selectedUnitDetail ?? unit.knowledgeUnit).id}
						courseId={course.id}
						unit={selectedUnitDetail ?? unit.knowledgeUnit}
						onDirty={setDirty}
						registerSave={(fn) => {
							saveRef.current = fn;
						}}
						onConflict={() => setConflict(true)}
						onSaved={async () => {
							setDirty(false);
							await refresh();
						}}
					/>
				) : (
					<p className="text-sm text-muted">Chọn một mục trong cây nội dung.</p>
				)}
			</section>
			<Dialog open={Boolean(pending)} onClose={() => setPending(null)} title="Chưa lưu thay đổi">
				<div className="flex flex-wrap justify-end gap-2">
					<button type="button" className="min-h-11 px-3" onClick={() => setPending(null)}>
						Ở lại
					</button>
					<button
						type="button"
						className="min-h-11 px-3"
						onClick={() => {
							setDirty(false);
							if (pending?.node) applySelection(pending.node);
							if (pending?.href) router.push(pending.href);
							setPending(null);
						}}
					>
						Bỏ thay đổi
					</button>
					<button
						type="button"
						className="min-h-11 rounded-[var(--mc-r-sm)] bg-ink px-4 text-paper"
						onClick={() => {
							void (async () => {
								try {
									await saveRef.current?.();
									if (pending?.node) applySelection(pending.node);
									if (pending?.href) router.push(pending.href);
									setPending(null);
								} catch {
									setToast('Không chuyển trang vì lưu thay đổi thất bại');
								}
							})();
						}}
					>
						Lưu rồi chuyển
					</button>
				</div>
			</Dialog>
			<Dialog
				open={Boolean(createTarget)}
				onClose={() => setCreateTarget(null)}
				title={createTarget?.type === 'lesson' ? 'Tạo bài học' : 'Tạo chủ đề'}
			>
				<div className="space-y-4">
					<label className="block text-sm">
						Tên
						<input
							autoFocus
							value={createTitle}
							onChange={(event) => setCreateTitle(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === 'Enter') void createNode();
							}}
							placeholder={
								createTarget?.type === 'lesson' ? 'Ví dụ: Tuyển dụng' : 'Ví dụ: Tổng quan'
							}
							className="mt-1 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3"
						/>
					</label>
					<div className="flex justify-end gap-2">
						<button type="button" className="min-h-11 px-3" onClick={() => setCreateTarget(null)}>
							Hủy
						</button>
						<button
							type="button"
							disabled={!createTitle.trim() || Boolean(busyKey)}
							className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-sm font-semibold text-paper disabled:opacity-50"
							onClick={() => void createNode()}
						>
							Tạo
						</button>
					</div>
				</div>
			</Dialog>
			<Dialog open={Boolean(attach)} onClose={() => setAttach(null)} title="Thêm nội dung">
				<div className="space-y-3">
					<input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Tìm theo tên hoặc slug"
						className="min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3"
					/>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() =>
								void myClassList<{
									id: string;
									slug: string;
									title: string;
									status?: string;
									_count?: { mappings: number };
								}>(`/api/admin/my-class/knowledge?q=${encodeURIComponent(search)}`).then(setResults)
							}
							className="min-h-11 rounded-[var(--mc-r-sm)] border px-4 text-xs font-bold uppercase"
						>
							Tìm
						</button>
						<button
							type="button"
							onClick={() =>
								attach
									? void myClassApi(`/api/admin/my-class/sections/${attach}/knowledge`, {
											method: 'POST',
											body: JSON.stringify({ create: true, title: search || 'Nội dung mới' }),
										}).then(() => {
											setAttach(null);
											return refresh();
										})
									: undefined
							}
							className="min-h-11 rounded-[var(--mc-r-sm)] border px-4 text-xs font-bold uppercase"
						>
							Tạo nội dung mới
						</button>
					</div>
					<ul className="max-h-56 space-y-2 overflow-auto text-sm">
						{results.map((item) => (
							<li key={item.id}>
								<button
									type="button"
									onClick={() =>
										attach
											? void myClassApi(`/api/admin/my-class/sections/${attach}/knowledge`, {
													method: 'POST',
													body: JSON.stringify({ knowledgeUnitId: item.id }),
												}).then(() => {
													setAttach(null);
													return refresh();
												})
											: undefined
									}
									className="min-h-11 text-left underline"
								>
									{item.title} · {item.slug} · {item.status ?? ''}
									{item._count?.mappings ? ` · đang dùng ${item._count.mappings} nơi` : ''}
								</button>
							</li>
						))}
					</ul>
				</div>
			</Dialog>
			<Toast message={toast} visible={Boolean(toast)} onDismiss={() => setToast('')} />
			<LiveRegion message={error ?? toast} politeness={error ? 'assertive' : 'polite'} />
		</div>
	);
}

async function patchNode(
	courseId: string,
	nodeType: string,
	nodeId: string,
	expectedUpdatedAt: string,
	changes: Record<string, unknown>,
	onConflict: (value: boolean) => void,
) {
	try {
		return await myClassApi(`/api/admin/my-class/courses/${courseId}/nodes/${nodeType}/${nodeId}`, {
			method: 'PATCH',
			body: JSON.stringify({ expectedUpdatedAt, changes }),
		});
	} catch (err) {
		const code = (err as Error & { code?: string }).code;
		if (code === 'CONFLICT') onConflict(true);
		throw err;
	}
}

async function updateNodeStatus(
	courseId: string,
	nodeType: 'lesson' | 'section',
	nodeId: string,
	expectedUpdatedAt: string,
	status: Status,
	onConflict: (value: boolean) => void,
) {
	try {
		await myClassApi(`/api/admin/my-class/courses/${courseId}/nodes/${nodeType}/${nodeId}`, {
			method: 'POST',
			body: JSON.stringify({ expectedUpdatedAt, status }),
		});
	} catch (err) {
		if ((err as Error & { code?: string }).code === 'CONFLICT') onConflict(true);
		throw err;
	}
}

function MetaEditor({
	courseId,
	nodeId,
	nodeType,
	title,
	slug,
	summary,
	status,
	onDirty,
	onSave,
	onStatusChange,
	registerSave,
}: {
	courseId: string;
	nodeId: string;
	nodeType: 'lesson' | 'section';
	title: string;
	slug?: string;
	summary: string;
	status: Status;
	onDirty: (value: boolean) => void;
	onSave: (changes: Record<string, unknown>) => Promise<void>;
	onStatusChange: (status: Status) => Promise<void>;
	registerSave: (fn: () => Promise<void>) => void;
}) {
	const [nextTitle, setTitle] = useState(title);
	const [nextSlug, setSlug] = useState(slug ?? '');
	const [nextSummary, setSummary] = useState(summary);
	const [busy, setBusy] = useState(false);
	const [statusBusy, setStatusBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [confirmArchive, setConfirmArchive] = useState(false);
	const [recovery, setRecovery] = useState<ReturnType<typeof readWorkspaceDraft> | null>(null);
	const dirty = workspaceDraftDiffers(
		{ title: nextTitle, summary: nextSummary, slug: nextSlug },
		{ title, summary, slug: slug ?? '' },
		{ compareSlug: true },
	);
	useEffect(() => onDirty(dirty), [dirty, onDirty]);
	useEffect(() => {
		const candidate = readWorkspaceDraft(courseId, nodeType, nodeId);
		if (!candidate) return;
		if (
			!workspaceDraftDiffers(candidate, { title, summary, slug: slug ?? '' }, { compareSlug: true })
		) {
			clearWorkspaceDraft(courseId, nodeType, nodeId);
			return;
		}
		if (isWorkspaceDraftDismissed(candidate)) return;
		setRecovery(candidate);
	}, [courseId, nodeId, nodeType, slug, summary, title]);
	useEffect(() => {
		if (!dirty) return;
		const timeout = window.setTimeout(
			() =>
				writeWorkspaceDraft({
					courseId,
					nodeType,
					nodeId,
					title: nextTitle,
					slug: nextSlug,
					summary: nextSummary,
					baseUpdatedAt: '',
				}),
			500,
		);
		return () => window.clearTimeout(timeout);
	}, [courseId, dirty, nextSlug, nextSummary, nextTitle, nodeId, nodeType]);

	function restoreRecovery() {
		if (!recovery) return;
		setTitle(recovery.title);
		setSlug(recovery.slug ?? '');
		setSummary(recovery.summary);
		setRecovery(null);
	}
	function discardRecovery() {
		clearWorkspaceDraft(courseId, nodeType, nodeId);
		setRecovery(null);
	}
	function dismissRecovery() {
		if (recovery) dismissWorkspaceDraft(recovery);
		setRecovery(null);
	}

	async function save() {
		setBusy(true);
		setError(null);
		setFieldErrors({});
		try {
			await onSave({ title: nextTitle, slug: nextSlug || undefined, summary: nextSummary });
			clearWorkspaceDraft(courseId, nodeType, nodeId);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Lỗi');
			setFieldErrors(fieldsFromError(err));
			throw err;
		} finally {
			setBusy(false);
		}
	}

	useEffect(() => {
		registerSave(save);
	});

	async function changeStatus(next: Status) {
		setStatusBusy(true);
		setError(null);
		try {
			await onStatusChange(next);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không đổi trạng thái được');
		} finally {
			setStatusBusy(false);
			setConfirmArchive(false);
		}
	}

	return (
		<div className="space-y-4">
			{recovery ? (
				<Dialog open title="Khôi phục bản nháp cục bộ?" onClose={dismissRecovery}>
					<p className="text-sm leading-6 text-ink-secondary">
						Có thay đổi chưa được gửi lên máy chủ từ phiên trước. Bạn có thể khôi phục, bỏ bản nháp
						hoặc để lại cho lần mở sau.
					</p>
					<div className="mt-4 flex flex-wrap justify-end gap-2">
						<button type="button" className="min-h-11 px-3" onClick={dismissRecovery}>
							Để sau
						</button>
						<button
							type="button"
							className="min-h-11 rounded-[var(--mc-r-sm)] border border-error/30 px-3 font-semibold text-error"
							onClick={discardRecovery}
						>
							Bỏ bản nháp
						</button>
						<button
							type="button"
							className="min-h-11 rounded-[var(--mc-r-sm)] bg-ink px-4 text-paper"
							onClick={restoreRecovery}
						>
							Khôi phục
						</button>
					</div>
				</Dialog>
			) : null}
			<div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-b-[var(--mc-r-md)] border-b border-mc-rule bg-paper/95 px-1 py-3 backdrop-blur">
				<div>
					<p className="text-sm">{busy ? 'Đang lưu…' : dirty ? 'Chưa lưu' : 'Đã lưu'}</p>
					<p className="text-xs text-muted">{STATUS_LABEL[status]}</p>
				</div>
				<div className="flex flex-wrap justify-end gap-2">
					<button
						type="button"
						disabled={busy || statusBusy || !dirty}
						onClick={() => void save()}
						className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-sm font-semibold text-paper disabled:opacity-50"
					>
						Lưu thay đổi
					</button>
					{status === 'DRAFT' ? (
						<button
							type="button"
							disabled={busy || statusBusy || dirty}
							onClick={() => void changeStatus('PUBLISHED')}
							className="min-h-11 rounded-[var(--mc-r-sm)] border px-4 text-xs font-bold uppercase disabled:opacity-50"
						>
							Xuất bản
						</button>
					) : null}
					{status === 'PUBLISHED' ? (
						<>
							<button
								type="button"
								disabled={busy || statusBusy || dirty}
								onClick={() => void changeStatus('DRAFT')}
								className="min-h-11 rounded-[var(--mc-r-sm)] border px-4 text-xs font-bold uppercase disabled:opacity-50"
							>
								Chuyển về nháp
							</button>
							<button
								type="button"
								disabled={busy || statusBusy || dirty}
								onClick={() => setConfirmArchive(true)}
								className="min-h-11 rounded-[var(--mc-r-sm)] border px-4 text-xs font-bold uppercase disabled:opacity-50"
							>
								Lưu trữ
							</button>
						</>
					) : null}
					{status === 'ARCHIVED' ? (
						<button
							type="button"
							disabled={busy || statusBusy || dirty}
							onClick={() => void changeStatus('DRAFT')}
							className="min-h-11 rounded-[var(--mc-r-sm)] border px-4 text-xs font-bold uppercase disabled:opacity-50"
						>
							Khôi phục nháp
						</button>
					) : null}
				</div>
			</div>
			{error ? <p className="text-sm text-error">{error}</p> : null}
			<label className="block text-sm">
				Tên
				<input
					value={nextTitle}
					onChange={(event) => setTitle(event.target.value)}
					className="mt-1 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3"
				/>
				{fieldErrors.title ? <span className="text-xs text-error">{fieldErrors.title}</span> : null}
			</label>
			{slug !== undefined ? (
				<label className="block text-sm">
					Slug
					<input
						value={nextSlug}
						onChange={(event) => setSlug(event.target.value)}
						className="mt-1 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3"
					/>
					{fieldErrors.slug ? <span className="text-xs text-error">{fieldErrors.slug}</span> : null}
				</label>
			) : null}
			<label className="block text-sm">
				Mô tả ngắn
				<textarea
					value={nextSummary}
					onChange={(event) => setSummary(event.target.value)}
					rows={3}
					className="mt-1 w-full rounded-[var(--mc-r-sm)] border border-mc-rule px-3 py-2"
				/>
				{fieldErrors.summary ? (
					<span className="text-xs text-error">{fieldErrors.summary}</span>
				) : null}
			</label>
			<Dialog
				open={confirmArchive}
				onClose={() => setConfirmArchive(false)}
				title="Lưu trữ mục này?"
			>
				<p className="text-sm">
					Mục sẽ không còn xuất hiện trong nội dung công khai. Các bài kiểm tra liên quan sẽ được
					chuyển về bản nháp nếu cần.
				</p>
				<div className="mt-4 flex justify-end gap-2">
					<button type="button" className="min-h-11 px-3" onClick={() => setConfirmArchive(false)}>
						Hủy
					</button>
					<button
						type="button"
						className="min-h-11 rounded-[var(--mc-r-sm)] bg-ink px-4 text-paper"
						onClick={() => void changeStatus('ARCHIVED')}
					>
						Lưu trữ
					</button>
				</div>
			</Dialog>
		</div>
	);
}

function UnitPanel({
	courseId,
	unit,
	onDirty,
	onSaved,
	onConflict,
	registerSave,
}: {
	courseId: string;
	unit: Knowledge['knowledgeUnit'];
	onDirty: (value: boolean) => void;
	onSaved: () => Promise<void>;
	onConflict: () => void;
	registerSave: (fn: () => Promise<void>) => void;
}) {
	const draft = unit.revisions.find((item) => item.status === 'DRAFT') ?? unit.revisions[0];
	const serverFields = {
		title: draft?.title ?? '',
		summary: draft?.summary ?? '',
		foundationHtml: draft?.foundationHtml ?? '',
		academicHtml: '',
		expertHtml: draft?.expertHtml || draft?.academicHtml || '',
	};
	const [title, setTitle] = useState(serverFields.title);
	const [summary, setSummary] = useState(serverFields.summary);
	const [foundationHtml, setFoundationHtml] = useState(serverFields.foundationHtml);
	const [academicHtml, setAcademicHtml] = useState(serverFields.academicHtml);
	const [expertHtml, setExpertHtml] = useState(serverFields.expertHtml);
	const [base, setBase] = useState(serverFields);
	const [tab, setTab] = useState<'foundation' | 'academic' | 'expert'>('foundation');
	const [relatedQ, setRelatedQ] = useState('');
	const [relatedHits, setRelatedHits] = useState<
		Array<{ id: string; title: string; slug?: string }>
	>([]);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [recovery, setRecovery] = useState<ReturnType<typeof readWorkspaceDraft> | null>(null);
	const [serverDraftAvailable, setServerDraftAvailable] = useState(draft?.status === 'DRAFT');
	const [latestUpdatedAt, setLatestUpdatedAt] = useState(iso(unit.updatedAt));
	const dirty = workspaceDraftDiffers(
		{ title, summary, foundationHtml, academicHtml, expertHtml },
		base,
	);

	useEffect(() => onDirty(dirty), [dirty, onDirty]);
	useEffect(() => {
		setTitle(serverFields.title);
		setSummary(serverFields.summary);
		setFoundationHtml(serverFields.foundationHtml);
		setAcademicHtml(serverFields.academicHtml);
		setExpertHtml(serverFields.expertHtml);
		setBase(serverFields);
		setRecovery(null);
		setServerDraftAvailable(draft?.status === 'DRAFT');
		setLatestUpdatedAt(iso(unit.updatedAt));
		setError(null);
		setFieldErrors({});
		// Keep the form aligned with the selected unit after tree navigation or a refresh.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		draft?.status,
		serverFields.academicHtml,
		serverFields.expertHtml,
		serverFields.foundationHtml,
		serverFields.summary,
		serverFields.title,
		unit.id,
		unit.updatedAt,
	]);
	useEffect(() => {
		const candidate =
			readWorkspaceDraft(courseId, 'unit', unit.id) ??
			(() => {
				const legacy = readUnitDraft(unit.id);
				return legacy
					? {
							...legacy,
							courseId,
							nodeType: 'unit' as const,
							nodeId: unit.id,
							baseUpdatedAt: iso(unit.updatedAt),
						}
					: null;
			})();
		if (!candidate) return;
		if (!workspaceDraftDiffers(candidate, base)) {
			clearWorkspaceDraft(courseId, 'unit', unit.id);
			clearUnitDraft(unit.id);
			return;
		}
		if (isWorkspaceDraftDismissed(candidate)) return;
		setRecovery(candidate);
	}, [
		base,
		base.academicHtml,
		base.expertHtml,
		base.foundationHtml,
		base.summary,
		base.title,
		courseId,
		unit.id,
		unit.updatedAt,
	]);
	useEffect(() => {
		if (!dirty) return;
		const timeout = window.setTimeout(
			() =>
				writeWorkspaceDraft({
					courseId,
					nodeType: 'unit',
					nodeId: unit.id,
					title,
					summary,
					foundationHtml,
					academicHtml,
					expertHtml,
					baseUpdatedAt: iso(unit.updatedAt),
				}),
			500,
		);
		return () => window.clearTimeout(timeout);
	}, [
		academicHtml,
		courseId,
		dirty,
		expertHtml,
		foundationHtml,
		summary,
		title,
		unit.id,
		unit.updatedAt,
	]);

	function restoreRecovery() {
		if (!recovery) return;
		setTitle(recovery.title);
		setSummary(recovery.summary);
		setFoundationHtml(recovery.foundationHtml ?? '');
		setAcademicHtml(recovery.academicHtml ?? '');
		setExpertHtml(recovery.expertHtml ?? '');
		setRecovery(null);
	}
	function discardRecovery() {
		clearWorkspaceDraft(courseId, 'unit', unit.id);
		clearUnitDraft(unit.id);
		setRecovery(null);
	}
	function dismissRecovery() {
		if (recovery) dismissWorkspaceDraft(recovery);
		setRecovery(null);
	}

	async function save(publish = false) {
		if (!dirty && !publish && !serverDraftAvailable) return;
		if (!dirty && publish && !serverDraftAvailable) {
			setError('Không có bản nháp mới để xuất bản');
			return;
		}
		setBusy(true);
		setError(null);
		setFieldErrors({});
		try {
			let expectedUpdatedAt = latestUpdatedAt;
			if (dirty) {
				const saved = (await patchNode(
					courseId,
					'unit',
					unit.id,
					expectedUpdatedAt,
					{ title, summary, foundationHtml, academicHtml: '', expertHtml },
					() => onConflict(),
				)) as { updatedAt?: Timestamp };
				expectedUpdatedAt = saved.updatedAt ? iso(saved.updatedAt) : expectedUpdatedAt;
				setLatestUpdatedAt(expectedUpdatedAt);
				setBase({ title, summary, foundationHtml, academicHtml, expertHtml });
				setServerDraftAvailable(true);
				clearWorkspaceDraft(courseId, 'unit', unit.id);
				clearUnitDraft(unit.id);
				if (!publish) await onSaved();
			}
			if (publish) {
				try {
					await myClassApi(`/api/admin/my-class/knowledge/${unit.id}/publish`, {
						method: 'POST',
						body: JSON.stringify({ expectedUpdatedAt, requireBoth: true }),
					});
					setServerDraftAvailable(false);
					await onSaved();
				} catch (publishError) {
					await onSaved();
					setError(
						`Bản nháp đã lưu, chưa xuất bản: ${publishError instanceof Error ? publishError.message : 'lỗi kiểm tra xuất bản'}`,
					);
				}
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không lưu được');
			setFieldErrors(fieldsFromError(err));
			throw err;
		} finally {
			setBusy(false);
		}
	}

	useEffect(() => {
		registerSave(() => save(false));
	});

	const related = unit.related ?? [];
	const visibleHits = relatedHits.filter(
		(item) => item.id !== unit.id && !related.some((entry) => entry.id === item.id),
	);

	return (
		<div className="space-y-4">
			{recovery ? (
				<Dialog open title="Khôi phục bản nháp cục bộ?" onClose={dismissRecovery}>
					<p className="text-sm leading-6 text-ink-secondary">
						Có thay đổi chưa được gửi lên máy chủ từ phiên trước. Bạn có thể khôi phục, bỏ bản nháp
						hoặc để lại cho lần mở sau.
					</p>
					<div className="mt-4 flex flex-wrap justify-end gap-2">
						<button type="button" className="min-h-11 px-3" onClick={dismissRecovery}>
							Để sau
						</button>
						<button
							type="button"
							className="min-h-11 rounded-[var(--mc-r-sm)] border border-error/30 px-3 font-semibold text-error"
							onClick={discardRecovery}
						>
							Bỏ bản nháp
						</button>
						<button
							type="button"
							className="min-h-11 rounded-[var(--mc-r-sm)] bg-ink px-4 text-paper"
							onClick={restoreRecovery}
						>
							Khôi phục
						</button>
					</div>
				</Dialog>
			) : null}
			<div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-b-[var(--mc-r-md)] border-b border-mc-rule bg-paper/95 px-1 py-3 backdrop-blur">
				<p className="text-sm font-medium text-ink-secondary">
					{busy ? 'Đang lưu…' : dirty ? 'Có thay đổi chưa lưu' : 'Đã đồng bộ'}
				</p>
				<div className="flex gap-2">
					<button
						type="button"
						disabled={busy || !dirty}
						onClick={() => void save(false)}
						className="min-h-11 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-4 text-sm font-semibold disabled:opacity-50"
					>
						Lưu bản nháp
					</button>
					<button
						type="button"
						disabled={busy || (!dirty && !serverDraftAvailable)}
						onClick={() => void save(true)}
						className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-sm font-semibold text-paper disabled:opacity-50"
					>
						Xuất bản
					</button>
				</div>
			</div>
			{error ? (
				<p className="text-sm text-error" role="alert">
					{error}
				</p>
			) : null}
			<KnowledgeUnitFields
				title={title}
				slug={unit.slug}
				summary={summary}
				foundationHtml={foundationHtml}
				academicHtml={academicHtml}
				expertHtml={expertHtml}
				tab={tab}
				onTitleChange={setTitle}
				onSummaryChange={setSummary}
				onFoundationChange={setFoundationHtml}
				onAcademicChange={setAcademicHtml}
				onExpertChange={setExpertHtml}
				onTabChange={setTab}
				onError={setError}
				showSlug={false}
				productMode
			/>
			{fieldErrors.title ? <p className="text-xs text-error">{fieldErrors.title}</p> : null}
			<p className="text-xs text-muted">
				Đang dùng: {unit._count?.mappings ?? unit.whereUsed?.length ?? 0} nơi
			</p>
			<section>
				<h2 className="font-bold">Nội dung liên quan</h2>
				<ul className="mt-2 space-y-1 text-sm">
					{related.map((item) => (
						<li key={item.id} className="flex items-center justify-between gap-3">
							<span>{item.title}</span>
							<button
								type="button"
								disabled={dirty}
								className="min-h-11 underline disabled:opacity-40"
								onClick={() =>
									void myClassApi(
										`/api/admin/my-class/knowledge/${unit.id}/related?toId=${item.id}`,
										{ method: 'DELETE' },
									).then(onSaved)
								}
							>
								Gỡ
							</button>
						</li>
					))}
				</ul>
				<div className="mt-3 flex gap-2">
					<input
						value={relatedQ}
						onChange={(event) => setRelatedQ(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter')
								void myClassList<{ id: string; title: string; slug?: string }>(
									`/api/admin/my-class/knowledge?q=${encodeURIComponent(relatedQ)}`,
								).then(setRelatedHits);
						}}
						placeholder="Tìm nội dung"
						className="min-h-11 flex-1 rounded-[var(--mc-r-sm)] border border-mc-rule px-3"
					/>
					<button
						type="button"
						disabled={dirty}
						onClick={() =>
							void myClassList<{ id: string; title: string; slug?: string }>(
								`/api/admin/my-class/knowledge?q=${encodeURIComponent(relatedQ)}`,
							).then(setRelatedHits)
						}
						className="min-h-11 rounded-[var(--mc-r-sm)] border px-3 text-xs font-bold uppercase disabled:opacity-40"
					>
						Tìm
					</button>
				</div>
				<ul className="mt-2 space-y-1 text-sm">
					{visibleHits.map((item) => (
						<li key={item.id}>
							<button
								type="button"
								disabled={dirty}
								className="min-h-11 underline disabled:opacity-40"
								onClick={() =>
									void myClassApi(`/api/admin/my-class/knowledge/${unit.id}/related`, {
										method: 'POST',
										body: JSON.stringify({ toId: item.id }),
									}).then(onSaved)
								}
							>
								{item.title}
							</button>
						</li>
					))}
				</ul>
			</section>
		</div>
	);
}
