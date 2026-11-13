import type { PrizeTier } from './domain/drawPool';

/** Shapes shared by the API routes and the client pages. */

export type PublicPrize = {
	id: string;
	slug: string;
	name: string;
	tier: PrizeTier;
	imagePath: string | null;
	remaining: number;
};

export type BoothState = {
	isOpen: boolean;
	hasPin: boolean;
	unlocked: boolean;
	prizes: PublicPrize[];
	luckLeft: number;
	spinsLeft: number;
};

export type DrawResult = {
	id: string;
	/** null = "Chúc may mắn". */
	prize: PublicPrize | null;
	createdAt: string;
};

export type AdminPrize = PublicPrize & { sortOrder: number; isActive: boolean };

export type AdminDraw = {
	id: string;
	createdAt: string;
	prizeName: string;
	isLuck: boolean;
	voidedAt: string | null;
};

export type AdminOverview = {
	settings: { totalSpins: number; isOpen: boolean; hasPin: boolean; updatedAt: string };
	prizes: AdminPrize[];
	spinsUsed: number;
	prizesLeft: number;
	luckLeft: number;
	spinsLeft: number;
	draws: AdminDraw[];
};
