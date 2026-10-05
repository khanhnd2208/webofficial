'use client';

import { useT } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import { cn } from '@/features/board-game-shared/lib/cn';
import { CARD_DECKS, VAN_SON_DECK_LABEL } from '@/features/werewolf/config/cardDecks';
import type { CardDeck } from '@/features/werewolf/types';

interface Props {
	value: CardDeck;
	disabled: boolean;
	onChange: (deck: CardDeck) => void;
}

export default function CardDeckSelector({ value, disabled, onChange }: Props) {
	const t = useT();
	return (
		<fieldset
			disabled={disabled}
			className="space-y-3 rounded-2xl border border-border bg-surface p-4"
		>
			<legend className="px-1 font-display text-base font-semibold text-ink">
				{t('mafia.deck.title')}
			</legend>
			<div className="grid gap-2 sm:grid-cols-2">
				{CARD_DECKS.map((deck) => (
					<button
						key={deck}
						type="button"
						aria-pressed={value === deck}
						onClick={() => {
							if (value !== deck) onChange(deck);
						}}
						className={cn(
							'min-h-12 rounded-xl border-2 px-3 py-3 text-left text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60',
							value === deck
								? 'border-accent bg-accent/10 text-ink'
								: 'border-border text-muted-foreground hover:border-accent/50',
						)}
					>
						{deck === 'classic' ? t('mafia.deck.classic') : VAN_SON_DECK_LABEL}
					</button>
				))}
			</div>
			<p className="text-sm text-muted-foreground">{t('mafia.deck.description')}</p>
		</fieldset>
	);
}
