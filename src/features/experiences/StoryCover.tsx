'use client';

import { useCallback, useState } from 'react';

/** Reserve photo space and keep an unobtrusive illustrated fallback for missing uploads. */
export default function StoryCover({ src, className = '' }: { src: string; className?: string }) {
	const [failedSrc, setFailedSrc] = useState<string | null>(null);
	const checkPhoto = useCallback(
		(photo: HTMLImageElement | null) => {
			// A cached failure can arrive before hydration attaches the error listener.
			if (photo?.complete && photo.naturalWidth === 0) setFailedSrc(src);
		},
		[src],
	);
	return (
		<div className={`experience-photo ${className}`} aria-hidden="true">
			{failedSrc !== src ? (
				<img
					ref={checkPhoto}
					src={src}
					alt=""
					loading="lazy"
					width={600}
					height={400}
					onError={() => setFailedSrc(src)}
				/>
			) : null}
		</div>
	);
}
