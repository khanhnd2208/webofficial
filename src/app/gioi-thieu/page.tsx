import type { Metadata } from 'next';

import { routes } from '@/config/routes';
import { absoluteUrl, SITE_NAME } from '@/config/site';
import { aboutHero } from '@/content/about';
import AboutLetter from './AboutLetter';

const description = `${aboutHero.fullName} — ${aboutHero.role}, ${aboutHero.organisation}. ${aboutHero.promise}`;

export const metadata: Metadata = {
	title: `Giới thiệu — ${aboutHero.fullName}`,
	description,
	alternates: { canonical: absoluteUrl(routes.about) },
	openGraph: {
		title: `Giới thiệu — ${aboutHero.fullName}`,
		description,
		url: absoluteUrl(routes.about),
		type: 'profile',
		siteName: SITE_NAME,
		locale: 'vi_VN',
		images: [
			{
				url: absoluteUrl('/gioi-thieu/opengraph-image'),
				width: 1200,
				height: 630,
				alt: aboutHero.manifesto,
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: `Giới thiệu — ${aboutHero.fullName}`,
		description,
		images: [absoluteUrl('/gioi-thieu/opengraph-image')],
	},
};

export default function AboutPage() {
	return <AboutLetter />;
}
