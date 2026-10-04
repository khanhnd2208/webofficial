'use client';

import { useState } from 'react';

import { imageSrcStatus, splitImageSrc } from '@/features/learn/images';

export default function LearnFigure({
	src,
	alt,
	title,
	showMissingImages = false,
}: {
	src?: string;
	alt?: string;
	title?: string;
	showMissingImages?: boolean;
}) {
	const parsed = splitImageSrc(src ?? '');
	const [open, setOpen] = useState(false);
	const [failedSrc, setFailedSrc] = useState<string | null>(null);
	const missing = imageSrcStatus(src ?? '') === 'missing' || failedSrc === src;
	if (missing)
		return showMissingImages ? (
			<figure className="ln-figure">
				<div className="ln-figure__missing">Chưa có ảnh: {parsed.url || '(chưa có tên)'}</div>
				{title ? <figcaption>{title}</figcaption> : null}
			</figure>
		) : null;
	return (
		<>
			<figure className="ln-figure" data-width={parsed.width ?? 100}>
				<button
					type="button"
					className="ln-figure__zoom"
					aria-label={alt ? `Phóng to ảnh: ${alt}` : 'Phóng to ảnh'}
					onClick={() => setOpen(true)}
				>
					<img
						src={parsed.url}
						alt={alt ?? ''}
						title={title}
						loading="lazy"
						onError={() => {
							setFailedSrc(src ?? '');
							setOpen(false);
						}}
					/>
				</button>
				{title ? <figcaption>{title}</figcaption> : null}
			</figure>
			{open ? (
				<button
					type="button"
					className="ln-lightbox"
					aria-label="Đóng ảnh"
					onClick={() => setOpen(false)}
				>
					<img src={parsed.url} alt={alt ?? ''} />
					{title ? <span>{title}</span> : null}
				</button>
			) : null}
		</>
	);
}
