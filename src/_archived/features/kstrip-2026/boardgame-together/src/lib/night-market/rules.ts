import {
	COMMODITIES,
	LEGAL_COMMODITIES,
	NIGHT_MARKET_HAND_SIZE,
	SECRET_MISSIONS,
} from '@/config/nightMarket';
import { shuffleSeeded } from '@/lib/night-market/random';
import type {
	CommodityCard,
	CommodityId,
	LegalCommodityId,
	NightMarketGameState,
	NightMarketPlayerState,
	NightMarketResult,
	PackedBag,
	PlayerStats,
	SecretMissionId,
} from '@/types/nightMarket';

export function emptyStats(): PlayerStats {
	return {
		bagsSent: 0, truths: 0, lies: 0, contrabandPassed: 0, confiscated: 0,
		penaltiesPaid: 0, compensationReceived: 0, bribesPaid: 0, bribesReceived: 0,
		betsPlaced: 0, betsWon: 0, inspections: 0, correctInspections: 0,
		truthsInspected: 0, wrongInspections: 0, acceptedBribes: 0,
		biggestBluffValue: 0, costliestTruth: 0,
	};
}

export function buildDeck(seed: string, prefix = 'a'): CommodityCard[] {
	const cards: CommodityCard[] = [];
	for (const commodity of Object.values(COMMODITIES)) {
		for (let index = 0; index < commodity.count; index += 1) {
			cards.push({ id: `${prefix}-${commodity.id}-${index}`, commodity: commodity.id });
		}
	}
	return shuffleSeeded(cards, seed);
}

export function cardMap(game: Pick<NightMarketGameState, 'deck'>): Map<string, CommodityCard> {
	return new Map(game.deck.map((card) => [card.id, card]));
}

export function drawCards(game: NightMarketGameState, player: NightMarketPlayerState): void {
	while (player.hand.length < NIGHT_MARKET_HAND_SIZE && game.drawIndex < game.deck.length) {
		player.hand.push(game.deck[game.drawIndex].id);
		game.drawIndex += 1;
	}
}

export function isTruthyBag(bag: PackedBag, cards: Map<string, CommodityCard>): boolean {
	return bag.cardIds.every((id) => cards.get(id)?.commodity === bag.declaration);
}

export function validatePack(
	player: NightMarketPlayerState,
	cardIds: string[],
	declaration: LegalCommodityId,
): void {
	if (cardIds.length < 1 || cardIds.length > 5) throw new Error('INVALID_BAG_SIZE');
	if (!LEGAL_COMMODITIES.includes(declaration)) throw new Error('INVALID_DECLARATION');
	if (new Set(cardIds).size !== cardIds.length) throw new Error('DUPLICATE_CARD');
	if (!cardIds.every((id) => player.hand.includes(id))) throw new Error('CARD_NOT_IN_HAND');
}

export function packBag(
	player: NightMarketPlayerState,
	cardIds: string[],
	declaration: LegalCommodityId,
	now: Date,
): void {
	validatePack(player, cardIds, declaration);
	player.hand = player.hand.filter((id) => !cardIds.includes(id));
	player.bag = { cardIds: [...cardIds], declaration, lockedAt: now.toISOString() };
}

function transferCard(cardId: string, from: string[], to: string[]): void {
	const index = from.indexOf(cardId);
	if (index >= 0) {
		from.splice(index, 1);
		to.push(cardId);
	}
}

