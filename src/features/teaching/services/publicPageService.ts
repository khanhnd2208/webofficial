import type { TeachingClassPublicLink } from '@prisma/client';

import { withUniqueConflict } from '../domain/prismaErrors';
import * as repo from '../repositories/teachingRepository';
import type { UpdateTeachingPublicPageInput } from '../schemas';
import type { TeachingPublicLink, TeachingPublicPageConfig } from '../types';
import { getTeachingClass, notFound } from './classService';
import { mapClass } from './mappers';

function mapPublicLink(link: TeachingClassPublicLink): TeachingPublicLink {
	return {
		id: link.id,
		label: link.label,
		url: link.url,
		description: link.description,
		displayOrder: link.displayOrder,
	};
}

export async function getTeachingPublicPageConfig(
	classId: string,
): Promise<TeachingPublicPageConfig> {
	const row = await repo.getPublicPageConfig(classId);
	if (!row) notFound();
	return {
		class: mapClass(row),
		links: row.publicLinks.map(mapPublicLink),
	};
}

export async function updateTeachingPublicPage(
	classId: string,
	input: UpdateTeachingPublicPageInput,
): Promise<TeachingPublicPageConfig> {
	const existing = await repo.getPublicPageConfig(classId);
	if (!existing) notFound();

	const updated = await withUniqueConflict('This public URL is already used by another class', () =>
		repo.updatePublicPageConfig(classId, {
			publicSlug: input.publicSlug,
			publicTitle: input.publicTitle,
			publicSummary: input.publicSummary,
			publicDescription: input.publicDescription,
			publicAnnouncement: input.publicAnnouncement,
			links: input.links.map((link) => ({
				label: link.label,
				url: link.url,
				description: link.description ?? '',
			})),
		}),
	);

	return {
		class: mapClass(updated),
		links: updated.publicLinks.map(mapPublicLink),
	};
}

export async function ensureTeachingPublicDefaults(
	classId: string,
): Promise<TeachingPublicPageConfig> {
	const config = await getTeachingPublicPageConfig(classId);
	if (config.class.publicSlug) return config;
	const teachingClass = await getTeachingClass(classId);
	const slug = `${teachingClass.courseCode}-${teachingClass.groupNo}-${teachingClass.term}`
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 80);
	return {
		...config,
		class: {
			...config.class,
			publicSlug: slug,
			publicTitle: teachingClass.courseName,
		},
	};
}
