import { redirect } from 'next/navigation';
import { getKnowledgeUnit } from '@/features/my-class';
import { courseWorkspacePath } from '@/features/my-class/domain/workspaceUrl';
import { rethrowUnlessNotFound } from '@/lib/pageErrors';

export const dynamic = 'force-dynamic';

export default async function KnowledgeUnitRedirectPage({
	params,
	searchParams,
}: {
	params: Promise<{ courseSlug: string; kuSlug: string }>;
	searchParams: Promise<{ lesson?: string; section?: string; level?: string }>;
}) {
	const { courseSlug, kuSlug } = await params;
	const query = await searchParams;
	let data;
	try {
		data = await getKnowledgeUnit(courseSlug, kuSlug, {
			lessonSlug: query.lesson,
			sectionId: query.section,
		});
	} catch (error) {
		rethrowUnlessNotFound(error);
	}
	redirect(
		courseWorkspacePath(courseSlug, {
			lesson: data.context.lessonSlug,
			s: data.context.sectionSlug,
			unit: data.unit.slug,
			level:
				query.level === 'readable' || query.level === 'academic' || query.level === 'deep'
					? query.level
					: undefined,
		}),
	);
}
