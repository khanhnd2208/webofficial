import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';
import { absoluteUrl, SITE_NAME } from '@/config/site';
import { aboutHero, aboutPagePaused } from '@/content/about';
import AboutLetter from './AboutLetter';

const title = `Giới thiệu — ${aboutHero.fullName}`;
const description = `${aboutHero.fullName} — ${aboutHero.role}, ${aboutHero.organisation}. ${aboutHero.promise}`;

export const metadata: Metadata = {
	title,
	description,
	alternates: { canonical: absoluteUrl(routes.about) },
	openGraph: {
		title,
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
		title,
		description,
		images: [absoluteUrl('/gioi-thieu/opengraph-image')],
	},
};

export default function AboutPage() {
	// While the introduction is rewritten, Liên hệ is the one page that lists every channel.
	if (aboutPagePaused) redirect(routes.contact);
	return <AboutLetter />;
}
