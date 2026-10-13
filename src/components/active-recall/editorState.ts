import type { ActiveRecallDeckDTO } from '@/features/active-recall';

export type EditorCard = {
	id?: string;
	localId: string;
	question: string;
	answer: string;
	questionVi: string;
	answerVi: string;
};

export const emptyCard = (): EditorCard => ({
	localId: crypto.randomUUID(),
	question: '',
	answer: '',
	questionVi: '',
	answerVi: '',
});

export function deckCards(deck: ActiveRecallDeckDTO | null): EditorCard[] {
	return (
		deck?.cards.map((card) => ({
			id: card.id,
			localId: card.id,
			question: card.question,
			answer: card.answer,
			questionVi: card.questionVi,
			answerVi: card.answerVi,
		})) ?? []
	);
}

export function deckSnapshot(deck: ActiveRecallDeckDTO) {
	return JSON.stringify({
		title: deck.title,
		slug: deck.slug,
		subject: deck.subject,
		lessonLabel: deck.lessonLabel,
		description: deck.description,
		status: deck.status,
		cards: deck.cards.map(({ id, question, answer, questionVi, answerVi }) => ({
			id,
			question,
			answer,
			questionVi,
			answerVi,
		})),
	});
}