export function settleBag(
	game: NightMarketGameState,
	merchant: NightMarketPlayerState,
	gate: NightMarketPlayerState,
): void {
	const bag = merchant.bag;
	if (!bag || bag.settled) return;
	const cards = cardMap(game);
	const truthful = isTruthyBag(bag, cards);
	bag.truthful = truthful;
	bag.settled = true;
	merchant.stats.bagsSent += 1;
	if (truthful) merchant.stats.truths += 1;
	else merchant.stats.lies += 1;

	const bribe = game.bribes.find((item) => item.merchantId === merchant.id && item.accepted);
	const decision = bribe ? 'pass' : (bag.decision ?? 'pass');
	bag.decision = decision;
	if (decision === 'pass') {
		for (const id of bag.cardIds) {
			merchant.stall.push(id);
			if (!COMMODITIES[cards.get(id)!.commodity].legal) merchant.stats.contrabandPassed += 1;
		}
		if (!truthful) {
			const value = bag.cardIds.reduce((total, id) => total + COMMODITIES[cards.get(id)!.commodity].value, 0);
			merchant.stats.biggestBluffValue = Math.max(merchant.stats.biggestBluffValue, value);
		}
		if (bribe) {
			merchant.money -= bribe.money;
			gate.money += bribe.money;
			merchant.stats.bribesPaid += bribe.money;
			gate.stats.bribesReceived += bribe.money;
			merchant.stats.acceptedBribes += 1;
			if (bribe.stallCardId) transferCard(bribe.stallCardId, merchant.stall, gate.stall);
		}
	} else {
		gate.stats.inspections += 1;
		if (truthful) {
			const compensation = bag.cardIds.reduce(
				(total, id) => total + COMMODITIES[cards.get(id)!.commodity].penalty,
				0,
			);
			bag.compensation = compensation;
			gate.money -= compensation;
			merchant.money += compensation;
			merchant.stats.compensationReceived += compensation;
			merchant.stats.costliestTruth = Math.max(merchant.stats.costliestTruth, compensation);
			gate.stats.wrongInspections += 1;
			merchant.stats.truthsInspected += 1;
			merchant.stall.push(...bag.cardIds);
		} else {
			gate.stats.correctInspections += 1;
			const wrong = bag.cardIds.filter((id) => cards.get(id)?.commodity !== bag.declaration);
			const correct = bag.cardIds.filter((id) => cards.get(id)?.commodity === bag.declaration);
			const penalty = wrong.reduce(
				(total, id) => total + COMMODITIES[cards.get(id)!.commodity].penalty,
				0,
			);
			bag.penalty = penalty;
			bag.confiscatedCardIds = wrong;
			merchant.money -= penalty;
			gate.money += penalty;
			merchant.stats.penaltiesPaid += penalty;
			merchant.stats.confiscated += wrong.length;
			merchant.stall.push(...correct);
			game.confiscated.push(...wrong);
		}
	}

	for (const bet of game.bets.filter((item) => item.targetId === merchant.id && !item.settled)) {
		bet.settled = true;
		bet.won = bet.prediction === (truthful ? 'truth' : 'lie');
		const bettor = game.players.find((player) => player.id === bet.bettorId);
		if (bettor && bet.won) {
			bettor.money += bet.amount * 2;
			bettor.stats.betsWon += 1;
		}
	}
}

function commodityCounts(player: NightMarketPlayerState, cards: Map<string, CommodityCard>) {
	const counts = new Map<CommodityId, number>();
	for (const id of player.stall) {
		const commodity = cards.get(id)?.commodity;
		if (commodity) counts.set(commodity, (counts.get(commodity) ?? 0) + 1);
	}
	return counts;
}

export function missionCompleted(
	mission: SecretMissionId,
	player: NightMarketPlayerState,
	game: NightMarketGameState,
): boolean {
	const cards = cardMap(game);
	const counts = commodityCounts(player, cards);
	const leaders = (commodity: LegalCommodityId) => {
		const mine = counts.get(commodity) ?? 0;
		return mine > 0 && game.players.every((other) => (commodityCounts(other, cards).get(commodity) ?? 0) <= mine);
	};
	switch (mission) {
		case 'cake-keeper': return (counts.get('festival-cake') ?? 0) >= 8;
		case 'tea-master': return leaders('cloud-tea');
		case 'pottery-collector': return (counts.get('moon-pottery') ?? 0) >= 6;
		case 'silk-merchant': return leaders('night-silk');
		case 'balanced-stall': return LEGAL_COMMODITIES.every((id) => (counts.get(id) ?? 0) >= 3);
		case 'contraband-runner': return player.stats.contrabandPassed >= 4;
		case 'clean-merchant':
			return player.stall.length >= 16 && player.stall.every((id) => COMMODITIES[cards.get(id)!.commodity].legal);
		case 'money-keeper': return player.money >= 30;
		case 'negotiator': return player.stats.acceptedBribes >= 3;
		case 'dangerous-truth': return player.stats.truthsInspected >= 2;
	}
}

