import { SOCIAL_IMAGE_SIZE } from '@/config/brandTokens';
import { createSocialImage } from '@/lib/socialImage';

export const alt = 'Duy Khánh — Trở thành';
export const size = SOCIAL_IMAGE_SIZE;
export const contentType = 'image/jpeg';

export default function OpenGraphImage() {
	return createSocialImage({
		title: 'Trở thành',
		kicker: 'TRANG CHỦ',
		description: 'Chưa xong. Và có lẽ, đó mới là điều hay.',
		artPath: 'brand/hero-journey-cutout-v1.webp',
	});
}
