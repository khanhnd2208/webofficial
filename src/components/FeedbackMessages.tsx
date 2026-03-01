'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

import type { FeedbackMessageDTO } from '@/types/feedbackMessage';

export default function FeedbackMessages() {
	const { data: session } = useSession();
	const [messages, setMessages] = useState<FeedbackMessageDTO[]>([]);
	const [loading, setLoading] = useState(true);
	const [subject, setSubject] = useState('');
	const [content, setContent] = useState('');
	const [sending, setSending] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

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
				body: JSON.stringify({ subject: subject.trim(), content: content.trim() }),
			});
			const json = (await res.json()) as unknown;
			if (!res.ok || !(typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true)) {
				const errMsg =
					typeof json === 'object' && json !== null && typeof (json as { error?: unknown }).error === 'string'
						? String((json as { error?: unknown }).error)
						: 'Gửi phản hồi thất bại';
				throw new Error(errMsg);
			}
			setSubject('');
			setContent('');
			setSuccess('Phản hồi đã được gửi! Admin sẽ trả lời sớm nhất có thể.');
			setTimeout(() => setSuccess(''), 5000);
			void fetchMessages();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error');
		} finally {
			setSending(false);
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
			<div className="mt-10 border-t border-border pt-10">
				<h2 className="text-xs font-bold uppercase tracking-widest text-muted">Gửi phản hồi</h2>
				<p className="mt-4 text-sm text-muted">
					<Link href="/login" className="font-bold text-accent underline underline-offset-2">
						Đăng nhập
					</Link>{' '}
					để gửi phản hồi trực tiếp đến admin.
				</p>
			</div>
		);
	}

	return (
		<div className="mt-10 border-t border-border pt-10">
			<h2 className="text-xs font-bold uppercase tracking-widest text-muted">Gửi phản hồi</h2>

			{/* Feedback form */}
			<form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
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
					{error && <p className="text-xs text-red-500">{error}</p>}
					{success && <p className="text-xs text-green-600 dark:text-green-400">{success}</p>}
				</div>
			</form>

			{/* Message history */}
			<div className="mt-10">
				<h3 className="text-xs font-bold uppercase tracking-widest text-muted">
					Lịch sử phản hồi {messages.length > 0 ? `(${messages.length})` : ''}
				</h3>

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
							<div
								key={msg.id}
								className="border border-border p-4 transition-colors hover:bg-surface-hover/30"
							>
								{/* Header */}
								<div className="flex items-start justify-between gap-2">
									<div className="min-w-0 flex-1">
										<h4 className="text-sm font-bold text-foreground">{msg.subject}</h4>
										<time className="mt-0.5 block text-xs text-muted">{formatDate(msg.createdAt)}</time>
									</div>
									{statusBadge(msg.status)}
								</div>

								{/* User's message */}
								<p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground-secondary">
									{msg.content}
								</p>

								{/* Admin reply */}
								{msg.adminReply && (
									<div className="mt-4 border-l-2 border-accent pl-4">
										<p className="text-xs font-bold text-accent">Phản hồi từ Admin</p>
										{msg.adminRepliedAt && (
											<time className="mt-0.5 block text-xs text-muted">
												{formatDate(msg.adminRepliedAt)}
											</time>
										)}
										<p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground-secondary">
											{msg.adminReply}
										</p>
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
