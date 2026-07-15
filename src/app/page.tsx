import type { Metadata } from 'next';

import HomeClosingCta from '@/components/home/HomeClosingCta';
import HomeHero from '@/components/home/HomeHero';
import HomeManifesto from '@/components/home/HomeManifesto';
import HomeWriting from '@/components/home/HomeWriting';
import homeStyles from '@/components/home/home.module.css';
import { StructuredData } from '@/components/marketing';
import { getHomeHeroArticleHref } from '@/content/home';
import { getHomePodcastEpisode } from '@/content/podcast';
import { SITE_NAME, SITE_ORIGIN, absoluteUrl } from '@/config/site';
import { getLatestPosts } from '@/services/postService';

export const revalidate = 60;

export const metadata: Metadata = {
	title: { absolute: 'Duy Khánh — Giáo dục, trải nghiệm học tập và phát triển con người' },
	description:
		'Duy Khánh là một giảng viên và người thiết kế trải nghiệm học tập, theo đuổi cách giáo dục thực chất, giàu trải nghiệm và hướng tới sự phát triển con người.',
	alternates: { canonical: absoluteUrl('/') },
	openGraph: {
		title: 'Duy Khánh — Giáo dục, trải nghiệm học tập và phát triển con người',
		description:
			'Duy Khánh là một giảng viên và người thiết kế trải nghiệm học tập, theo đuổi cách giáo dục thực chất, giàu trải nghiệm và hướng tới sự phát triển con người.',
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
		title: 'Duy Khánh — Giáo dục, trải nghiệm học tập và phát triển con người',
		description:
			'Duy Khánh là một giảng viên và người thiết kế trải nghiệm học tập, theo đuổi cách giáo dục thực chất, giàu trải nghiệm và hướng tới sự phát triển con người.',
		images: [absoluteUrl('/brand/learning-as-becoming-og.jpg')],
	},
};

export default async function Home() {
	const posts = await getLatestPosts(6);
	const heroArticleHref = getHomeHeroArticleHref(posts);
	const podcast = getHomePodcastEpisode();
	const homepageDescription =
		'Duy Khánh là một giảng viên và người thiết kế trải nghiệm học tập, theo đuổi cách giáo dục thực chất, giàu trải nghiệm và hướng tới sự phát triển con người.';

	const personLd = {
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: SITE_NAME,
		url: SITE_ORIGIN,
		jobTitle: 'Educator',
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
			<HomeHero articleHref={heroArticleHref} />
			<HomeManifesto />
			<HomeWriting podcast={podcast} />
			<HomeClosingCta />
		</main>
	);
}
