import type { AudienceGatewayItem } from './types';
import { routes } from '@/config/routes';

export const audienceGateway: AudienceGatewayItem[] = [
	{
		id: 'personal',
		title: 'Cá nhân tìm hướng phát triển',
		description: 'Sinh viên, young professional hoặc first-time manager cần làm rõ bước tiếp theo.',
		href: `${routes.contact}?type=mentoring`,
		cta: 'Trao đổi mentoring',
	},
	{
		id: 'business',
		title: 'Founder / doanh nghiệp',
		description: 'Cần làm rõ bài toán, ưu tiên và cách đội ngũ học – vận hành tốt hơn.',
		href: `${routes.contact}?type=business`,
		cta: 'Trao đổi cố vấn',
	},
	{
		id: 'learn',
		title: 'Muốn học quản trị / AI',
		description: 'Theo dõi Journal và các chương trình học khi catalog mở.',
		href: routes.posts,
		cta: 'Đọc HANOICAM',
	},
	{
		id: 'explore',
		title: 'Muốn khám phá',
		description: 'Xem Góc của Khánh, bài viết và cách Khánh làm việc với tri thức.',
		href: routes.lab,
		cta: 'Vào Góc của Khánh',
	},
];
