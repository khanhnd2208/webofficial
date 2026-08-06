export type FeatureTabId = 'boardgames' | 'trips' | 'memories' | 'tools';

export interface FeatureTab {
	id: FeatureTabId;
	label: string;
	icon: string;
	description: string;
	available: boolean;
}

export interface BoardGameItem {
	slug: string;
	title: string;
	subtitle: string;
	description: string;
	players: string;
	duration: string;
	href: string;
	emoji: string;
	available: boolean;
	accent: 'accent' | 'indigo' | 'teal' | 'purple' | 'rose';
}

export const KSTRIP_NAME = "K'sTrip";

export const FEATURE_TABS: FeatureTab[] = [
	{
		id: 'boardgames',
		label: 'Amazing Boardgames',
		icon: '🎲',
		description: 'Party game & boardgame chơi cùng bạn bè, không cần dụng cụ.',
		available: true,
	},
	{
		id: 'trips',
		label: 'Trip Planner',
		icon: '✈️',
		description: 'Lên kế hoạch chuyến đi, lịch trình và checklist.',
		available: false,
	},
	{
		id: 'memories',
		label: 'Memories',
		icon: '📸',
		description: 'Album và kỷ niệm từ mỗi chuyến đi.',
		available: false,
	},
	{
		id: 'tools',
		label: 'Trip Tools',
		icon: '🧰',
		description: 'Công cụ tiện ích khi đi du lịch cùng nhau.',
		available: false,
	},
];

export const BOARD_GAMES: BoardGameItem[] = [
	{
		slug: 'spy',
		title: 'AI Là Gián Điệp',
		subtitle: 'Spyfall · Suy luận xã hội',
		description: 'Tìm ra ai không biết từ khóa bí mật — vote, nghi ngờ và bluff cùng nhau.',
		players: '4–12 người',
		duration: '6–10 phút',
		href: '/games/spy',
		emoji: '🕵️',
		available: true,
		accent: 'accent',
	},
	{
		slug: 'mafia',
		title: 'Ma Sói',
		subtitle: 'Werewolf · Chuyền tay xem vai',
		description: 'Phe dân làng vs ma sói — chia vai bí mật trên một điện thoại.',
		players: '5–20 người',
		duration: '5–10 phút phát vai',
		href: '/games/mafia',
		emoji: '🐺',
		available: true,
		accent: 'indigo',
	},
	{
		slug: 'night-market',
		title: 'Cổng Chợ Đêm',
		subtitle: 'Bluff · Thương lượng · Hàng cấm',
		description: 'Đóng túi, khai báo, hối lộ và qua mặt Người Gác Cổng trong khu chợ đêm.',
		players: '1–6 người + bot',
		duration: '20–55 phút',
		href: '/games/night-market',
		emoji: '🏮',
		available: true,
		accent: 'purple',
	},
	{
		slug: 'codenames',
		title: 'Codenames',
		subtitle: 'Đoán từ theo đội',
		description: 'Spymaster gợi ý — đang được phát triển.',
		players: '4–8 người',
		duration: '10–15 phút',
		href: '#',
		emoji: '🎯',
		available: false,
		accent: 'teal',
	},
];
