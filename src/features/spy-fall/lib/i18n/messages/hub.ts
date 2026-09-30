import type { MessageTree } from '@/features/spy-fall/lib/i18n/types';

export const hubVi: MessageTree = {
	brand: 'Spy Fall',
	tagline: 'Hub du lịch & giải trí',
	startMission: 'Bắt đầu nhiệm vụ',
	tabs: {
		boardgames: {
			label: 'Amazing Boardgames',
			description: 'Party game & boardgame chơi cùng bạn bè, không cần dụng cụ.',
		},
		trips: {
			label: 'Trip Planner',
			description: 'Lên kế hoạch chuyến đi, lịch trình và checklist.',
		},
		memories: {
			label: 'Memories',
			description: 'Album và kỷ niệm từ mỗi chuyến đi.',
		},
		tools: {
			label: 'Trip Tools',
			description: 'Công cụ tiện ích khi đi du lịch cùng nhau.',
		},
	},
	games: {
		spy: {
			title: 'Spy Fall',
			subtitle: 'Spyfall · Suy luận xã hội',
			description: 'Tìm ra ai không biết từ khóa bí mật — vote, nghi ngờ và bluff cùng nhau.',
			players: '4–12 người',
			duration: '10–15 phút',
		},
		mafia: {
			title: 'Ma Sói',
			subtitle: 'Werewolf · Chuyền tay xem vai',
			description: 'Phe dân làng vs ma sói — chia vai bí mật trên một điện thoại.',
			players: '5–20 người',
			duration: '5–10 phút phát vai',
		},
		'night-market': {
			title: 'Cổng Chợ Đêm',
			subtitle: 'Bluff · Thương lượng · Hàng cấm',
			description: 'Đóng túi, khai báo, hối lộ và qua mặt Người Gác Cổng trong khu chợ đêm.',
			players: '1–6 người + bot',
			duration: '20–55 phút',
		},
		codenames: {
			title: 'Codenames',
			subtitle: 'Đoán từ theo đội',
			description: 'Spymaster gợi ý — đang được phát triển.',
			players: '4–8 người',
			duration: '10–15 phút',
		},
	},
	unavailable: {
		title: 'Sắp mở',
		body: 'Tính năng này đang được chuẩn bị. Quay lại Amazing Boardgames để chơi ngay.',
		preparing: 'Đang chuẩn bị khởi hành',
		notifyMe: 'Báo tôi khi ra mắt',
		notified: 'Đã ghi nhận — cảm ơn bạn!',
	},
	boardgames: {
		pick: 'Chọn nhiệm vụ',
		pickHint: 'Tạo phòng, mời đồng đội và chơi ngay trên điện thoại — không cần bàn cờ hay bài.',
		upcoming: 'Nhiệm vụ sắp tới',
	},
	hero: {
		eyebrow: 'Departure Lounge',
		tagline: 'Hub du lịch & giải trí — chơi game, lên kế hoạch chuyến đi và lưu kỷ niệm cùng nhau.',
		boarding: 'Boarding Pass',
		expedition: 'Covert Expedition',
		expeditionHint: 'Mỗi ván là một điệp vụ — tìm kẻ không biết từ khóa bí mật.',
	},
};

export const hubEn: MessageTree = {
	brand: 'Spy Fall',
	tagline: 'Travel & entertainment hub',
	startMission: 'Start mission',
	tabs: {
		boardgames: {
			label: 'Amazing Boardgames',
			description: 'Party games with friends — no physical pieces needed.',
		},
		trips: {
			label: 'Trip Planner',
			description: 'Plan trips, itineraries, and checklists.',
		},
		memories: {
			label: 'Memories',
			description: 'Albums and memories from every trip.',
		},
		tools: {
			label: 'Trip Tools',
			description: 'Handy tools for traveling together.',
		},
	},
	games: {
		spy: {
			title: 'Spy Fall',
			subtitle: 'Spyfall · Social deduction',
			description: 'Find who doesn’t know the secret word — vote, suspect, and bluff together.',
			players: '4–12 players',
			duration: '10–15 min',
		},
		mafia: {
			title: 'Werewolf',
			subtitle: 'Pass-and-play role deal',
			description: 'Villagers vs werewolves — deal secret roles on one phone.',
			players: '5–20 players',
			duration: '5–10 min to deal',
		},
		'night-market': {
			title: 'Night Market Gate',
			subtitle: 'Bluffing · Negotiation · Contraband',
			description: 'Pack bags, make declarations, bribe, and outwit the Gatekeeper.',
			players: '1–6 players + bots',
			duration: '20–55 min',
		},
		codenames: {
			title: 'Codenames',
			subtitle: 'Team word guessing',
			description: 'Spymaster hints — coming soon.',
			players: '4–8 players',
			duration: '10–15 min',
		},
	},
	unavailable: {
		title: 'Coming soon',
		body: 'This feature is still being prepared. Head back to Amazing Boardgames to play now.',
		preparing: 'Preparing for departure',
		notifyMe: 'Notify me when it launches',
		notified: 'Noted — thank you!',
	},
	boardgames: {
		pick: 'Choose a mission',
		pickHint: 'Create a room, invite friends, and play on your phone — no board or cards needed.',
		upcoming: 'Upcoming missions',
	},
	hero: {
		eyebrow: 'Departure Lounge',
		tagline: 'Travel & entertainment hub — play games, plan trips, and save memories together.',
		boarding: 'Boarding Pass',
		expedition: 'Covert Expedition',
		expeditionHint: 'Every round is a mission — find who doesn’t know the secret word.',
	},
};
