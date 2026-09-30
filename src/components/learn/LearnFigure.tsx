'use client';

import { useState } from 'react';

import { splitImageSrc } from '@/features/learn/images';

export default function LearnFigure({
	src,
	alt,
	title,
}: {
	src?: string;
	alt?: string;
	title?: string;
}) {
	const parsed = splitImageSrc(src ?? '');
	const [open, setOpen] = useState(false);
	if (!parsed.url) return null;
	return (
		<>
			<figure className="ln-figure" data-width={parsed.width ?? 100}>
				<button type="button" className="ln-figure__zoom" onClick={() => setOpen(true)}>
					<img src={parsed.url} alt={alt ?? ''} title={title} loading="lazy" />
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
