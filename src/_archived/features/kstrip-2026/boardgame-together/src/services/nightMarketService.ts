import { customAlphabet } from 'nanoid';

import {
	COMMODITIES,
	DEFAULT_NIGHT_MARKET_SETTINGS,
	LEGAL_COMMODITIES,
	NIGHT_MARKET_DISCONNECT_MS,
	NIGHT_MARKET_GATE_GRACE_MS,
	NIGHT_MARKET_HAND_SIZE,
	NIGHT_MARKET_MAX_PLAYERS,
	NIGHT_MARKET_MIN_PLAYERS,
	NIGHT_MARKET_ROOM_TTL_MS,
	NIGHT_MARKET_STARTING_MONEY,
	interrogationSeconds,
} from '@/config/nightMarket';
import { AppError } from '@/lib/appError';
import dbConnect from '@/lib/dbConnect';
import {
	BOT_NAMES,
	botAcceptBribes,
	botBets,
	botBribe,
	botGateDecisions,
	botMessage,
	botPack,
} from '@/lib/night-market/bot';
import { seededRandom } from '@/lib/night-market/random';
import {
	assignMissions,
	buildDeck,
	cardMap,
	drawCards,
	emptyStats,
	packBag,
	scoreGame,
	settleBag,
} from '@/lib/night-market/rules';
import NightMarketRoom, { type INightMarketRoom } from '@/models/NightMarketRoom';
import type {
	BetRecord,
	BotProfile,
	BribeOffer,
	CreateNightMarketRoomInput,
	LegalCommodityId,
	NightMarketAction,
	NightMarketActionInput,
	NightMarketGameState,
	NightMarketPhase,
	NightMarketPlayerState,
	NightMarketRoomDTO,
	NightMarketSettings,
} from '@/types/nightMarket';

type RoomRecord = INightMarketRoom & { _id: unknown };
const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);
const generateToken = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 24);
const generateId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);

function cleanName(value: string, fallback = ''): string {
	return (value ?? '').trim().replace(/\s+/g, ' ').slice(0, 24) || fallback;
}

function expiresAt(): Date {
	return new Date(Date.now() + NIGHT_MARKET_ROOM_TTL_MS);
}

function normalizeSettings(input?: Partial<NightMarketSettings>): NightMarketSettings {
	return {
		...DEFAULT_NIGHT_MARKET_SETTINGS,
		...input,
		cycles: input?.cycles === 2 ? 2 : 1,
		interrogationSeconds: input?.interrogationSeconds == null
			? null
			: Math.max(60, Math.min(300, Math.round(input.interrogationSeconds))),
	};
}

function humanPlayer(name: string, token: string, seat: number, now: Date): NightMarketPlayerState {
	return {
		id: generateId(), token, name, controller: 'human', seat, connected: true,
		lastSeenAt: now.toISOString(), ready: false, money: NIGHT_MARKET_STARTING_MONEY,
		hand: [], stall: [], stats: emptyStats(),
	};
}

function botPlayer(game: NightMarketGameState, profile?: BotProfile): NightMarketPlayerState {
	const used = new Set(game.players.map((player) => player.name));
	const names = BOT_NAMES.map((entry) => entry[0]);
	const name = names.find((candidate) => !used.has(candidate)) ?? `Bot ${game.players.length + 1}`;
	const profiles: BotProfile[] = ['cautious', 'balanced', 'daring'];
	const selected = profile ?? profiles[Math.floor(seededRandom(`${game.seed}:bot:${game.players.length}`)() * profiles.length)];
	return {
		id: generateId(), name, controller: 'bot', botProfile: selected,
		seat: game.players.length, connected: true, lastSeenAt: new Date().toISOString(), ready: true,
		money: NIGHT_MARKET_STARTING_MONEY, hand: [], stall: [], stats: emptyStats(),
	};
}

function findByToken(game: NightMarketGameState, token: string): NightMarketPlayerState | undefined {
	return game.players.find((player) => player.token === token);
}

function requirePlayer(game: NightMarketGameState, token: string): NightMarketPlayerState {
	const player = findByToken(game, token);
	if (!player) throw new AppError('PLAYER_NOT_FOUND', 404);
	return player;
}

function requireHost(room: RoomRecord, token: string): NightMarketPlayerState {
	const player = requirePlayer(room.game, token);
	if (room.hostToken !== token) throw new AppError('HOST_ONLY', 403);
	return player;
}

