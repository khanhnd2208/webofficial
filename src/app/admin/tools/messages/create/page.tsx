'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import MusicTrackSelect from '@/components/MusicTrackSelect';
import ThumbnailUpload from '@/components/ThumbnailUpload';
import { routes } from '@/config/routes';
import { DEFAULT_DISPLAY_FONT } from '@/constants/message';
import { adminFetch } from '@/lib/admin/client';

const MessageEditorWithFont = dynamic(() => import('@/components/MessageEditorWithFont'), { ssr: false });

const DRAFT_KEY = 'message-draft-create-v3';

type SaveState =
	| { status: 'idle' }
	| { status: 'saving' }
	| { status: 'saved'; slug: string }
	| { status: 'error'; message: string };

interface DraftData {
	title: string;
	recipientName: string;
	displayFont: string;
	content: string;
	coverImageUrl: string;
	musicTrack: string;
	usePassword: boolean;
	password: string;
	expiresAt: string;
	isPublished: boolean;
	savedAt: number;
}

function htmlToPlainText(html: string): string {
	return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function uploadImage(file: File): Promise<string> {
	const fd = new FormData();
	fd.append('file', file);
	const data = await adminFetch<{ url?: string }>('/api/messages/upload', { method: 'POST', body: fd });
	if (!data?.url) throw new Error('Upload failed');
	return data.url;
}

export default function CreateMessagePage() {
	const router = useRouter();
	const [title, setTitle] = useState('');
	const [recipientName, setRecipientName] = useState('');
	const [displayFont, setDisplayFont] = useState(DEFAULT_DISPLAY_FONT);
	const [content, setContent] = useState('');
	const [coverImageUrl, setCoverImageUrl] = useState('');
	const [musicTrack, setMusicTrack] = useState('');
	const [usePassword, setUsePassword] = useState(false);
	const [password, setPassword] = useState('');
	const [expiresAt, setExpiresAt] = useState('');
	const [isPublished, setIsPublished] = useState(true);
	const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' });
	const [draftRestored, setDraftRestored] = useState(false);
	const isSavingRef = useRef(false);

	const plainText = useMemo(() => htmlToPlainText(content), [content]);

	useEffect(() => {
		try {
			const raw = localStorage.getItem(DRAFT_KEY);
			if (!raw) return;
			const draft = JSON.parse(raw) as DraftData;
			if (Date.now() - draft.savedAt > 7 * 24 * 60 * 60 * 1000) {
				localStorage.removeItem(DRAFT_KEY);
				return;
			}
			setTitle(draft.title || '');
			setRecipientName(draft.recipientName || '');
			setDisplayFont(draft.displayFont || DEFAULT_DISPLAY_FONT);
			setContent(draft.content || '');
			setCoverImageUrl(draft.coverImageUrl || '');
			setMusicTrack(draft.musicTrack || '');
			setUsePassword(draft.usePassword || false);
			setPassword(draft.password || '');
			setExpiresAt(draft.expiresAt || '');
			setIsPublished(draft.isPublished ?? true);
			setDraftRestored(true);
		} catch {
			/* ignore */
		}
	}, []);

	useEffect(() => {
		if (saveState.status === 'saved') return;
		const timer = setTimeout(() => {
			if (!title.trim() && plainText.length < 10) return;
			const draft: DraftData = {
				title,
				recipientName,
				displayFont,
				content,
				coverImageUrl,
				musicTrack,
				usePassword,
				password,
				expiresAt,
				isPublished,
				savedAt: Date.now(),
			};
			try {
				localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
			} catch {
				/* ignore */
			}
		}, 5000);
		return () => clearTimeout(timer);
	}, [
		title,
		recipientName,
		displayFont,
		content,
		coverImageUrl,
		musicTrack,
		usePassword,
		password,
		expiresAt,
		isPublished,
		plainText,
		saveState.status,
	]);

	const onSave = useCallback(async () => {
		if (isSavingRef.current) return;
		if (!title.trim()) {
			setSaveState({ status: 'error', message: 'Vui lòng nhập tiêu đề lời nhắn' });
			return;
		}
		if (!recipientName.trim()) {
			setSaveState({ status: 'error', message: 'Vui lòng nhập tên người nhận' });
			return;
		}
		if (!content.trim()) {
			setSaveState({ status: 'error', message: 'Vui lòng nhập nội dung' });
			return;
		}
		if (usePassword && !/^\d{8}$/.test(password)) {
			setSaveState({ status: 'error', message: 'Mật khẩu phải gồm đúng 8 chữ số' });
			return;
		}

		isSavingRef.current = true;
		setSaveState({ status: 'saving' });
		try {
			const created = await adminFetch<{ slug?: string }>('/api/messages', {
				method: 'POST',
				body: JSON.stringify({
					title,
					recipientName,
					displayFont,
					content,
					coverImageUrl: coverImageUrl || undefined,
					musicTrack: musicTrack || undefined,
					password: usePassword ? password : undefined,
					expiresAt: expiresAt || undefined,
					isPublished,
				}),
			});
			if (!created?.slug) {
				throw new Error('Không tạo được lời nhắn');
			}
			localStorage.removeItem(DRAFT_KEY);
			setSaveState({ status: 'saved', slug: created.slug });
			router.push(routes.admin.messageEdit(created.slug));
		} catch (e) {
			setSaveState({ status: 'error', message: e instanceof Error ? e.message : 'Lỗi không xác định' });
		} finally {
			isSavingRef.current = false;
		}
	}, [
		title,
		recipientName,
		displayFont,
		content,
		coverImageUrl,
		musicTrack,
		usePassword,
		password,
		expiresAt,
		isPublished,
		router,
	]);

	useEffect(() => {
		function handleSave(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === 's') {
				e.preventDefault();
				void onSave();
			}
		}
		window.addEventListener('keydown', handleSave);
		return () => window.removeEventListener('keydown', handleSave);
	}, [onSave]);

	return (
		<div className="min-h-screen pb-20">
			<div className="border-b border-border">
				<div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-6">
					<div>
						<Link href={routes.admin.messages} className="text-xs text-muted hover:text-foreground">
							← Quay lại
						</Link>
						<h1 className="mt-1 text-xl font-bold text-foreground">Tạo lời nhắn mới</h1>
					</div>
					<button
						type="button"
						onClick={() => void onSave()}
						disabled={saveState.status === 'saving'}
						className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
					>
						{saveState.status === 'saving' ? 'Đang lưu...' : 'Lưu & tạo QR'}
					</button>
				</div>
			</div>

			<div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
				{draftRestored && (
					<p className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-foreground-secondary">
						Đã khôi phục bản nháp từ lần trước.
					</p>
				)}

				{saveState.status === 'error' && (
					<p className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
						{saveState.message}
					</p>
				)}

				<section className="grid gap-4 sm:grid-cols-2">
					<div>
						<label className="text-xs font-semibold uppercase tracking-wider text-muted">
							Tên người nhận
						</label>
						<input
							type="text"
							value={recipientName}
							onChange={(e) => setRecipientName(e.target.value)}
							placeholder="Minh, Lan, ..."
							className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
						/>
					</div>
					<div>
						<label className="text-xs font-semibold uppercase tracking-wider text-muted">
							Tiêu đề lời nhắn
						</label>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Gửi đến người thương..."
							className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-lg font-semibold text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
						/>
					</div>
				</section>

				<section>
					<ThumbnailUpload
						value={coverImageUrl}
						onChange={setCoverImageUrl}
						uploadEndpoint="/api/messages/upload"
					/>
				</section>

				<section>
					<label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-muted">
						Nội dung lời nhắn
					</label>
					<MessageEditorWithFont
						content={content}
						onChange={setContent}
						onImageUpload={uploadImage}
						displayFont={displayFont}
						onFontChange={setDisplayFont}
						placeholder="Viết lời nhắn của bạn..."
					/>
				</section>

				<section>
					<MusicTrackSelect value={musicTrack} onChange={setMusicTrack} />
				</section>

				<section className="grid gap-6 sm:grid-cols-2">
					<div>
						<label className="text-xs font-semibold uppercase tracking-wider text-muted">
							Ngày hết hạn (tùy chọn)
						</label>
						<input
							type="date"
							value={expiresAt}
							onChange={(e) => setExpiresAt(e.target.value)}
							className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
						/>
					</div>

					<label className="flex items-center gap-3 self-end rounded-xl border border-border bg-surface px-4 py-3">
						<input
							type="checkbox"
							checked={isPublished}
							onChange={(e) => setIsPublished(e.target.checked)}
							className="h-4 w-4 rounded border-border text-accent"
						/>
						<span className="text-sm text-foreground">Xuất bản ngay (cho phép quét QR)</span>
					</label>
				</section>

				<section className="rounded-2xl border border-border bg-surface-secondary/30 p-5">
					<label className="flex items-center gap-3">
						<input
							type="checkbox"
							checked={usePassword}
							onChange={(e) => setUsePassword(e.target.checked)}
							className="h-4 w-4 rounded border-border text-accent"
						/>
						<span className="text-sm font-medium text-foreground">Bảo vệ bằng mã 8 chữ số</span>
					</label>
					{usePassword && (
						<input
							type="text"
							inputMode="numeric"
							maxLength={8}
							value={password}
							onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 8))}
							placeholder="12345678"
							className="mt-3 w-full max-w-xs rounded-xl border border-border bg-surface px-4 py-2.5 text-center text-lg font-bold tracking-[0.3em] text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
						/>
					)}
				</section>
			</div>
		</div>
	);
}
