import type { SVGProps } from 'react';

export type McIconName =
	| 'add'
	| 'arrow_back'
	| 'arrow_drop_down'
	| 'arrow_forward'
	| 'assignment'
	| 'auto_awesome'
	| 'bar_chart'
	| 'block'
	| 'bolt'
	| 'book'
	| 'calendar_month'
	| 'campaign'
	| 'chair'
	| 'check'
	| 'check_circle'
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
	| 'explore'
	| 'favorite'
	| 'filter_list'
	| 'forum'
	| 'gavel'
	| 'groups'
	| 'help'
	| 'home'
	| 'info'
	| 'key'
	| 'library_books'
	| 'link'
	| 'lock'
	| 'lock_open'
	| 'login'
	| 'menu'
	| 'menu_book'
	| 'more_horiz'
	| 'more_vert'
	| 'open_in_new'
	| 'percent'
	| 'play_arrow'
	| 'quiz'
	| 'record_voice_over'
	| 'remove'
	| 'save'
	| 'schedule'
	| 'school'
	| 'search'
	| 'settings'
	| 'shield'
	| 'track_changes'
	| 'trending_up'
	| 'unfold_less'
	| 'unfold_more'
	| 'upload'
	| 'verified'
	| 'verified_user'
	| 'view_column'
	| 'visibility'
	| 'visibility_off'
	| 'warning'
	| 'workspace_premium';