function isConnected(room: RoomRecord, player: NightMarketPlayerState, now: Date): boolean {
	if (player.controller === 'bot') return true;
	const heartbeat = room.heartbeats?.[player.id];
	return Boolean(heartbeat && now.getTime() - new Date(heartbeat).getTime() < NIGHT_MARKET_DISCONNECT_MS);
}

function setPhase(game: NightMarketGameState, phase: NightMarketPhase, now: Date, seconds?: number): void {
	game.phase = phase;
	game.phaseStartedAt = now.toISOString();
	game.phaseEndsAt = seconds == null ? undefined : new Date(now.getTime() + seconds * 1000).toISOString();
}

function gate(game: NightMarketGameState): NightMarketPlayerState {
	return game.players[game.gateSeat];
}

function merchants(game: NightMarketGameState): NightMarketPlayerState[] {
	return game.players.filter((player) => player.id !== gate(game)?.id);
}

function beginPacking(game: NightMarketGameState, now: Date): void {
	setPhase(game, 'packing', now, 60);
	for (const player of merchants(game)) if (player.controller === 'bot') botPack(game, player, now);
}

function beginInterrogation(game: NightMarketGameState, now: Date): void {
	setPhase(game, 'interrogation', now, interrogationSeconds(game.players.length, game.settings.interrogationSeconds));
	for (const player of merchants(game)) {
		if (player.controller !== 'bot' || !player.bag) continue;
		game.messages.push(botMessage(game, player, now));
		const offer = botBribe(game, player);
		if (offer) game.bribes.push(offer);
	}
}

function beginBetting(game: NightMarketGameState, now: Date): void {
	if (!game.settings.bettingEnabled) {
		beginGateDecision(game, now);
		return;
	}
	setPhase(game, 'betting', now, 30);
	for (const player of merchants(game)) {
		if (player.controller !== 'bot') continue;
		const bets = botBets(game, player);
		const total = bets.reduce((sum, bet) => sum + bet.amount, 0);
		if (total <= Math.max(0, player.money)) {
			player.money -= total;
			player.stats.betsPlaced += bets.length;
			game.bets.push(...bets);
		}
	}
}

function beginReveal(game: NightMarketGameState, now: Date): void {
	game.revealOrder = merchants(game).filter((player) => player.bag).map((player) => player.id);
	game.revealIndex = 0;
	setPhase(game, 'reveal', now, 15);
	settleCurrentReveal(game);
}

function beginGateDecision(game: NightMarketGameState, now: Date): void {
	const currentGate = gate(game);
	if (currentGate.controller === 'bot') {
		botAcceptBribes(game, currentGate);
		const decisions = botGateDecisions(game, currentGate);
		for (const merchant of merchants(game)) if (merchant.bag) merchant.bag.decision = decisions.get(merchant.id) ?? 'pass';
		beginReveal(game, now);
		return;
	}
	setPhase(game, 'gate-decision', now, 60);
}

function settleCurrentReveal(game: NightMarketGameState): void {
	const playerId = game.revealOrder[game.revealIndex];
	const merchant = game.players.find((player) => player.id === playerId);
	if (merchant) settleBag(game, merchant, gate(game));
}

function beginRoundSummary(game: NightMarketGameState, now: Date): void {
	game.roundSummary = {
		lies: merchants(game).filter((player) => player.bag?.truthful === false).length,
		contrabandPassed: merchants(game).reduce((sum, player) => sum + (player.bag?.decision === 'pass'
			? player.bag.cardIds.filter((id) => !COMMODITIES[cardMap(game).get(id)!.commodity].legal).length : 0), 0),
	};
	setPhase(game, 'round-summary', now, 8);
}

function advanceReveal(game: NightMarketGameState, now: Date): void {
	game.revealIndex += 1;
	if (game.revealIndex >= game.revealOrder.length) beginRoundSummary(game, now);
	else {
		setPhase(game, 'reveal', now, 15);
		settleCurrentReveal(game);
	}
}

