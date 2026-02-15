'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import type { AdminCourseListItemDTO } from '@/types/course';

type Props = {
	course: AdminCourseListItemDTO;
};

type Status = 'idle' | 'renaming' | 'deleting' | 'error';

export default function CourseRowActions({ course }: Props) {
	const [status, setStatus] = useState<Status>('idle');
	const [error, setError] = useState('');
	const router = useRouter();

	async function onEdit() {
		const nextName = window.prompt('Tên course', course.name);
		if (nextName == null) return;
		const name = nextName.trim();
		if (!name) return;

		const nextDescription = window.prompt('Mô tả (tuỳ chọn)', course.description ?? '');
		if (nextDescription == null) return;
		const description = nextDescription.trim();

		setStatus('renaming');
		setError('');
		try {
			const res = await fetch(`/api/admin/courses/${encodeURIComponent(course.id)}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, description }),
			});
			const json = (await res.json()) as unknown;
			const ok = typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true;
			if (!res.ok || !ok) {
				const message =
					typeof json === 'object' && json !== null && typeof (json as { error?: unknown }).error === 'string'
						? String((json as { error?: unknown }).error)
						: `HTTP ${res.status}`;
				throw new Error(message);
			}
			router.refresh();
		} catch (e) {
			setStatus('error');
			setError(e instanceof Error ? e.message : 'Unknown error');
		}
	}

	async function onDelete() {
		const ok = window.confirm(
			`Xoá course "${course.name}"?\n\nChỉ xoá được khi course chưa có lesson.`
		);
		if (!ok) return;

		setStatus('deleting');
		setError('');
		try {
			const res = await fetch(`/api/admin/courses/${encodeURIComponent(course.id)}`, { method: 'DELETE' });
			const json = (await res.json()) as unknown;
			const success = typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true;
			if (!res.ok || !success) {
				const message =
					typeof json === 'object' && json !== null && typeof (json as { error?: unknown }).error === 'string'
						? String((json as { error?: unknown }).error)
						: `HTTP ${res.status}`;
				throw new Error(message);
			}
			router.refresh();
		} catch (e) {
			setStatus('error');
			setError(e instanceof Error ? e.message : 'Unknown error');
		}
	}

	return (
		<div className="flex flex-wrap items-center justify-end gap-2">
			<button
				type="button"
				onClick={() => void onEdit()}
				disabled={status === 'renaming' || status === 'deleting'}
				className="rounded-md border border-border-hover px-3 py-1 text-xs disabled:opacity-60"
			>
				{status === 'renaming' ? 'Đang lưu…' : 'Sửa'}
			</button>
			<button
				type="button"
				onClick={() => void onDelete()}
				disabled={status === 'deleting' || status === 'renaming'}
				className="rounded-md border border-border-hover px-3 py-1 text-xs disabled:opacity-60"
			>
				{status === 'deleting' ? 'Đang xoá…' : 'Xoá'}
			</button>
			{status === 'error' ? <span className="text-xs text-error">{error}</span> : null}
		</div>
	);
}
