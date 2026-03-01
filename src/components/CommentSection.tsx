'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

import type { CommentDTO } from '@/types/comment';

interface CommentSectionProps {
	slug: string;
	postTitle?: string;
}

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

/* ─── Avatar ──────────────────────────────────────────────── */
function Avatar({ src, name, size = 8 }: { src?: string; name: string; size?: number }) {
	const cls = `h-${size} w-${size} shrink-0 rounded-full object-cover`;
	const fallbackCls = `flex h-${size} w-${size} shrink-0 items-center justify-center rounded-full bg-surface-hover text-xs font-bold text-foreground-secondary`;
	return src ? (
		<img src={src} alt={name} className={cls} referrerPolicy="no-referrer" />
	) : (
		<div className={fallbackCls}>{name[0]?.toUpperCase() ?? '?'}</div>
	);
}

/* ─── Inline Reply Form ────────────────────────────────────── */
function ReplyForm({
	slug,
	parentId,
	parentAuthor,
	onSubmitted,
	onCancel,
}: {
	slug: string;
	parentId: string;
	parentAuthor: string;
	onSubmitted: () => void;
	onCancel: () => void;
}) {
	const { data: session } = useSession();
	const [text, setText] = useState('');
	const [posting, setPosting] = useState(false);
	const [error, setError] = useState('');
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		textareaRef.current?.focus();
	}, []);

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		const content = text.trim();
		if (!content || posting) return;
		setPosting(true);
		setError('');
		try {
			const res = await fetch(`/api/posts/${slug}/comments`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content, parentId }),
			});
			const json = (await res.json()) as unknown;
			if (!res.ok || !(typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok)) {
				throw new Error((json as { error?: string }).error ?? 'Gửi thất bại');
			}
			setText('');
			onSubmitted();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Lỗi không xác định');
		} finally {
			setPosting(false);
		}
	}

	if (!session?.user) return null;

	return (
		<form onSubmit={(e) => void submit(e)} className="mt-3 flex items-start gap-2">
			<Avatar src={session.user.image ?? undefined} name={session.user.name ?? '?'} size={7} />
			<div className="flex-1">
				<textarea
					ref={textareaRef}
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder={`Trả lời ${parentAuthor}…`}
					rows={2}
					maxLength={2000}
					className="w-full resize-none border border-border bg-transparent px-3 py-2 text-sm transition-colors placeholder:text-muted focus:border-accent focus:outline-none"
				/>
				{error && <p className="mt-1 text-xs text-error">{error}</p>}
				<div className="mt-2 flex items-center gap-2">
					<button
						type="submit"
						disabled={!text.trim() || posting}
						className="border border-foreground bg-foreground px-3 py-1 text-xs font-bold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground disabled:opacity-40"
					>
						{posting ? 'Đang gửi…' : 'Trả lời'}
					</button>
					<button
						type="button"
						onClick={onCancel}
						className="px-3 py-1 text-xs text-muted hover:text-foreground"
					>
						Hủy
					</button>
				</div>
			</div>
		</form>
	);
}