function startNextRound(game: NightMarketGameState, now: Date): void {
	const totalRounds = game.players.length * game.settings.cycles;
	for (const player of merchants(game)) drawCards(game, player);
	if (game.round >= totalRounds) {
		game.results = scoreGame(game);
		setPhase(game, 'final-score', now);
		return;
	}
	for (const player of game.players) player.bag = undefined;
	game.bribes = [];
	game.bets = [];
	game.messages = [];
	game.revealOrder = [];
	game.revealIndex = 0;
	game.roundSummary = undefined;
	game.round += 1;
	game.gateSeat = (game.gateSeat + 1) % game.players.length;
	const nextCycle = Math.floor((game.round - 1) / game.players.length) + 1;
	if (nextCycle > game.cycle) {
		game.cycle = nextCycle;
		game.deck.push(...buildDeck(`${game.seed}:cycle:${nextCycle}`, `c${nextCycle}`));
	}
	setPhase(game, 'round-intro', now, 5);
}

function cancelRound(game: NightMarketGameState, now: Date): void {
	for (const player of game.players) {
		if (player.bag && !player.bag.settled) player.hand.push(...player.bag.cardIds);
		player.bag = undefined;
	}
	for (const bet of game.bets.filter((item) => !item.settled)) {
		const bettor = game.players.find((player) => player.id === bet.bettorId);
		if (bettor) bettor.money += bet.amount;
	}
	game.bribes = [];
	game.bets = [];
	game.messages = [];
	game.gateDisconnectedAt = undefined;
	game.pausedFromPhase = undefined;
	game.pausedRemainingMs = undefined;
	startNextRound(game, now);
}

function applyConnections(room: RoomRecord, now: Date): boolean {
	let changed = false;
	for (const player of room.game.players) {
		const connected = isConnected(room, player, now);
		if (player.connected !== connected) { player.connected = connected; changed = true; }
	}
	const host = findByToken(room.game, room.hostToken);
	if (!host?.connected) {
		const replacement = room.game.players.find((player) => player.controller === 'human' && player.connected);
		if (replacement?.token && replacement.token !== room.hostToken) { room.hostToken = replacement.token; changed = true; }
	}
	return changed;
}

function applyGateDisconnect(room: RoomRecord, now: Date): boolean {
	const game = room.game;
	if (game.phase === 'lobby' || game.phase === 'final-score') return false;
	const currentGate = gate(game);
	if (currentGate.controller === 'bot') return false;
	if (currentGate.connected) {
		if (game.pausedFromPhase && game.gateDisconnectedAt) {
			const resumePhase = game.pausedFromPhase;
			const remaining = game.pausedRemainingMs ?? 0;
			game.pausedFromPhase = undefined;
			game.pausedRemainingMs = undefined;
			game.gateDisconnectedAt = undefined;
			game.phase = resumePhase;
			game.phaseEndsAt = remaining ? new Date(now.getTime() + remaining).toISOString() : undefined;
			return true;
		}
		return false;
	}
	if (!game.gateDisconnectedAt) {
		game.gateDisconnectedAt = now.toISOString();
		game.pausedFromPhase = game.phase;
		game.pausedRemainingMs = game.phaseEndsAt ? Math.max(0, new Date(game.phaseEndsAt).getTime() - now.getTime()) : 0;
		game.phaseEndsAt = undefined;
		return true;
	}
	if (now.getTime() - new Date(game.gateDisconnectedAt).getTime() >= NIGHT_MARKET_GATE_GRACE_MS) {
		cancelRound(game, now);
		return true;
	}
	return false;
}

function applyAutomaticAdvance(room: RoomRecord, now: Date): boolean {
	let changed = applyConnections(room, now);
	changed = applyGateDisconnect(room, now) || changed;
	const game = room.game;
	if (game.pausedFromPhase) return changed;
	for (let guard = 0; guard < 12; guard += 1) {
		const expired = game.phaseEndsAt && new Date(game.phaseEndsAt).getTime() <= now.getTime();
		const allPacked = game.phase === 'packing' && merchants(game).every((player) => player.bag || player.controller === 'human' && !player.connected);
		if (!expired && !allPacked) break;
		changed = true;
		switch (game.phase) {
			case 'round-intro': beginPacking(game, now); break;
			case 'packing': beginInterrogation(game, now); break;
			case 'interrogation':
				if (gate(game).controller === 'bot') botAcceptBribes(game, gate(game));
				beginBetting(game, now); break;
			case 'betting': beginGateDecision(game, now); break;
			case 'gate-decision':
				for (const player of merchants(game)) if (player.bag && !player.bag.decision) player.bag.decision = 'pass';
				beginReveal(game, now); break;
			case 'reveal': advanceReveal(game, now); break;
			case 'round-summary': startNextRound(game, now); break;
			default: return changed;
		}
	}
	return changed;
}

