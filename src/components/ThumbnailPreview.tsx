'use client';

import { useState, useCallback } from 'react';

interface ThumbnailPreviewProps {
	src: string;
	alt: string;
	className?: string;
	children: React.ReactNode;
}

/**
 * Wraps a thumbnail container. On desktop hover, shows a larger preview
 * floating near the cursor. On mobile nothing extra happens.
 */
export default function ThumbnailPreview({ src, alt, className = '', children }: ThumbnailPreviewProps) {
	const [show, setShow] = useState(false);
	const [pos, setPos] = useState({ x: 0, y: 0 });

	const handleMouseMove = useCallback((e: React.MouseEvent) => {
		setPos({ x: e.clientX, y: e.clientY });
	}, []);

	return (
		<div
			className={`group/preview relative ${className}`}
			onMouseEnter={() => setShow(true)}
			onMouseLeave={() => setShow(false)}
			onMouseMove={handleMouseMove}
		>
			{children}

			{/* Preview tooltip — desktop only, follows cursor */}
			{show ? (
				<div
					className="pointer-events-none fixed z-100 hidden lg:block"
					style={{
						left: pos.x,
						top: pos.y - 16,
						transform: 'translate(-50%, -100%)',
					}}
				>
					<div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
						<img
							src={src}
							alt={alt}
							className="max-h-[320px] max-w-[480px] object-contain"
							loading="lazy"
						/>
					</div>
				</div>
			) : null}
		</div>
	);
}

