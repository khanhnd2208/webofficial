import type { SVGProps } from 'react';

const paths = {
	teaching:
		'M3 5c3-1 6-1 9 1 3-2 6-2 9-1v15c-3-1-6-1-9 1-3-2-6-2-9-1V5Zm9 1v15M6 10h3m-3 4h3m6-4h3m-3 4h3',
	course: 'M6 3h13v18H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm0 0v12m-3 3a3 3 0 0 1 3-3h13M9 7h6m-6 4h4',
	class: 'M3 3h18v12H3V3Zm4 18 2-6m8 6-2-6M7 7h10m-10 4h6',
	attendance: 'M8 4H5v17h14V4h-3M8 3h8v4H8V3Zm0 11 3 3 5-6',
	cp: 'M4 4h16v12h-7l-5 4v-4H4V4Zm4 6 2 2 5-5',
	groups:
		'M9 7a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm-5 3a2 2 0 1 1 0 .1m16-.1a2 2 0 1 0 0 .1M7 21v-4a5 5 0 0 1 10 0v4M2 20v-4a3 3 0 0 1 3-3m17 7v-4a3 3 0 0 0-3-3',
	notes: 'M5 3h14v18H5V3Zm4 5h6m-6 4h6m-6 4h3',
	recall: 'm7 3 14 3-3 14-14-3L7 3Zm-4 7-1 10 14 2m-6-12 6 1m-7 3 4 1',
	calendar: 'M4 5h16v16H4V5Zm4-3v6m8-6v6M4 10h16m-12 4h2m4 0h2m-8 3h2',
	students: 'M8 7a4 4 0 1 1 8 0 4 4 0 0 1-8 0Zm-4 14v-2a8 8 0 0 1 16 0v2',
} as const;

export type TeachingIconName = keyof typeof paths;

export function TeachingIcon({
	name,
	size = 20,
	...props
}: Omit<SVGProps<SVGSVGElement>, 'name'> & { name: TeachingIconName; size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.7"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...props}
		>
			<path d={paths[name]} />
		</svg>
	);
}
