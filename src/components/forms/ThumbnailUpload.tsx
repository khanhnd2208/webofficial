'use client';

import { Icon } from '@/components/ui/Icon';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';

const ImageCropModal = dynamic(() => import('./ImageCropModal'), { ssr: false });

interface ThumbnailUploadProps {
	value: string;
	onChange: (url: string) => void;
	uploadEndpoint?: string;
	variant?: 'default' | 'product';
	/** Lets a form keep its save button off until the file has a URL. */
	onUploadingChange?: (uploading: boolean) => void;
}

async function uploadFileToServer(file: File, endpoint = '/api/uploads'): Promise<string> {
	const fd = new FormData();
	fd.append('file', file);
	const res = await fetch(endpoint, { method: 'POST', body: fd });
	const json = (await res.json()) as unknown;
	const ok = typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true;
	if (!res.ok || !ok) {
		const message =
			typeof json === 'object' &&
			json !== null &&
			typeof (json as { error?: unknown }).error === 'string'
				? String((json as { error?: unknown }).error)
				: `HTTP ${res.status}`;
		throw new Error(message);
	}
	const data = (json as { data?: unknown }).data;
	const url =
		typeof data === 'object' && data !== null && typeof (data as { url?: unknown }).url === 'string'
			? String((data as { url?: unknown }).url)
			: '';
	if (!url) throw new Error('Upload failed');
	return url;
}

