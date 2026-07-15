import type { MetadataRoute } from 'next';

import { getPublishedPolicies } from '@/content';
import { hasPublishedPodcastEpisodes } from '@/content/podcast';
import { getPublishedCollections, JOURNAL_PILLARS } from '@/content/journal';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { getLatestPosts } from '@/services/postService';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const now = new Date();
	const staticRoutes: MetadataRoute.Sitemap = [
		{ url: absoluteUrl(routes.home), lastModified: now, changeFrequency: 'weekly', priority: 1 },
		{ url: absoluteUrl(routes.about), lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
		{ url: absoluteUrl(routes.contact), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
		{ url: absoluteUrl(routes.posts), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
	];

	if (hasPublishedPodcastEpisodes()) {
		staticRoutes.push({
			url: absoluteUrl(routes.growth),
			lastModified: now,
			changeFrequency: 'weekly',
			priority: 0.7,
		});
	}

	const policies = getPublishedPolicies().map((p) => ({
		url: absoluteUrl(`/chinh-sach/${p.slug}`),
		lastModified: now,
		changeFrequency: 'yearly' as const,
		priority: 0.3,
	}));

	const pillars = JOURNAL_PILLARS.map((p) => ({
		url: absoluteUrl(routes.postPillar(p.slug)),
		lastModified: now,
		changeFrequency: 'weekly' as const,
		priority: 0.6,
	}));

	const collections = getPublishedCollections().map((c) => ({
		url: absoluteUrl(routes.postCollection(c.slug)),
		lastModified: now,
		changeFrequency: 'weekly' as const,
		priority: 0.6,
	}));

	let posts: MetadataRoute.Sitemap = [];
	try {
		const latest = await getLatestPosts(50);
		posts = latest.map((p) => ({
			url: absoluteUrl(routes.post(p.slug)),
			lastModified: p.publishedAt ? new Date(p.publishedAt) : now,
			changeFrequency: 'weekly' as const,
			priority: 0.7,
		}));
	} catch {
		posts = [];
	}

	return [...staticRoutes, ...policies, ...pillars, ...collections, ...posts];
}
