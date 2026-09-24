'use client';

import { useEffect, useState } from 'react';

import { countPlaces, wordDiff } from '@/features/learn/textFidelity';
import type { LearnStudioSection } from '@/features/learn/types';
import { adminFetch } from '@/lib/admin/client';

import TextDiff from './TextDiff';

const REASON_LABEL: Record<string, string> = {
	autosave: 'Tự lưu',
	import: 'Trước khi nhập đè',
	restore: 'Trước khi khôi phục',
	manual: 'Lưu thủ công',
};

interface RevisionRow {
	id: string;
	title: string;
	reason: string;
	createdAt: string;
	markdown: string;
}

export default function SectionHistory({
	sectionId,
	currentMarkdown,
	onRestored,
	onSaveVersion,
}: {
	sectionId: string;
	currentMarkdown: string;
	onRestored: (section: LearnStudioSection) => void;
	onSaveVersion: () => Promise<void>;
}) {
	const [open, setOpen] = useState(false);
	const [rows, setRows] = useState<RevisionRow[]>([]);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	function reload() {
		return adminFetch<RevisionRow[]>(`/api/admin/learn/sections/${sectionId}/revisions`)
			.then(setRows)
			.catch(() => setRows([]));
	}

	useEffect(() => {
		if (!open) return;
		let active = true;
		void adminFetch<RevisionRow[]>(`/api/admin/learn/sections/${sectionId}/revisions`)
			.then((next) => {
				if (active) setRows(next);
			})
			.catch(() => {
				if (active) setRows([]);
			});
		return () => {
			active = false;
		};
	}, [open, sectionId]);

	const selected = rows.find((row) => row.id === selectedId) ?? null;
	const hunks = selected ? wordDiff(currentMarkdown, selected.markdown) : [];

	return (
		<div className="ln-inspector__group">
			<div className="flex flex-wrap gap-x-4 gap-y-1">
				<button type="button" className="ln-link-btn" onClick={() => setOpen((value) => !value)}>
					{open ? 'Ẩn lịch sử' : 'Lịch sử'}
				</button>
				<button
					type="button"
					className="ln-link-btn"
					disabled={saving}
					onClick={() => {
						setSaving(true);
						void onSaveVersion()
							.then(() => {
								setOpen(true);
								return reload();
							})
							.finally(() => setSaving(false));
					}}
				>
					{saving ? 'Đang lưu…' : 'Lưu phiên bản'}
				</button>
			</div>
			{open ? (
				rows.length ? (
					<ul className="ln-history">
						{rows.map((row) => (
							<li key={row.id}>
								<button type="button" aria-pressed={row.id === selectedId} onClick={() => setSelectedId(row.id)}>
									{new Date(row.createdAt).toLocaleString('vi-VN')} · {REASON_LABEL[row.reason] ?? row.reason}
								</button>
								<button
									type="button"
									onClick={() => {
										if (!window.confirm('Khôi phục bản này? Nội dung hiện tại được giữ lại trong lịch sử.')) return;
										void adminFetch<LearnStudioSection>(`/api/admin/learn/sections/${sectionId}/revisions/${row.id}`, {
											method: 'POST',
										}).then(onRestored);
									}}
								>
									Khôi phục
								</button>
							</li>
						))}
					</ul>
				) : (
					<p className="ln-inspector__hint">Chưa có bản lưu. Bản tự lưu được giữ khi lần sửa trước đã hơn 10 phút.</p>
				)
			) : null}
			{selected ? (
				<div className="ln-history__diff">
					<p className="ln-inspector__hint">
						{hunks.length
							? `${countPlaces(hunks)} chỗ khác bản này. Gạch đỏ là chữ hiện có sẽ mất nếu khôi phục. Chữ xanh là chữ của bản cũ sẽ quay lại.`
							: 'Bản này trùng nội dung đang mở.'}
					</p>
					<TextDiff hunks={hunks} />
				</div>
			) : null}
		</div>
	);
}