function cardDTOs(game: NightMarketGameState, ids: string[]) {
	const cards = cardMap(game);
	return ids.map((id) => cards.get(id)).filter((card): card is NonNullable<typeof card> => Boolean(card));
}

function toDTO(room: RoomRecord, token: string | null, now: Date): NightMarketRoomDTO {
	const game = room.game;
	const viewer = token ? findByToken(game, token) : undefined;
	const currentGate = gate(game);
	const players = game.players.map((player) => ({
		id: player.id, name: player.name, controller: player.controller, botProfile: player.botProfile,
		seat: player.seat, connected: player.connected, ready: player.ready, money: player.money,
		stall: cardDTOs(game, player.stall), isHost: player.token === room.hostToken,
		isGate: game.phase !== 'lobby' && player.id === currentGate?.id,
		stats: game.phase === 'final-score' ? player.stats : undefined,
		...(player.bag ? { bag: {
			cardCount: player.bag.cardIds.length, declaration: player.bag.declaration,
			decision: player.bag.decision, settled: player.bag.settled, truthful: player.bag.settled ? player.bag.truthful : undefined,
			cards: player.bag.settled ? cardDTOs(game, player.bag.cardIds) : undefined,
			penalty: player.bag.penalty, compensation: player.bag.compensation,
			acceptedBribe: player.bag.settled ? (() => {
				const offer = game.bribes.find((item) => item.merchantId === player.id && item.accepted);
				return offer ? { money: offer.money, hasGoods: Boolean(offer.stallCardId) } : undefined;
			})() : undefined,
		} } : {}),
	}));
	const publicSelf = viewer ? players.find((player) => player.id === viewer.id)! : null;
	return {
		code: room.code, name: game.name, version: room.version, serverNow: now.toISOString(),
		phase: game.phase, phaseEndsAt: game.phaseEndsAt, paused: Boolean(game.pausedFromPhase),
		isHost: Boolean(viewer?.token && viewer.token === room.hostToken), settings: game.settings,
		cycle: game.cycle, round: game.round, totalRounds: game.players.length * game.settings.cycles,
		players,
		self: viewer && publicSelf ? {
			...publicSelf, hand: cardDTOs(game, viewer.hand), mission: viewer.mission,
			activeBribe: game.bribes.find((offer) => offer.merchantId === viewer.id),
			bets: game.bets.filter((bet) => bet.bettorId === viewer.id),
		} : null,
		gatePlayerId: game.phase === 'lobby' ? undefined : currentGate?.id,
		bribesForGate: viewer?.id === currentGate?.id ? game.bribes : undefined,
		messages: game.messages, revealIndex: game.revealIndex, revealCount: game.revealOrder.length,
		roundSummary: game.roundSummary, results: game.results,
	};
}

async function loadRoom(code: string): Promise<RoomRecord> {
	await dbConnect();
	const room = await NightMarketRoom.findOne({ code: code.toUpperCase() }).lean<RoomRecord>();
	if (!room) throw new AppError('ROOM_NOT_FOUND', 404);
	return room;
}

async function persist(room: RoomRecord, originalVersion: number): Promise<RoomRecord> {
	const result = await NightMarketRoom.findOneAndUpdate(
		{ _id: room._id, version: originalVersion },
		{ $set: { game: room.game, hostToken: room.hostToken, expiresAt: expiresAt() }, $inc: { version: 1 } },
		{ returnDocument: 'after' },
	).lean<RoomRecord>();
	if (!result) throw new AppError('VERSION_CONFLICT', 409);
	return result;
}

function startGame(game: NightMarketGameState, now: Date): void {
	if (game.players.length < NIGHT_MARKET_MIN_PLAYERS || game.players.length > NIGHT_MARKET_MAX_PLAYERS) throw new AppError('PLAYER_COUNT_INVALID', 400);
	if (game.players.some((player) => player.controller === 'human' && !player.ready)) throw new AppError('PLAYERS_NOT_READY', 400);
	game.deck = buildDeck(`${game.seed}:cycle:1`);
	game.drawIndex = 0;
	game.confiscated = [];
	game.cycle = 1;
	game.round = 1;
	game.gateSeat = Math.floor(seededRandom(`${game.seed}:gate`)() * game.players.length);
	game.results = [];
	for (const player of game.players) {
		player.money = NIGHT_MARKET_STARTING_MONEY; player.hand = []; player.stall = [];
		player.bag = undefined; player.stats = emptyStats(); drawCards(game, player);
	}
	if (game.settings.secretMissionsEnabled) assignMissions(game);
	setPhase(game, 'round-intro', now, 5);
}

