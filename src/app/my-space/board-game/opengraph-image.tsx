import { SOCIAL_IMAGE_SIZE } from '@/config/brandTokens';
import { createSocialImage } from '@/lib/socialImage';

export const alt = 'Trò chơi cùng nhau — Spy Fall, Ma Sói và Cheese Thief';
export const size = SOCIAL_IMAGE_SIZE;
export const contentType = 'image/jpeg';

export default function OpenGraphImage() {
	return createSocialImage({
		title: 'Chơi cùng nhau',
		kicker: 'TRÒ CHƠI',
		description: 'Mở phòng, mời bạn bè và bắt đầu. Chơi ngay trên điện thoại.',
		artPath: 'brand/myspace/ma-soi-editorial.webp',
		dark: true,
	});
}
