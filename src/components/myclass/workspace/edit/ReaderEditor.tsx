'use client';

import { useEffect, useState } from 'react';
import KnowledgeUnitFields, {
	type KnowledgeUnitLevelTab,
} from '@/components/myclass/admin/KnowledgeUnitFields';
import { myClassApi } from '@/components/myclass/admin/api';
import { McButton } from '@/components/myclass/ui';
import {
	clearWorkspaceDraft,
	dismissWorkspaceDraft,
	isWorkspaceDraftDismissed,
	readWorkspaceDraft,
	workspaceDraftDiffers,
	writeWorkspaceDraft,
} from '@/features/my-class/client/adminDraft';
import type { MyClassKnowledgeUnit } from '@/features/my-class/types';
import { Dialog } from '@/components/ui/Dialog';
import { useEditMode } from './EditModeContext';

export default function ReaderEditor({
	unit,
	onSaved,
}: {
	unit: MyClassKnowledgeUnit;
	onSaved: (next: MyClassKnowledgeUnit) => void;
}) {
	const edit = useEditMode();
	const [title, setTitle] = useState(unit.title);
	const [summary, setSummary] = useState(unit.summary);
	const [foundationHtml, setFoundationHtml] = useState(unit.foundationHtml);
	const [academicHtml, setAcademicHtml] = useState(unit.academicHtml);
	const [expertHtml, setExpertHtml] = useState(unit.expertHtml);
	const [tab, setTab] = useState<KnowledgeUnitLevelTab>('foundation');
	const [expectedUpdatedAt, setExpectedUpdatedAt] = useState(unit.authoring?.updatedAt ?? '');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [conflict, setConflict] = useState(false);
	const [recovery, setRecovery] = useState<ReturnType<typeof readWorkspaceDraft> | null>(null);

	useEffect(() => {
		setTitle(unit.title);
		setSummary(unit.summary);
		setFoundationHtml(unit.foundationHtml);
		setAcademicHtml(unit.academicHtml);
		setExpertHtml(unit.expertHtml);
		setExpectedUpdatedAt(unit.authoring?.updatedAt ?? '');
		setError(null);
		setConflict(false);
	}, [unit]);

	const dirty = workspaceDraftDiffers(
		{ title, summary, foundationHtml, academicHtml, expertHtml },
		unit,
	);

	useEffect(() => {
		if (!edit || !dirty) return;
		const timeout = window.setTimeout(() => {
			writeWorkspaceDraft({
				courseId: edit.courseId,
				nodeType: 'unit',
				nodeId: unit.id,
				title,
				summary,
				foundationHtml,
				academicHtml,
				expertHtml,
				baseUpdatedAt: expectedUpdatedAt,
			});
		}, 500);
		return () => window.clearTimeout(timeout);
	}, [
		academicHtml,
		dirty,
		edit,
		expectedUpdatedAt,
		expertHtml,
		foundationHtml,
		summary,
		title,
		unit.id,
	]);

	useEffect(() => {
		if (!edit) return;
		setRecovery(null);
		const draft = readWorkspaceDraft(edit.courseId, 'unit', unit.id);
		if (!draft) return;
		if (!workspaceDraftDiffers(draft, unit)) {
			clearWorkspaceDraft(edit.courseId, 'unit', unit.id);
			return;
		}
		if (isWorkspaceDraftDismissed(draft)) return;
		setRecovery(draft);
	}, [edit, unit]);

	useEffect(() => {
		function onBeforeUnload(event: BeforeUnloadEvent) {
			if (!dirty) return;
			event.preventDefault();
			event.returnValue = '';
		}
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	}, [dirty]);

	useEffect(() => {
		function onKey(event: KeyboardEvent) {
			if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 's') return;
			event.preventDefault();
			void save(false);
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [academicHtml, dirty, expertHtml, foundationHtml, summary, title, expectedUpdatedAt]);

	async function save(publish: boolean) {
		if (!edit) return;
		if (!dirty && !publish) return;
		setBusy(true);
		setError(null);
		setConflict(false);
		try {
			let stamp = expectedUpdatedAt;
			if (dirty) {
				const saved = await myClassApi<{ updatedAt?: string }>(
					`/api/admin/my-class/courses/${edit.courseId}/nodes/unit/${unit.id}`,
					{
						method: 'PATCH',
						body: JSON.stringify({
							expectedUpdatedAt: stamp,
							changes: { title, summary, foundationHtml, academicHtml, expertHtml },
						}),
					},
				);
				if (saved.updatedAt) stamp = new Date(saved.updatedAt).toISOString();
			}
			if (publish) {
				const published = await myClassApi<{ updatedAt?: string }>(
					`/api/admin/my-class/knowledge/${unit.id}/publish`,
					{
						method: 'POST',
						body: JSON.stringify({ expectedUpdatedAt: stamp }),
					},
				);
				if (published.updatedAt) stamp = new Date(published.updatedAt).toISOString();
			}
			clearWorkspaceDraft(edit.courseId, 'unit', unit.id);
			setExpectedUpdatedAt(stamp);
			onSaved({
				...unit,
				title,
				slug: unit.slug,
				summary,
				foundationHtml,
				academicHtml,
				expertHtml,
				authoring: {
					status: publish ? 'PUBLISHED' : (unit.authoring?.status ?? 'DRAFT'),
					updatedAt: stamp,
					hasDraft: !publish,
				},
			});
			await edit.refresh();
			edit.setToast(publish ? 'Đã xuất bản' : 'Đã lưu bản nháp');
		} catch (err) {
			const code = (err as { code?: string }).code;
			if (code === 'CONFLICT') {
				setConflict(true);
				setError('Dữ liệu đã được người khác cập nhật');
			} else {
				setError(err instanceof Error ? err.message : 'Không lưu được');
			}
		} finally {
			setBusy(false);
		}
	}

	if (!edit?.enabled) return null;

	return (
		<div className="pb-24">
			{conflict ? (
				<div className="mb-4 rounded-[var(--mc-r-sm)] border border-warning/40 bg-surface-sunken p-3 text-sm">
					Dữ liệu đã được người khác cập nhật.{' '}
					<button
						type="button"
						className="font-semibold underline"
						onClick={() => window.location.reload()}
					>
						Tải lại
					</button>
				</div>
			) : null}
			{error ? <p className="mb-3 text-sm text-error">{error}</p> : null}
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
				compact
			/>
			<div className="sticky bottom-3 z-20 mt-8 flex flex-wrap items-center justify-between gap-3 rounded-[var(--mc-r-md)] border border-mc-rule bg-paper/95 p-3 backdrop-blur">
				<p className="mc-meta">{dirty ? 'Chưa lưu' : 'Đã lưu'}</p>
				<div className="flex flex-wrap gap-2">
					<McButton variant="secondary" disabled={busy || !dirty} onClick={() => void save(false)}>
						Lưu nháp
					</McButton>
					<McButton disabled={busy} onClick={() => void save(true)}>
						Xuất bản
					</McButton>
				</div>
			</div>
			<Dialog
				open={Boolean(recovery)}
				onClose={() => {
					if (recovery) dismissWorkspaceDraft(recovery);
					setRecovery(null);
				}}
				title="Khôi phục bản nháp cục bộ?"
			>
				<p className="text-sm">Trình duyệt còn nội dung chưa lưu của mục này.</p>
				<div className="mt-4 flex justify-end gap-2">
					<button
						type="button"
						className="min-h-11 px-3"
						onClick={() => {
							if (recovery) dismissWorkspaceDraft(recovery);
							setRecovery(null);
						}}
					>
						Để sau
					</button>
					<button
						type="button"
						className="min-h-11 px-3"
						onClick={() => {
							if (edit) clearWorkspaceDraft(edit.courseId, 'unit', unit.id);
							setRecovery(null);
						}}
					>
						Bỏ bản nháp
					</button>
					<button
						type="button"
						className="min-h-11 rounded-[var(--mc-r-sm)] bg-ink px-4 text-paper"
						onClick={() => {
							if (!recovery) return;
							setTitle(recovery.title);
							setSummary(recovery.summary);
							if (recovery.foundationHtml !== undefined) setFoundationHtml(recovery.foundationHtml);
							if (recovery.academicHtml !== undefined) setAcademicHtml(recovery.academicHtml);
							if (recovery.expertHtml !== undefined) setExpertHtml(recovery.expertHtml);
							setRecovery(null);
						}}
					>
						Khôi phục
					</button>
				</div>
			</Dialog>
		</div>
	);
}
