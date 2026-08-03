import type { AudienceGatewayItem } from './types';
import { routes } from '@/config/routes';

export const audienceGateway: AudienceGatewayItem[] = [
	{
		id: 'personal',
		title: 'Cá nhân tìm hướng phát triển',
		description:
			'Sinh viên, người mới đi làm hoặc người lần đầu đảm nhận vai trò quản lý cần làm rõ bước tiếp theo.',
		href: `${routes.contact}?type=mentoring`,
		cta: 'Trao đổi về hướng phát triển',
	},
	{
		id: 'business',
		title: 'Người sáng lập và doanh nghiệp',
		description: 'Cần làm rõ bài toán, ưu tiên và cách đội ngũ học – vận hành tốt hơn.',
		href: `${routes.contact}?type=business`,
		cta: 'Trao đổi cố vấn',
	},
	{
		id: 'learn',
		title: 'Muốn học về quản trị hoặc AI',
		description: 'Theo dõi góc viết HANOICAM và các chương trình học khi có đợt đăng ký mới.',
		href: routes.posts,
		cta: 'Đọc HANOICAM',
	},
	{
		id: 'explore',
		title: 'Muốn khám phá',
		description: 'Xem Góc của Khánh, các bài viết và cách tôi làm việc với tri thức.',
		href: routes.lab,
		cta: 'Vào Góc của Khánh',
	},
];
