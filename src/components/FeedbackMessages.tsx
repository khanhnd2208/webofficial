'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import type { FeedbackMessageDTO } from '@/types/feedbackMessage';

/* ─── Helpers ──────────────────────────────────────────────── */
function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString('vi-VN', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

export default function FeedbackMessages() {
	const { data: session } = useSession();
	const searchParams = useSearchParams();
	const [messages, setMessages] = useState<FeedbackMessageDTO[]>([]);
	const [loading, setLoading] = useState(true);
	const [subject, setSubject] = useState('');
	const [content, setContent] = useState('');
	const [sending, setSending] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	// Per-message reply state
	const [replyingId, setReplyingId] = useState<string | null>(null);
	const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
	const [replyingLoading, setReplyingLoading] = useState(false);
	const [replyError, setReplyError] = useState('');

	// Auto-populated sourceUrl from ?ref= query param
	const sourceUrl = searchParams.get('ref') ?? undefined;

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
		if (session?.user) void fetchMessages();
		else setLoading(false);
	}, [session, fetchMessages]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!subject.trim() || !content.trim() || sending) return;

		setSending(true);
		setError('');
		setSuccess('');

		try {
			const res = await fetch('/api/feedback/messages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ subject: subject.trim(), content: content.trim(), sourceUrl }),
			});
			const json = (await res.json()) as unknown;
			if (!res.ok || !(typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true)) {
				throw new Error((json as { error?: string }).error ?? 'Gửi phản hồi thất bại');
			}
			setSubject('');
			setContent('');
			setSuccess('Phản hồi đã được gửi! Admin sẽ trả lời sớm nhất có thể.');
			setTimeout(() => setSuccess(''), 6000);
			void fetchMessages();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Lỗi không xác định');
		} finally {
			setSending(false);
		}
	}

	async function handleReply(msgId: string) {
		const text = replyTexts[msgId]?.trim();
		if (!text || replyingLoading) return;
		setReplyingLoading(true);
		setReplyError('');
		try {
			const res = await fetch(`/api/feedback/messages/${msgId}/reply`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reply: text }),
			});
			const json = (await res.json()) as unknown;
			if (!res.ok || !(typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true)) {
				throw new Error((json as { error?: string }).error ?? 'Gửi thất bại');
			}
			setReplyTexts((prev) => ({ ...prev, [msgId]: '' }));
			setReplyingId(null);
			void fetchMessages();
		} catch (err) {
			setReplyError(err instanceof Error ? err.message : 'Lỗi không xác định');
		} finally {
			setReplyingLoading(false);
		}
	}

	function statusBadge(status: string) {
		switch (status) {
			case 'pending':
				return (
					<span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
						<span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
						Đang chờ
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
						Đã đóng
					</span>
				);
			default:
				return null;
		}
	}

	// Not logged in
	if (!session?.user) {
		return (
			<div className="rounded-xl border border-border bg-surface p-8 text-center">
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-hover">
					<svg viewBox="0 0 20 20" fill="none" className="h-6 w-6 text-muted">
						<path d="M2 4.5C2 3.67 2.67 3 3.5 3h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5h-13C2.67 15 2 14.33 2 13.5v-9z" stroke="currentColor" strokeWidth="1.4" />
						<path d="M2 4.5l8 5.25L18 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
					</svg>
				</div>
				<p className="mt-4 text-sm font-bold text-foreground">Đăng nhập để gửi phản hồi</p>
				<p className="mt-1.5 text-sm text-muted">Cần tài khoản để gửi tin nhắn và theo dõi trả lời.</p>
				<Link
					href={`/login?callbackUrl=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '/feedback')}`}
					className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-background transition-all hover:opacity-80"
				>
					Đăng nhập với Google
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-10">
			{/* New message form */}
			<div>
				<p className="text-xs font-bold uppercase tracking-widest text-muted">Gửi tin nhắn mới</p>
				{sourceUrl && (
					<p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
						<svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
						</svg>
						Phản hồi từ trang:{' '}
						<a href={sourceUrl} className="truncate underline underline-offset-2 hover:text-foreground" target="_blank" rel="noopener noreferrer">
							{sourceUrl}
						</a>
					</p>
				)}
				<form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
					<div>
						<label htmlFor="fb-subject" className="block text-xs font-bold uppercase tracking-wider text-muted">
							Tiêu đề
						</label>
						<input
							id="fb-subject"
							type="text"
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							placeholder="VD: Góp ý về bài viết, Báo lỗi..."
							maxLength={200}
							className="mt-1.5 w-full border border-border bg-transparent px-3 py-2.5 text-sm transition-colors placeholder:text-muted focus:border-accent focus:outline-none"
						/>
					</div>
					<div>
						<label htmlFor="fb-content" className="block text-xs font-bold uppercase tracking-wider text-muted">
							Nội dung
						</label>
						<textarea
							id="fb-content"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder="Viết phản hồi của bạn ở đây..."
							rows={5}
							maxLength={5000}
							className="mt-1.5 w-full resize-none border border-border bg-transparent px-3 py-2.5 text-sm leading-relaxed transition-colors placeholder:text-muted focus:border-accent focus:outline-none"
						/>
						<span className="mt-1 block text-right text-xs text-muted">{content.length}/5000</span>
					</div>
					<div className="flex items-center gap-3">
						<button
							type="submit"
							disabled={!subject.trim() || !content.trim() || sending}
							className="border-2 border-foreground bg-foreground px-5 py-2 text-xs font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground disabled:opacity-40"
						>
							{sending ? 'Đang gửi…' : 'Gửi phản hồi'}
						</button>
						{error && <p className="text-xs text-error">{error}</p>}
						{success && <p className="text-xs text-green-600 dark:text-green-400">{success}</p>}
					</div>
				</form>
			</div>

			{/* Message history with conversation threads */}
			<div>
				<p className="text-xs font-bold uppercase tracking-widest text-muted">
					Lịch sử phản hồi {messages.length > 0 ? `(${messages.length})` : ''}
				</p>

				{loading ? (
					<div className="mt-4 flex items-center gap-2 text-sm text-muted">
						<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
							<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
							<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
						</svg>
						Đang tải…
					</div>
				) : messages.length === 0 ? (
					<p className="mt-4 text-sm text-muted">Bạn chưa gửi phản hồi nào.</p>
				) : (
					<div className="mt-4 space-y-4">
						{messages.map((msg) => (
							<div key={msg.id} className="rounded-xl border border-border p-5 transition-colors hover:border-border-hover">
								{/* Thread header */}
								<div className="flex items-start justify-between gap-2">
									<div className="min-w-0 flex-1">
										<h4 className="text-sm font-bold text-foreground">{msg.subject}</h4>
										<time className="mt-0.5 block text-xs text-muted">{formatDate(msg.createdAt)}</time>
									</div>
									{statusBadge(msg.status)}
								</div>

								{/* Initial user message */}
								<div className="mt-3 flex items-start gap-3">
									<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-hover text-xs font-bold text-foreground-secondary">
										{(session.user.name ?? '?')[0].toUpperCase()}
									</div>
									<div className="flex-1 rounded-lg bg-surface-hover px-3.5 py-3">
										<p className="text-xs font-bold text-foreground">{session.user.name} <span className="font-normal text-muted">(Bạn)</span></p>
										<p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground-secondary">{msg.content}</p>
									</div>
								</div>

								{/* Conversation thread: replies[] */}
								{msg.replies && msg.replies.length > 0 && (
									<div className="mt-3 space-y-3">
										{msg.replies.map((r) => (
											<div key={r.id} className={`flex items-start gap-3 ${r.role === 'admin' ? 'flex-row-reverse' : ''}`}>
												<div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
													r.role === 'admin'
														? 'bg-foreground text-background'
														: 'bg-surface-hover text-foreground-secondary'
												}`}>
													{r.authorName[0]?.toUpperCase() ?? '?'}
												</div>
												<div className={`flex-1 rounded-lg px-3.5 py-3 ${
													r.role === 'admin'
														? 'bg-accent/10 text-right'
														: 'bg-surface-hover'
												}`}>
													<p className={`text-xs font-bold ${r.role === 'admin' ? 'text-accent' : 'text-foreground'}`}>
														{r.role === 'admin' ? 'Giảng viên' : `${r.authorName} (Bạn)`}
													</p>
													<time className="mt-0.5 block text-[10px] text-muted">{formatDate(r.createdAt)}</time>
													<p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground-secondary">
														{r.content}
													</p>
												</div>
											</div>
										))}
									</div>
								)}

								{/* Legacy adminReply fallback for old messages without replies[] */}
								{(!msg.replies || msg.replies.length === 0) && msg.adminReply && (
									<div className="mt-4 flex items-start gap-3 flex-row-reverse">
										<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">G</div>
										<div className="flex-1 rounded-lg bg-accent/10 px-3.5 py-3 text-right">
											<p className="text-xs font-bold text-accent">Giảng viên</p>
											{msg.adminRepliedAt && (
												<time className="mt-0.5 block text-[10px] text-muted">{formatDate(msg.adminRepliedAt)}</time>
											)}
											<p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground-secondary">
												{msg.adminReply}
											</p>
										</div>
									</div>
								)}

								{/* Continue thread: user reply button */}
								{msg.status !== 'closed' && (
									<div className="mt-4">
										{replyingId === msg.id ? (
											<div className="space-y-2">
												<textarea
													value={replyTexts[msg.id] ?? ''}
													onChange={(e) => setReplyTexts((prev) => ({ ...prev, [msg.id]: e.target.value }))}
													placeholder="Tiếp tục cuộc trò chuyện…"
													rows={3}
													maxLength={5000}
													className="w-full resize-none border border-border bg-transparent px-3 py-2.5 text-sm transition-colors placeholder:text-muted focus:border-accent focus:outline-none"
												/>
												{replyError && <p className="text-xs text-error">{replyError}</p>}
												<div className="flex items-center gap-2">
													<button
														type="button"
														onClick={() => void handleReply(msg.id)}
														disabled={!replyTexts[msg.id]?.trim() || replyingLoading}
														className="border border-foreground bg-foreground px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground disabled:opacity-40"
													>
														{replyingLoading ? 'Đang gửi…' : 'Gửi'}
													</button>
													<button
														type="button"
														onClick={() => { setReplyingId(null); setReplyError(''); }}
														className="px-3 py-1.5 text-xs text-muted hover:text-foreground"
													>
														Hủy
													</button>
												</div>
											</div>
										) : (
											<button
												type="button"
												onClick={() => setReplyingId(msg.id)}
												className="text-xs font-bold text-muted underline underline-offset-2 hover:text-foreground"
											>
												+ Tiếp tục hội thoại
											</button>
										)}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

