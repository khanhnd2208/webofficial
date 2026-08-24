import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { readGuestId } from '@/features/myspace-tests/guestIdentity';
import { guestActorKey, userActorKey } from '@/features/my-class/domain/actor';
import { getCourse, getKnowledgeUnit, loadCourseLearnerState } from '@/features/my-class';
import { isReservedLessonSlug } from '@/features/my-class/domain/workspaceUrl';
import { routes } from '@/config/routes';
import KnowledgeHeader from '@/components/knowledge/KnowledgeHeader';
import KnowledgeWorkspace from '@/components/knowledge/KnowledgeWorkspace';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ courseSlug: string; lessonSlug: string; unitSlug: string }> }): Promise<Metadata> {
	try {
		const { courseSlug, lessonSlug, unitSlug } = await params;
		const course = await getCourse(courseSlug);
		const unit = course.lessons.find((lesson) => lesson.slug === lessonSlug)?.sections.flatMap((section) => section.knowledgeUnits).find((item) => item.slug === unitSlug);
		return { title: `${unit?.title ?? course.title} | Kho kiến thức`, description: unit?.summary || course.summary, alternates: { canonical: routes.myClassUnit(courseSlug, lessonSlug, unitSlug) } };
	} catch { return { title: 'Kho kiến thức' }; }
}

export default async function MyClassUnitPage({ params, searchParams }: { params: Promise<{ courseSlug: string; lessonSlug: string; unitSlug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
	const { courseSlug, lessonSlug, unitSlug } = await params;
	if (isReservedLessonSlug(lessonSlug)) notFound();
	const query = await searchParams;
	const course = await getCourse(courseSlug);
	const lesson = course.lessons.find((item) => item.slug === lessonSlug);
	const section = lesson?.sections.find((item) => item.slug === query.s) ?? lesson?.sections.find((item) => item.knowledgeUnits.some((unit) => unit.slug === unitSlug));
	if (!lesson || !section || !section.knowledgeUnits.some((item) => item.slug === unitSlug)) notFound();
	const session = await auth();
	const userId = (session?.user as { id?: string } | undefined)?.id;
	const guestId = userId ? null : await readGuestId();
	const actor = userId ? { type: 'user' as const, userId, actorKey: userActorKey(userId) } : guestId ? { type: 'guest' as const, guestId, actorKey: guestActorKey(guestId) } : null;
	const { learnerState } = await loadCourseLearnerState(courseSlug, actor);
	const detail = await getKnowledgeUnit(courseSlug, unitSlug, { lessonSlug, sectionId: section.id });
	const mode = query.level === 'readable' ? 'short' : query.level === 'academic' || query.level === 'deep' ? 'deep' : 'short';
	return <><KnowledgeHeader crumb={`${course.title} · ${lesson.title}`} user={session?.user ?? null} loginHref={`${routes.login}?from=${encodeURIComponent(routes.myClassCourse(courseSlug))}`} /><KnowledgeWorkspace course={course} initialState={learnerState} initialLessonSlug={lessonSlug} initialUnitSlug={unitSlug} initialSectionSlug={section.slug} initialContent={{ ...detail, progress: learnerState }} initialMode={mode} /></>;
}