export default function ThumbnailUpload({
	value,
	onChange,
	uploadEndpoint = '/api/uploads',
	variant = 'default',
	onUploadingChange,
}: ThumbnailUploadProps) {
	const product = variant === 'product';
	const [uploading, setUploading] = useState(false);
	const [dragActive, setDragActive] = useState(false);
	const [error, setError] = useState('');
	const [cropSrc, setCropSrc] = useState<string | null>(null);
	const fileRef = useRef<HTMLInputElement>(null);
	const returnFocusRef = useRef<HTMLElement | null>(null);
	const restoreFocusRef = useRef(false);

	const closeCrop = useCallback(() => {
		restoreFocusRef.current = true;
		setCropSrc((current) => {
			if (current) URL.revokeObjectURL(current);
			return null;
		});
	}, []);

	useEffect(() => {
		if (cropSrc !== null || !restoreFocusRef.current) return;
		restoreFocusRef.current = false;
		returnFocusRef.current?.focus();
	}, [cropSrc]);

	function rememberFocus(target: EventTarget | null) {
		if (target instanceof HTMLElement) returnFocusRef.current = target;
	}

	function openPicker(target: EventTarget | null) {
		rememberFocus(target);
		fileRef.current?.click();
	}

	const openCrop = useCallback((file: File) => {
		if (!file.type.startsWith('image/')) {
			setError('Chỉ hỗ trợ upload hình ảnh.');
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			setError('Kích thước tối đa 10MB.');
			return;
		}
		setError('');
		setCropSrc((current) => {
			if (current) URL.revokeObjectURL(current);
			return URL.createObjectURL(file);
		});
	}, []);

	const onCropDone = useCallback(
		async (croppedFile: File) => {
			closeCrop();
			setUploading(true);
			onUploadingChange?.(true);
			setError('');
			try {
				const url = await uploadFileToServer(croppedFile, uploadEndpoint);
				onChange(url);
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Upload thất bại');
			} finally {
				setUploading(false);
				onUploadingChange?.(false);
			}
		},
		[closeCrop, onChange, onUploadingChange, uploadEndpoint],
	);

	function onDrop(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault();
		setDragActive(false);
		rememberFocus(e.currentTarget);
		const file = e.dataTransfer.files[0];
		if (file) openCrop(file);
	}

	function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) openCrop(file);
		e.target.value = '';
	}

	return (
		<div>
			<div
				className={
					product
						? 'text-sm font-bold text-ink'
						: 'text-xs font-semibold uppercase tracking-wider text-muted'
				}
			>
				{product ? 'Ảnh bìa khóa học' : 'Thumbnail'}
			</div>
			{product ? <p className="mc-meta mt-1">Tỉ lệ 16:9, đề xuất 1280 × 720px.</p> : null}
			<input
				ref={fileRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={onFileChange}
				disabled={uploading}
				aria-label="Chọn tệp ảnh"
			/>

			{value ? (
				<div className="mt-2">
					<div
						className={`group relative overflow-hidden border border-border ${product ? 'rounded-[var(--mc-r-md)]' : 'rounded-xl'}`}
					>
						<img
							src={value}
							alt={product ? 'Xem trước ảnh bìa khóa học' : 'Thumbnail preview'}
							className={`${product ? 'aspect-video' : 'aspect-2/1'} w-full object-cover`}
						/>
						{/* Overlay actions */}
						<div
							className={`absolute inset-0 flex items-center justify-center gap-2 bg-black/50 transition-opacity ${uploading ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100'}`}
						>
							{uploading ? (
								<span
									role="status"
									className="inline-flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 text-xs font-bold text-black"
								>
									<Icon name="retry" className="h-4 w-4 animate-spin" />
									Đang tải ảnh…
								</span>
							) : (
								<>
									<button
										type="button"
										onClick={(event) => openPicker(event.currentTarget)}
										className="min-h-11 rounded-lg bg-white/90 px-3 text-xs font-bold text-black shadow transition-colors hover:bg-white"
									>
										Đổi ảnh
									</button>
									<button
										type="button"
										onClick={() => onChange('')}
										className="min-h-11 rounded-lg bg-red-500/90 px-3 text-xs font-bold text-white shadow transition-colors hover:bg-red-600"
									>
										Xoá
									</button>
								</>
							)}
						</div>
					</div>
					<div className="mt-1.5">
						<input
							value={value}
							onChange={(e) => onChange(e.target.value)}
							className={`w-full border border-border bg-transparent px-3 text-xs text-muted outline-none focus:border-accent ${product ? 'min-h-11 rounded-[var(--mc-r-sm)]' : 'py-1.5 rounded-md'}`}
							placeholder="URL"
						/>
					</div>
				</div>
			) : (
				<div
					className={`mt-2 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed p-8 transition-colors ${product ? 'rounded-[var(--mc-r-md)]' : 'rounded-xl'} ${
						dragActive
							? `border-accent ${product ? 'bg-surface-sunken' : 'bg-accent-subtle'}`
							: 'border-border hover:border-accent/50'
					} ${uploading ? 'pointer-events-none opacity-60' : ''}`}
					onClick={(event) => openPicker(event.currentTarget)}
					onDragOver={(e) => {
						e.preventDefault();
						setDragActive(true);
					}}
					onDragLeave={() => setDragActive(false)}
					onDrop={onDrop}
					role="button"
					tabIndex={0}
					aria-label="Chọn ảnh bìa khóa học"
					onKeyDown={(event) => {
						if (event.key === 'Enter' || event.key === ' ') {
							event.preventDefault();
							openPicker(event.currentTarget);
						}
					}}
				>
					{uploading ? (
						<div className="flex items-center gap-2 text-sm text-muted">
							<Icon name="retry" className="h-4 w-4 animate-spin" />
							Đang upload…
						</div>
					) : (
						<>
							<div
								className={`flex h-12 w-12 items-center justify-center bg-surface-hover text-muted ${product ? 'rounded-[var(--mc-r-sm)]' : 'rounded-xl'}`}
							>
								<Icon name="upload" className="h-6 w-6" />
							</div>
							<p className="mt-3 text-sm font-medium text-foreground-secondary">
								Kéo thả hoặc click để upload
							</p>
							<p className="mt-1 text-xs text-muted">
								PNG, JPG, WebP — tối đa 10MB · Hỗ trợ cắt &amp; chỉnh sửa
							</p>
							<p className="mt-1 font-mono text-xs text-muted/60">
								Kích thước đề xuất:{' '}
								{product ? '1280 × 720 px (tỉ lệ 16:9)' : '1200 × 600 px (tỉ lệ 2:1)'}
							</p>
						</>
					)}
				</div>
			)}

			{error ? (
				<p className="mt-1.5 text-xs text-error" role="alert">
					{error}
				</p>
			) : null}

			{!value && !uploading ? (
				<div className="mt-2">
					<input
						value={value}
						onChange={(e) => onChange(e.target.value)}
						className={`w-full border border-border px-3 py-2 text-sm outline-none transition-colors focus:border-accent ${product ? 'rounded-[var(--mc-r-sm)]' : 'rounded-lg'}`}
						placeholder="Hoặc dán URL trực tiếp: https://..."
					/>
				</div>
			) : null}

			{/* Crop Modal */}
			{cropSrc ? (
				<ImageCropModal
					src={cropSrc}
					aspectRatio={product ? 16 / 9 : 2}
					onCropDone={onCropDone}
					onCancel={closeCrop}
				/>
			) : null}
		</div>
	);
}
