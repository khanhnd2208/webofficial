import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { readGuestId } from '@/features/myspace-tests/guestIdentity';
import { guestActorKey, userActorKey } from '@/features/my-class/domain/actor';
import { getCourse, loadCourseLearnerState } from '@/features/my-class';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import KnowledgeHeader from '@/components/knowledge/KnowledgeHeader';
import SubjectOverview from '@/components/knowledge/SubjectOverview';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ courseSlug: string }> }): Promise<Metadata> {
	try {
		const { courseSlug } = await params;
		const course = await getCourse(courseSlug);
		return { title: `${course.title} | Kho kiến thức`, description: course.summary || course.description, alternates: { canonical: absoluteUrl(routes.myClassCourse(course.slug)) } };
	} catch { return { title: 'Kho kiến thức' }; }
}

export default async function MyClassCoursePage({ params, searchParams }: { params: Promise<{ courseSlug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
	const { courseSlug } = await params;
	const query = await searchParams;
	if (query.view === 'vocab') redirect(routes.myClassVocabIndex(courseSlug));
	const course = await getCourse(courseSlug);
	const session = await auth();
	const userId = (session?.user as { id?: string } | undefined)?.id;
	const guestId = userId ? null : await readGuestId();
	const actor = userId
		? { type: 'user' as const, userId, actorKey: userActorKey(userId) }
		: guestId
			? { type: 'guest' as const, guestId, actorKey: guestActorKey(guestId) }
			: null;
	if (query.lesson && query.unit) {
		redirect(routes.myClassUnit(courseSlug, String(query.lesson), String(query.unit), { sectionSlug: typeof query.s === 'string' ? query.s : null, level: query.level === 'readable' ? 'short' : query.level === 'academic' || query.level === 'deep' ? 'deep' : null }));
	}
	const { learnerState } = await loadCourseLearnerState(courseSlug, actor);
	return <><KnowledgeHeader crumb={course.title} user={session?.user ?? null} loginHref={`${routes.login}?from=${encodeURIComponent(routes.myClassCourse(courseSlug))}`} /><SubjectOverview course={course} state={learnerState} /></>;
}
