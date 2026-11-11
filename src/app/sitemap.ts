import type { MetadataRoute } from 'next';

import { isArchivedPublicPath } from '@/config/moduleRegistry';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { aboutPagePaused } from '@/content/about';
import { projects } from '@/features/portfolio';

export default function sitemap(): MetadataRoute.Sitemap {
	const now = new Date();
	const entries: MetadataRoute.Sitemap = [
		{ url: absoluteUrl(routes.home), lastModified: now, changeFrequency: 'weekly', priority: 1 },
		{ url: absoluteUrl(routes.toc), lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
		{
			url: absoluteUrl(routes.discoverCourses),
			lastModified: now,
			changeFrequency: 'weekly',
			priority: 0.9,
		},
		// While the introduction is paused, /gioi-thieu only redirects to /lien-he.
		...(aboutPagePaused
			? []
			: [
					{
						url: absoluteUrl(routes.about),
						lastModified: now,
						changeFrequency: 'monthly' as const,
						priority: 0.9,
					},
				]),
		{
			url: absoluteUrl(routes.experiences),
			lastModified: now,
			changeFrequency: 'weekly',
			priority: 0.85,
		},
		...projects.map((project) => ({
			url: absoluteUrl(routes.project(project.slug)),
			lastModified: now,
			changeFrequency: 'monthly' as const,
			priority: 0.8,
		})),
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
