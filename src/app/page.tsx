import type { Metadata } from 'next';

import HomeClosingCta from '@/components/home/HomeClosingCta';
import HomeHero from '@/components/home/HomeHero';
import HomeManifesto from '@/components/home/HomeManifesto';
import HomeWriting from '@/components/home/HomeWriting';
import homeStyles from '@/components/home/home.module.css';
import { StructuredData } from '@/components/marketing';
import { getHomePodcastEpisode } from '@/content/podcast';
import { SITE_NAME, SITE_ORIGIN, absoluteUrl } from '@/config/site';
import { getLatestPosts } from '@/services/postService';

export const revalidate = 60;

export const metadata: Metadata = {
	title: { absolute: 'Duy Khánh — Giảng viên và những ghi chép về việc học' },
	description:
		'Duy Khánh là một giảng viên, viết về việc học, con người, công việc và những điều gặp trên đường.',
	alternates: { canonical: absoluteUrl('/') },
	openGraph: {
		title: 'Duy Khánh — Giảng viên và những ghi chép về việc học',
		description:
			'Duy Khánh là một giảng viên, viết về việc học, con người, công việc và những điều gặp trên đường.',
		url: absoluteUrl('/'),
		siteName: SITE_NAME,
		locale: 'vi_VN',
		type: 'website',
		images: [
			{
				url: absoluteUrl('/brand/learning-as-becoming-og.jpg'),
				width: 1200,
				height: 630,
				alt: 'Duy Khánh — Không chỉ học để biết. Học để trở thành.',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Duy Khánh — Giảng viên và những ghi chép về việc học',
		description:
			'Duy Khánh là một giảng viên, viết về việc học, con người, công việc và những điều gặp trên đường.',
		images: [absoluteUrl('/brand/learning-as-becoming-og.jpg')],
	},
};

export default async function Home() {
	const posts = await getLatestPosts(3);
	const podcast = getHomePodcastEpisode();
	const homepageDescription =
		'Duy Khánh là một giảng viên, viết về việc học, con người, công việc và những điều gặp trên đường.';

	const personLd = {
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: SITE_NAME,
		url: SITE_ORIGIN,
		jobTitle: 'Giảng viên',
		description: homepageDescription,
	};

	const websiteLd = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: SITE_NAME,
		url: SITE_ORIGIN,
		description: homepageDescription,
		inLanguage: 'vi-VN',
	};

	return (
		<main className={`${homeStyles.home} min-h-screen`}>
			<StructuredData data={[personLd, websiteLd]} />
			<HomeHero />
			<HomeManifesto />
			<HomeWriting posts={posts} podcast={podcast} />
			<HomeClosingCta />
		</main>
	);
}
