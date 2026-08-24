import { notFound } from 'next/navigation';

import ActiveRecallEditor from '@/components/active-recall/ActiveRecallEditor';
import { getAdminRecallDeck } from '@/features/active-recall';

export const dynamic = 'force-dynamic';

export default async function EditActiveRecallDeckPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const deck = await getAdminRecallDeck(id);
	if (!deck) notFound();
	return <ActiveRecallEditor initialDeck={deck} />;
}