/* ─── Single Comment Card ─────────────────────────────────── */
function CommentCard({
	comment,
	slug,
	currentUserId,
	isAdmin,
	isReply,
	onRefresh,
}: {
	comment: CommentDTO;
	slug: string;
	currentUserId?: string;
	isAdmin?: boolean;
	isReply?: boolean;
	onRefresh: () => void;
}) {
	const { data: session } = useSession();
	const [showReply, setShowReply] = useState(false);
	const [liking, setLiking] = useState(false);
	const [localLikes, setLocalLikes] = useState(comment.likes);
	const [localLikedByMe, setLocalLikedByMe] = useState(comment.likedByMe);
	const [moderating, setModerating] = useState(false);

	const isPending = comment.status === 'pending';
	const isHidden = comment.status === 'hidden';
	const isMine = currentUserId === comment.userId;

	async function handleLike() {
		if (!session?.user || liking) return;
		setLiking(true);
		const next = !localLikedByMe;
		setLocalLikedByMe(next);
		setLocalLikes((v) => (next ? v + 1 : Math.max(0, v - 1)));
		try {
			const res = await fetch(`/api/posts/${slug}/comments`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ commentId: comment.id }),
			});
			const json = (await res.json()) as unknown;
			if (typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true) {
				const data = (json as { data?: { likes?: number; likedByMe?: boolean } }).data;
				if (data) {
					setLocalLikes(data.likes ?? localLikes);
					setLocalLikedByMe(data.likedByMe ?? localLikedByMe);
				}
			}
		} catch {
			setLocalLikedByMe(!next);
			setLocalLikes((v) => (!next ? v + 1 : Math.max(0, v - 1)));
		} finally {
			setLiking(false);
		}
	}

	async function handleModerate(action: 'approve' | 'hide' | 'delete') {
		if (moderating) return;
		setModerating(true);
		try {
			await fetch('/api/admin/comments', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ commentId: comment.id, action }),
			});
			onRefresh();
		} catch {
			/* ignore */
		} finally {
			setModerating(false);
		}
	}

	async function handleDelete() {
		if (moderating) return;
		if (!confirm('Xóa bình luận này?')) return;
		setModerating(true);
		try {
			await fetch(`/api/posts/${slug}/comments`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ commentId: comment.id, action: 'delete' }),
			});
			onRefresh();
		} catch {
			/* ignore */
		} finally {
			setModerating(false);
		}
	}

	return (
		<div className={`${isReply ? '' : ''} ${isPending || isHidden ? 'opacity-80' : ''}`}>
			<div className="flex items-start gap-3">
				<Avatar src={comment.userImage} name={comment.userName} size={isReply ? 7 : 8} />
				<div className="min-w-0 flex-1">
					{/* Header */}
					<div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
						<span className="text-sm font-bold text-foreground">{comment.userName}</span>
					<time className="text-xs text-muted" title={formatDate(comment.createdAt)}>
						{timeAgo(comment.createdAt)}
					</time>
						{/* Status badges */}
						{isPending && (
							<span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
								<span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
								Chờ duyệt
							</span>
						)}
						{isHidden && (
							<span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
								<span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
								Ẩn
							</span>
						)}
					</div>

					{/* Content */}
					<p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground-secondary">
						{comment.content}
					</p>

					{/* Actions row */}
					<div className="mt-2 flex flex-wrap items-center gap-3">
						{/* Like */}
						<button
							onClick={() => void handleLike()}
							disabled={liking || !session?.user}
							title={session?.user ? (localLikedByMe ? 'Bỏ thích' : 'Thích') : 'Đăng nhập để thích'}
							className={`group inline-flex items-center gap-1.5 text-xs transition-colors ${
								localLikedByMe ? 'font-bold text-accent' : 'text-muted hover:text-accent disabled:hover:text-muted'
							}`}
						>
							<svg
								className={`h-3.5 w-3.5 transition-transform ${localLikedByMe ? 'scale-110' : 'group-hover:scale-110'}`}
								viewBox="0 0 24 24"
								fill={localLikedByMe ? 'currentColor' : 'none'}
								stroke="currentColor"
								strokeWidth={2}
							>
								<path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
							</svg>
							{localLikes > 0 && <span>{localLikes}</span>}
						</button>

						{/* Reply — only for approved top-level comments, logged-in users */}
						{!isReply && !isPending && !isHidden && session?.user && (
							<button
								onClick={() => setShowReply((v) => !v)}
								className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-foreground"
							>
								<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
								</svg>
								Trả lời
							</button>
						)}

						{/* Admin moderation controls */}
						{isAdmin && (
							<>
								{isPending && (
									<button
										onClick={() => void handleModerate('approve')}
										disabled={moderating}
										className="inline-flex items-center gap-1 text-xs font-bold text-green-600 transition-colors hover:text-green-700 disabled:opacity-40 dark:text-green-400"
									>
										<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
										</svg>
										Duyệt
									</button>
								)}
								{!isHidden && (
									<button
										onClick={() => void handleModerate('hide')}
										disabled={moderating}
										className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-40"
									>
										<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
										</svg>
										Ẩn
									</button>
								)}
								{isHidden && (
									<button
										onClick={() => void handleModerate('approve')}
										disabled={moderating}
										className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-40"
									>
										<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
											<path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
										</svg>
										Hiện lại
									</button>
								)}
								<button
									onClick={() => void handleModerate('delete')}
									disabled={moderating}
									className="inline-flex items-center gap-1 text-xs text-error transition-colors hover:opacity-80 disabled:opacity-40"
								>
									<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
									</svg>
									Xóa
								</button>
							</>
						)}

						{/* User self-delete (own pending comment) */}
						{!isAdmin && isMine && (
							<button
								onClick={() => void handleDelete()}
								disabled={moderating}
								className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-error disabled:opacity-40"
							>
								<svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
								</svg>
								Xóa
							</button>
						)}
					</div>

					{/* Inline reply form */}
					{showReply && (
						<ReplyForm
							slug={slug}
							parentId={comment.id}
							parentAuthor={comment.userName}
							onSubmitted={() => { setShowReply(false); onRefresh(); }}
							onCancel={() => setShowReply(false)}
						/>
					)}
				</div>
			</div>

			{/* Nested replies */}
			{comment.replies && comment.replies.length > 0 && (
				<div className="ml-11 mt-3 space-y-3 border-l-2 border-border pl-4">
					{comment.replies.map((reply) => (
						<CommentCard
							key={reply.id}
							comment={reply}
							slug={slug}
							currentUserId={currentUserId}
							isAdmin={isAdmin}
							isReply
							onRefresh={onRefresh}
						/>
					))}
				</div>
			)}
		</div>
	);
}

