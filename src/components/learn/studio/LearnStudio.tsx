'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';

import { routes } from '@/config/routes';
import { exportCourseMarkdown } from '@/features/learn/lessonImport';
import { countPlaces, wordDiff } from '@/features/learn/textFidelity';
import {
	LEARN_SECTION_KIND_LABELS,
	type LearnCourseMeta,
	type LearnSectionKind,
	type LearnStudioCourse,
	type LearnStudioLesson,
	type LearnStudioSection,
} from '@/features/learn/types';
import { adminFetch } from '@/lib/admin/client';

import CourseSettingsDialog, { type CourseSettingsPatch } from './CourseSettingsDialog';
import { StudioIcon } from './icons';
import ImportLessonDialog from './ImportLessonDialog';
import LearnDiscussionEditor from './LearnDiscussionEditor';
import LearnQuizEditor from './LearnQuizEditor';
import LearnRichEditor from './LearnRichEditor';
import StudioDialog from './StudioDialog';
import StudioInspector, { type SectionPatch } from './StudioInspector';
import TextDiff from './TextDiff';
import StudioOutline from './StudioOutline';
import { useStudioSaver, type SaveStatus } from './useStudioSaver';

const SAVE_LABEL: Record<SaveStatus, string> = {
	saved: 'Đã lưu',
	pending: 'Chưa lưu…',
	saving: 'Đang lưu…',
	error: 'Lỗi lưu',
};

/** Only send what the API accepts: blank titles and empty takeaway rows stay local. */
function networkPatch(patch: SectionPatch): Record<string, unknown> {
	const body: Record<string, unknown> = { ...patch };
	if (patch.title !== undefined) {
		if (patch.title.trim()) body.title = patch.title.trim();
		else delete body.title;
	}
	if (patch.keyTakeaways) body.keyTakeaways = patch.keyTakeaways.map((item) => item.trim()).filter(Boolean);
	return body;
}

function findSection(lessons: LearnStudioLesson[], id: string | null): LearnStudioSection | null {
	if (!id) return null;
	for (const lesson of lessons) {
		const match = lesson.sections.find((section) => section.id === id);
		if (match) return match;
	}
	return null;
}

