import type { CardDeck, RoleDefinition } from '@/features/werewolf/types';

export const CARD_DECKS = ['classic', 'van-son-2026'] as const;
export const DEFAULT_CARD_DECK: CardDeck = 'classic';
export const VAN_SON_DECK_LABEL = 'Ma Sói - Vân Sơn 26 - 28/9/2026';

export function isCardDeck(value: unknown): value is CardDeck {
	return value === 'classic' || value === 'van-son-2026';
}

/** Unknown or pre-edition rooms keep the original artwork. */
export function getCardDeck(value: unknown): CardDeck {
	return isCardDeck(value) ? value : DEFAULT_CARD_DECK;
}

export function getRoleImage(role: RoleDefinition, cardDeck: CardDeck = DEFAULT_CARD_DECK) {
	return cardDeck === 'van-son-2026'
		? `/board-game/ma-soi/van-son-2026/${role.roleId}.webp`
		: role.image;
}