function availableMoney(game: NightMarketGameState, player: NightMarketPlayerState): number {
	const reserved = game.bribes.find((offer) => offer.merchantId === player.id && offer.accepted)?.money ?? 0;
	return Math.max(0, player.money - reserved);
}

function applyAction(room: RoomRecord, actor: NightMarketPlayerState, action: NightMarketAction, now: Date): void {
	const game = room.game;
	switch (action.type) {
		case 'ready':
			if (game.phase !== 'lobby') throw new AppError('PHASE_INVALID', 400);
			actor.ready = action.ready; break;
		case 'settings':
			requireHost(room, actor.token!);
			if (game.phase !== 'lobby') throw new AppError('PHASE_INVALID', 400);
			game.settings = normalizeSettings({ ...game.settings, ...action.settings }); break;
		case 'add-bot':
			requireHost(room, actor.token!);
			if (game.phase !== 'lobby' || game.players.length >= NIGHT_MARKET_MAX_PLAYERS) throw new AppError('ROOM_FULL', 400);
			game.players.push(botPlayer(game, action.profile)); break;
		case 'remove-bot': {
			requireHost(room, actor.token!);
			if (game.phase !== 'lobby') throw new AppError('PHASE_INVALID', 400);
			const target = game.players.find((player) => player.id === action.playerId);
			if (!target || target.controller !== 'bot') throw new AppError('BOT_NOT_FOUND', 404);
			game.players = game.players.filter((player) => player.id !== target.id);
			game.players.forEach((player, seat) => { player.seat = seat; }); break;
		}
		case 'reorder':
			requireHost(room, actor.token!);
			if (game.phase !== 'lobby' || action.playerIds.length !== game.players.length || new Set(action.playerIds).size !== game.players.length) throw new AppError('ORDER_INVALID', 400);
			game.players = action.playerIds.map((id) => game.players.find((player) => player.id === id)!).filter(Boolean);
			game.players.forEach((player, seat) => { player.seat = seat; }); break;
		case 'start': requireHost(room, actor.token!); startGame(game, now); break;
		case 'pack':
			if (game.phase !== 'packing' || actor.id === gate(game).id) throw new AppError('PHASE_INVALID', 400);
			packBag(actor, action.cardIds, action.declaration, now); break;
		case 'bribe': {
			if (game.phase !== 'interrogation' || !actor.bag || actor.money <= 0) throw new AppError('BRIBE_INVALID', 400);
			if (action.money < 1 || action.money > 5 || action.money > availableMoney(game, actor)) throw new AppError('BRIBE_INVALID', 400);
			if (action.stallCardId) {
				const card = cardMap(game).get(action.stallCardId);
				if (!game.settings.goodsBribesEnabled || !actor.stall.includes(action.stallCardId) || !card || !COMMODITIES[card.commodity].legal) throw new AppError('BRIBE_GOODS_INVALID', 400);
			}
			game.bribes = game.bribes.filter((offer) => offer.merchantId !== actor.id || offer.accepted);
			game.bribes.push({ merchantId: actor.id, money: action.money, stallCardId: action.stallCardId, accepted: false }); break;
		}
		case 'cancel-bribe':
			if (game.phase !== 'interrogation') throw new AppError('PHASE_INVALID', 400);
			game.bribes = game.bribes.filter((offer) => offer.merchantId !== actor.id || offer.accepted); break;
		case 'accept-bribe': {
			if (game.phase !== 'interrogation' || actor.id !== gate(game).id) throw new AppError('PHASE_INVALID', 400);
			const offer = game.bribes.find((item) => item.merchantId === action.merchantId && !item.accepted);
			if (!offer) throw new AppError('BRIBE_NOT_FOUND', 404);
			offer.accepted = true; break;
		}
		case 'quick-reply':
			if (game.phase !== 'interrogation' || actor.id === gate(game).id) throw new AppError('PHASE_INVALID', 400);
			game.messages.push({ id: generateId(), playerId: actor.id, textVi: action.kind === 'truth' ? 'Tôi khẳng định túi này hoàn toàn sạch.' : action.kind === 'accuse' ? 'Đừng nhìn tôi—hãy kiểm tra người kia.' : 'Tôi sẵn sàng nâng đề nghị.', textEn: action.kind === 'truth' ? 'I swear this bag is completely clean.' : action.kind === 'accuse' ? 'Do not watch me—inspect the other trader.' : 'I am willing to raise my offer.', createdAt: now.toISOString() }); break;
		case 'finish-interrogation':
			if (game.phase !== 'interrogation' || actor.id !== gate(game).id || !game.phaseStartedAt || now.getTime() - new Date(game.phaseStartedAt).getTime() < 60_000) throw new AppError('CANNOT_FINISH_YET', 400);
			beginBetting(game, now); break;
		case 'bet': {
			if (game.phase !== 'betting' || actor.id === gate(game).id || actor.money <= 0) throw new AppError('BET_INVALID', 400);
			if (game.bets.some((bet) => bet.bettorId === actor.id)) throw new AppError('BET_ALREADY_LOCKED', 400);
			const total = action.bets.reduce((sum, bet) => sum + bet.amount, 0);
			if (total > 2 || total > availableMoney(game, actor) || action.bets.some((bet) => bet.targetId === actor.id || !merchants(game).some((player) => player.id === bet.targetId && player.bag))) throw new AppError('BET_INVALID', 400);
			const records: BetRecord[] = action.bets.map((bet) => ({ bettorId: actor.id, targetId: bet.targetId, prediction: bet.prediction, amount: bet.amount, settled: false }));
			actor.money -= total; actor.stats.betsPlaced += records.length; game.bets.push(...records); break;
		}
		case 'decide':
			if (game.phase !== 'gate-decision' || actor.id !== gate(game).id) throw new AppError('PHASE_INVALID', 400);
			for (const choice of action.decisions) {
				const merchant = merchants(game).find((player) => player.id === choice.merchantId && player.bag);
				if (!merchant) continue;
				const locked = game.bribes.some((offer) => offer.merchantId === merchant.id && offer.accepted);
				merchant.bag!.decision = locked ? 'pass' : choice.decision;
			}
			if (merchants(game).filter((player) => player.bag).every((player) => player.bag!.decision)) beginReveal(game, now);
			break;
		case 'reveal-next':
			if (game.phase !== 'reveal') throw new AppError('PHASE_INVALID', 400);
			advanceReveal(game, now); break;
		case 'pause':
			requireHost(room, actor.token!);
			if (game.phase === 'lobby' || game.phase === 'final-score' || game.pausedFromPhase) throw new AppError('PHASE_INVALID', 400);
			game.pausedFromPhase = game.phase; game.pausedRemainingMs = game.phaseEndsAt ? Math.max(0, new Date(game.phaseEndsAt).getTime() - now.getTime()) : 0; game.phaseEndsAt = undefined; break;
		case 'resume':
			requireHost(room, actor.token!);
			if (!game.pausedFromPhase) throw new AppError('PHASE_INVALID', 400);
			game.phase = game.pausedFromPhase; game.phaseEndsAt = game.pausedRemainingMs ? new Date(now.getTime() + game.pausedRemainingMs).toISOString() : undefined; game.pausedFromPhase = undefined; game.pausedRemainingMs = undefined; break;
		case 'leave':
			if (game.phase === 'lobby') {
				game.players = game.players.filter((player) => player.id !== actor.id);
				game.players.forEach((player, seat) => { player.seat = seat; });
			} else actor.connected = false;
			break;
		case 'play-again':
			requireHost(room, actor.token!);
			if (game.phase !== 'final-score') throw new AppError('PHASE_INVALID', 400);
			game.phase = 'lobby'; game.phaseEndsAt = undefined; game.results = []; game.players.forEach((player) => { player.ready = player.controller === 'bot'; player.money = NIGHT_MARKET_STARTING_MONEY; player.hand = []; player.stall = []; player.bag = undefined; player.mission = undefined; player.stats = emptyStats(); }); break;
	}
}

