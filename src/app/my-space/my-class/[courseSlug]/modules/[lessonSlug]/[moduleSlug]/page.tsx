import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { readGuestId } from '@/features/myspace-tests/guestIdentity';
import { guestActorKey, userActorKey } from '@/features/my-class/domain/actor';
import { getCourse, loadCourseLearnerState } from '@/features/my-class';
import { routes } from '@/config/routes';
import KnowledgeHeader from '@/components/knowledge/KnowledgeHeader';
import ModuleOverview from '@/components/knowledge/ModuleOverview';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
	params,
}: {
	params: Promise<{ courseSlug: string; lessonSlug: string; moduleSlug: string }>;
}): Promise<Metadata> {
	try {
		const { courseSlug, lessonSlug, moduleSlug } = await params;
		const course = await getCourse(courseSlug);
		const lesson = course.lessons.find((item) => item.slug === lessonSlug);
		const section = lesson?.sections.find((item) => item.slug === moduleSlug);
		return {
			title: `${section?.title ?? course.title} | Kho kiến thức`,
			description: section?.summary || course.summary,
			alternates: { canonical: routes.myClassModule(courseSlug, lessonSlug, moduleSlug) },
		};
	} catch {
		return { title: 'Kho kiến thức' };
	}
}

export default async function MyClassModulePage({
	params,
}: {
	params: Promise<{ courseSlug: string; lessonSlug: string; moduleSlug: string }>;
}) {
	const { courseSlug, lessonSlug, moduleSlug } = await params;
	const course = await getCourse(courseSlug);
	const lesson = course.lessons.find((item) => item.slug === lessonSlug);
	if (!lesson || !lesson.sections.some((item) => item.slug === moduleSlug)) notFound();
	const session = await auth();
	const userId = (session?.user as { id?: string } | undefined)?.id;
	const guestId = userId ? null : await readGuestId();
	const actor = userId
		? { type: 'user' as const, userId, actorKey: userActorKey(userId) }
		: guestId
			? { type: 'guest' as const, guestId, actorKey: guestActorKey(guestId) }
			: null;
	const { learnerState } = await loadCourseLearnerState(courseSlug, actor);
	return (
		<>
			<KnowledgeHeader
				crumb={`${course.title} · ${lesson.title}`}
				user={session?.user ?? null}
				loginHref={`${routes.login}?from=${encodeURIComponent(routes.myClassModule(courseSlug, lessonSlug, moduleSlug))}`}
			/>
			<ModuleOverview
				course={course}
				state={learnerState}
				lessonSlug={lessonSlug}
				moduleSlug={moduleSlug}
			/>
		</>
	);
}
