import type { MetadataRoute } from 'next';

import { isPublicLearningFeatureEnabled } from '@/config/publicFeatureAccess';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { areNotesPublic, getPublishedNotes } from '@/content/notes';
import { getCourse, hasPublishedCourses, listCourses } from '@/features/my-class';
import { projects } from '@/features/portfolio';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const now = new Date();
	const entries: MetadataRoute.Sitemap = [
		{ url: absoluteUrl(routes.home), lastModified: now, changeFrequency: 'weekly', priority: 1 },
		{ url: absoluteUrl(routes.toc), lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
		{
			url: absoluteUrl(routes.about),
			lastModified: now,
			changeFrequency: 'monthly',
			priority: 0.9,
		},
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
			url: absoluteUrl(routes.mySpace),
			lastModified: now,
			changeFrequency: 'monthly',
			priority: 0.7,
		},
		{
			url: absoluteUrl(routes.contact),
			lastModified: now,
			changeFrequency: 'monthly',
			priority: 0.8,
		},
	];

	if (isPublicLearningFeatureEnabled('tests')) {
		entries.push({
			url: absoluteUrl(routes.mySpaceTests),
			lastModified: now,
			changeFrequency: 'weekly',
			priority: 0.65,
		});
	}

	if (isPublicLearningFeatureEnabled('knowledge') && (await hasPublishedCourses())) {
		entries.push({
			url: absoluteUrl(routes.myClass),
			lastModified: now,
			changeFrequency: 'weekly',
			priority: 0.7,
		});
		for (const card of await listCourses()) {
			entries.push({
				url: absoluteUrl(card.firstUnitHref ?? routes.myClassCourse(card.slug)),
				lastModified: now,
				changeFrequency: 'weekly',
				priority: 0.65,
			});
			const course = await getCourse(card.slug);
			for (const lesson of course.lessons) {
				for (const section of lesson.sections) {
					for (const unit of section.knowledgeUnits) {
						entries.push({
							url: absoluteUrl(routes.myClassUnit(card.slug, lesson.slug, unit.slug)),
							lastModified: now,
							changeFrequency: 'weekly',
							priority: 0.55,
						});
					}
				}
			}
		}
	}

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
