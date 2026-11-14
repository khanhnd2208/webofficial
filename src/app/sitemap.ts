import type { MetadataRoute } from 'next';

import { isArchivedPublicPath } from '@/config/moduleRegistry';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';

export default function sitemap(): MetadataRoute.Sitemap {
	const now = new Date();
	const entries: MetadataRoute.Sitemap = [
		{ url: absoluteUrl(routes.home), lastModified: now, changeFrequency: 'weekly', priority: 1 },
		{ url: absoluteUrl(routes.toc), lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
		{
			url: absoluteUrl(routes.learnCourses),
			lastModified: now,
			changeFrequency: 'weekly',
			priority: 0.9,
		},
		{
			url: absoluteUrl(routes.contact),
			lastModified: now,
			changeFrequency: 'monthly',
			priority: 0.8,
		},
	];

	return entries.filter((entry) => {
		const path = new URL(entry.url).pathname;
		return !isArchivedPublicPath(path);
	});
}
