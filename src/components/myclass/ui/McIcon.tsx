import type { SVGProps } from 'react';

export type McIconName =
	| 'add'
	| 'arrow_back'
	| 'arrow_drop_down'
	| 'arrow_forward'
	| 'assignment'
	| 'bar_chart'
	| 'block'
	| 'book'
	| 'campaign'
	| 'check'
	| 'chevron_left'
	| 'chevron_right'
	| 'close'
	| 'content_copy'
	| 'dashboard'
	| 'delete'
	| 'download'
	| 'drag_indicator'
	| 'edit'
	| 'error'
	| 'event_available'
	| 'event_repeat'
	| 'expand_more'
	| 'filter_list'
	| 'groups'
	| 'help'
	| 'home'
	| 'info'
	| 'library_books'
	| 'link'
	| 'lock'
	| 'menu'
	| 'menu_book'
	| 'more_vert'
	| 'open_in_new'
	| 'percent'
	| 'play_arrow'
	| 'quiz'
	| 'remove'
	| 'save'
	| 'schedule'
	| 'school'
	| 'search'
	| 'settings'
	| 'upload'
	| 'unfold_less'
	| 'unfold_more'
	| 'view_column'
	| 'visibility'
	| 'warning';

const PATHS: Record<McIconName, string> = {
	add: 'M12 5v14M5 12h14',
	arrow_back: 'M15 5l-7 7 7 7M8 12h11',
	arrow_drop_down: 'M6 9l6 6 6-6',
	arrow_forward: 'M9 5l7 7-7 7M5 12h11',
	assignment: 'M8 4h8M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2M8 4c0 1.1.9 2 2 2h4a2 2 0 002-2M8 12h8M8 16h5',
	bar_chart: 'M6 20V10M12 20V4M18 20v-7',
	block: 'M12 4a8 8 0 100 16 8 8 0 000-16zM7 7l10 10',
	book: 'M5 4h11a2 2 0 012 2v14H7a2 2 0 01-2-2V4zM5 18a2 2 0 012-2h13',
	campaign: 'M4 10v4h3l5 4V6L7 10H4zM16 9.5a4 4 0 010 5M18.5 7a7 7 0 010 10',
	check: 'M5 12l5 5L20 7',
	chevron_left: 'M14 6l-6 6 6 6',
	chevron_right: 'M10 6l6 6-6 6',
	close: 'M6 6l12 12M18 6L6 18',
	content_copy: 'M8 8h10v12H8zM6 16H4V4h12v2',
	dashboard: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
	delete: 'M5 7h14M9 7V5h6v2M8 7l1 12h6l1-12',
	download: 'M12 4v12M7 11l5 5 5-5M5 20h14',
	drag_indicator: 'M8 7h.01M16 7h.01M8 12h.01M16 12h.01M8 17h.01M16 17h.01',
	edit: 'M4 20h4l10-10-4-4L4 16v4zM14 6l4 4',
	error: 'M12 8v5M12 16h.01M12 4a8 8 0 100 16 8 8 0 000-16z',
	event_available: 'M7 3v3M17 3v3M4 8h16M6 5h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2zM9 14l2 2 4-4',
	event_repeat: 'M7 3v3M17 3v3M4 8h16M6 5h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2zM8 15h4M15 13l2 2-2 2',
	expand_more: 'M6 9l6 6 6-6',
	filter_list: 'M4 7h16M7 12h10M10 17h4',
	groups: 'M8 10a3 3 0 100-6 3 3 0 000 6zM16 11a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 19c0-2.5 2-4.5 5-4.5s5 2 5 4.5M13 14.5c2.4 0 4.5 1.6 4.5 4.5',
	help: 'M9 9a3 3 0 115 2.2c-.7.6-2 1.4-2 2.8M12 17h.01M12 4a8 8 0 100 16 8 8 0 000-16z',
	home: 'M4 11l8-7 8 7v9H4v-9z',
	info: 'M12 11v5M12 8h.01M12 4a8 8 0 100 16 8 8 0 000-16z',
	library_books: 'M5 6h11v14H5zM8 10h5M8 14h5M9 4h11v14',
	link: 'M10 13a5 5 0 007.07 0l2-2a5 5 0 00-7.07-7.07l-1 1M14 11a5 5 0 00-7.07 0l-2 2a5 5 0 007.07 7.07l1-1',
	lock: 'M8 11V8a4 4 0 118 0v3M6 11h12v9H6v-9z',
	menu: 'M4 7h16M4 12h16M4 17h16',
	menu_book: 'M4 5h7a3 3 0 013 3v11H7a3 3 0 00-3 3V5zM20 5h-7a3 3 0 00-3 3v11h7a3 3 0 013 3V5z',
	more_vert: 'M12 6h.01M12 12h.01M12 18h.01',
	open_in_new: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6v6M13 11l7-7',
	percent: 'M18 6L6 18M8 8.5A1.5 1.5 0 118 5.5 1.5 1.5 0 018 8.5zM16 18.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
	play_arrow: 'M8 6l12 6-12 6V6z',
	quiz: 'M6 4h12a2 2 0 012 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 012-2zM9 10h6M9 14h3',
	remove: 'M5 12h14',
	save: 'M6 4h10l4 4v12H6V4zM8 4v5h8M8 16h8',
	schedule: 'M12 8v5l3 2M12 4a8 8 0 100 16 8 8 0 000-16z',
	school: 'M3 10l9-5 9 5-9 5-9-5zM7 12.5V17l5 2.5 5-2.5v-4.5',
	search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
	settings: 'M12 15.5A3.5 3.5 0 1012 8.5a3.5 3.5 0 000 7zM4 12h2M18 12h2M6.5 6.5l1.5 1.5M16 16l1.5 1.5M6.5 17.5L8 16M16 8l1.5-1.5',
	upload: 'M12 20V8M7 13l5-5 5 5M5 4h14',
	unfold_less: 'M8 7l4 4 4-4M8 17l4-4 4 4',
	unfold_more: 'M8 9l4-4 4 4M8 15l4 4 4-4',
	view_column: 'M4 5h16v14H4zM10 5v14M16 5v14',
	visibility: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
	warning: 'M12 4l9 16H3L12 4zM12 10v4M12 16h.01',
};

type McIconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
	name: McIconName | (string & {});
	size?: number;
	filled?: boolean;
};

export function McIcon({
	name,
	size = 24,
	filled = false,
	className = '',
	'aria-hidden': ariaHidden = true,
	...props
}: McIconProps) {
	const path = PATHS[name as McIconName] ?? PATHS.help;
	return (
		<svg
			viewBox="0 0 24 24"
			width={size}
			height={size}
			fill={filled ? 'currentColor' : 'none'}
			stroke="currentColor"
			strokeWidth={filled ? 0 : 1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden={ariaHidden}
			className={className}
			focusable="false"
			{...props}
		>
			<path d={path} />
		</svg>
	);
}
