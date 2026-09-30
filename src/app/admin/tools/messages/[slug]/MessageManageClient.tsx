'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { useAdminConfirm } from '@/components/admin/useAdminConfirm';
import { adminFetch } from '@/lib/admin/client';
import MusicTrackSelect from '@/components/MusicTrackSelect';
import QrCodePanel from '@/components/QrCodePanel';
import ThumbnailUpload from '@/components/ThumbnailUpload';
import { routes } from '@/config/routes';
import { DEFAULT_DISPLAY_FONT } from '@/constants/message';
import type { MessageDetailDTO } from '@/types/message';

const MessageEditorWithFont = dynamic(() => import('@/components/MessageEditorWithFont'), {
	ssr: false,
});

interface MessageManageClientProps {
	message: MessageDetailDTO;
	publicUrl: string;
}

async function uploadImage(file: File): Promise<string> {
	const fd = new FormData();
	fd.append('file', file);
	const data = await adminFetch<{ url?: string }>('/api/messages/upload', {
		method: 'POST',
		body: fd,
	});
	if (!data?.url) {
		throw new Error('Upload failed');
	}
	return data.url;
}

export default function MessageManageClient({ message, publicUrl }: MessageManageClientProps) {
	const router = useRouter();
	const { confirm, dialog } = useAdminConfirm();
	const [title, setTitle] = useState(message.title);
	const [recipientName, setRecipientName] = useState(message.recipientName);
	const [displayFont, setDisplayFont] = useState(message.displayFont ?? DEFAULT_DISPLAY_FONT);
	const [content, setContent] = useState(message.content);
	const [coverImageUrl, setCoverImageUrl] = useState(message.coverImageUrl ?? '');
	const [musicTrack, setMusicTrack] = useState(message.musicTrack ?? '');
	const [usePassword, setUsePassword] = useState(message.hasPassword);
	const [password, setPassword] = useState('');
	const [expiresAt, setExpiresAt] = useState(
		message.expiresAt ? message.expiresAt.slice(0, 10) : '',
	);
	const [isPublished, setIsPublished] = useState(message.isPublished);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');
	const [showEdit, setShowEdit] = useState(false);

	const onSave = useCallback(async () => {
		if (usePassword && password && !/^\d{8}$/.test(password)) {
			setError('Mật khẩu mới phải gồm đúng 8 chữ số');
			return;
		}

		setSaving(true);
		setError('');
		try {
			const body: Record<string, unknown> = {
				title,
				recipientName,
				displayFont,
				content,
				coverImageUrl: coverImageUrl || null,
				musicTrack: musicTrack || null,
				isPublished,
				expiresAt: expiresAt || null,
			};

			if (!usePassword) {
				body.password = null;
			} else if (password) {
				body.password = password;
			}

			await adminFetch(`/api/messages/${message.slug}`, {
				method: 'PUT',
				body: JSON.stringify(body),
			});
			setShowEdit(false);
			setPassword('');
			router.refresh();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Lỗi không xác định');
		} finally {
			setSaving(false);
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
		message.slug,
		router,
	]);

	const onDelete = async () => {
		const ok = await confirm({
			title: 'Xóa lời nhắn',
			description: 'Xóa lời nhắn này? Hành động không thể hoàn tác.',
			confirmLabel: 'Xóa',
		});
		if (!ok) return;
		await adminFetch(`/api/messages/${message.slug}`, { method: 'DELETE' });
		router.push(routes.admin.messages);
	};

	return (
		<>
			<div className="mx-auto max-w-4xl space-y-10 px-6 py-8">
				<section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
					<h2 className="text-center text-sm font-bold uppercase tracking-wider text-muted">
						Mã QR
					</h2>
					<div className="mt-6">
						<QrCodePanel url={publicUrl} title={`message-${message.slug}`} />
					</div>
					<div className="mt-6 flex justify-center">
						<Link
							href={`/m/${message.slug}`}
							target="_blank"
							className="text-sm font-medium text-accent hover:underline"
						>
							Xem trước như người nhận →
						</Link>
					</div>
				</section>

				<section className="rounded-2xl border border-border bg-surface p-6">
					<div className="flex items-center justify-between gap-4">
						<h2 className="text-sm font-bold uppercase tracking-wider text-muted">
							Chỉnh sửa lời nhắn
						</h2>
						<button
							type="button"
							onClick={() => setShowEdit((v) => !v)}
							className="text-sm font-medium text-accent hover:underline"
						>
							{showEdit ? 'Đóng' : 'Mở chỉnh sửa'}
						</button>
					</div>

					{showEdit && (
						<div className="mt-6 space-y-6">
							{error && (
								<p className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
									{error}
								</p>
							)}

							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<label className="text-xs font-semibold uppercase tracking-wider text-muted">
										Tên người nhận
									</label>
									<input
										type="text"
										value={recipientName}
										onChange={(e) => setRecipientName(e.target.value)}
										className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground outline-none focus:border-accent"
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
										className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-lg font-semibold text-foreground outline-none focus:border-accent"
									/>
								</div>
							</div>

							<ThumbnailUpload
								value={coverImageUrl}
								onChange={setCoverImageUrl}
								uploadEndpoint="/api/messages/upload"
							/>

							<MessageEditorWithFont
								content={content}
								onChange={setContent}
								onImageUpload={uploadImage}
								displayFont={displayFont}
								onFontChange={setDisplayFont}
								placeholder="Viết lời nhắn..."
							/>

							<MusicTrackSelect value={musicTrack} onChange={setMusicTrack} />

							<div className="grid gap-6 sm:grid-cols-2">
								<input
									type="date"
									value={expiresAt}
									onChange={(e) => setExpiresAt(e.target.value)}
									className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm"
								/>
								<label className="flex items-center gap-3 self-center">
									<input
										type="checkbox"
										checked={isPublished}
										onChange={(e) => setIsPublished(e.target.checked)}
									/>
									<span className="text-sm">Xuất bản</span>
								</label>
							</div>

							<div className="rounded-xl border border-border p-4">
								<label className="flex items-center gap-3">
									<input
										type="checkbox"
										checked={usePassword}
										onChange={(e) => setUsePassword(e.target.checked)}
									/>
									<span className="text-sm font-medium">Bảo vệ bằng mã 8 chữ số</span>
								</label>
								{usePassword && (
									<input
										type="text"
										inputMode="numeric"
										maxLength={8}
										value={password}
										onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 8))}
										placeholder={
											message.hasPassword ? 'Nhập mã mới (để trống = giữ mã cũ)' : '12345678'
										}
										className="mt-3 w-full max-w-xs rounded-xl border border-border px-4 py-2.5 text-center text-lg font-bold tracking-[0.3em]"
									/>
								)}
							</div>

							<div className="flex flex-wrap gap-3">
								<button
									type="button"
									onClick={() => void onSave()}
									disabled={saving}
									className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
								>
									{saving ? 'Đang lưu...' : 'Lưu thay đổi'}
								</button>
								<button
									type="button"
									onClick={() => void onDelete()}
									className="rounded-xl border border-error/30 px-5 py-2.5 text-sm font-medium text-error"
								>
									Xóa lời nhắn
								</button>
							</div>
						</div>
					)}
				</section>
			</div>
			{dialog}
		</>
	);
}
