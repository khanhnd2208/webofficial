import type { Metadata } from 'next';

import { routes } from '@/config/routes';
import { absoluteUrl, SITE_NAME } from '@/config/site';
import { aboutContact, aboutHero, aboutPagePaused } from '@/content/about';
import AboutLetter from './AboutLetter';
import ContactCard from './ContactCard';

const title = aboutPagePaused
	? `${aboutContact.title} — ${aboutHero.fullName}`
	: `Giới thiệu — ${aboutHero.fullName}`;
const description = aboutPagePaused
	? `Email và Instagram của ${aboutHero.fullName} — ${aboutHero.role}, ${aboutHero.organisation}.`
	: `${aboutHero.fullName} — ${aboutHero.role}, ${aboutHero.organisation}. ${aboutHero.promise}`;

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
				alt: aboutPagePaused ? aboutContact.title : aboutHero.manifesto,
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
	return aboutPagePaused ? <ContactCard /> : <AboutLetter />;
}
