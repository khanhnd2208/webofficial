const PATHS = {
	overview: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
	website:
		'M12 4a8 8 0 100 16 8 8 0 000-16zM4 12h16M12 4c2.2 2.4 3.3 5.2 3.3 8s-1.1 5.6-3.3 8c-2.2-2.4-3.3-5.2-3.3-8s1.1-5.6 3.3-8z',
	inbox: 'M4 4h16v16H4zM4 13h5l1 3h4l1-3h5',
	analytics: 'M6 20V10M12 20V4M18 20v-7',
	archive: 'M3 5h18v4H3zM5 9v10h14V9M9 13h6',
	teaching: 'M3 9l9-5 9 5-9 5-9-5zM7 11.5V16c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5',
	search: 'M11 6a5 5 0 100 10 5 5 0 000-10zM15.5 15.5L20 20',
	filter: 'M4 7h16M7 12h10M10 17h4',
	back: 'M15 5l-7 7 7 7M8 12h11',
	external: 'M14 5h5v5M19 5l-8 8M10 5H6v13h13v-4',
	save: 'M5 4h11l3 3v13H5zM8 4v5h7M8 20v-6h8v6',
	retry: 'M20 12a8 8 0 01-13.5 5.8M4 12a8 8 0 0113.5-5.8M18 4v4h-4M6 20v-4h4',
	delete: 'M5 7h14M9 7V5h6v2M8 7l1 12h6l1-12',
	toc: 'M5 5h6v6H5zM13 6h6M13 9h6M5 13h6v6H5zM13 15h6M13 18h6',
	logout: 'M10 5H5v14h5M10 12h9M16 9l3 3-3 3',
	warning: 'M12 4l8 14H4zM12 10v4M12 16.5h.01',
	copy: 'M8 8h10v12H8zM6 16H4V4h12v2',
	home: 'M4 11l8-7 8 7M6 10v9h12v-9',
	about: 'M12 12a3 3 0 100-6 3 3 0 000 6zM6 19c1-3 3.2-4 6-4s5 1 6 4',
	story: 'M7 4h8l4 4v12H7zM15 4v4h4M9 12h6M9 16h4',
	contact: 'M4 7h16v10H4zM4 7l8 6 8-6',
	space: 'M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z',
} as const;

export type AdminIconName = keyof typeof PATHS;

export function AdminIcon({ name, size = 20 }: { name: AdminIconName; size?: number }) {
	return (
		<svg
			viewBox="0 0 24 24"
			width={size}
			height={size}
			fill="none"
			stroke="currentColor"
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			data-icon={name}
			focusable="false"
		>
			<path d={PATHS[name]} />
		</svg>
	);
}
