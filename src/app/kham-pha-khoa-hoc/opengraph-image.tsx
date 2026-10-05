import { SOCIAL_IMAGE_SIZE } from '@/config/brandTokens';
import { createSocialImage } from '@/lib/socialImage';

export const alt = 'Khám phá các khóa học của Duy Khánh';
export const size = SOCIAL_IMAGE_SIZE;
export const contentType = 'image/jpeg';

export default function OpenGraphImage() {
	return createSocialImage({
		title: 'Một điều mới bắt đầu từ đây.',
		kicker: 'KHÓA HỌC',
		description: 'Xem chương trình trước. Chọn điều bạn muốn học. Bắt đầu theo nhịp của bạn.',
		artPath: 'brand/spots/empty-v1.webp',
	});
}
