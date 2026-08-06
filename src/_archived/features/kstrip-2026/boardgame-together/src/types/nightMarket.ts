export type CommodityId =
	| 'festival-cake'
	| 'cloud-tea'
	| 'moon-pottery'
	| 'night-silk'
	| 'black-firecracker'
	| 'forbidden-charm'
	| 'royal-relic';

export type LegalCommodityId = Extract<
	CommodityId,
	'festival-cake' | 'cloud-tea' | 'moon-pottery' | 'night-silk'
>;

export type NightMarketPhase =
	| 'lobby'
	| 'round-intro'
	| 'packing'
	| 'interrogation'
	| 'betting'
	| 'gate-decision'
	| 'reveal'
	| 'round-summary'
	| 'final-score';

export type BotProfile = 'cautious' | 'balanced' | 'daring';
export type PlayerController = 'human' | 'bot';
export type GateDecision = 'pass' | 'inspect';
export type SecretMissionId =
	| 'cake-keeper'
	| 'tea-master'
	| 'pottery-collector'
	| 'silk-merchant'
	| 'balanced-stall'
	| 'contraband-runner'
	| 'clean-merchant'
	| 'money-keeper'
	| 'negotiator'
	| 'dangerous-truth';

export interface CommodityCard {
	id: string;
	commodity: CommodityId;
}

export interface NightMarketSettings {
	cycles: 1 | 2;
	interrogationSeconds: number | null;
	bettingEnabled: boolean;
	secretMissionsEnabled: boolean;
	goodsBribesEnabled: boolean;
	animationEnabled: boolean;
}

export interface PlayerStats {
	bagsSent: number;
	truths: number;
	lies: number;
	contrabandPassed: number;
	confiscated: number;
	penaltiesPaid: number;
	compensationReceived: number;
	bribesPaid: number;
	bribesReceived: number;
	betsPlaced: number;
	betsWon: number;
	inspections: number;
	correctInspections: number;
	truthsInspected: number;
	wrongInspections: number;
	acceptedBribes: number;
	biggestBluffValue: number;
	costliestTruth: number;
}

export interface PackedBag {
	cardIds: string[];
	declaration: LegalCommodityId;
	lockedAt: string;
	decision?: GateDecision;
	settled?: boolean;
	truthful?: boolean;
	penalty?: number;
	compensation?: number;
	confiscatedCardIds?: string[];
}

export interface BribeOffer {
	merchantId: string;
	money: number;
	stallCardId?: string;
	accepted: boolean;
}

export interface BetRecord {
	bettorId: string;
	targetId: string;
	prediction: 'truth' | 'lie';
	amount: 1 | 2;
	settled: boolean;
	won?: boolean;
}

export interface MarketMessage {
	id: string;
	playerId: string;
	textVi: string;
	textEn: string;
	createdAt: string;
}

export interface NightMarketPlayerState {
	id: string;
	token?: string;
	name: string;
	controller: PlayerController;
	botProfile?: BotProfile;
	seat: number;
	connected: boolean;
	lastSeenAt: string;
	ready: boolean;
	money: number;
	hand: string[];
	stall: string[];
	mission?: SecretMissionId;
	bag?: PackedBag;
	stats: PlayerStats;
}

export interface NightMarketResult {
	playerId: string;
	moneyPoints: number;
	goodsPoints: number;
	marketBonus: number;
	missionBonus: number;
	total: number;
	rank: number;
	missionCompleted?: boolean;
}

export interface NightMarketGameState {
	name: string;
	settings: NightMarketSettings;
	phase: NightMarketPhase;
	phaseEndsAt?: string;
	phaseStartedAt?: string;
	pausedFromPhase?: NightMarketPhase;
	pausedRemainingMs?: number;
	gateDisconnectedAt?: string;
	cycle: number;
	round: number;
	gateSeat: number;
	deck: CommodityCard[];
	drawIndex: number;
	confiscated: string[];
	players: NightMarketPlayerState[];
	bribes: BribeOffer[];
	bets: BetRecord[];
	messages: MarketMessage[];
	revealOrder: string[];
	revealIndex: number;
	roundSummary?: { lies: number; contrabandPassed: number; topEarnerId?: string };
	results: NightMarketResult[];
	processedActionIds: string[];
	seed: string;
}

export interface NightMarketPlayerPublicDTO {
	id: string;
	name: string;
	controller: PlayerController;
	botProfile?: BotProfile;
	seat: number;
	connected: boolean;
	ready: boolean;
	money: number;
	stall: CommodityCard[];
	isHost: boolean;
	isGate: boolean;
	stats?: PlayerStats;
	bag?: {
		cardCount: number;
		declaration: LegalCommodityId;
		decision?: GateDecision;
		settled?: boolean;
		truthful?: boolean;
		cards?: CommodityCard[];
		penalty?: number;
		compensation?: number;
		acceptedBribe?: { money: number; hasGoods: boolean };
	};
}

export interface NightMarketSelfDTO extends NightMarketPlayerPublicDTO {
	hand: CommodityCard[];
	mission?: SecretMissionId;
	activeBribe?: BribeOffer;
	bets: BetRecord[];
}

export interface NightMarketRoomDTO {
	code: string;
	name: string;
	version: number;
	serverNow: string;
	phase: NightMarketPhase;
	phaseEndsAt?: string;
	paused: boolean;
	isHost: boolean;
	settings: NightMarketSettings;
	cycle: number;
	round: number;
	totalRounds: number;
	players: NightMarketPlayerPublicDTO[];
	self: NightMarketSelfDTO | null;
	gatePlayerId?: string;
	bribesForGate?: BribeOffer[];
	messages: MarketMessage[];
	revealIndex: number;
	revealCount: number;
	roundSummary?: NightMarketGameState['roundSummary'];
	results: NightMarketResult[];
}

export interface CreateNightMarketRoomInput {
	name: string;
	hostName: string;
	settings?: Partial<NightMarketSettings>;
}

export type NightMarketAction =
	| { type: 'ready'; ready: boolean }
	| { type: 'settings'; settings: Partial<NightMarketSettings> }
	| { type: 'add-bot'; profile?: BotProfile }
	| { type: 'remove-bot'; playerId: string }
	| { type: 'reorder'; playerIds: string[] }
	| { type: 'start' }
	| { type: 'pack'; cardIds: string[]; declaration: LegalCommodityId }
	| { type: 'bribe'; money: number; stallCardId?: string }
	| { type: 'cancel-bribe' }
	| { type: 'accept-bribe'; merchantId: string }
	| { type: 'quick-reply'; kind: 'truth' | 'accuse' | 'raise'; targetId?: string }
	| { type: 'finish-interrogation' }
	| { type: 'bet'; bets: Array<{ targetId: string; prediction: 'truth' | 'lie'; amount: 1 | 2 }> }
	| { type: 'decide'; decisions: Array<{ merchantId: string; decision: GateDecision }> }
	| { type: 'reveal-next' }
	| { type: 'pause' }
	| { type: 'resume' }
	| { type: 'leave' }
	| { type: 'play-again' };

export interface NightMarketActionInput {
	token: string;
	actionId: string;
	expectedVersion: number;
	action: NightMarketAction;
}
