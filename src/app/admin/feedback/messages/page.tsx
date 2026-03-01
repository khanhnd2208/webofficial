'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import type { FeedbackMessageDTO } from '@/types/feedbackMessage';

type ViewMode = 'list' | 'detail';
type FilterStatus = 'all' | 'pending' | 'replied' | 'closed';

export default function AdminFeedbackMessagesPage() {
	const [messages, setMessages] = useState<FeedbackMessageDTO[]>([]);
	const [loading, setLoading] = useState(true);
	const [view, setView] = useState<ViewMode>('list');
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [filter, setFilter] = useState<FilterStatus>('all');
	const [replyText, setReplyText] = useState('');
	const [replying, setReplying] = useState(false);
	const [replyError, setReplyError] = useState('');

	const fetchMessages = useCallback(async () => {
		try {
			const res = await fetch('/api/feedback/messages');
			const json = (await res.json()) as unknown;
			if (typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true) {
				const data = (json as { data?: { items?: FeedbackMessageDTO[] } }).data;
				if (data?.items) setMessages(data.items);
			}
		} catch {
			/* ignore */
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchMessages();
	}, [fetchMessages]);

	const selected = messages.find((m) => m.id === selectedId) ?? null;

	const filtered = filter === 'all' ? messages : messages.filter((m) => m.status === filter);

	const pendingCount = messages.filter((m) => m.status === 'pending').length;

	async function handleReply() {
		if (!selected || !replyText.trim() || replying) return;
		setReplying(true);
		setReplyError('');

		try {
			const res = await fetch(`/api/feedback/messages/${selected.id}/reply`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reply: replyText.trim() }),
			});
			const json = (await res.json()) as unknown;
			if (!res.ok || !(typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true)) {
				const errMsg =
					typeof json === 'object' && json !== null && typeof (json as { error?: unknown }).error === 'string'
						? String((json as { error?: unknown }).error)
						: 'Gửi trả lời thất bại';
				throw new Error(errMsg);
			}
			setReplyText('');
			void fetchMessages();
		} catch (err) {
			setReplyError(err instanceof Error ? err.message : 'Unknown error');
		} finally {
			setReplying(false);
		}
	}

	async function handleClose() {
		if (!selected) return;
		try {
			await fetch(`/api/feedback/messages/${selected.id}/reply`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'close' }),
			});
			void fetchMessages();
		} catch {
			/* ignore */
		}
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

	function statusBadge(status: string) {
		switch (status) {
			case 'pending':
				return (
					<span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
						<span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
						Chờ
					</span>
				);
			case 'replied':
				return (
					<span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800 dark:bg-green-900/30 dark:text-green-400">
						<span className="h-1.5 w-1.5 rounded-full bg-green-500" />
						Đã trả lời
					</span>
				);
			case 'closed':
				return (
					<span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
						<span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
						Đóng
					</span>
				);
			default:
				return null;
		}
	}

	if (loading) {
		return (
			<main className="mx-auto max-w-6xl px-6 py-8">
				<div className="flex items-center gap-2 text-sm text-muted">
					<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
						<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
					</svg>
					Đang tải…
				</div>
			</main>
		);
	}

	return (
		<main className="mx-auto max-w-6xl px-6 py-8">
			{/* Header */}
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<Link href="/admin" className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground">
						← Admin
					</Link>
					<h1 className="mt-2 text-2xl font-bold tracking-tight">
						Hộp thư phản hồi
						{pendingCount > 0 && (
							<span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
								{pendingCount}
							</span>
						)}
					</h1>
					<p className="mt-1 text-sm text-foreground-secondary">
						Quản lý tin nhắn phản hồi từ người dùng — {messages.length} tin nhắn
					</p>
				</div>
			</header>

			{/* Filter tabs */}
			<div className="mt-6 flex items-center gap-1 border-b border-border">
				{(
					[
						{ key: 'all' as FilterStatus, label: 'Tất cả', count: messages.length },
						{ key: 'pending' as FilterStatus, label: 'Đang chờ', count: pendingCount },
						{ key: 'replied' as FilterStatus, label: 'Đã trả lời', count: messages.filter((m) => m.status === 'replied').length },
						{ key: 'closed' as FilterStatus, label: 'Đã đóng', count: messages.filter((m) => m.status === 'closed').length },
					] as const
				).map((tab) => (
					<button
						key={tab.key}
						onClick={() => setFilter(tab.key)}
						className={`border-b-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
							filter === tab.key
								? 'border-foreground text-foreground'
								: 'border-transparent text-muted hover:text-foreground'
						}`}
					>
						{tab.label}
						{tab.count > 0 && (
							<span className="ml-1.5 text-[10px] opacity-60">({tab.count})</span>
						)}
					</button>
				))}
			</div>

			{view === 'list' ? (
				/* Message list */
				<div className="mt-4">
					{filtered.length === 0 ? (
						<p className="py-10 text-center text-sm text-muted">Không có tin nhắn nào.</p>
					) : (
						<div className="space-y-0 divide-y divide-border">
							{filtered.map((msg) => (
								<button
									key={msg.id}
									onClick={() => {
										setSelectedId(msg.id);
										setView('detail');
										setReplyText(msg.adminReply ?? '');
										setReplyError('');
									}}
									className={`flex w-full items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-surface-hover/50 ${
										msg.status === 'pending' ? 'bg-yellow-50/50 dark:bg-yellow-900/5' : ''
									}`}
								>
									{/* Avatar */}
									{msg.userImage ? (
										<img
											src={msg.userImage}
											alt={msg.userName}
											className="h-9 w-9 shrink-0 rounded-full object-cover"
										/>
									) : (
										<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-hover text-xs font-bold text-foreground-secondary">
											{msg.userName[0]?.toUpperCase() ?? '?'}
										</div>
									)}

									{/* Content preview */}
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span className="text-sm font-bold text-foreground">{msg.userName}</span>
											<span className="text-xs text-muted">{msg.userEmail}</span>
											{statusBadge(msg.status)}
										</div>
										<p className="mt-0.5 text-sm font-medium text-foreground">{msg.subject}</p>
										<p className="mt-0.5 truncate text-xs text-muted">{msg.content}</p>
									</div>

									{/* Date */}
									<time className="shrink-0 text-xs text-muted">{formatDate(msg.createdAt)}</time>
								</button>
							))}
						</div>
					)}
				</div>
			) : selected ? (
				/* Detail view */
				<div className="mt-6">
					<button
						onClick={() => {
							setView('list');
							setSelectedId(null);
						}}
						className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground"
					>
						← Quay lại
					</button>

					<div className="mt-4 border border-border p-6">
						{/* Message header */}
						<div className="flex items-start gap-3">
							{selected.userImage ? (
								<img
									src={selected.userImage}
									alt={selected.userName}
									className="h-10 w-10 shrink-0 rounded-full object-cover"
								/>
							) : (
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-hover text-sm font-bold text-foreground-secondary">
									{selected.userName[0]?.toUpperCase() ?? '?'}
								</div>
							)}
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<span className="text-sm font-bold text-foreground">{selected.userName}</span>
									<span className="text-xs text-muted">{selected.userEmail}</span>
									{statusBadge(selected.status)}
								</div>
								<time className="mt-0.5 block text-xs text-muted">{formatDate(selected.createdAt)}</time>
							</div>
						</div>

						{/* Subject */}
						<h2 className="mt-4 text-lg font-bold text-foreground">{selected.subject}</h2>

						{/* User's message */}
						<p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground-secondary">
							{selected.content}
						</p>

						{/* Previous admin reply */}
						{selected.adminReply && (
							<div className="mt-6 border-l-2 border-accent pl-4">
								<p className="text-xs font-bold text-accent">Phản hồi đã gửi</p>
								{selected.adminRepliedAt && (
									<time className="mt-0.5 block text-xs text-muted">
										{formatDate(selected.adminRepliedAt)}
									</time>
								)}
								<p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground-secondary">
									{selected.adminReply}
								</p>
							</div>
						)}

						{/* Reply form */}
						{selected.status !== 'closed' && (
							<div className="mt-6 border-t border-border pt-6">
								<label className="block text-xs font-bold uppercase tracking-wider text-muted">
									{selected.adminReply ? 'Cập nhật trả lời' : 'Trả lời'}
								</label>
								<textarea
									value={replyText}
									onChange={(e) => setReplyText(e.target.value)}
									placeholder="Viết trả lời cho người dùng..."
									rows={5}
									maxLength={5000}
									className="mt-2 w-full resize-none border border-border bg-transparent px-3 py-2.5 text-sm leading-relaxed transition-colors placeholder:text-muted focus:border-accent focus:outline-none"
								/>
								<div className="mt-3 flex items-center gap-3">
									<button
										onClick={() => void handleReply()}
										disabled={!replyText.trim() || replying}
										className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
									>
										{replying ? 'Đang gửi…' : 'Gửi trả lời'}
									</button>
									<button
										onClick={() => void handleClose()}
										className="text-xs font-bold text-muted underline underline-offset-4 hover:text-foreground"
									>
										Đóng tin nhắn
									</button>
									{replyError && <p className="text-xs text-red-500">{replyError}</p>}
								</div>
							</div>
						)}
					</div>
				</div>
			) : null}
		</main>
	);
}