const PATHS: Record<McIconName, string> = {
	add: 'M12 5v14M5 12h14',
	arrow_back: 'M15 5l-7 7 7 7M8 12h11',
	arrow_drop_down: 'M6 9l6 6 6-6',
	arrow_forward: 'M9 5l7 7-7 7M5 12h11',
	assignment: 'M8 4h8M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2M8 4c0 1.1.9 2 2 2h4a2 2 0 002-2M8 12h8M8 16h5',
	auto_awesome:
		'M12 3l1.15 3.55H17l-3.1 2.25L15.05 13 12 10.75 8.95 13l1.15-4.2L7 6.55h3.85L12 3zM19 13l.7 2.15H22l-1.85 1.35.7 2.15L19 17.3l-1.85 1.35.7-2.15L16 15.15h2.3L19 13zM5 14l.55 1.7H7.5l-1.5 1.1.55 1.7L5 17.4l-1.55 1.1.55-1.7-1.5-1.1h1.95L5 14z',
	bar_chart: 'M6 20V10M12 20V4M18 20v-7',
	block: 'M12 4a8 8 0 100 16 8 8 0 000-16zM7 7l10 10',
	bolt: 'M13 3L6 14h6l-1 7 7-11h-6l1-7z',
	book: 'M5 4h11a2 2 0 012 2v14H7a2 2 0 01-2-2V4zM5 18a2 2 0 012-2h13',
	calendar_month:
		'M7 3v3M17 3v3M4 8h16M6 5h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2zM8 13h2v2H8zM12 13h2v2h-2zM16 13h2v2h-2zM8 17h2v2H8zM12 17h2v2h-2z',
	campaign: 'M4 10v4h3l5 4V6L7 10H4zM16 9.5a4 4 0 010 5M18.5 7a7 7 0 010 10',
	chair: 'M7 10V7a3 3 0 013-3h4a3 3 0 013 3v3M6 10h12v3H6zM8 13v5M16 13v5M5 18h14',
	check: 'M5 12l5 5L20 7',
	check_circle: 'M12 4a8 8 0 100 16 8 8 0 000-16zM8.5 12.2l2.4 2.4 4.6-4.8',
	chevron_left: 'M14 6l-6 6 6 6',
	chevron_right: 'M10 6l6 6-6 6',
	close: 'M6 6l12 12M18 6L6 18',
	content_copy: 'M8 8h10v12H8zM6 16H4V4h12v2',
	dashboard: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
	delete: 'M5 7h14M9 7V5h6v2M8 7l1 12h6l1-12',
	download: 'M12 4v12M7 11l5 5 5-5M5 20h14',
	drag_indicator: '',
	edit: 'M4 20h4l10-10-4-4L4 16v4zM14 6l4 4',
	error: 'M12 8v5M12 4a8 8 0 100 16 8 8 0 000-16zM12 16.5a.8.8 0 100-1.6.8.8 0 000 1.6',
	event_available: 'M7 3v3M17 3v3M4 8h16M6 5h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2zM9 14l2 2 4-4',
	event_repeat: 'M7 3v3M17 3v3M4 8h16M6 5h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2zM8 15h4M15 13l2 2-2 2',
	expand_more: 'M6 9l6 6 6-6',
	explore: 'M12 4a8 8 0 100 16 8 8 0 000-16zM14.6 9.4l-2 5-5 2 2-5 5-2z',
	favorite: 'M12 19s-7-4.5-7-9.1A3.9 3.9 0 0112 7.2 3.9 3.9 0 0119 9.9C19 14.5 12 19 12 19z',
	filter_list: 'M4 7h16M7 12h10M10 17h4',
	forum: 'M5 6h9a2 2 0 012 2v5H9l-4 3V8a2 2 0 012-2zM12 15h5l3 2.2V10a2 2 0 00-2-2',
	gavel: 'M5 20h7M8 16l4-4M14 6l4 4M10 12l6-6M7 15l2 2',
	groups: 'M8 10a3 3 0 100-6 3 3 0 000 6zM16 11a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 19c0-2.5 2-4.5 5-4.5s5 2 5 4.5M13 14.5c2.4 0 4.5 1.6 4.5 4.5',
	help: 'M9 9a3 3 0 115 2.2c-.7.6-2 1.4-2 2.8M12 4a8 8 0 100 16 8 8 0 000-16zM12 17.2a.8.8 0 100-1.6.8.8 0 000 1.6',
	home: 'M4 11l8-7 8 7v9H4v-9z',
	info: 'M12 11v5M12 4a8 8 0 100 16 8 8 0 000-16zM12 8.6a.8.8 0 100-1.6.8.8 0 000 1.6',
	key: 'M8 15a4 4 0 110-8 4 4 0 010 8zm3.2-2.8L20 20.2M16.5 16.7h3.3',
	library_books: 'M5 6h11v14H5zM8 10h5M8 14h5M9 4h11v14',
	link: 'M10 13a5 5 0 007.07 0l2-2a5 5 0 00-7.07-7.07l-1 1M14 11a5 5 0 00-7.07 0l-2 2a5 5 0 007.07 7.07l1-1',
	lock: 'M8 11V8a4 4 0 118 0v3M6 11h12v9H6v-9z',
	lock_open: 'M8 11V8a4 4 0 017.5-2M6 11h12v9H6v-9z',
	login: 'M10 5H6a2 2 0 00-2 2v10a2 2 0 002 2h4M15 12H4M15 8l5 4-5 4',
	menu: 'M4 7h16M4 12h16M4 17h16',
	menu_book: 'M4 5h7a3 3 0 013 3v11H7a3 3 0 00-3 3V5zM20 5h-7a3 3 0 00-3 3v11h7a3 3 0 013 3V5z',
	more_horiz: '',
	more_vert: '',
	open_in_new: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6v6M13 11l7-7',
	percent: 'M18 6L6 18M8 8.5A1.5 1.5 0 118 5.5 1.5 1.5 0 018 8.5zM16 18.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
	play_arrow: 'M8 6l12 6-12 6V6z',
	quiz: 'M6 4h12a2 2 0 012 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 012-2zM9 10h6M9 14h3',
	record_voice_over:
		'M8 12a3 3 0 100-6 3 3 0 000 6zM3 19c0-2.5 2-4.5 5-4.5s5 2 5 4.5M16.2 9.2a3.2 3.2 0 010 5.6M19 7a6.2 6.2 0 010 10',
	remove: 'M5 12h14',
	save: 'M6 4h10l4 4v12H6V4zM8 4v5h8M8 16h8',
	schedule: 'M12 8v5l3 2M12 4a8 8 0 100 16 8 8 0 000-16z',
	school: 'M3 10l9-5 9 5-9 5-9-5zM7 12.5V17l5 2.5 5-2.5v-4.5',
	search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
	settings: 'M12 15.5A3.5 3.5 0 1012 8.5a3.5 3.5 0 000 7zM4 12h2M18 12h2M6.5 6.5l1.5 1.5M16 16l1.5 1.5M6.5 17.5L8 16M16 8l1.5-1.5',
	shield: 'M12 3l8 4v6c0 5-3.4 8-8 9.5C7.4 21 4 18 4 13V7l8-4z',
	track_changes: 'M12 4a8 8 0 100 16 8 8 0 000-16zM12 8a4 4 0 100 8 4 4 0 000-8zM12 12.8a.8.8 0 100-1.6.8.8 0 000 1.6',
	trending_up: 'M4 17l7-7 4 4 6-7M15 7h5v5',
	unfold_less: 'M8 7l4 4 4-4M8 17l4-4 4 4',
	unfold_more: 'M8 9l4-4 4 4M8 15l4 4 4-4',
	upload: 'M12 20V8M7 13l5-5 5 5M5 4h14',
	verified: 'M12 3l2.3 1.7 2.8.4.7 2.7L20 10.5l-2.2 2.3-.7 2.7-2.8.4L12 17.6l-2.3-1.7-2.8-.4-.7-2.7L4 10.5l2.2-2.3.7-2.7 2.8-.4L12 3zM9 10.6l2.1 2.1 4-4.1',
	verified_user: 'M12 3l8 4v6c0 5-3.4 8-8 9.5C7.4 21 4 18 4 13V7l8-4zM9 12l2.2 2.2L15.5 10',
	view_column: 'M4 5h16v14H4zM10 5v14M16 5v14',
	visibility: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
	visibility_off:
		'M3 3l18 18M10.6 10.6A3 3 0 0014 14.1M6.2 6.2C4 7.7 2 10 2 12s4 7 10 7c1.6 0 3.1-.3 4.4-.9M10.7 5.1A15 15 0 0121 12c-.5.8-1.2 1.7-2.1 2.6',
	warning: 'M12 4l9 16H3L12 4zM12 10v4M12 16.6a.8.8 0 100-1.6.8.8 0 000 1.6',
	workspace_premium: 'M12 2.8l1.7 4.9H19l-4.2 3.1 1.6 5-4.4-3.2-4.4 3.2 1.6-5L5 7.7h5.3L12 2.8zM8 20h8',
};