export async function createNightMarketRoom(input: CreateNightMarketRoomInput): Promise<{ state: NightMarketRoomDTO; playerToken: string }> {
	await dbConnect();
	const now = new Date();
	const hostName = cleanName(input.hostName);
	const roomName = cleanName(input.name);
	if (!hostName) throw new AppError('PLAYER_NAME_REQUIRED', 400);
	if (!roomName) throw new AppError('ROOM_NAME_REQUIRED', 400);
	let code = generateCode();
	for (let attempt = 0; attempt < 10 && await NightMarketRoom.exists({ code }); attempt += 1) code = generateCode();
	const token = generateToken();
	const game: NightMarketGameState = {
		name: roomName, settings: normalizeSettings(input.settings), phase: 'lobby', cycle: 1, round: 0,
		gateSeat: 0, deck: [], drawIndex: 0, confiscated: [], players: [], bribes: [], bets: [],
		messages: [], revealOrder: [], revealIndex: 0, results: [], processedActionIds: [], seed: `${code}:${generateId()}`,
	};
	const host = humanPlayer(hostName, token, 0, now);
	game.players.push(host);
	const created = await NightMarketRoom.create({ code, hostToken: token, version: 0, game, heartbeats: { [host.id]: now }, expiresAt: expiresAt() });
	const room = created.toObject() as RoomRecord;
	return { state: toDTO(room, token, now), playerToken: token };
}

