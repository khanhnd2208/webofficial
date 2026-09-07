import { notFound, permanentRedirect } from 'next/navigation';

import { resolvePublicClassSlugForDeck } from '@/features/active-recall';
import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

export default async function LegacyActiveRecallDeckRedirect({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const classSlug = await resolvePublicClassSlugForDeck(slug);
	if (!classSlug) notFound();
	permanentRedirect(routes.teachingPublicRecallDeck(classSlug, slug));
}
