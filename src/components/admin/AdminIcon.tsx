import { McIcon, type McIconName } from '@/components/myclass/ui/McIcon';

const icons = {
	overview: 'dashboard',
	website: 'view_column',
	inbox: 'inbox',
	analytics: 'bar_chart',
	archive: 'archive',
	teaching: 'school',
	search: 'search',
	filter: 'filter_list',
	back: 'arrow_back',
	external: 'open_in_new',
	save: 'save',
	retry: 'event_repeat',
	delete: 'delete',
	toc: 'menu_book',
	logout: 'login',
} satisfies Record<string, McIconName>;
export type AdminIconName = keyof typeof icons;
export function AdminIcon({ name, size = 20 }: { name: AdminIconName; size?: number }) {
	return <McIcon name={icons[name]} size={size} />;
}
