import type { MetadataRoute } from 'next';

import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { areNotesPublic, getPublishedNotes } from '@/content/notes';
import { projects } from '@/features/portfolio';

export default function sitemap(): MetadataRoute.Sitemap {
	const now = new Date();
	const entries: MetadataRoute.Sitemap = [
		{ url: absoluteUrl(routes.home), lastModified: now, changeFrequency: 'weekly', priority: 1 },
		{ url: absoluteUrl(routes.about), lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
		{
			url: absoluteUrl(routes.projects),
			lastModified: now,
			changeFrequency: 'monthly',
			priority: 0.9,
		},
		...projects.map((project) => ({
			url: absoluteUrl(routes.project(project.slug)),
			lastModified: now,
			changeFrequency: 'monthly' as const,
			priority: 0.8,
		})),
		{
			url: absoluteUrl(routes.services),
			lastModified: now,
			changeFrequency: 'monthly',
			priority: 0.9,
		},
		{
			url: absoluteUrl(routes.contact),
			lastModified: now,
			changeFrequency: 'monthly',
			priority: 0.8,
		},
	];

	if (areNotesPublic()) {
		entries.push({
			url: absoluteUrl(routes.notes),
			lastModified: now,
			changeFrequency: 'weekly',
			priority: 0.8,
		});
		for (const note of getPublishedNotes()) {
			entries.push({
				url: absoluteUrl(routes.note(note.slug)),
				lastModified: new Date(note.date),
				changeFrequency: 'monthly',
				priority: 0.7,
			});
		}
	}

	return entries;
}
