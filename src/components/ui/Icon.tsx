import type { SVGProps } from 'react';

export type IconName =
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
	| 'workspace_premium'
	| 'layers'
	| 'sidebar'
	| 'note'
	| 'trophy'
	| 'keyboard'
	| 'grid'
	| 'list'
	| 'flag'
	| 'globe'
	| 'inbox'
	| 'archive'
	| 'retry'
	| 'toc'
	| 'logout'
	| 'person'
	| 'mail'
	| 'bold'
	| 'italic'
	| 'strike'
	| 'ordered'
	| 'quote'
	| 'callout'
	| 'table'
	| 'undo'
	| 'redo'
	| 'arrow_up'
	| 'arrow_down'
	| 'duplicate'
	| 'markdown'
	| 'image'
	| 'volume_up'
	| 'volume_off'
	| 'fullscreen'
	| 'fullscreen_exit'
	| 'shuffle'
	| 'underline'
	| 'align_left'
	| 'align_center'
	| 'align_right'
	| 'align_justify'
	| 'code'
	| 'pause'
	| 'music'
	| 'star';

const PATHS: Record<IconName, string> = {
	underline: 'M6 4v6a6 6 0 0 0 12 0V4M4 21h16',
	align_left: 'M4 5h16M4 10h10M4 15h16M4 20h10',
	align_center: 'M4 5h16M7 10h10M4 15h16M7 20h10',
	align_right: 'M4 5h16M10 10h10M4 15h16M10 20h10',
	align_justify: 'M4 5h16M4 10h16M4 15h16M4 20h16',
	code: 'M8 6l-6 6 6 6M16 6l6 6-6 6M14 3l-4 18',
	pause: 'M8 5v14M16 5v14',
	music:
		'M9 18V5l11-2v13M9 8l11-2M5.5 21a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM16.5 19a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
	star: 'M12 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z',
	volume_up: 'M11 5 6 9H3v6h3l5 4V5zM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14',
	volume_off: 'M11 5 6 9H3v6h3l5 4V5zM16 9l6 6M22 9l-6 6',
	fullscreen: 'M9 4H4v5M15 4h5v5M4 15v5h5M20 15v5h-5',
	fullscreen_exit: 'M4 9h5V4M15 4v5h5M9 20v-5H4M20 15h-5v5',
	shuffle: 'M4 4l5 5M4 20 20 4M15 4h5v5M15 15l5 5M15 20h5v-5',
	layers: 'M12 3 3 8l9 5 9-5zM3 13l9 5 9-5',
	sidebar: 'M3.5 4.5h17v15h-17zM9.5 4.5v15',
	note: 'M7 4h8l4 4v12H7zM15 4v4h4M9 12h6M9 16h4',
	trophy:
		'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3.5 3.5 0 0 0 4 3.5M16 6h3.5a3.5 3.5 0 0 1-4 3.5M12 13v4M8.5 20h7M10 17h4v3h-4z',
	keyboard: 'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10',
	grid: 'M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z',
	list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
	flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
	globe:
		'M12 4a8 8 0 100 16 8 8 0 000-16zM4 12h16M12 4c2.2 2.4 3.3 5.2 3.3 8s-1.1 5.6-3.3 8c-2.2-2.4-3.3-5.2-3.3-8s1.1-5.6 3.3-8z',
	inbox: 'M4 4h16v16H4zM4 13h5l1 3h4l1-3h5',
	archive: 'M3 5h18v4H3zM5 9v10h14V9M9 13h6',
	retry: 'M20 12a8 8 0 01-13.5 5.8M4 12a8 8 0 0113.5-5.8M18 4v4h-4M6 20v-4h4',
	toc: 'M5 5h6v6H5zM13 6h6M13 9h6M5 13h6v6H5zM13 15h6M13 18h6',
	logout: 'M10 5H5v14h5M10 12h9M16 9l3 3-3 3',
	person: 'M12 12a3 3 0 100-6 3 3 0 000 6zM6 19c1-3 3.2-4 6-4s5 1 6 4',
	mail: 'M4 7h16v10H4zM4 7l8 6 8-6',
	bold: 'M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z',
	italic: 'M14 5h-4M14 19h-4M14.5 5l-5 14',
	strike:
		'M5 12h14M16 7.5C15.4 6 13.9 5 12 5c-2.5 0-4 1.3-4 3 0 3.8 8 2.7 8 7 0 1.8-1.7 4-4.5 4-2 0-3.6-1-4.3-2.5',
	ordered: 'M10 6h10M10 12h10M10 18h10M4 5l1.5-1v5M3.5 14h2.5l-2.5 3.5h2.5',
	quote: 'M6 17c1.7 0 3-1.3 3-3V9H4v5h3M15 17c1.7 0 3-1.3 3-3V9h-5v5h3',
	callout: 'M4 5h16v11H9l-4 3.5V16H4zM8 9h8M8 12.5h5',
	table: 'M4 5h16v14H4zM4 10h16M4 14.5h16M10 5v14',
	undo: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
	redo: 'M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3',
	arrow_up: 'M12 19V5M6 11l6-6 6 6',
	arrow_down: 'M12 5v14M6 13l6 6 6-6',
	duplicate: 'M9 9h10v11H9zM5 15V4h10M14 12v5M11.5 14.5h5',
	markdown: 'M3 6h18v12H3zM6.5 15V9l2.5 3 2.5-3v6M16.5 9v6M14.5 13l2 2 2-2',
	image: 'M4 5h16v14H4zM8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM4 16l4.5-5 3.5 4 2.5-3L20 16',
	add: 'M12 5v14M5 12h14',
	arrow_back: 'M15 5l-7 7 7 7M8 12h11',
	arrow_drop_down: 'M6 9l6 6 6-6',
	arrow_forward: 'M9 5l7 7-7 7M5 12h11',
	assignment:
		'M8 4h8M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2M8 4c0 1.1.9 2 2 2h4a2 2 0 002-2M8 12h8M8 16h5',
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
	event_available:
		'M7 3v3M17 3v3M4 8h16M6 5h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2zM9 14l2 2 4-4',
	event_repeat:
		'M7 3v3M17 3v3M4 8h16M6 5h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2zM8 15h4M15 13l2 2-2 2',
	expand_more: 'M6 9l6 6 6-6',
	explore: 'M12 4a8 8 0 100 16 8 8 0 000-16zM14.6 9.4l-2 5-5 2 2-5 5-2z',
	favorite: 'M12 19s-7-4.5-7-9.1A3.9 3.9 0 0112 7.2 3.9 3.9 0 0119 9.9C19 14.5 12 19 12 19z',
	filter_list: 'M4 7h16M7 12h10M10 17h4',
	forum: 'M5 6h9a2 2 0 012 2v5H9l-4 3V8a2 2 0 012-2zM12 15h5l3 2.2V10a2 2 0 00-2-2',
	gavel: 'M5 20h7M8 16l4-4M14 6l4 4M10 12l6-6M7 15l2 2',
	groups:
		'M8 10a3 3 0 100-6 3 3 0 000 6zM16 11a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 19c0-2.5 2-4.5 5-4.5s5 2 5 4.5M13 14.5c2.4 0 4.5 1.6 4.5 4.5',
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
	percent:
		'M18 6L6 18M8 8.5A1.5 1.5 0 118 5.5 1.5 1.5 0 018 8.5zM16 18.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
	play_arrow: 'M8 6l12 6-12 6V6z',
	quiz: 'M6 4h12a2 2 0 012 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 012-2zM9 10h6M9 14h3',
	record_voice_over:
		'M8 12a3 3 0 100-6 3 3 0 000 6zM3 19c0-2.5 2-4.5 5-4.5s5 2 5 4.5M16.2 9.2a3.2 3.2 0 010 5.6M19 7a6.2 6.2 0 010 10',
	remove: 'M5 12h14',
	save: 'M6 4h10l4 4v12H6V4zM8 4v5h8M8 16h8',
	schedule: 'M12 8v5l3 2M12 4a8 8 0 100 16 8 8 0 000-16z',
	school: 'M3 10l9-5 9 5-9 5-9-5zM7 12.5V17l5 2.5 5-2.5v-4.5',
	search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
	settings:
		'M12 15.5A3.5 3.5 0 1012 8.5a3.5 3.5 0 000 7zM4 12h2M18 12h2M6.5 6.5l1.5 1.5M16 16l1.5 1.5M6.5 17.5L8 16M16 8l1.5-1.5',
	shield: 'M12 3l8 4v6c0 5-3.4 8-8 9.5C7.4 21 4 18 4 13V7l8-4z',
	track_changes:
		'M12 4a8 8 0 100 16 8 8 0 000-16zM12 8a4 4 0 100 8 4 4 0 000-8zM12 12.8a.8.8 0 100-1.6.8.8 0 000 1.6',
	trending_up: 'M4 17l7-7 4 4 6-7M15 7h5v5',
	unfold_less: 'M8 7l4 4 4-4M8 17l4-4 4 4',
	unfold_more: 'M8 9l4-4 4 4M8 15l4 4 4-4',
	upload: 'M12 20V8M7 13l5-5 5 5M5 4h14',
	verified:
		'M12 3l2.3 1.7 2.8.4.7 2.7L20 10.5l-2.2 2.3-.7 2.7-2.8.4L12 17.6l-2.3-1.7-2.8-.4-.7-2.7L4 10.5l2.2-2.3.7-2.7 2.8-.4L12 3zM9 10.6l2.1 2.1 4-4.1',
	verified_user: 'M12 3l8 4v6c0 5-3.4 8-8 9.5C7.4 21 4 18 4 13V7l8-4zM9 12l2.2 2.2L15.5 10',
	view_column: 'M4 5h16v14H4zM10 5v14M16 5v14',
	visibility: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
	visibility_off:
		'M3 3l18 18M10.6 10.6A3 3 0 0014 14.1M6.2 6.2C4 7.7 2 10 2 12s4 7 10 7c1.6 0 3.1-.3 4.4-.9M10.7 5.1A15 15 0 0121 12c-.5.8-1.2 1.7-2.1 2.6',
	warning: 'M12 4l9 16H3L12 4zM12 10v4M12 16.6a.8.8 0 100-1.6.8.8 0 000 1.6',
	workspace_premium:
		'M12 2.8l1.7 4.9H19l-4.2 3.1 1.6 5-4.4-3.2-4.4 3.2 1.6-5L5 7.7h5.3L12 2.8zM8 20h8',
};

const DOT_ICONS: Partial<Record<IconName, ReadonlyArray<readonly [number, number]>>> = {
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

export const ICON_NAMES = Object.keys(PATHS) as IconName[];

export function isIconName(name: string): name is IconName {
	return Object.prototype.hasOwnProperty.call(PATHS, name);
}

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
	name: IconName;
	size?: number;
	filled?: boolean;
};

export function Icon({
	name,
	size = 24,
	filled = false,
	className = '',
	'aria-hidden': ariaHidden = true,
	...props
}: IconProps) {
	const resolved = isIconName(name) ? name : 'help';
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
