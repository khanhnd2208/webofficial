import { Icon, type IconName } from '@/components/ui/Icon';

const ICON_MAP = {
	overview: 'dashboard',
	website: 'globe',
	inbox: 'inbox',
	analytics: 'bar_chart',
	archive: 'archive',
	teaching: 'school',
	search: 'search',
	filter: 'filter_list',
	back: 'arrow_back',
	external: 'open_in_new',
	save: 'save',
	retry: 'retry',
	delete: 'delete',
	toc: 'toc',
	logout: 'logout',
	warning: 'warning',
	copy: 'content_copy',
	home: 'home',
	about: 'person',
	story: 'note',
	contact: 'mail',
	space: 'grid',
} as const satisfies Record<string, IconName>;
export type AdminIconName = keyof typeof ICON_MAP;
export function AdminIcon({ name, size = 20 }: { name: AdminIconName; size?: number }) {
	return <Icon name={ICON_MAP[name]} size={size} data-icon={name} />;
}