export default function LearnStudio({
	course,
	initialSectionId,
}: {
	course: LearnStudioCourse;
	initialSectionId: string | null;
}) {
	const router = useRouter();
	const { lessons: initialLessons, ...initialMeta } = course;
	const [meta, setMeta] = useState<LearnCourseMeta>(initialMeta);
	const [lessons, setLessons] = useState<LearnStudioLesson[]>(initialLessons);
	const [selectedId, setSelectedId] = useState<string | null>(
		findSection(initialLessons, initialSectionId)?.id ?? initialLessons[0]?.sections[0]?.id ?? null,
	);
	const [dialog, setDialog] = useState<'import' | 'settings' | null>(null);
	const [reviewChanges, setReviewChanges] = useState(false);
	const [editorEpoch, setEditorEpoch] = useState(0);
	const [baselines, setBaselines] = useState<Record<string, string>>({});
	const [trackedSectionId, setTrackedSectionId] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const saver = useStudioSaver();
	const { flush, queue } = saver;

	const section = useMemo(() => findSection(lessons, selectedId), [lessons, selectedId]);
	if (section && section.id !== trackedSectionId) {
		setTrackedSectionId(section.id);
		if (baselines[section.id] === undefined) {
			setBaselines((current) =>
				current[section.id] !== undefined ? current : { ...current, [section.id]: section.markdown },
			);
		}
	}
	const deferredMarkdown = useDeferredValue(section?.markdown ?? '');
	const sessionBase = section ? baselines[section.id] : undefined;
	const sessionHunks = useMemo(() => {
		if (sessionBase == null) return [];
		return wordDiff(sessionBase, deferredMarkdown);
	}, [sessionBase, deferredMarkdown]);
	const sessionPlaces = countPlaces(sessionHunks);

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
				event.preventDefault();
				void flush();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [flush]);

	const select = useCallback(
		(id: string | null) => {
			setSelectedId(id);
			const url = routes.learnStudio(meta.slug, id);
			window.history.replaceState(window.history.state, '', url);
		},
		[meta.slug],
	);

	async function act<T>(action: () => Promise<T>): Promise<T | undefined> {
		setActionError(null);
		try {
			await flush();
			return await action();
		} catch (err) {
			setActionError(err instanceof Error ? err.message : 'Thao tác không thành công');
			return undefined;
		}
	}

	// ─── Section edits (autosaved) ───────────────────────────────────────────
	function patchSection(id: string, patch: SectionPatch) {
		setLessons((current) =>
			current.map((lesson) => ({
				...lesson,
				sections: lesson.sections.map((item) => (item.id === id ? { ...item, ...patch } : item)),
			})),
		);
		const body = networkPatch(patch);
		if (Object.keys(body).length) queue(`section:${id}`, `/api/admin/learn/sections/${id}`, body);
	}

	function renameLesson(id: string, title: string) {
		setLessons((current) => current.map((lesson) => (lesson.id === id ? { ...lesson, title } : lesson)));
		queue(`lesson:${id}`, `/api/admin/learn/lessons/${id}`, { title });
	}

	// ─── Structure (saved immediately) ───────────────────────────────────────
	async function saveOutline(next: LearnStudioLesson[]) {
		const previous = lessons;
		setLessons(next);
		const ok = await act(() =>
			adminFetch(`/api/admin/learn/courses/${meta.id}/outline`, {
				method: 'PUT',
				body: JSON.stringify({
					lessons: next.map((lesson) => ({ id: lesson.id, sectionIds: lesson.sections.map((item) => item.id) })),
				}),
			}),
		);
		if (ok === undefined) setLessons(previous);
	}

	function reorderLessons(ids: string[]) {
		const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
		void saveOutline(ids.map((id) => byId.get(id)!).filter(Boolean));
	}

	function reorderSections(lessonId: string, ids: string[]) {
		void saveOutline(
			lessons.map((lesson) => {
				if (lesson.id !== lessonId) return lesson;
				const byId = new Map(lesson.sections.map((item) => [item.id, item]));
				return { ...lesson, sections: ids.map((id) => byId.get(id)!).filter(Boolean) };
			}),
		);
	}

	function moveSection(sectionId: string, lessonId: string) {
		const moving = findSection(lessons, sectionId);
		if (!moving || moving.lessonId === lessonId) return;
		void saveOutline(
			lessons.map((lesson) => {
				if (lesson.id === moving.lessonId) {
					return { ...lesson, sections: lesson.sections.filter((item) => item.id !== sectionId) };
				}
				if (lesson.id === lessonId) return { ...lesson, sections: [...lesson.sections, { ...moving, lessonId }] };
				return lesson;
			}),
		);
	}

	async function addLesson() {
		const lesson = await act(() =>
			adminFetch<LearnStudioLesson>(`/api/admin/learn/courses/${meta.id}/lessons`, {
				method: 'POST',
				body: JSON.stringify({ title: `Bài ${lessons.length + 1}` }),
			}),
		);
		if (!lesson) return;
		setLessons((current) => [...current, lesson]);
		select(lesson.sections[0]?.id ?? null);
	}

	async function importLesson(input: { markdown: string; mode: 'create' | 'append' | 'replace'; lessonId?: string }) {
		await flush();
		const result = await adminFetch<LearnStudioLesson | { lessons: LearnStudioLesson[] }>(
			`/api/admin/learn/courses/${meta.id}/lessons`,
			{ method: 'POST', body: JSON.stringify(input) },
		);
		const imported = 'lessons' in result ? result.lessons : [result];
		setLessons((current) => (input.mode === 'create' ? [...current, ...imported] : current.map((lesson) => imported.find((item) => item.id === lesson.id) ?? lesson)));
		select(imported[0]?.sections[0]?.id ?? null);
		setDialog(null);
	}

	async function deleteLesson(id: string) {
		const lesson = lessons.find((item) => item.id === id);
		if (!lesson) return;
		const count = lesson.sections.length;
		if (!window.confirm(`Xóa "${lesson.title}" cùng ${count} mục bên trong? Không thể hoàn tác.`)) return;
		const done = await act(() => adminFetch(`/api/admin/learn/lessons/${id}`, { method: 'DELETE' }));
		if (done === undefined) return;
		const next = lessons.filter((item) => item.id !== id);
		setLessons(next);
		if (lesson.sections.some((item) => item.id === selectedId)) select(next[0]?.sections[0]?.id ?? null);
	}

	async function addSection(lessonId: string, type: LearnSectionKind) {
		const created = await act(() =>
			adminFetch<LearnStudioSection>(`/api/admin/learn/lessons/${lessonId}/sections`, {
				method: 'POST',
				body: JSON.stringify({ type }),
			}),
		);
		if (!created) return;
		setLessons((current) =>
			current.map((lesson) => (lesson.id === lessonId ? { ...lesson, sections: [...lesson.sections, created] } : lesson)),
		);
		select(created.id);
	}

	async function deleteSection(id: string) {
		const target = findSection(lessons, id);
		if (!target || !window.confirm(`Xóa mục "${target.title}"? Không thể hoàn tác.`)) return;
		const done = await act(() => adminFetch(`/api/admin/learn/sections/${id}`, { method: 'DELETE' }));
		if (done === undefined) return;
		const flat = lessons.flatMap((lesson) => lesson.sections);
		const index = flat.findIndex((item) => item.id === id);
		const neighbour = flat[index + 1] ?? flat[index - 1] ?? null;
		setLessons((current) =>
			current.map((lesson) => ({ ...lesson, sections: lesson.sections.filter((item) => item.id !== id) })),
		);
		select(neighbour && neighbour.id !== id ? neighbour.id : null);
	}

	// ─── Course ──────────────────────────────────────────────────────────────
	async function setStatus(status: LearnCourseMeta['status']) {
		const updated = await act(() =>
			adminFetch<LearnCourseMeta>(`/api/admin/learn/courses/${meta.id}`, {
				method: 'PATCH',
				body: JSON.stringify({ status }),
			}),
		);
		if (updated) setMeta(updated);
	}

	async function saveSettings(patch: CourseSettingsPatch) {
		const updated = await adminFetch<LearnCourseMeta>(`/api/admin/learn/courses/${meta.id}`, {
			method: 'PATCH',
			body: JSON.stringify(patch),
		});
		setMeta(updated);
		setDialog(null);
		if (updated.slug !== meta.slug) router.replace(routes.learnStudio(updated.slug, selectedId));
	}

	async function deleteCourse() {
		await flush();
		await adminFetch(`/api/admin/learn/courses/${meta.id}`, { method: 'DELETE' });
		router.push(routes.learnCourses);
	}

	const published = meta.status === 'PUBLISHED';

	return (
		<div className="ln-studio">
			<header className="ln-studio__bar">
				<Link href={routes.learnCourse(meta.slug, selectedId)} className="ln-backlink" onClick={() => void flush()}>
					← Về trang học
				</Link>
				<button type="button" className="ln-studio__course" onClick={() => setDialog('settings')} title="Sửa thông tin khóa học">
					<span className="truncate">{meta.title}</span>
					<StudioIcon name="settings" size={14} />
				</button>
				<span className="ln-save" data-status={saver.status} role="status" title={saver.error ?? undefined}>
					<span className="ln-save__dot" aria-hidden="true" />
					{SAVE_LABEL[saver.status]}
					{saver.status === 'error' ? (
						<button type="button" className="ln-link-btn" onClick={() => void flush()}>
							Thử lại
						</button>
					) : null}
				</span>
				<button
					type="button"
					className="ln-btn"
					onClick={() => {
						const markdown = exportCourseMarkdown(
							lessons.map((lesson) => ({
								title: lesson.title,
								description: lesson.description,
								sections: lesson.sections,
							})),
						);
						const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
						const url = URL.createObjectURL(blob);
						const link = document.createElement('a');
						link.href = url;
						link.download = `${meta.slug || 'khoa-hoc'}.md`;
						link.click();
						URL.revokeObjectURL(url);
					}}
				>
					Xuất cả khóa
				</button>
				<div className="ln-segmented ln-studio__status" role="radiogroup" aria-label="Trạng thái khóa học">
					<button type="button" role="radio" aria-checked={!published} onClick={() => published && void setStatus('DRAFT')}>
						Bản nháp
					</button>
					<button type="button" role="radio" aria-checked={published} onClick={() => !published && void setStatus('PUBLISHED')}>
						Xuất bản
					</button>
				</div>
			</header>

			{actionError || saver.error ? (
				<p className="ln-studio__error" role="alert">
					{actionError ?? saver.error}
				</p>
			) : null}

			<div className="ln-studio__grid">
				<StudioOutline
					lessons={lessons}
					selectedId={selectedId}
					onSelect={select}
					onRenameLesson={renameLesson}
					onReorderLessons={reorderLessons}
					onReorderSections={reorderSections}
					onPlaceSection={(sectionId, lessonId, beforeId) => {
						const moving = findSection(lessons, sectionId);
						if (!moving) return;
						const stripped = lessons.map((lesson) => ({
							...lesson,
							sections: lesson.sections.filter((item) => item.id !== sectionId),
						}));
						void saveOutline(
							stripped.map((lesson) => {
								if (lesson.id !== lessonId) return lesson;
								const sections = [...lesson.sections];
								const index = beforeId ? sections.findIndex((item) => item.id === beforeId) : sections.length;
								sections.splice(index < 0 ? sections.length : index, 0, { ...moving, lessonId });
								return { ...lesson, sections };
							}),
						);
					}}
					onAddSection={(lessonId, type) => void addSection(lessonId, type)}
					onDeleteLesson={(id) => void deleteLesson(id)}
					onAddLesson={() => void addLesson()}
					onImport={() => setDialog('import')}
				/>

				<main className="ln-studio__canvas">
					{section ? (
						<div className="ln-studio__page" key={`${section.id}:${editorEpoch}`}>
							<p className="ln-eyebrow">
								{LEARN_SECTION_KIND_LABELS[section.type]} ·{' '}
								{lessons.find((lesson) => lesson.id === section.lessonId)?.title}
							</p>
							<textarea
								className="ln-studio__title"
								value={section.title}
								rows={1}
								maxLength={200}
								placeholder="Tên mục"
								aria-label="Tên mục"
								onChange={(event) => patchSection(section.id, { title: event.target.value.replace(/\n/g, ' ') })}
								style={{ fieldSizing: 'content' } as React.CSSProperties}
							/>
							{section.type === 'QUIZ' || section.type === 'PRACTICE' ? (
								<LearnQuizEditor
									sectionId={section.id}
									variant={section.type === 'PRACTICE' ? 'practice' : 'quiz'}
									quiz={section.quiz ?? { passingScorePercent: 70, timeLimitMinutes: null, questions: [] }}
									onChange={(quiz) => patchSection(section.id, { quiz })}
								/>
							) : section.type === 'DISCUSSION' ? (
								<LearnDiscussionEditor
									discussion={section.discussion ?? { questions: [] }}
									onChange={(discussion) => patchSection(section.id, { discussion })}
								/>
							) : (
								<LearnRichEditor
									value={section.markdown}
									onChange={(markdown) => patchSection(section.id, { markdown })}
									sessionChanges={{ count: sessionPlaces, onReview: () => setReviewChanges(true) }}
								/>
							)}
						</div>
					) : (
						<div className="ln-studio__empty">
							<p className="font-display text-2xl">Chọn một mục để soạn</p>
							<p className="mt-2 text-ink-secondary">Hoặc thêm bài mới, nhập cả bài từ Markdown ở cột trái.</p>
						</div>
					)}
				</main>

				{section ? (
					<StudioInspector
						section={section}
						lessons={lessons}
						onPatch={(patch) => patchSection(section.id, patch)}
						onMove={(lessonId) => moveSection(section.id, lessonId)}
						onDelete={() => void deleteSection(section.id)}
						onRestored={(restored) => {
							setEditorEpoch((epoch) => epoch + 1);
							setLessons((current) =>
								current.map((lesson) => ({
									...lesson,
									sections: lesson.sections.map((item) => (item.id === restored.id ? restored : item)),
								})),
							);
						}}
						onSaveVersion={async () => {
							await flush();
							await adminFetch(`/api/admin/learn/sections/${section.id}/revisions`, { method: 'POST' });
						}}
						previewHref={routes.learnCourse(meta.slug, section.id)}
					/>
				) : (
					<aside className="ln-inspector" />
				)}
			</div>

			{dialog === 'import' ? (
				<ImportLessonDialog
					lessons={lessons}
					selectedLessonId={section?.lessonId ?? lessons[0]?.id ?? null}
					onClose={() => setDialog(null)}
					onImport={importLesson}
				/>
			) : null}
			{reviewChanges && section ? (
				<StudioDialog
					title="Thay đổi trong phiên này"
					size="narrow"
					onClose={() => setReviewChanges(false)}
					footer={
						<>
							<button type="button" className="ln-btn" onClick={() => setReviewChanges(false)}>
								Đóng
							</button>
							<button
								type="button"
								className="ln-btn ln-btn--primary"
								disabled={!sessionPlaces}
								onClick={() => {
									const base = baselines[section.id];
									if (base == null) return;
									patchSection(section.id, { markdown: base });
									setEditorEpoch((epoch) => epoch + 1);
									setReviewChanges(false);
								}}
							>
								Hoàn tác tất cả về lúc mở
							</button>
						</>
					}
				>
					{sessionPlaces ? (
						<TextDiff hunks={sessionHunks} />
					) : (
						<p className="text-sm text-ink-secondary">Chưa có chữ nào khác lúc mở mục này.</p>
					)}
				</StudioDialog>
			) : null}
			{dialog === 'settings' ? (
				<CourseSettingsDialog course={meta} onClose={() => setDialog(null)} onSave={saveSettings} onDelete={deleteCourse} />
			) : null}
		</div>
	);
}
