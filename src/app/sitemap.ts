import type { MetadataRoute } from 'next';

import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { projects } from '@/features/portfolio';

export default function sitemap(): MetadataRoute.Sitemap {
	const now = new Date();
	return [
		{ url: absoluteUrl(routes.home), lastModified: now, changeFrequency: 'weekly', priority: 1 },
		{ url: absoluteUrl(routes.about), lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
		{ url: absoluteUrl(routes.projects), lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
		...projects.map((project) => ({ url: absoluteUrl(routes.project(project.slug)), lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 })),
		{ url: absoluteUrl(routes.services), lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
		{ url: absoluteUrl(routes.contact), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
	];
}
