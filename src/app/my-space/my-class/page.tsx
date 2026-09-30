import type { Metadata } from 'next';
import { getActorProgress, listCourses } from '@/features/my-class';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { auth } from '@/lib/auth';
import { readGuestId } from '@/features/myspace-tests/guestIdentity';
import { guestActorKey, userActorKey } from '@/features/my-class/domain/actor';
import KnowledgeHeader from '@/components/knowledge/KnowledgeHeader';
import SubjectCatalog from '@/components/knowledge/SubjectCatalog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Kho kiến thức | My Space',
	description: 'Hệ thống tổng hợp kiến thức theo môn học, Unit và module.',
	alternates: { canonical: absoluteUrl(routes.myClass) },
};

export default async function MyClassPage() {
	const [courses, session] = await Promise.all([listCourses(), auth()]);
	const userId = (session?.user as { id?: string } | undefined)?.id;
	const guestId = userId ? null : await readGuestId();
	const actor = userId
		? { type: 'user' as const, userId, actorKey: userActorKey(userId) }
		: guestId
			? { type: 'guest' as const, guestId, actorKey: guestActorKey(guestId) }
			: null;
	const progress = await getActorProgress(actor);
	const loginHref = `${routes.login}?from=${encodeURIComponent(routes.myClass)}`;

	return (
		<>
			<KnowledgeHeader user={session?.user ?? null} loginHref={loginHref} />
			<SubjectCatalog courses={courses} progress={progress.courses} />
		</>
	);
}