const DOT_ICONS: Partial<Record<McIconName, ReadonlyArray<readonly [number, number]>>> = {
	drag_indicator: [
		[9, 6],
		[15, 6],
		[9, 12],
		[15, 12],
		[9, 18],
		[15, 18],
	],
	more_horiz: [
		[6, 12],
		[12, 12],
		[18, 12],
	],
	more_vert: [
		[12, 6],
		[12, 12],
		[12, 18],
	],
};

export const MC_ICON_NAMES = Object.keys(PATHS) as McIconName[];

export function isMcIconName(name: string): name is McIconName {
	return Object.prototype.hasOwnProperty.call(PATHS, name);
}

type McIconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
	name: McIconName;
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
	const resolved = isMcIconName(name) ? name : 'help';
	const dots = DOT_ICONS[resolved];
	const path = dots ? undefined : PATHS[resolved];
	return (
		<svg
			viewBox="0 0 24 24"
			width={size}
			height={size}
			fill={filled ? 'currentColor' : 'none'}
			stroke={dots && !filled ? 'none' : 'currentColor'}
			strokeWidth={filled || dots ? 0 : 1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden={ariaHidden}
			data-icon={resolved}
			className={className}
			focusable="false"
			{...props}
		>
			{path ? <path d={path} /> : null}
			{dots?.map(([cx, cy]) => (
				<circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.7} fill="currentColor" stroke="none" />
			))}
		</svg>
	);
}
