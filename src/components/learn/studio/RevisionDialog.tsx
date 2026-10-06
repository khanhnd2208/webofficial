'use client';

import { useEffect, useState } from 'react';

import { absoluteWhen, relativeWhen } from '@/features/learn/formatWhen';
import { sectionPlainText } from '@/features/learn/sectionText';
import { wordDiff } from '@/features/learn/textFidelity';
import type { LearnStudioSection } from '@/features/learn/types';
import { adminFetch } from '@/lib/admin/client';

import StudioDialog from './StudioDialog';
import TextDiff from './TextDiff';
import { useStudioConfirm } from './StudioConfirm';

const REASON_LABEL: Record<string, string> = {
	autosave: 'Tự lưu',
	import: 'Trước khi nhập',
	restore: 'Trước khi khôi phục',
	manual: 'Lưu thủ công',
	conflict: 'Trước khi ghi đè',
};

interface RevisionMeta {
	id: string;
	title: string;
	reason: string;
	createdAt: string;
}

interface RevisionBody extends RevisionMeta {
	summary: string;
	markdown: string;
	keyTakeaways: string[];
	checkpoint: LearnStudioSection['checkpoint'];
	quiz: LearnStudioSection['quiz'];
	discussion: LearnStudioSection['discussion'];
}

export default function RevisionDialog({
	section,
	flush,
	onClose,
	onRestored,
}: {
	section: LearnStudioSection;
	/** Save pending edits first, so a snapshot holds them and a restore is not overwritten. */
	flush: () => Promise<{ ok: boolean }>;
	onClose: () => void;
	onRestored: (section: LearnStudioSection) => void;
}) {
	const [rows, setRows] = useState<RevisionMeta[] | null>(null);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [body, setBody] = useState<RevisionBody | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const { confirm, confirmDialog } = useStudioConfirm();

	useEffect(() => {
		let cancelled = false;
		adminFetch<RevisionMeta[]>(`/api/admin/learn/sections/${section.id}/revisions`)
			.then((list) => {
				if (cancelled) return;
				setRows(list);
				setSelectedId(list[0]?.id ?? null);
			})
			.catch((err: unknown) => {
				if (!cancelled) setError(err instanceof Error ? err.message : 'Không tải được lịch sử');
			});
		return () => {
			cancelled = true;
		};
	}, [section.id]);

	useEffect(() => {
		if (!selectedId) return;
		let cancelled = false;
		adminFetch<RevisionBody>(`/api/admin/learn/sections/${section.id}/revisions/${selectedId}`)
			.then((revision) => {
				if (!cancelled) setBody(revision);
			})
			.catch((err: unknown) => {
				if (!cancelled) setError(err instanceof Error ? err.message : 'Không tải được bản này');
			});
		return () => {
			cancelled = true;
		};
	}, [section.id, selectedId]);

	const hunks = body
		? wordDiff(
				sectionPlainText({
					...section,
					title: body.title,
					summary: body.summary,
					markdown: body.markdown,
					keyTakeaways: body.keyTakeaways,
					checkpoint: body.checkpoint,
					quiz: body.quiz,
					discussion: body.discussion,
				}),
				sectionPlainText(section),
			).slice(0, 40)
		: [];

	async function saveManual() {
		setBusy(true);
		setError(null);
		try {
			if (!(await flush()).ok) throw new Error('Chưa lưu được nội dung đang soạn');
			const list = await adminFetch<RevisionMeta[]>(
				`/api/admin/learn/sections/${section.id}/revisions`,
				{
					method: 'POST',
					body: JSON.stringify({ reason: 'manual' }),
				},
			);
			setRows(list);
			setSelectedId(list[0]?.id ?? null);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không lưu được phiên bản');
		} finally {
			setBusy(false);
		}
	}

	async function restore() {
		if (!selectedId) return;
		const accepted = await confirm({
			title: 'Khôi phục bản này?',
			body: 'Khôi phục sẽ thay nội dung hiện tại. Lịch sử hoàn tác trong ô soạn sẽ mất.',
			confirmLabel: 'Khôi phục',
			danger: true,
		});
		if (!accepted) return;
		setBusy(true);
		setError(null);
		try {
			if (!(await flush()).ok) throw new Error('Chưa lưu được nội dung đang soạn');
			const restored = await adminFetch<LearnStudioSection>(
				`/api/admin/learn/sections/${section.id}/revisions/${selectedId}`,
				{ method: 'POST' },
			);
			onRestored(restored);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không khôi phục được');
			setBusy(false);
		}
	}

	return (
		<>
			<StudioDialog
				title="Lịch sử"
				onClose={onClose}
				footer={
					<div className="ln-confirm">
						<button
							type="button"
							className="ln-btn"
							disabled={busy}
							onClick={() => void saveManual()}
						>
							Lưu phiên bản
						</button>
						<button
							type="button"
							className="ln-btn ln-btn--primary"
							disabled={busy || !selectedId}
							onClick={() => void restore()}
						>
							Khôi phục bản này
						</button>
					</div>
				}
			>
				{error ? <p role="alert">{error}</p> : null}
				<div className="ln-revs">
					<ul className="ln-revs__list">
						{rows?.length === 0 ? (
							<li className="ln-revs__empty">
								Chưa có phiên bản nào. Hệ thống tự lưu một bản khi bạn sửa nội dung, hoặc bấm Lưu
								phiên bản.
							</li>
						) : null}
						{(rows ?? []).map((row) => (
							<li key={row.id}>
								<button
									type="button"
									aria-current={row.id === selectedId ? 'true' : undefined}
									onClick={() => setSelectedId(row.id)}
								>
									<span>{REASON_LABEL[row.reason] ?? row.reason}</span>
									<span className="tabular-nums">
										{relativeWhen(row.createdAt)} · {absoluteWhen(row.createdAt)}
									</span>
								</button>
							</li>
						))}
					</ul>
					<div className="ln-revs__diff">
						{body ? (
							<TextDiff hunks={hunks} />
						) : rows === null || selectedId ? (
							<p>Đang tải…</p>
						) : null}
						{body && !hunks.length ? <p>Bản này giống nội dung đang mở.</p> : null}
					</div>
				</div>
			</StudioDialog>
			{confirmDialog}
		</>
	);
}
