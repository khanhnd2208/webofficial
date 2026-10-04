'use client';

import { useRef } from 'react';

import { findImageRefs } from '@/features/learn/images';

export default function MissingImagesBar({
	markdown,
	onFiles,
	disabled = false,
}: {
	markdown: string;
	onFiles: (files: File[]) => void;
	disabled?: boolean;
}) {
	const ref = useRef<HTMLInputElement>(null);
	const images = findImageRefs(markdown).filter((image) => image.status !== 'ready');
	if (!images.length) return null;
	return (
		<div className="ln-image-picker">
			<p>
				{images.length} ảnh chưa tải lên ·{' '}
				<button
					type="button"
					className="ln-link-btn"
					disabled={disabled}
					onClick={() => ref.current?.click()}
				>
					Chọn ảnh…
				</button>
			</p>
			<p className="text-xs text-ink-secondary">
				Chọn nhiều ảnh hoặc thả thư mục ảnh vào vùng soạn. Tự khớp theo tên file, ví dụ hinh-1.png.
			</p>
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
