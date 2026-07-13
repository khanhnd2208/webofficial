import type { MetadataRoute } from 'next';

import {
	getPublishedCaseStudies,
	getPublishedPolicies,
	getPublishedResources,
	getPublishedServices,
} from '@/content';
import { getPublishedCollections, JOURNAL_PILLARS } from '@/content/journal';
import { labCategoryForResource } from '@/content/lab';
import { listPublicCourseTeasers } from '@/features/courses/services/courseService';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { getLatestPosts } from '@/services/postService';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const now = new Date();
	const staticRoutes: MetadataRoute.Sitemap = [
		{ url: absoluteUrl(routes.home), lastModified: now, changeFrequency: 'weekly', priority: 1 },
		{ url: absoluteUrl(routes.about), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
		{ url: absoluteUrl(routes.contact), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
		{ url: absoluteUrl(routes.accompany), lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
		{ url: absoluteUrl(routes.posts), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
		{ url: absoluteUrl(routes.lab), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
		{ url: absoluteUrl(routes.caseStudies), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
		{ url: absoluteUrl(routes.learn), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
		{ url: absoluteUrl(routes.learnPrograms), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
	];

	const services = getPublishedServices().map((s) => ({
		url: absoluteUrl(`${routes.accompany}/${s.slug}`),
		lastModified: now,
		changeFrequency: 'monthly' as const,
		priority: 0.8,
	}));

	const policies = getPublishedPolicies().map((p) => ({
		url: absoluteUrl(`/chinh-sach/${p.slug}`),
		lastModified: now,
		changeFrequency: 'yearly' as const,
		priority: 0.3,
	}));

	const resources = getPublishedResources().map((r) => ({
		url: absoluteUrl(`${routes.lab}/${labCategoryForResource(r.type)}/${r.slug}`),
		lastModified: now,
		changeFrequency: 'monthly' as const,
		priority: 0.5,
	}));

	const cases = getPublishedCaseStudies().map((c) => ({
		url: absoluteUrl(`${routes.caseStudies}/${c.slug}`),
		lastModified: now,
		changeFrequency: 'monthly' as const,
		priority: 0.6,
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

	let courses: MetadataRoute.Sitemap = [];
	try {
		const teasers = await listPublicCourseTeasers();
		courses = teasers.map((c) => ({
			url: absoluteUrl(routes.course(c.slug)),
			lastModified: c.publishedAt ? new Date(c.publishedAt) : now,
			changeFrequency: 'weekly' as const,
			priority: 0.7,
		}));
	} catch {
		courses = [];
	}

	return [
		...staticRoutes,
		...services,
		...policies,
		...resources,
		...cases,
		...pillars,
		...collections,
		...posts,
		...courses,
	];
}
