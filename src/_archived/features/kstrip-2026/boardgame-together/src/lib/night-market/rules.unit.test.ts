import { describe, expect, it } from 'vitest';

import { COMMODITIES, DEFAULT_NIGHT_MARKET_SETTINGS } from '@/config/nightMarket';
import { createBotObservation } from '@/lib/night-market/bot';
import { buildDeck, emptyStats, isTruthyBag, scoreGame, settleBag } from '@/lib/night-market/rules';
import type { NightMarketGameState, NightMarketPlayerState } from '@/types/nightMarket';

function player(id: string): NightMarketPlayerState {
	return { id, name: id, controller: id === 'bot' ? 'bot' : 'human', botProfile: id === 'bot' ? 'balanced' : undefined, seat: 0, connected: true, lastSeenAt: new Date().toISOString(), ready: true, money: 25, hand: [], stall: [], stats: emptyStats() };
}

function game(players: NightMarketPlayerState[]): NightMarketGameState {
	return { name: 'test', settings: DEFAULT_NIGHT_MARKET_SETTINGS, phase: 'packing', cycle: 1, round: 1, gateSeat: 0, deck: buildDeck('test'), drawIndex: 0, confiscated: [], players, bribes: [], bets: [], messages: [], revealOrder: [], revealIndex: 0, results: [], processedActionIds: [], seed: 'test' };
}

describe('night market rules', () => {
	it('builds the exact 200-card catalog', () => {
		const deck = buildDeck('catalog');
		expect(deck).toHaveLength(200);
		for (const definition of Object.values(COMMODITIES)) {
			expect(deck.filter((card) => card.commodity === definition.id)).toHaveLength(definition.count);
		}
		expect(new Set(deck.map((card) => card.id)).size).toBe(200);
	});

	it('detects truthful and mixed bags', () => {
		const state = game([player('gate'), player('merchant')]);
		const cakes = state.deck.filter((card) => card.commodity === 'festival-cake').slice(0, 2);
		const tea = state.deck.find((card) => card.commodity === 'cloud-tea')!;
		const cards = new Map(state.deck.map((card) => [card.id, card]));
		expect(isTruthyBag({ cardIds: cakes.map((card) => card.id), declaration: 'festival-cake', lockedAt: '' }, cards)).toBe(true);
		expect(isTruthyBag({ cardIds: [cakes[0].id, tea.id], declaration: 'festival-cake', lockedAt: '' }, cards)).toBe(false);
	});

	it('confiscates only misdeclared goods and transfers their penalties', () => {
		const gate = player('gate'); const merchant = player('merchant'); const state = game([gate, merchant]);
		const cake = state.deck.find((card) => card.commodity === 'festival-cake')!;
		const relic = state.deck.find((card) => card.commodity === 'royal-relic')!;
		merchant.bag = { cardIds: [cake.id, relic.id], declaration: 'festival-cake', decision: 'inspect', lockedAt: '' };
		settleBag(state, merchant, gate);
		expect(merchant.stall).toEqual([cake.id]);
		expect(state.confiscated).toEqual([relic.id]);
		expect(merchant.money).toBe(19);
		expect(gate.money).toBe(31);
	});

	it('does not award market leadership for a commodity nobody owns', () => {
		const state = game([player('a'), player('b'), player('c')]);
		const scores = scoreGame(state);
		expect(scores.every((score) => score.marketBonus === 0)).toBe(true);
	});

	it('bot observations never contain another player hand or bag contents', () => {
		const bot = player('bot'); const other = player('other'); const state = game([bot, other]);
		bot.hand = ['own-secret'];
		other.hand = ['other-secret'];
		other.bag = { cardIds: ['bag-secret'], declaration: 'night-silk', lockedAt: '' };
		const observation = createBotObservation(state, bot);
		expect(observation.ownHand).toEqual(['own-secret']);
		expect(JSON.stringify(observation)).not.toContain('other-secret');
		expect(JSON.stringify(observation)).not.toContain('bag-secret');
		expect(observation.publicBags[0]).toEqual({ playerId: 'other', count: 1, declaration: 'night-silk' });
	});
});
