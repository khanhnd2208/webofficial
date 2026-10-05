'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { routes } from '@/config/routes';
import { publishChecklist } from '@/features/learn/publishChecklist';
import type {
	LearnCourseMeta,
	LearnStudioCourse,
	LearnStudioLesson,
	LearnStudioSection,
} from '@/features/learn/types';
import { adminFetch } from '@/lib/admin/client';

import AiImportDialog from './AiImportDialog';
import ConflictDialog from './ConflictDialog';
import CourseSettingsDialog, { type CourseSettingsPatch } from './CourseSettingsDialog';
import { courseExport, downloadTextFile, lessonExport } from './exportMarkdown';
import PublishDialog from './PublishDialog';
import RevisionDialog from './RevisionDialog';
import SectionJumpDialog from './SectionJumpDialog';
import StudioCanvas from './StudioCanvas';
import { useStudioConfirm } from './StudioConfirm';
import StudioDialog from './StudioDialog';
import StudioHelpDialog from './StudioHelpDialog';
import StudioInspector from './StudioInspector';
import StudioOutline from './StudioOutline';
import StudioTabs, { type StudioTab } from './StudioTabs';
import StudioToast from './StudioToast';
import StudioTopBar from './StudioTopBar';
import { findSection, validateSectionPatch, type SectionPatch } from './sectionPatch';
import { useDeferredDeletes } from './useDeferredDeletes';
import { useSectionImport } from './useSectionImport';
import { useStudioNavigation } from './useStudioNavigation';
import { useStudioSaver } from './useStudioSaver';
import { useStudioShortcuts } from './useStudioShortcuts';
import { useStudioStructure } from './useStudioStructure';

function versionMap(lessons: LearnStudioLesson[]) {
	const versions = new Map<string, string>();
	for (const lesson of lessons) {
		for (const section of lesson.sections) versions.set(section.id, section.updatedAt);
	}
	return versions;
}

function committedTitles(lessons: LearnStudioLesson[]) {
	const titles = new Map<string, string>();
	for (const lesson of lessons) {
		for (const section of lesson.sections) {
			if (section.title.trim()) titles.set(section.id, section.title);
		}
	}
	return titles;
}

