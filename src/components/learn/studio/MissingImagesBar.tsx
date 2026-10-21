'use client';

import { useEffect, useRef, useState } from 'react';

import { findImageRefs } from '@/features/learn/images';

export default function MissingImagesBar({
	markdown,
	onFiles,
	onReplace,
	disabled = false,
}: {
	markdown: string;
	onFiles: (files: File[]) => void;
	onReplace?: (index: number, file: File) => void;
	disabled?: boolean;
}) {
	const ref = useRef<HTMLInputElement>(null);
	const [failed, setFailed] = useState<Set<string>>(() => new Set());
	const refs = findImageRefs(markdown);
	const sources = JSON.stringify([
		...new Set(refs.filter((image) => image.status === 'ready').map((image) => image.url)),
	]);
	useEffect(() => {
		const probes = (JSON.parse(sources) as string[]).map((src) => {
			const probe = new Image();
			probe.onerror = () => setFailed((previous) => new Set(previous).add(src));
			probe.onload = () =>
				setFailed((previous) => {
					if (!previous.has(src)) return previous;
					const next = new Set(previous);
					next.delete(src);
					return next;
				});
			probe.src = src;
			return probe;
		});
		return () => {
			for (const probe of probes) {
				probe.onload = null;
				probe.onerror = null;
			}
		};
	}, [sources]);
	const images = refs
		.map((image, index) => ({ ...image, index }))
		.filter((image) => image.status !== 'ready' || failed.has(image.url));
	if (!images.length) return null;
	return (
		<div className="ln-image-picker">
			<p>
				{images.length} vị trí ảnh cần bổ sung ·{' '}
				<button
					type="button"
					className="ln-link-btn"
					disabled={disabled}
					onClick={() => ref.current?.click()}
				>
					Ghép nhiều ảnh theo tên…
				</button>
			</p>
			<p className="text-xs text-ink-secondary">
				Chọn nhiều ảnh hoặc thả thư mục ảnh vào vùng soạn. Tự khớp theo tên file, ví dụ hinh-1.png.
			</p>
			{onReplace ? (
				<ul className="ln-image-picker__slots">
					{images.map((image) => (
						<li key={image.index}>
							<span>
								<strong>{image.alt || `Ảnh ${image.index + 1}`}</strong>
								<small>
									{image.url || 'Chưa có đường dẫn'}
									{failed.has(image.url)
										? ' · Không tải được ảnh'
										: image.status === 'external'
											? ' · Ảnh ngoài website'
											: ''}
								</small>
							</span>
							<label className="ln-btn ln-btn--sm">
								Chọn ảnh
								<input
									type="file"
									accept="image/*"
									className="sr-only"
									disabled={disabled}
									aria-label={`Bổ sung ảnh ${image.index + 1}: ${image.alt || 'chưa có mô tả'}`}
									onChange={(event) => {
										const file = event.target.files?.[0];
										event.target.value = '';
										if (file) onReplace(image.index, file);
									}}
								/>
							</label>
						</li>
					))}
				</ul>
			) : null}
			<input
				ref={ref}
				aria-label="Chọn ảnh khớp tên file"
				type="file"
				accept="image/*"
				multiple
				hidden
				disabled={disabled}
				onChange={(event) => {
					const files = [...(event.target.files ?? [])];
					event.target.value = '';
					onFiles(files);
				}}
			/>
		</div>
	);
}
