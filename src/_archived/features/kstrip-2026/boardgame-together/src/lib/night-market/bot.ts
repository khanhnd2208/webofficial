import { BOT_PROFILES, COMMODITIES, LEGAL_COMMODITIES } from '@/config/nightMarket';
import { seededRandom } from '@/lib/night-market/random';
import { cardMap, packBag } from '@/lib/night-market/rules';
import type {
	BetRecord,
	BotProfile,
	BribeOffer,
	GateDecision,
	LegalCommodityId,
	MarketMessage,
	NightMarketGameState,
	NightMarketPlayerState,
} from '@/types/nightMarket';

export interface BotObservation {
	botId: string;
	profile: BotProfile;
	phase: NightMarketGameState['phase'];
	money: number;
	ownHand?: string[];
	publicBags: Array<{ playerId: string; count: number; declaration: LegalCommodityId }>;
	offersForBot: Array<{ merchantId: string; money: number; hasGoods: boolean }>;
}

export const BOT_NAMES = [
	['Cô Mây', 'Auntie May'], ['Ông Đèn', 'Mister Lantern'], ['Bé Lụa', 'Silky'],
	['Chú Trăng', 'Uncle Moon'], ['Nàng Trà', 'Lady Tea'], ['Kẻ Đeo Mặt Nạ', 'The Mask'],
] as const;

function randomFor(game: NightMarketGameState, bot: NightMarketPlayerState, purpose: string) {
	return seededRandom(`${game.seed}:${game.round}:${bot.id}:${purpose}`);
}

export function createBotObservation(
	game: NightMarketGameState,
	bot: NightMarketPlayerState,
): BotObservation {
	return {
		botId: bot.id,
		profile: bot.botProfile ?? 'balanced',
		phase: game.phase,
		money: bot.money,
		ownHand: bot.hand,
		publicBags: game.players
			.filter((player) => player.id !== game.players[game.gateSeat]?.id && player.bag)
			.map((player) => ({
				playerId: player.id,
				count: player.bag!.cardIds.length,
				declaration: player.bag!.declaration,
			})),
		offersForBot: game.bribes
			.filter((offer) => game.players[game.gateSeat]?.id === bot.id && !offer.accepted)
			.map((offer) => ({ merchantId: offer.merchantId, money: offer.money, hasGoods: Boolean(offer.stallCardId) })),
	};
}

export function botPack(game: NightMarketGameState, bot: NightMarketPlayerState, now: Date): void {
	if (bot.bag || bot.hand.length === 0) return;
	const profile = BOT_PROFILES[bot.botProfile ?? 'balanced'];
	const random = randomFor(game, bot, 'pack');
	const cards = cardMap(game);
	const byLegal = new Map<LegalCommodityId, string[]>();
	for (const legal of LEGAL_COMMODITIES) byLegal.set(legal, []);
	const illegal: string[] = [];
	for (const id of bot.hand) {
		const commodity = cards.get(id)!.commodity;
		if (COMMODITIES[commodity].legal) byLegal.get(commodity as LegalCommodityId)!.push(id);
		else illegal.push(id);
	}
	const declaration = [...LEGAL_COMMODITIES].sort(
		(a, b) => byLegal.get(b)!.length - byLegal.get(a)!.length,
	)[0];
	const selected = [...byLegal.get(declaration)!].slice(0, Math.min(4, byLegal.get(declaration)!.length));
	if (illegal.length && random() < profile.bluff) selected.push(illegal[Math.floor(random() * illegal.length)]);
	if (selected.length === 0) selected.push(bot.hand[Math.floor(random() * bot.hand.length)]);
	packBag(bot, selected.slice(0, 5), declaration, now);
}

export function botMessage(game: NightMarketGameState, bot: NightMarketPlayerState, now: Date): MarketMessage {
	const profile = bot.botProfile ?? 'balanced';
	const messages = {
		cautious: ['Túi nhỏ thôi, hàng sạch cả.', 'A modest bag. Nothing forbidden.'],
		balanced: ['Giá hợp lý thì cổng nào cũng mở.', 'Every gate opens for a fair price.'],
		daring: ['Kiểm tra đi, nếu bạn đủ gan.', 'Inspect it—if you are brave enough.'],
	};
	return { id: `${bot.id}-${game.round}-claim`, playerId: bot.id, textVi: messages[profile][0], textEn: messages[profile][1], createdAt: now.toISOString() };
}

export function botBribe(game: NightMarketGameState, bot: NightMarketPlayerState): BribeOffer | null {
	if (!bot.bag || bot.money <= 0) return null;
	const profile = BOT_PROFILES[bot.botProfile ?? 'balanced'];
	const random = randomFor(game, bot, 'bribe');
	if (random() > profile.bribe) return null;
	const amount = Math.min(5, bot.money, 1 + Math.floor(random() * (bot.botProfile === 'daring' ? 4 : 2)));
	return { merchantId: bot.id, money: amount, accepted: false };
}

export function botAcceptBribes(game: NightMarketGameState, gate: NightMarketPlayerState): void {
	const observation = createBotObservation(game, gate);
	const profile = BOT_PROFILES[observation.profile];
	const random = randomFor(game, gate, 'accept');
	for (const offer of game.bribes) {
		if (offer.accepted || game.bribes.some((other) => other.merchantId === offer.merchantId && other.accepted)) continue;
		const score = offer.money / 5 + (offer.stallCardId ? 0.2 : 0);
		if (score + random() * 0.35 >= 0.55 + profile.suspicion * 0.25) offer.accepted = true;
	}
}

export function botBets(game: NightMarketGameState, bot: NightMarketPlayerState): BetRecord[] {
	if (bot.money <= 0) return [];
	const profile = BOT_PROFILES[bot.botProfile ?? 'balanced'];
	const random = randomFor(game, bot, 'bet');
	if (random() > profile.bet) return [];
	const targets = createBotObservation(game, bot).publicBags.filter((bag) => bag.playerId !== bot.id);
	if (!targets.length) return [];
	const target = targets[Math.floor(random() * targets.length)];
	const amount = Math.min(bot.money, random() > 0.6 ? 2 : 1) as 1 | 2;
	return [{
		bettorId: bot.id,
		targetId: target.playerId,
		prediction: random() < 0.48 + profile.suspicion * 0.25 ? 'lie' : 'truth',
		amount,
		settled: false,
	}];
}

export function botGateDecisions(
	game: NightMarketGameState,
	gate: NightMarketPlayerState,
): Map<string, GateDecision> {
	const observation = createBotObservation(game, gate);
	const profile = BOT_PROFILES[observation.profile];
	const random = randomFor(game, gate, 'gate');
	const decisions = new Map<string, GateDecision>();
	for (const bag of observation.publicBags) {
		const accepted = game.bribes.some((offer) => offer.merchantId === bag.playerId && offer.accepted);
		if (accepted) decisions.set(bag.playerId, 'pass');
		else {
			const unusual = bag.count >= 4 ? 0.15 : 0;
			decisions.set(bag.playerId, random() + unusual < profile.suspicion ? 'inspect' : 'pass');
		}
	}
	return decisions;
}