export async function joinNightMarketRoom(code: string, name: string, existingToken?: string): Promise<{ state: NightMarketRoomDTO; playerToken: string }> {
	let room = await loadRoom(code);
	const now = new Date();
	if (existingToken) {
		const existing = findByToken(room.game, existingToken);
		if (existing) {
			await NightMarketRoom.updateOne({ _id: room._id }, { $set: { [`heartbeats.${existing.id}`]: now, expiresAt: expiresAt() } });
			room.heartbeats[existing.id] = now;
			existing.connected = true;
			return { state: toDTO(room, existingToken, now), playerToken: existingToken };
		}
	}
	if (room.game.phase !== 'lobby') throw new AppError('GAME_IN_PROGRESS', 400);
	if (room.game.players.length >= NIGHT_MARKET_MAX_PLAYERS) throw new AppError('ROOM_FULL', 400);
	const clean = cleanName(name);
	if (!clean) throw new AppError('PLAYER_NAME_REQUIRED', 400);
	if (room.game.players.some((player) => player.name.toLocaleLowerCase() === clean.toLocaleLowerCase())) throw new AppError('NAME_TAKEN', 400);
	const token = generateToken();
	const player = humanPlayer(clean, token, room.game.players.length, now);
	room.game.players.push(player);
	room.heartbeats[player.id] = now;
	room = await persist(room, room.version);
	await NightMarketRoom.updateOne({ _id: room._id }, { $set: { [`heartbeats.${player.id}`]: now } });
	return { state: toDTO(room, token, now), playerToken: token };
}

export async function getNightMarketState(code: string, token: string | null): Promise<NightMarketRoomDTO> {
	let room = await loadRoom(code);
	const now = new Date();
	const viewer = token ? findByToken(room.game, token) : undefined;
	if (viewer && viewer.controller === 'human') {
		await NightMarketRoom.updateOne({ _id: room._id }, { $set: { [`heartbeats.${viewer.id}`]: now, expiresAt: expiresAt() } });
		room.heartbeats[viewer.id] = now;
		viewer.connected = true;
	}
	const originalVersion = room.version;
	if (applyAutomaticAdvance(room, now)) {
		try { room = await persist(room, originalVersion); }
		catch (error) { if (error instanceof AppError && error.code === 'VERSION_CONFLICT') room = await loadRoom(code); else throw error; }
	}
	return toDTO(room, token, now);
}

export async function performNightMarketAction(code: string, input: NightMarketActionInput): Promise<NightMarketRoomDTO> {
	let room = await loadRoom(code);
	const now = new Date();
	const actor = requirePlayer(room.game, input.token);
	if (room.game.processedActionIds.includes(input.actionId)) return toDTO(room, input.token, now);
	if (input.expectedVersion !== room.version) throw new AppError('VERSION_CONFLICT', 409);
	applyAction(room, actor, input.action, now);
	room.game.processedActionIds.push(input.actionId);
	room.game.processedActionIds = room.game.processedActionIds.slice(-80);
	applyAutomaticAdvance(room, now);
	room = await persist(room, input.expectedVersion);
	return toDTO(room, input.token, now);
}
