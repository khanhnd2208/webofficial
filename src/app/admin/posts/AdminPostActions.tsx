'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useAdminConfirm } from '@/components/admin/useAdminConfirm';
import { adminFetch } from '@/lib/admin/client';

type Props = {
	id: string;
	slug: string;
	title: string;
	isPublished: boolean;
};

export default function AdminPostActions({ id, slug, title, isPublished }: Props) {
	const [status, setStatus] = useState<'idle' | 'deleting' | 'error'>('idle');
	const [error, setError] = useState<string>('');
	const { confirm, dialog } = useAdminConfirm();

	async function onDelete() {
		const ok = await confirm({
			title: 'Xoá bài viết',
			description: `Xoá bài viết “${title}”? Không hoàn tác được.`,
			confirmLabel: 'Xoá',
		});
		if (!ok) return;

		setStatus('deleting');
		setError('');
		try {
			await adminFetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
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
					href={`/bai-viet/${slug}`}
					className="rounded-md border border-border-hover px-3 py-1 text-xs"
				>
					Xem
				</Link>
			) : (
				<span className="rounded-md border border-border px-3 py-1 text-xs text-muted">
					Chưa xuất bản
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
			{dialog}
		</div>
	);
}
