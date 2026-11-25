import type { Metadata } from 'next';

import RecallCourseIndex, {
	type RecallIndexGroup,
} from '@/components/active-recall/RecallCourseIndex';
import { routes } from '@/config/routes';
import { listPublishedRecallDecks } from '@/features/active-recall';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Active Recall',
	description: 'Bộ thẻ câu hỏi và đáp án để tự kiểm tra kiến thức.',
};

export default async function ActiveRecallIndexPage() {
	const decks = await listPublishedRecallDecks();
	// One lesson list per course, in the order the decks are already sorted.
	const groups = new Map<string, RecallIndexGroup>();
	for (const deck of decks) {
		const key = deck.courseId || deck.subject || 'other';
		const group = groups.get(key) ?? { id: key, title: deck.courseName || 'Bộ thẻ', decks: [] };
		group.decks.push({
			id: deck.id,
			href: routes.activeRecallDeck(deck.slug),
			title: deck.title,
			lessonLabel: deck.lessonLabel,
			description: deck.description,
			cardIds: deck.cardIds,
		});
		groups.set(key, group);
	}
	return <RecallCourseIndex kicker="Ôn tập" title="Active Recall" groups={[...groups.values()]} />;
}