/* ─── Main Component ──────────────────────────────────────── */
export default function CommentSection({ slug, postTitle }: CommentSectionProps) {
	const { data: session } = useSession();
	const [comments, setComments] = useState<CommentDTO[]>([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [newComment, setNewComment] = useState('');
	const [posting, setPosting] = useState(false);
	const [error, setError] = useState('');
	const [showLoginHint, setShowLoginHint] = useState(false);
	const [justPosted, setJustPosted] = useState(false);

	const isAdmin = session?.user?.role === 'admin';

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
		setJustPosted(false);

		try {
			const res = await fetch(`/api/posts/${slug}/comments`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content, postTitle }),
			});
			const json = (await res.json()) as unknown;
			if (!res.ok || !(typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true)) {
				throw new Error((json as { error?: string }).error ?? 'Gửi thất bại');
			}
			setNewComment('');
			setJustPosted(true);
			void fetchComments();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Lỗi không xác định');
		} finally {
			setPosting(false);
		}
	}

	return (
		<section>
			<div className="flex items-baseline gap-2">
				<h2 className="text-xs font-bold uppercase tracking-widest text-muted">
					Bình luận {total > 0 ? `(${total})` : ''}
				</h2>
				{isAdmin && comments.some((c) => c.status === 'pending') && (
					<Link
						href="/admin/posts/comments"
						className="text-[10px] font-bold text-amber-600 hover:underline dark:text-amber-400"
					>
						({comments.filter((c) => c.status === 'pending').length} chờ duyệt)
					</Link>
				)}
			</div>

			{/* Comment form */}
			{session?.user ? (
				<form onSubmit={(e) => void handleSubmit(e)} className="mt-6">
					<div className="flex items-start gap-3">
						<Avatar src={session.user.image ?? undefined} name={session.user.name ?? '?'} size={8} />
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
					{error && <p className="mt-2 text-xs text-error">{error}</p>}
					{justPosted && (
						<p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
							Bình luận đã gửi — đang chờ admin duyệt trước khi hiển thị công khai.
						</p>
					)}
				</form>
			) : (
				<div className="mt-6">
					<button
						type="button"
						onClick={() => { setShowLoginHint(true); setTimeout(() => setShowLoginHint(false), 4000); }}
						className="w-full rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
					>
						Viết bình luận…
					</button>
					{showLoginHint && (
						<p className="mt-2 text-xs text-muted">
							Hãy{' '}
							<Link href="/login" className="font-bold text-accent underline underline-offset-2">
								đăng nhập
							</Link>{' '}
							để bình luận.
						</p>
					)}
				</div>
			)}

			{/* Comments list */}
			<div className="mt-8 space-y-5 divide-y divide-border">
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
						<div key={c.id} className="pt-5 first:pt-0">
							<CommentCard
								comment={c}
								slug={slug}
								currentUserId={session?.user?.id}
								isAdmin={isAdmin}
								onRefresh={() => void fetchComments()}
							/>
						</div>
					))
				)}
			</div>
		</section>
	);
}

