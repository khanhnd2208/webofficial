import type {
	BotProfile,
	CommodityId,
	LegalCommodityId,
	NightMarketSettings,
	SecretMissionId,
} from '@/types/nightMarket';

export const NIGHT_MARKET_MIN_PLAYERS = 3;
export const NIGHT_MARKET_MAX_PLAYERS = 6;
export const NIGHT_MARKET_STARTING_MONEY = 25;
export const NIGHT_MARKET_HAND_SIZE = 6;
export const NIGHT_MARKET_ROOM_TTL_MS = 24 * 60 * 60 * 1000;
export const NIGHT_MARKET_DISCONNECT_MS = 10_000;
export const NIGHT_MARKET_GATE_GRACE_MS = 90_000;
export const NIGHT_MARKET_POLL_MS = 1_500;

export interface CommodityDefinition {
	id: CommodityId;
	legal: boolean;
	value: number;
	penalty: number;
	count: number;
	emoji: string;
}

export const COMMODITIES: Record<CommodityId, CommodityDefinition> = {
	'festival-cake': { id: 'festival-cake', legal: true, value: 2, penalty: 1, count: 44, emoji: '🥮' },
	'cloud-tea': { id: 'cloud-tea', legal: true, value: 3, penalty: 2, count: 40, emoji: '🫖' },
	'moon-pottery': { id: 'moon-pottery', legal: true, value: 4, penalty: 2, count: 36, emoji: '🏺' },
	'night-silk': { id: 'night-silk', legal: true, value: 5, penalty: 3, count: 30, emoji: '🧵' },
	'black-firecracker': { id: 'black-firecracker', legal: false, value: 7, penalty: 4, count: 20, emoji: '🧨' },
	'forbidden-charm': { id: 'forbidden-charm', legal: false, value: 9, penalty: 5, count: 16, emoji: '📜' },
	'royal-relic': { id: 'royal-relic', legal: false, value: 12, penalty: 6, count: 14, emoji: '👑' },
};

export const LEGAL_COMMODITIES = Object.values(COMMODITIES)
	.filter((item) => item.legal)
	.map((item) => item.id) as LegalCommodityId[];

export const SECRET_MISSIONS: SecretMissionId[] = [
	'cake-keeper', 'tea-master', 'pottery-collector', 'silk-merchant', 'balanced-stall',
	'contraband-runner', 'clean-merchant', 'money-keeper', 'negotiator', 'dangerous-truth',
];

export const DEFAULT_NIGHT_MARKET_SETTINGS: NightMarketSettings = {
	cycles: 1,
	interrogationSeconds: null,
	bettingEnabled: true,
	secretMissionsEnabled: false,
	goodsBribesEnabled: true,
	animationEnabled: true,
};

export const BOT_PROFILES: Record<BotProfile, {
	bluff: number;
	bribe: number;
	suspicion: number;
	bet: number;
}> = {
	cautious: { bluff: 0.2, bribe: 0.25, suspicion: 0.32, bet: 0.35 },
	balanced: { bluff: 0.45, bribe: 0.5, suspicion: 0.5, bet: 0.55 },
	daring: { bluff: 0.72, bribe: 0.7, suspicion: 0.68, bet: 0.75 },
};

export function interrogationSeconds(playerCount: number, override: number | null): number {
	if (override != null) return Math.max(60, Math.min(300, override));
	return ({ 3: 150, 4: 180, 5: 240, 6: 300 } as Record<number, number>)[playerCount] ?? 180;
}
