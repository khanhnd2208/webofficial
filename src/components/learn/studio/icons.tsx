import { Icon, type IconName } from '@/components/ui/Icon';

const ICON_MAP = {
	bold: 'bold',
	italic: 'italic',
	strike: 'strike',
	link: 'link',
	list: 'list',
	ordered: 'ordered',
	quote: 'quote',
	callout: 'callout',
	table: 'table',
	hr: 'remove',
	undo: 'undo',
	redo: 'redo',
	grip: 'drag_indicator',
	plus: 'add',
	trash: 'delete',
	eye: 'visibility',
	settings: 'settings',
	import: 'download',
	download: 'download',
	copy: 'content_copy',
	up: 'arrow_up',
	down: 'arrow_down',
	duplicate: 'duplicate',
	close: 'close',
	markdown: 'markdown',
	image: 'image',
	more: 'more_horiz',
	chevron: 'chevron_right',
	pencil: 'edit',
	move: 'arrow_forward',
	help: 'help',
	reading: 'menu_book',
	discussion: 'forum',
	collapse: 'unfold_less',
	expand: 'unfold_more',
} as const satisfies Record<string, IconName>;
export type StudioIconName = keyof typeof ICON_MAP;
export function StudioIcon({ name, size = 16 }: { name: StudioIconName; size?: number }) {
	return <Icon name={ICON_MAP[name]} size={size} data-icon={name} />;
}
