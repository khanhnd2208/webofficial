'use client';

import Link from 'next/link';
import { useState } from 'react';

type Props = {
	lessonId: string;
	lessonTitle: string;
};

type Status = 'idle' | 'deleting' | 'error';

export default function AdminLessonActions({ lessonId, lessonTitle }: Props) {
	const [status, setStatus] = useState<Status>('idle');
	const [error, setError] = useState('');

	async function onDelete() {
		const ok = window.confirm(`Xoá lesson "${lessonTitle}"?\n\nSẽ xoá luôn vocab của lesson và vocab đã lưu của học viên (nếu có).`);
		if (!ok) return;

		setStatus('deleting');
		setError('');
		try {
			const res = await fetch(`/api/admin/lessons/${encodeURIComponent(lessonId)}`, { method: 'DELETE' });
			const json = (await res.json()) as unknown;
			const success = typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true;
			if (!res.ok || !success) {
				const message =
					typeof json === 'object' && json !== null && typeof (json as { error?: unknown }).error === 'string'
						? String((json as { error?: unknown }).error)
						: `HTTP ${res.status}`;
				throw new Error(message);
			}
			window.location.reload();
		} catch (e) {
			setStatus('error');
			setError(e instanceof Error ? e.message : 'Unknown error');
		}
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			<Link className="rounded-md border border-border-hover px-3 py-1 text-xs" href={`/admin/lessons/${lessonId}/edit`}>
				Sửa lesson
			</Link>
			<button
				type="button"
				onClick={() => void onDelete()}
				disabled={status === 'deleting'}
				className="rounded-md border border-border-hover px-3 py-1 text-xs disabled:opacity-60"
			>
				{status === 'deleting' ? 'Đang xoá…' : 'Xoá lesson'}
			</button>
			{status === 'error' ? <span className="text-xs text-error">{error}</span> : null}
		</div>
	);
}
