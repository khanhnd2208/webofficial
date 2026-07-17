import type { Metadata } from 'next';

import HomeClosingCta from '@/components/home/HomeClosingCta';
import HomeHero from '@/components/home/HomeHero';
import HomeWriting from '@/components/home/HomeWriting';
import homeStyles from '@/components/home/home.module.css';
import { StructuredData } from '@/components/marketing';
import { getHomePodcastEpisode } from '@/content/podcast';
import { SITE_NAME, SITE_ORIGIN, absoluteUrl } from '@/config/site';
import { getLatestPosts } from '@/services/postService';

export const revalidate = 60;

export const metadata: Metadata = {
	title: { absolute: 'Duy Khánh — Giảng viên, người thiết kế chương trình học và người viết' },
	description:
		'Duy Khánh giảng dạy, thiết kế chương trình học và viết về cách con người học, làm việc và trưởng thành.',
	alternates: { canonical: absoluteUrl('/') },
	openGraph: {
		title: 'Duy Khánh — Giảng viên, người thiết kế chương trình học và người viết',
		description:
			'Duy Khánh giảng dạy, thiết kế chương trình học và viết về cách con người học, làm việc và trưởng thành.',
		url: absoluteUrl('/'),
		siteName: SITE_NAME,
		locale: 'vi_VN',
		type: 'website',
		images: [
			{
				url: absoluteUrl('/brand/learning-as-becoming-og.jpg'),
				width: 1200,
				height: 630,
				alt: 'Duy Khánh — Giảng viên, người thiết kế chương trình học và người viết.',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Duy Khánh — Giảng viên, người thiết kế chương trình học và người viết',
		description:
			'Duy Khánh giảng dạy, thiết kế chương trình học và viết về cách con người học, làm việc và trưởng thành.',
		images: [absoluteUrl('/brand/learning-as-becoming-og.jpg')],
	},
};

export default async function Home() {
	const posts = await getLatestPosts(3);
	const podcast = getHomePodcastEpisode();
	const homepageDescription =
		'Duy Khánh giảng dạy, thiết kế chương trình học và viết về cách con người học, làm việc và trưởng thành.';

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
			<HomeWriting posts={posts} podcast={podcast} />
			<HomeClosingCta />
		</main>
	);
}
