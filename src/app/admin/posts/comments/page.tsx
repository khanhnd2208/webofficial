'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface PendingComment {
	id: string;
	postId: string;
	postSlug: string;
	postTitle?: string;
	userId: string;
	userName: string;
	userImage?: string;
	content: string;
	status: string;
	parentId: string | null;
	createdAt: string;
}

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString('vi-VN', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function timeAgo(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return 'vừa xong';
	if (mins < 60) return `${mins} phút trước`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours} giờ trước`;
	const days = Math.floor(hours / 24);
	return `${days} ngày trước`;
}

export default function AdminCommentsPage() {
	const [comments, setComments] = useState<PendingComment[]>([]);
	const [loading, setLoading] = useState(true);
	const [actionId, setActionId] = useState<string | null>(null);
	const [filter, setFilter] = useState<'pending' | 'all'>('pending');

	const fetchComments = useCallback(async () => {
		try {
			const res = await fetch(`/api/admin/comments${filter === 'all' ? '?status=all' : ''}`);
			const json = (await res.json()) as unknown;
			if (typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true) {
				const data = (json as { data?: { items?: PendingComment[] } }).data;
				if (data?.items) setComments(data.items);
			}
		} catch {
			/* ignore */
		} finally {
			setLoading(false);
		}
	}, [filter]);

	useEffect(() => {
		setLoading(true);
		void fetchComments();
	}, [fetchComments]);

	async function handleAction(commentId: string, action: 'approve' | 'hide' | 'delete') {
		if (actionId) return;
		setActionId(commentId);
		try {
			await fetch('/api/admin/comments', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ commentId, action }),
			});
			void fetchComments();
		} catch {
			/* ignore */
		} finally {
			setActionId(null);
		}
	}

	const pendingCount = comments.filter((c) => c.status === 'pending').length;

	return (
		<main className="mx-auto max-w-5xl px-6 py-8">
			{/* Header */}
			<header>
				<Link href="/admin" className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground">
					← Admin
				</Link>
				<h1 className="mt-2 text-2xl font-bold tracking-tight">
					Bình luận
					{pendingCount > 0 && (
						<span className="ml-2 inline-flex items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
							{pendingCount} chờ duyệt
						</span>
					)}
				</h1>
				<p className="mt-1 text-sm text-foreground-secondary">
					Duyệt hoặc ẩn bình luận từ người dùng trước khi hiển thị công khai.
				</p>
			</header>

			{/* Filter tabs */}
			<div className="mt-6 flex items-center gap-1 border-b border-border">
				{(['pending', 'all'] as const).map((f) => (
					<button
						key={f}
						onClick={() => setFilter(f)}
						className={`border-b-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
							filter === f
								? 'border-foreground text-foreground'
								: 'border-transparent text-muted hover:text-foreground'
						}`}
					>
						{f === 'pending' ? 'Chờ duyệt' : 'Tất cả'}
					</button>
				))}
			</div>

			{/* Content */}
			<div className="mt-4">
				{loading ? (
					<div className="flex items-center gap-2 py-10 text-sm text-muted">
						<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
							<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
							<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
						</svg>
						Đang tải…
					</div>
				) : comments.length === 0 ? (
					<p className="py-10 text-center text-sm text-muted">
						{filter === 'pending' ? 'Không có bình luận nào đang chờ duyệt.' : 'Chưa có bình luận nào.'}
					</p>
				) : (
					<div className="space-y-0 divide-y divide-border">
						{comments.map((c) => (
							<div key={c.id} className="flex items-start gap-4 py-5">
								{/* Avatar */}
								{c.userImage ? (
									<img
										src={c.userImage}
										alt={c.userName}
										className="h-9 w-9 shrink-0 rounded-full object-cover"
										referrerPolicy="no-referrer"
									/>
								) : (
									<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-hover text-xs font-bold text-foreground-secondary">
										{c.userName[0]?.toUpperCase() ?? '?'}
									</div>
								)}

								{/* Body */}
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
										<span className="text-sm font-bold text-foreground">{c.userName}</span>
										{c.parentId && (
											<span className="text-[10px] text-muted">(trả lời bình luận)</span>
										)}
										<span className="text-xs text-muted">·</span>
										<time className="text-xs text-muted" title={formatDate(c.createdAt)}>
											{timeAgo(c.createdAt)}
										</time>
										{/* Status badge */}
										{c.status === 'pending' && (
											<span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
												<span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
												Chờ duyệt
											</span>
										)}
										{c.status === 'approved' && (
											<span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800 dark:bg-green-900/30 dark:text-green-400">
												<span className="h-1.5 w-1.5 rounded-full bg-green-500" />
												Đã duyệt
											</span>
										)}
										{c.status === 'hidden' && (
											<span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
												<span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
												Ẩn
											</span>
										)}
									</div>

									{/* Post link */}
									{c.postSlug && (
										<Link
											href={`/blog/${c.postSlug}`}
											target="_blank"
											className="mt-0.5 block text-xs text-muted underline underline-offset-2 hover:text-foreground"
										>
											{c.postTitle ?? c.postSlug}
										</Link>
									)}

									{/* Comment content */}
									<p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground-secondary">
										{c.content}
									</p>

									{/* Action buttons */}
									<div className="mt-3 flex flex-wrap items-center gap-3">
										{c.status !== 'approved' && (
											<button
												onClick={() => void handleAction(c.id, 'approve')}
												disabled={actionId === c.id}
												className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-40"
											>
												<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
													<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
												</svg>
												Duyệt
											</button>
										)}
										{c.status !== 'hidden' && (
											<button
												onClick={() => void handleAction(c.id, 'hide')}
												disabled={actionId === c.id}
												className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-foreground-secondary transition-colors hover:bg-surface-hover disabled:opacity-40"
											>
												<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
													<path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
												</svg>
												Ẩn
											</button>
										)}
										{c.status === 'hidden' && (
											<button
												onClick={() => void handleAction(c.id, 'approve')}
												disabled={actionId === c.id}
												className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-foreground-secondary transition-colors hover:bg-surface-hover disabled:opacity-40"
											>
												Hiện lại
											</button>
										)}
										<button
											onClick={() => {
												if (confirm('Xóa bình luận này? Hành động không thể hoàn tác.')) {
													void handleAction(c.id, 'delete');
												}
											}}
											disabled={actionId === c.id}
											className="inline-flex items-center gap-1 rounded-lg border border-error/30 px-3 py-1.5 text-xs font-bold text-error transition-colors hover:bg-error/5 disabled:opacity-40"
										>
											<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
												<path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
											</svg>
											Xóa
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</main>
	);
}
