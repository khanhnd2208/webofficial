/** Small line icons for the studio toolbar; stroke follows currentColor. */

const PATHS = {
	bold: 'M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z',
	italic: 'M14 5h-4M14 19h-4M14.5 5l-5 14',
	strike:
		'M5 12h14M16 7.5C15.4 6 13.9 5 12 5c-2.5 0-4 1.3-4 3 0 3.8 8 2.7 8 7 0 1.8-1.7 4-4.5 4-2 0-3.6-1-4.3-2.5',
	link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
	list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
	ordered: 'M10 6h10M10 12h10M10 18h10M4 5l1.5-1v5M3.5 14h2.5l-2.5 3.5h2.5',
	quote: 'M6 17c1.7 0 3-1.3 3-3V9H4v5h3M15 17c1.7 0 3-1.3 3-3V9h-5v5h3',
	callout: 'M4 5h16v11H9l-4 3.5V16H4zM8 9h8M8 12.5h5',
	table: 'M4 5h16v14H4zM4 10h16M4 14.5h16M10 5v14',
	hr: 'M4 12h16',
	undo: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
	redo: 'M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3',
	grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
	plus: 'M12 5v14M5 12h14',
	trash: 'M5 7h14M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3',
	eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
	settings:
		'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
	import: 'M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14',
	download: 'M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14',
	copy: 'M9 9h10v11H9zM5 15V4h10',
	up: 'M12 19V5M6 11l6-6 6 6',
	down: 'M12 5v14M6 13l6 6 6-6',
	duplicate: 'M9 9h10v11H9zM5 15V4h10M14 12v5M11.5 14.5h5',
	close: 'M6 6l12 12M18 6 6 18',
	markdown: 'M3 6h18v12H3zM6.5 15V9l2.5 3 2.5-3v6M16.5 9v6M14.5 13l2 2 2-2',
	image: 'M4 5h16v14H4zM8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM4 16l4.5-5 3.5 4 2.5-3L20 16',
} as const;

export type StudioIconName = keyof typeof PATHS;

export function StudioIcon({ name, size = 16 }: { name: StudioIconName; size?: number }) {
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
		>
			<path d={PATHS[name]} />
		</svg>
	);
}
