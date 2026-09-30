import type { Metadata } from 'next';

import { StructuredData } from '@/components/marketing';
import IntroLanding from '@/components/site/IntroLanding';
import { SITE_NAME, SITE_ORIGIN, absoluteUrl } from '@/config/site';
import { corePositioning, introPage } from '@/content/publicMarketing';

export const metadata: Metadata = {
	title: { absolute: `${SITE_NAME} — ${introPage.headline}` },
	description:
		'Trang cá nhân của Nguyễn Duy Khánh, giảng viên tại Hà Nội, chia sẻ các dự án giáo dục, trải nghiệm học tập, quản trị và ứng dụng AI.',
	alternates: { canonical: absoluteUrl('/') },
	openGraph: {
		title: `${SITE_NAME} — ${introPage.headline}`,
		description:
			'Trang cá nhân của Nguyễn Duy Khánh, giảng viên tại Hà Nội, chia sẻ các dự án giáo dục, trải nghiệm học tập, quản trị và ứng dụng AI.',
		url: absoluteUrl('/'),
		siteName: SITE_NAME,
		locale: 'vi_VN',
		type: 'website',
		images: [
			{
				url: absoluteUrl('/og-editorial-premium.jpg'),
				width: 1200,
				height: 630,
				alt: 'Duy Khánh — Tôi vẫn đang học cách trở thành một người thầy tốt hơn.',
			},
		],
	},
	twitter: { card: 'summary_large_image', images: [absoluteUrl('/og-editorial-premium.jpg')] },
};

export default function HomePage() {
	return (
		<>
			<StructuredData
				data={[
					{
						'@context': 'https://schema.org',
						'@type': 'Person',
						name: SITE_NAME,
						url: SITE_ORIGIN,
						jobTitle: 'Lecturer and Learning Experience Designer',
						description: corePositioning.full,
					},
					{
						'@context': 'https://schema.org',
						'@type': 'WebSite',
						name: SITE_NAME,
						url: SITE_ORIGIN,
						description: corePositioning.full,
						inLanguage: 'vi-VN',
					},
				]}
			/>
			<IntroLanding />
		</>
	);
}
