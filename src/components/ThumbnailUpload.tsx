'use client';

import { useCallback, useRef, useState } from 'react';

interface ThumbnailUploadProps {
	value: string;
	onChange: (url: string) => void;
}

export default function ThumbnailUpload({ value, onChange }: ThumbnailUploadProps) {
	const [uploading, setUploading] = useState(false);
	const [dragActive, setDragActive] = useState(false);
	const [error, setError] = useState('');
	const fileRef = useRef<HTMLInputElement>(null);

	const upload = useCallback(
		async (file: File) => {
			if (!file.type.startsWith('image/')) {
				setError('Chỉ hỗ trợ upload hình ảnh.');
				return;
			}
			if (file.size > 5 * 1024 * 1024) {
				setError('Kích thước tối đa 5MB.');
				return;
			}

			setUploading(true);
			setError('');
			try {
				const fd = new FormData();
				fd.append('file', file);
				const res = await fetch('/api/uploads', { method: 'POST', body: fd });
				const json = (await res.json()) as unknown;
				const ok = typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true;
				if (!res.ok || !ok) {
					const message =
						typeof json === 'object' && json !== null && typeof (json as { error?: unknown }).error === 'string'
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
				onChange(url);
			} catch (e) {
				setError(e instanceof Error ? e.message : 'Upload thất bại');
			} finally {
				setUploading(false);
			}
		},
		[onChange]
	);

	function onDrop(e: React.DragEvent) {
		e.preventDefault();
		setDragActive(false);
		const file = e.dataTransfer.files[0];
		if (file) void upload(file);
	}

	function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) void upload(file);
		e.target.value = '';
	}

	return (
		<div>
			<div className="text-sm font-medium">Thumbnail</div>

			{value ? (
				<div className="mt-2">
					<div className="relative inline-block">
						<img
							src={value}
							alt="Thumbnail preview"
							className="h-32 w-auto rounded-lg border border-border object-cover"
						/>
						<button
							type="button"
							onClick={() => onChange('')}
							className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background shadow-md transition-transform hover:scale-110"
							aria-label="Remove thumbnail"
						>
							<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
					<div className="mt-1.5 flex items-center gap-2">
						<input
							value={value}
							onChange={(e) => onChange(e.target.value)}
							className="w-full rounded-md border border-border-hover bg-transparent px-3 py-1.5 text-xs text-muted"
							placeholder="URL"
						/>
					</div>
				</div>
			) : (
				<div
					className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
						dragActive ? 'border-accent bg-accent-subtle' : 'border-border hover:border-border-hover'
					} ${uploading ? 'pointer-events-none opacity-60' : ''}`}
					onClick={() => fileRef.current?.click()}
					onDragOver={(e) => {
						e.preventDefault();
						setDragActive(true);
					}}
					onDragLeave={() => setDragActive(false)}
					onDrop={onDrop}
				>
					<input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
					{uploading ? (
						<div className="flex items-center gap-2 text-sm text-muted">
							<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
							</svg>
							Đang upload…
						</div>
					) : (
						<>
							<svg className="h-8 w-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
							</svg>
							<p className="mt-2 text-xs text-muted">Kéo thả hoặc click để upload</p>
							<p className="text-[10px] text-muted">PNG, JPG, WebP — tối đa 5MB</p>
						</>
					)}
				</div>
			)}

			{error ? <p className="mt-1 text-xs text-error">{error}</p> : null}

			{!value ? (
				<div className="mt-2">
					<input
						value={value}
						onChange={(e) => onChange(e.target.value)}
						className="w-full rounded-md border border-border-hover px-3 py-2 text-sm"
						placeholder="Hoặc dán URL trực tiếp: https://..."
					/>
				</div>
			) : null}
		</div>
	);
}
