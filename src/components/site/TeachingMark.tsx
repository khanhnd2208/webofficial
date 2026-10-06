import type { SVGProps } from 'react';

/** Shared destination mark so the contents page and Teaching use one identity. */
export function TeachingMark(props: SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
			<rect x="5" y="4" width="38" height="40" rx="12" fill="var(--teaching-selected)" />
			<path
				d="M12 15c4-2 8-2 12 0 4-2 8-2 12 0v20c-4-2-8-2-12 0-4-2-8-2-12 0V15Z"
				fill="var(--teaching-mark-paper)"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinejoin="round"
			/>
			<path
				d="M24 15v20M16 21h4m-4 5h4m8-5h4m-4 5h4"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
			/>
			<path
				d="m31 9 2-3 2 3m-2-3v7"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
