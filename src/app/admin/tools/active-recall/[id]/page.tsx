import { notFound, redirect } from 'next/navigation';

import { getAdminRecallDeck } from '@/features/active-recall';
import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

export default async function LegacyEditActiveRecallRedirect({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const deck = await getAdminRecallDeck(id);
	if (!deck) notFound();
	redirect(routes.mySpaceTeachingRecallEdit(deck.courseId, deck.id));
}
