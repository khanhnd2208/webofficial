import type { Metadata } from 'next';

import { StructuredData } from '@/components/marketing';
import IntroLanding from '@/components/site/IntroLanding';
import { COVER_ATMOSPHERE_STORAGE_KEY } from '@/components/site/cover/coverAtmosphere';
import { SITE_NAME, SITE_ORIGIN, absoluteUrl } from '@/config/site';
import { corePositioning, introPage } from '@/content/publicMarketing';

/**
 * Runs synchronously before first paint on `/` so evening visitors open directly into
 * Night indigo with zero Dawn cream flash. Without JavaScript, SSR stays warm Dawn paper.
 */
const COVER_ATMOSPHERE_BOOTSTRAP = `(()=>{try{var p=new URLSearchParams(location.search).get('mode');var s=sessionStorage.getItem('${COVER_ATMOSPHERE_STORAGE_KEY}');var h=new Date().getHours();var m=p==='dawn'||p==='night'?p:s==='dawn'||s==='night'?s:(h>=6&&h<18?'dawn':'night');document.documentElement.dataset.coverAtmosphere=m;}catch(e){}})();`;

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
				url: absoluteUrl('/opengraph-image'),
				width: 1200,
				height: 630,
				alt: 'Duy Khánh — Tôi vẫn đang học cách trở thành một người thầy tốt hơn.',
			},
		],
	},
	twitter: { card: 'summary_large_image', images: [absoluteUrl('/opengraph-image')] },
};

export default function HomePage() {
	return (
		<>
			<script dangerouslySetInnerHTML={{ __html: COVER_ATMOSPHERE_BOOTSTRAP }} />
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
