'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import adminStyles from '@/components/admin/AdminStudio.module.css';

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
import { DiscussionQuestionList, DiscussionSession } from './LearnDiscussionEditor';
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
import { onTabListKeyDown, useWideStudio, type StudioArea } from './StudioTabs';
import StudioToast from './StudioToast';
import StudioTopBar from './StudioTopBar';
import { findSection, validateSectionPatch, type SectionPatch } from './sectionPatch';
import { StudioDeleteError, useDeferredDeletes } from './useDeferredDeletes';
import { useSectionImport } from './useSectionImport';
import { useStudioNavigation } from './useStudioNavigation';
import { flushRegisteredEditors, useStudioSaver } from './useStudioSaver';
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

/** One studio region. On a narrow screen it stays mounted while another tab is showing. */
function StudioAreaPanel({
	id,
	wide,
	active,
	children,
}: {
	id: StudioArea;
	wide: boolean;
	active: boolean;
	children: ReactNode;
}) {
	const visible = wide || active;
	return (
		<div
			className="ln-studio__panel"
			id={`ln-studio-panel-${id}`}
			role={wide ? undefined : 'tabpanel'}
			aria-labelledby={wide ? undefined : `ln-studio-tab-${id}`}
			hidden={visible ? undefined : true}
		>
			{children}
		</div>
	);
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
	const wide = useWideStudio();
	const [area, setArea] = useState<StudioArea>('content');
	const [sidebarTab, setSidebarTab] = useState<'outline' | 'questions'>('outline');
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
	const commitAndFlush = useCallback(async () => {
		try {
			await deletes.commitAll();
		} catch (err) {
			if (err instanceof StudioDeleteError) throw err;
			return { ok: false };
		}
		return flush();
	}, [deletes, flush]);
	const flushAfterDeletes = useCallback(async () => {
		try {
			return await commitAndFlush();
		} catch (err) {
			if (err instanceof StudioDeleteError) return { ok: false };
			throw err;
		}
	}, [commitAndFlush]);
	const { confirm, confirmDialog } = useStudioConfirm();
	const { onNavigate, openPreview } = useStudioNavigation(flushAfterDeletes, () =>
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
			flushRegisteredEditors();
			setSelectedId(id);
			if (!wide) setArea('content');
			window.history.replaceState(window.history.state, '', routes.learnStudio(meta.slug, id));
		},
		[meta.slug, wide],
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
		flush: commitAndFlush,
		remember,
		remount,
	});

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
		if (!key) return;
		const fields = issues[key] ?? {};
		const inContent = Boolean(fields.title || fields.markdown || fields.discussion);
		select(key.slice('section:'.length));
		if (!wide) setArea(inContent ? 'content' : 'info');
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
		const saved = await flushAfterDeletes();
		if (!saved.ok) {
			setActionError((current) => current ?? 'Chưa lưu được nội dung');
			return;
		}
		const all = lessonsRef.current;
		const index = all.findIndex((item) => item.id === lessonId);
		const file =
			index < 0 ? courseExport(meta.slug, all) : lessonExport(meta.slug, all[index], index + 1);
		downloadTextFile(file.filename, file.text);
	}

	async function openPublish() {
		const saved = await flushAfterDeletes();
		if (!saved.ok) {
			setActionError((current) => current ?? 'Chưa lưu được nội dung');
			return;
		}
		setDialog('publish');
	}

	const discussion = section?.type === 'DISCUSSION' ? section : null;
	const [seenDiscussion, setSeenDiscussion] = useState<string | null>(null);
	if ((discussion?.id ?? null) !== seenDiscussion) {
		setSeenDiscussion(discussion?.id ?? null);
		setSidebarTab(discussion ? 'questions' : 'outline');
	}

	const previewSection = (id: string) => {
		void openPreview(routes.learnCourse(meta.slug, id)).then((opened) => {
			if (!opened) setActionError((current) => current ?? 'Chưa lưu được nội dung');
		});
	};
	const lessonTitle = lessons.find((lesson) => lesson.id === section?.lessonId)?.title ?? '';
	const fieldErrors = section ? issues[`section:${section.id}`] : undefined;
	const titleError = fieldErrors?.title;
	const editingLabel = section ? `${lessonTitle} · ${section.title}` : 'chưa chọn mục';

	useStudioShortcuts({
		save: () => void flush(),
		jump: () => setDialog('jump'),
		preview: () => {
			if (section) previewSection(section.id);
		},
		help: () => setDialog('shortcuts'),
	});

	const sidebar = (
		<aside className="ln-souter">
			<div
				className="ln-souter__tabs"
				role="tablist"
				aria-label="Điều hướng"
				onKeyDown={onTabListKeyDown}
			>
				<button
					type="button"
					role="tab"
					aria-selected={sidebarTab === 'outline'}
					tabIndex={sidebarTab === 'outline' ? 0 : -1}
					onClick={() => setSidebarTab('outline')}
				>
					Mục lục khóa
				</button>
				{discussion ? (
					<button
						type="button"
						role="tab"
						aria-selected={sidebarTab === 'questions'}
						tabIndex={sidebarTab === 'questions' ? 0 : -1}
						onClick={() => setSidebarTab('questions')}
					>
						Danh sách câu
					</button>
				) : null}
			</div>
			{discussion && sidebarTab === 'questions' ? (
				<DiscussionQuestionList />
			) : (
				<StudioOutline
					onSearch={() => setDialog('jump')}
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
			)}
		</aside>
	);

	return (
		<div className={`ln-studio ${adminStyles.theme}`}>
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
				onPreview={() => {
					if (section) previewSection(section.id);
				}}
				canPreview={Boolean(section)}
				onPublish={() => void openPublish()}
				onUnpublish={() => setDialog('draft')}
				onExportCourse={() => void exportFile()}
				onExportLesson={() => void exportFile(section?.lessonId)}
				onHelp={() => setDialog('help')}
			/>
			{meta.status === 'PUBLISHED' ? (
				<p className="ln-studio__live-note">
					Khóa đang công khai. Mỗi lần lưu thành công, học viên thấy nội dung mới.
				</p>
			) : null}
			{wide ? null : (
				<div className="ln-studio__areas">
					<div role="tablist" aria-label="Vùng soạn" onKeyDown={onTabListKeyDown}>
						{(
							[
								['outline', 'Mục lục'],
								['content', 'Nội dung'],
								['info', 'Thông tin'],
							] as const
						).map(([id, label]) => (
							<button
								key={id}
								id={`ln-studio-tab-${id}`}
								type="button"
								role="tab"
								aria-selected={area === id}
								aria-controls={`ln-studio-panel-${id}`}
								tabIndex={area === id ? 0 : -1}
								onClick={() => setArea(id)}
							>
								{label}
							</button>
						))}
					</div>
					<p className="ln-studio__editing">Đang sửa: {editingLabel}</p>
				</div>
			)}

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

			<DiscussionSession
				key={`${discussion?.id ?? 'reading'}:${editorEpoch}`}
				onSelect={() => {
					if (!wide) setArea('content');
				}}
				discussion={discussion?.discussion ?? { questions: [] }}
				onChange={(next) => {
					if (discussion) patchSection(discussion.id, { discussion: next });
				}}
			>
				<div className="ln-studio__grid">
					<StudioAreaPanel id="outline" wide={wide} active={area === 'outline'}>
						{sidebar}
					</StudioAreaPanel>
					<StudioAreaPanel id="content" wide={wide} active={area === 'content'}>
						<StudioCanvas
							section={section}
							lessonTitle={lessonTitle}
							editorEpoch={editorEpoch}
							titleError={titleError}
							fieldErrors={fieldErrors}
							keptTitle={keptTitle}
							onPatch={(patch) => section && patchSection(section.id, patch)}
							onRestoreTitle={() => section && restoreTitle(section.id)}
							onOpenImport={imports.setRequest}
							onOpenHelp={() => setDialog('help')}
						/>
					</StudioAreaPanel>
					<StudioAreaPanel id="info" wide={wide} active={area === 'info'}>
						{section ? (
							<StudioInspector
								section={section}
								lessons={lessons}
								fieldErrors={fieldErrors}
								onPatch={(patch) => patchSection(section.id, patch)}
								onMove={(lessonId) => structure.moveSection(section.id, lessonId)}
								onDelete={() => structure.deleteSection(section.id)}
								onHistory={() => setDialog('history')}
							/>
						) : (
							<aside className="ln-inspector" aria-label="Thông tin mục">
								<p className="ln-inspector__hint">Chọn một mục trong mục lục.</p>
							</aside>
						)}
					</StudioAreaPanel>
				</div>
			</DiscussionSession>

			{imports.request ? (
				<AiImportDialog
					kind={imports.request.kind}
					lockKind={imports.request.locked}
					lessons={lessons}
					courseTitle={meta.title}
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
					busy={statusBusy}
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