function marketBonuses(game: NightMarketGameState): Map<string, number> {
	const cards = cardMap(game);
	const bonuses = new Map(game.players.map((player) => [player.id, 0]));
	for (const commodity of LEGAL_COMMODITIES) {
		const ranking = game.players
			.map((player) => ({ player, count: commodityCounts(player, cards).get(commodity) ?? 0 }))
			.sort((a, b) => b.count - a.count);
		const top = ranking[0]?.count ?? 0;
		if (top === 0) continue;
		const first = ranking.filter((entry) => entry.count === top);
		if (first.length > 1) {
			const share = Math.floor(12 / first.length);
			for (const entry of first) bonuses.set(entry.player.id, (bonuses.get(entry.player.id) ?? 0) + share);
			continue;
		}
		if (first[0]) bonuses.set(first[0].player.id, (bonuses.get(first[0].player.id) ?? 0) + 8);
		const secondCount = ranking.find((entry) => entry.count < top)?.count;
		if (secondCount == null) continue;
		const second = ranking.filter((entry) => entry.count === secondCount);
		const share = Math.floor(4 / second.length);
		for (const entry of second) bonuses.set(entry.player.id, (bonuses.get(entry.player.id) ?? 0) + share);
	}
	return bonuses;
}

export function scoreGame(game: NightMarketGameState): NightMarketResult[] {
	const cards = cardMap(game);
	const bonuses = marketBonuses(game);
	const scored = game.players.map((player) => {
		const goodsPoints = player.stall.reduce(
			(total, id) => total + COMMODITIES[cards.get(id)!.commodity].value,
			0,
		);
		const completed = player.mission ? missionCompleted(player.mission, player, game) : false;
		const missionBonus = completed ? 6 : 0;
		const marketBonus = bonuses.get(player.id) ?? 0;
		return {
			playerId: player.id,
			moneyPoints: player.money,
			goodsPoints,
			marketBonus,
			missionBonus,
			total: player.money + goodsPoints + marketBonus + missionBonus,
			rank: 0,
			...(player.mission ? { missionCompleted: completed } : {}),
		};
	});
	scored.sort((a, b) => {
		if (b.total !== a.total) return b.total - a.total;
		if (b.moneyPoints !== a.moneyPoints) return b.moneyPoints - a.moneyPoints;
		const pa = game.players.find((player) => player.id === a.playerId)!;
		const pb = game.players.find((player) => player.id === b.playerId)!;
		const legalA = pa.stall.filter((id) => COMMODITIES[cards.get(id)!.commodity].legal).length;
		const legalB = pb.stall.filter((id) => COMMODITIES[cards.get(id)!.commodity].legal).length;
		if (legalB !== legalA) return legalB - legalA;
		if (pb.stats.contrabandPassed !== pa.stats.contrabandPassed) return pb.stats.contrabandPassed - pa.stats.contrabandPassed;
		return pa.stats.penaltiesPaid - pb.stats.penaltiesPaid;
	});
	let rank = 1;
	for (let index = 0; index < scored.length; index += 1) {
		if (index > 0 && scored[index].total < scored[index - 1].total) rank = index + 1;
		scored[index].rank = rank;
	}
	return scored;
}

export function assignMissions(game: NightMarketGameState): void {
	const missions = shuffleSeeded(SECRET_MISSIONS, `${game.seed}:missions`);
	game.players.forEach((player, index) => { player.mission = missions[index % missions.length]; });
}
