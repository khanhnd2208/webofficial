'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

import type { CommentDTO } from '@/types/comment';

interface CommentSectionProps {
	slug: string;
}

export default function CommentSection({ slug }: CommentSectionProps) {
	const { data: session } = useSession();
	const [comments, setComments] = useState<CommentDTO[]>([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [newComment, setNewComment] = useState('');
	const [posting, setPosting] = useState(false);
	const [error, setError] = useState('');
	const [likingIds, setLikingIds] = useState<Set<string>>(new Set());

	const fetchComments = useCallback(async () => {
		try {
			const res = await fetch(`/api/posts/${slug}/comments`);
			const json = (await res.json()) as unknown;
			if (typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true) {
				const data = (json as { data?: { items?: CommentDTO[]; total?: number } }).data;
				if (data?.items) setComments(data.items);
				if (typeof data?.total === 'number') setTotal(data.total);
			}
		} catch {
			/* ignore */
		} finally {
			setLoading(false);
		}
	}, [slug]);

	useEffect(() => {
		void fetchComments();
	}, [fetchComments]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const content = newComment.trim();
		if (!content || posting) return;

		setPosting(true);
		setError('');

		try {
			const res = await fetch(`/api/posts/${slug}/comments`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content }),
			});
			const json = (await res.json()) as unknown;
			if (!res.ok || !(typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true)) {
				const message =
					typeof json === 'object' && json !== null && typeof (json as { error?: unknown }).error === 'string'
						? String((json as { error?: unknown }).error)
						: 'Failed to post comment';
				throw new Error(message);
			}
			setNewComment('');
			void fetchComments();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error');
		} finally {
			setPosting(false);
		}
	}

	async function handleLike(commentId: string) {
		if (!session?.user || likingIds.has(commentId)) return;

		setLikingIds((prev) => new Set(prev).add(commentId));

		// Optimistic update
		setComments((prev) =>
			prev.map((c) => {
				if (c.id !== commentId) return c;
				const newLiked = !c.likedByMe;
				return { ...c, likedByMe: newLiked, likes: newLiked ? c.likes + 1 : Math.max(0, c.likes - 1) };
			})
		);

		try {
			const res = await fetch(`/api/posts/${slug}/comments`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ commentId }),
			});
			const json = (await res.json()) as unknown;
			if (typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true) {
				const data = (json as { data?: { likes?: number; likedByMe?: boolean } }).data;
				if (data) {
					setComments((prev) =>
						prev.map((c) =>
							c.id === commentId
								? { ...c, likes: data.likes ?? c.likes, likedByMe: data.likedByMe ?? c.likedByMe }
								: c
						)
					);
				}
			}
		} catch {
			// Revert optimistic update on error
			setComments((prev) =>
				prev.map((c) => {
					if (c.id !== commentId) return c;
					const reverted = !c.likedByMe;
					return { ...c, likedByMe: reverted, likes: reverted ? c.likes + 1 : Math.max(0, c.likes - 1) };
				})
			);
		} finally {
			setLikingIds((prev) => {
				const next = new Set(prev);
				next.delete(commentId);
				return next;
			});
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

	function timeAgo(iso: string): string {
		const diff = Date.now() - new Date(iso).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'vừa xong';
		if (mins < 60) return `${mins} phút trước`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours} giờ trước`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `${days} ngày trước`;
		return formatDate(iso);
	}

	return (
		<section>
			<h2 className="text-xs font-bold uppercase tracking-widest text-muted">
				Bình luận {total > 0 ? `(${total})` : ''}
			</h2>

			{/* Comment form */}
			{session?.user ? (
				<form onSubmit={(e) => void handleSubmit(e)} className="mt-6">
					<div className="flex items-start gap-3">
						{session.user.image ? (
							<img
								src={session.user.image}
								alt={session.user.name ?? ''}
								className="h-8 w-8 shrink-0 rounded-full object-cover"
							/>
						) : (
							<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
								{(session.user.name ?? '?')[0].toUpperCase()}
							</div>
						)}
						<div className="flex-1">
							<textarea
								value={newComment}
								onChange={(e) => setNewComment(e.target.value)}
								placeholder="Viết bình luận…"
								rows={3}
								maxLength={2000}
								className="w-full resize-none border border-border bg-transparent px-3 py-2.5 text-sm transition-colors placeholder:text-muted focus:border-accent focus:outline-none"
							/>
							<div className="mt-2 flex items-center justify-between">
								<span className="text-xs text-muted">{newComment.length}/2000</span>
								<button
									type="submit"
									disabled={!newComment.trim() || posting}
									className="border-2 border-foreground bg-foreground px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground disabled:opacity-40"
								>
									{posting ? 'Đang gửi…' : 'Gửi'}
								</button>
							</div>
						</div>
					</div>
					{error ? <p className="mt-2 text-xs text-error">{error}</p> : null}
				</form>
			) : (
				<p className="mt-6 text-sm text-muted">
					Hãy{' '}
					<a href="/login" className="font-bold text-accent underline underline-offset-2">
						đăng nhập
					</a>{' '}
					để bình luận.
				</p>
			)}

			{/* Comments list — sorted by most liked */}
			<div className="mt-8 space-y-0 divide-y divide-border">
				{loading ? (
					<div className="flex items-center gap-2 py-6 text-sm text-muted">
						<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
							<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
							<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
						</svg>
						Đang tải bình luận…
					</div>
				) : comments.length === 0 ? (
					<p className="py-6 text-sm text-muted">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
				) : (
					comments.map((c) => (
						<article key={c.id} className="flex items-start gap-3 py-5">
							{c.userImage ? (
								<img
									src={c.userImage}
									alt={c.userName}
									className="h-8 w-8 shrink-0 rounded-full object-cover"
								/>
							) : (
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-hover text-xs font-bold text-foreground-secondary">
									{c.userName[0]?.toUpperCase() ?? '?'}
								</div>
							)}
							<div className="min-w-0 flex-1">
								<div className="flex items-baseline gap-2">
									<span className="text-sm font-bold text-foreground">{c.userName}</span>
									<time className="text-xs text-muted" title={formatDate(c.createdAt)}>
										{timeAgo(c.createdAt)}
									</time>
								</div>
								<p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground-secondary">
									{c.content}
								</p>
								{/* Like button */}
								<div className="mt-2">
									<button
										onClick={() => void handleLike(c.id)}
										disabled={!session?.user || likingIds.has(c.id)}
										className={`group inline-flex items-center gap-1.5 text-xs transition-colors ${
											c.likedByMe
												? 'font-bold text-accent'
												: 'text-muted hover:text-accent disabled:hover:text-muted'
										}`}
										title={session?.user ? (c.likedByMe ? 'Bỏ thích' : 'Thích') : 'Đăng nhập để thích'}
									>
										<svg
											className={`h-3.5 w-3.5 transition-transform ${c.likedByMe ? 'scale-110' : 'group-hover:scale-110'}`}
											viewBox="0 0 24 24"
											fill={c.likedByMe ? 'currentColor' : 'none'}
											stroke="currentColor"
											strokeWidth={2}
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
											/>
										</svg>
										{c.likes > 0 ? (
											<span>{c.likes}</span>
										) : null}
									</button>
								</div>
							</div>
						</article>
					))
				)}
			</div>
		</section>
	);
}
