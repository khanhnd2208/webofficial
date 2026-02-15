'use client';

import Link from 'next/link';
import { useState } from 'react';

type Props = {
	id: string;
	slug: string;
	title: string;
	isPublished: boolean;
};

export default function AdminPostActions({ id, slug, title, isPublished }: Props) {
	const [status, setStatus] = useState<'idle' | 'deleting' | 'error'>('idle');
	const [error, setError] = useState<string>('');

	async function onDelete() {
		const ok = window.confirm(`Xoá bài viết: "${title}"?`);
		if (!ok) return;

		setStatus('deleting');
		setError('');
		try {
			const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
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
			<Link
				href={`/admin/posts/${id}/edit`}
				className="rounded-md border border-border-hover px-3 py-1 text-xs"
			>
				Sửa
			</Link>
			{isPublished ? (
				<Link
					href={`/blog/${slug}`}
					className="rounded-md border border-border-hover px-3 py-1 text-xs"
				>
					Xem
				</Link>
			) : (
				<span className="rounded-md border border-border px-3 py-1 text-xs text-muted">
					Chưa publish
				</span>
			)}
			<button
				type="button"
				onClick={onDelete}
				disabled={status === 'deleting'}
				className="rounded-md border border-border-hover px-3 py-1 text-xs disabled:opacity-60"
			>
				{status === 'deleting' ? 'Đang xoá…' : 'Xoá'}
			</button>
			{status === 'error' ? <span className="text-xs text-error">{error}</span> : null}
		</div>
	);
}