function initialTab(): StudioTab {
	if (typeof window === 'undefined') return 'edit';
	const value = new URLSearchParams(window.location.search).get('tab');
	return value === 'outline' || value === 'edit' || value === 'properties' ? value : 'edit';
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
	const lessonsRef = useRef(lessons);
	useEffect(() => {
		lessonsRef.current = lessons;
	}, [lessons]);
	const [tab, setTab] = useState<StudioTab>(initialTab);
	const [dialog, setDialog] = useState<
		'settings' | 'help' | 'shortcuts' | 'publish' | 'draft' | 'history' | 'jump' | null
	>(null);
	const [statusBusy, setStatusBusy] = useState(false);
	const [keptTitle, setKeptTitle] = useState<string | null>(null);
	const [editorEpoch, setEditorEpoch] = useState(0);
	const [savedAt, setSavedAt] = useState<number | null>(null);
	const titles = useRef(committedTitles(initialLessons));
	const versions = useRef(versionMap(initialLessons));

	const remember = useCallback((sections: LearnStudioSection[]) => {
		for (const section of sections) versions.current.set(section.id, section.updatedAt);
	}, []);
	const remount = useCallback(() => setEditorEpoch((epoch) => epoch + 1), []);

	const saver = useStudioSaver({
		onSaved: (key, data) => {
			setSavedAt(Date.now());
			if (!key.startsWith('section:') || !data || typeof data !== 'object') return;
			const updatedAt = (data as { updatedAt?: unknown }).updatedAt;
			if (typeof updatedAt === 'string')
				versions.current.set(key.slice('section:'.length), updatedAt);
		},
		baseFor: (key) =>
			key.startsWith('section:') ? versions.current.get(key.slice('section:'.length)) : undefined,
	});
	const { flush, queue, syncIssues, issues } = saver;
	const deletes = useDeferredDeletes();
	const { confirm, confirmDialog } = useStudioConfirm();
	const { onNavigate, openPreview } = useStudioNavigation(
		async () => {
			await deletes.commitAll();
			return flush();
		},
		() =>
			confirm({
				title: 'Chưa lưu được',
				body: 'Những thay đổi vừa rồi chưa được lưu. Vẫn rời trang?',
				confirmLabel: 'Rời trang',
				cancelLabel: 'Ở lại',
			}),
	);

	const section = useMemo(() => findSection(lessons, selectedId), [lessons, selectedId]);
	const checks = useMemo(
		() => publishChecklist({ description: meta.description, lessons }),
		[lessons, meta.description],
	);
	const conflictSection = saver.conflictKey?.startsWith('section:')
		? findSection(lessons, saver.conflictKey.slice('section:'.length))
		: null;

	const select = useCallback(
		(id: string | null) => {
			setSelectedId(id);
			setTab('edit');
			window.history.replaceState(window.history.state, '', routes.learnStudio(meta.slug, id));
		},
		[meta.slug],
	);

	const structure = useStudioStructure({
		courseId: meta.id,
		lessons,
		lessonsRef,
		setLessons,
		selectedId,
		select,
		flush,
		deletes,
		confirm,
		remember,
	});
	const { act, actionError, setActionError } = structure;
	const imports = useSectionImport({
		courseId: meta.id,
		lessonsRef,
		setLessons,
		select,
		flush,
		remember,
		remount,
	});

	function chooseTab(next: StudioTab) {
		setTab(next);
		const url = new URL(window.location.href);
		url.searchParams.set('tab', next);
		window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
	}

	// ─── Section edits (autosaved) ───────────────────────────────────────────
	function patchSection(id: string, patch: SectionPatch) {
		setKeptTitle(null);
		setLessons((current) =>
			current.map((lesson) => ({
				...lesson,
				sections: lesson.sections.map((item) => (item.id === id ? { ...item, ...patch } : item)),
			})),
		);
		if (typeof patch.title === 'string' && patch.title.trim()) titles.current.set(id, patch.title);
		const { body, errors } = validateSectionPatch(patch);
		const key = `section:${id}`;
		syncIssues(key, Object.keys(patch), errors);
		if (Object.keys(body).length) queue(key, `/api/admin/learn/sections/${id}`, body);
	}

	function restoreTitle(id: string) {
		const previous = titles.current.get(id);
		if (!previous) return;
		patchSection(id, { title: previous });
		setKeptTitle('Đã giữ lại tên cũ');
	}

	function renameLesson(id: string, title: string) {
		setLessons((current) =>
			current.map((lesson) => (lesson.id === id ? { ...lesson, title } : lesson)),
		);
		queue(`lesson:${id}`, `/api/admin/learn/lessons/${id}`, { title });
	}

	/** Take the user to the first section with a field that cannot be saved. */
	function showIssue() {
		const key = Object.keys(issues).find((item) => item.startsWith('section:'));
		if (key) select(key.slice('section:'.length));
	}

	// ─── Course ──────────────────────────────────────────────────────────────
	async function setStatus(status: LearnCourseMeta['status']) {
		setStatusBusy(true);
		const updated = await act(() =>
			adminFetch<LearnCourseMeta>(`/api/admin/learn/courses/${meta.id}`, {
				method: 'PATCH',
				body: JSON.stringify({ status }),
			}),
		);
		if (updated) {
			setMeta(updated);
			setDialog(null);
		}
		setStatusBusy(false);
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
		const saved = await flush();
		if (!saved.ok) {
			setActionError('Chưa lưu được nội dung');
			return;
		}
		await adminFetch(`/api/admin/learn/courses/${meta.id}`, { method: 'DELETE' });
		router.push(routes.learnCourses);
	}

	async function exportFile(lessonId?: string) {
		const saved = await flush();
		if (!saved.ok) {
			setActionError('Chưa lưu được nội dung');
			return;
		}
		const all = lessonsRef.current;
		const index = all.findIndex((item) => item.id === lessonId);
		const file =
			index < 0 ? courseExport(meta.slug, all) : lessonExport(meta.slug, all[index], index + 1);
		downloadTextFile(file.filename, file.text);
	}

	const previewSection = (id: string) => openPreview(routes.learnCourse(meta.slug, id));
	const titleError = section ? issues[`section:${section.id}`]?.title : undefined;

	useStudioShortcuts({
		save: () => void flush(),
		jump: () => setDialog('jump'),
		preview: () => {
			if (section) previewSection(section.id);
		},
		help: () => setDialog('shortcuts'),
	});

	return (
		<div className="ln-studio">
			<StudioTopBar
				courseHref={routes.learnCourse(meta.slug, selectedId)}
				title={meta.title}
				published={meta.status === 'PUBLISHED'}
				status={saver.status}
				error={saver.error}
				retryInMs={saver.retryInMs}
				issueCount={saver.issueCount}
				savedAt={savedAt}
				onNavigate={onNavigate}
				onFlush={() => void flush()}
				onShowIssue={showIssue}
				onOpenSettings={() => setDialog('settings')}
				onPublish={() => setDialog('publish')}
				onUnpublish={() => setDialog('draft')}
				onExportCourse={() => void exportFile()}
				onExportLesson={() => void exportFile(section?.lessonId)}
				onHelp={() => setDialog('help')}
			/>
			<StudioTabs tab={tab} onChange={chooseTab} />

			{structure.outlineConflict ? (
				<div className="ln-studio__error" role="alert">
					<p>Mục lục đã thay đổi ở nơi khác</p>
					<button type="button" className="ln-btn" onClick={() => router.refresh()}>
						Tải lại
					</button>
				</div>
			) : null}
			{actionError || saver.error ? (
				<p className="ln-studio__error" role="alert">
					{actionError ?? saver.error}
				</p>
			) : null}

			<div className="ln-studio__grid" data-tab={tab}>
				<StudioOutline
					courseId={meta.id}
					lessons={lessons}
					selectedId={selectedId}
					actions={{
						onSelect: select,
						onRenameLesson: renameLesson,
						onReorderLessons: structure.reorderLessons,
						onReorderSections: structure.reorderSections,
						onPlaceSection: structure.placeSection,
						onAddSection: (lessonId, type) => void structure.addSection(lessonId, type),
						onDeleteLesson: (id) => void structure.deleteLesson(id),
						onDuplicateLesson: (id) => void structure.duplicateLesson(id),
						onExportLesson: (id) => void exportFile(id),
						onDuplicateSection: (id) => void structure.duplicateSection(id),
						onPreviewSection: previewSection,
						onDeleteSection: structure.deleteSection,
						onAddLesson: () => void structure.addLesson(),
						onImport: () => imports.setRequest({ kind: 'lesson', locked: false }),
					}}
				/>

				<StudioCanvas
					section={section}
					lessonTitle={lessons.find((lesson) => lesson.id === section?.lessonId)?.title ?? ''}
					editorEpoch={editorEpoch}
					titleError={titleError}
					keptTitle={keptTitle}
					onPatch={(patch) => section && patchSection(section.id, patch)}
					onRestoreTitle={() => section && restoreTitle(section.id)}
					onOpenImport={imports.setRequest}
					onOpenHelp={() => setDialog('help')}
				/>

				{section ? (
					<StudioInspector
						section={section}
						lessons={lessons}
						onPatch={(patch) => patchSection(section.id, patch)}
						onMove={(lessonId) => structure.moveSection(section.id, lessonId)}
						onDelete={() => structure.deleteSection(section.id)}
						onHistory={() => setDialog('history')}
						onPreview={() => previewSection(section.id)}
					/>
				) : (
					<aside className="ln-inspector" />
				)}
			</div>

			{imports.request ? (
				<AiImportDialog
					kind={imports.request.kind}
					lockKind={imports.request.locked}
					lessons={lessons}
					selectedLessonId={section?.lessonId ?? lessons[0]?.id ?? null}
					target={imports.request.target}
					onClose={() => imports.setRequest(null)}
					onSave={imports.saveImport}
				/>
			) : null}
			{dialog === 'publish' ? (
				<PublishDialog
					title={meta.title}
					blockers={checks.blockers}
					warnings={checks.warnings}
					busy={statusBusy}
					onClose={() => {
						if (!statusBusy) setDialog(null);
					}}
					onJump={(sectionId) => {
						select(sectionId);
						setDialog(null);
					}}
					onPublish={() => void setStatus('PUBLISHED')}
				/>
			) : null}
			{dialog === 'draft' ? (
				<StudioDialog
					title="Chuyển về bản nháp?"
					size="narrow"
					onClose={() => {
						if (!statusBusy) setDialog(null);
					}}
					footer={
						<div className="ln-confirm">
							<button
								type="button"
								className="ln-btn"
								disabled={statusBusy}
								onClick={() => setDialog(null)}
							>
								Ở lại
							</button>
							<button
								type="button"
								className="ln-btn ln-btn--primary"
								disabled={statusBusy}
								onClick={() => void setStatus('DRAFT')}
							>
								{statusBusy ? 'Đang lưu…' : 'Chuyển về bản nháp'}
							</button>
						</div>
					}
				>
					<p>Học viên sẽ không mở được khóa này nữa.</p>
				</StudioDialog>
			) : null}
			{dialog === 'history' && section ? (
				<RevisionDialog
					section={section}
					flush={flush}
					onClose={() => setDialog(null)}
					onRestored={(restored) => {
						imports.replaceSection(restored);
						remount();
						setDialog(null);
					}}
				/>
			) : null}
			{dialog === 'jump' ? (
				<SectionJumpDialog
					lessons={lessons}
					onClose={() => setDialog(null)}
					onJump={(sectionId) => {
						select(sectionId);
						setDialog(null);
					}}
				/>
			) : null}
			{dialog === 'help' || dialog === 'shortcuts' ? (
				<StudioHelpDialog
					initialTab={dialog === 'shortcuts' ? 'shortcuts' : 'syntax'}
					onClose={() => setDialog(null)}
				/>
			) : null}
			{dialog === 'settings' ? (
				<CourseSettingsDialog
					course={meta}
					onClose={() => setDialog(null)}
					onSave={saveSettings}
					onDelete={deleteCourse}
				/>
			) : null}
			{confirmDialog}
			{conflictSection && saver.conflictKey ? (
				<ConflictDialog
					sectionId={conflictSection.id}
					local={conflictSection}
					onTakeRemote={(remote) => {
						saver.drop(`section:${conflictSection.id}`);
						imports.replaceSection(remote);
						remount();
					}}
					onKeepMine={(remoteUpdatedAt) => {
						void adminFetch(`/api/admin/learn/sections/${conflictSection.id}/revisions`, {
							method: 'POST',
							body: JSON.stringify({ reason: 'conflict' }),
						})
							.then(() => {
								versions.current.set(conflictSection.id, remoteUpdatedAt);
								saver.releaseConflict(`section:${conflictSection.id}`);
							})
							.catch((err: unknown) => {
								setActionError(err instanceof Error ? err.message : 'Không lưu được bản xung đột');
							});
					}}
				/>
			) : null}
			<StudioToast message={deletes.message} onAction={deletes.undo} onClose={deletes.commitAll} />
		</div>
	);
}
