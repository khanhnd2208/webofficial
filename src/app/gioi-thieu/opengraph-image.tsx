import { SOCIAL_IMAGE_SIZE } from '@/config/brandTokens';
import { aboutContact, aboutPagePaused } from '@/content/about';
import { createSocialImage } from '@/lib/socialImage';

export const alt = aboutPagePaused ? 'Liên hệ Nguyễn Duy Khánh' : 'Giới thiệu Nguyễn Duy Khánh';
export const size = SOCIAL_IMAGE_SIZE;
export const contentType = 'image/jpeg';

export default function OpenGraphImage() {
	if (aboutPagePaused) {
		return createSocialImage({
			title: aboutContact.title,
			kicker: 'CONTACT ME',
			description: 'khanhnd2208@gmail.com · Instagram @turamisi.nk',
			artPath: 'brand/toc/about-v1.webp',
		});
	}
	return createSocialImage({
		title: 'Người thầy, và hành trình trở thành.',
		kicker: 'GIỚI THIỆU',
		description: 'Giảng dạy, thiết kế trải nghiệm học tập và những điều tôi đang khám phá.',
		artPath: 'brand/toc/about-v1.webp',
	});
}
