import 'server-only';

import { randomInt } from 'node:crypto';

import type { Prisma } from '@prisma/client';

import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';

import { isPrizeTier, pickFromPool, summarizePool, type PrizeTier } from '../domain/drawPool';
import type {
	BoothSetupInput,
	PrizeCreateInput,
	PrizeUpdateInput,
	SettingsUpdateInput,
} from '../schemas';
import type { AdminOverview, AdminPrize, BoothState, DrawResult, PublicPrize } from '../types';
import { hashPin } from './boothUnlock';

type Tx = Prisma.TransactionClient;

const SETTINGS_ID = 1;
const HISTORY_LIMIT = 50;

type PrizeRow = {
	id: string;
	slug: string;
	name: string;
	tier: string;
	imagePath: string | null;
	remaining: number;
	sortOrder: number;
	isActive: boolean;
};

function tierOf(value: string): PrizeTier {
	return isPrizeTier(value) ? value : 'common';
}

function toPublicPrize(row: PrizeRow): PublicPrize {
	return {
		id: row.id,
		slug: row.slug,
		name: row.name,
		tier: tierOf(row.tier),
		imagePath: row.imagePath,
		remaining: Math.max(0, row.remaining),
	};
}

function toAdminPrize(row: PrizeRow): AdminPrize {
	return { ...toPublicPrize(row), sortOrder: row.sortOrder, isActive: row.isActive };
}

/** The settings row exists from the migration; recreate it if someone removed it. */
async function loadSettings(db: Tx | typeof prisma) {
	return db.fmt2026Settings.upsert({
		where: { id: SETTINGS_ID },
		update: {},
		create: { id: SETTINGS_ID },
	});
}

/**
 * Serialises every stock change behind one row lock, so two booth clicks (or a
 * click and an admin edit) never see the same stock.
 */
async function lockBooth(tx: Tx) {
	await loadSettings(tx);
	await tx.$queryRaw`SELECT "id" FROM "Fmt2026Settings" WHERE "id" = ${SETTINGS_ID} FOR UPDATE`;
	return tx.fmt2026Settings.findUniqueOrThrow({ where: { id: SETTINGS_ID } });
}

async function readPool(db: Tx | typeof prisma) {
	const [prizes, spinsUsed] = await Promise.all([
		db.fmt2026Prize.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] }),
		db.fmt2026Draw.count({ where: { voidedAt: null } }),
	]);
	return { prizes, spinsUsed };
}

export async function getBoothState(unlocked: boolean): Promise<BoothState> {
	const settings = await loadSettings(prisma);
	const { prizes, spinsUsed } = await readPool(prisma);
	const summary = summarizePool({ totalSpins: settings.totalSpins, spinsUsed, prizes });
	return {
		isOpen: settings.isOpen,
		hasPin: settings.pinHash !== null,
		unlocked,
		prizes: prizes.filter((prize) => prize.isActive).map(toPublicPrize),
		luckLeft: summary.luckLeft,
		spinsLeft: summary.spinsLeft,
	};
}

export async function getPinState(): Promise<{ pinHash: string | null; pinVersion: number }> {
	const settings = await loadSettings(prisma);
	return { pinHash: settings.pinHash, pinVersion: settings.pinVersion };
}

/** The server decides every result; the page only plays the animation for it. */
export async function drawOnce(): Promise<DrawResult> {
	return prisma.$transaction(async (tx) => {
		const settings = await lockBooth(tx);
		if (!settings.isOpen) {
			throw new AppError('Quầy quà đang đóng', 409, 'BOOTH_CLOSED');
		}
		const { prizes, spinsUsed } = await readPool(tx);
		const pick = pickFromPool({ totalSpins: settings.totalSpins, spinsUsed, prizes }, (max) =>
			randomInt(max),
		);
		if (!pick) throw new AppError('Đã hết lượt quay', 409, 'SOLD_OUT');

		if (pick.prizeId === null) {
			const draw = await tx.fmt2026Draw.create({ data: { prizeName: 'Chúc may mắn' } });
			return { id: draw.id, prize: null, createdAt: draw.createdAt.toISOString() };
		}

		const prize = await tx.fmt2026Prize.update({
			where: { id: pick.prizeId },
			data: { remaining: { decrement: 1 } },
		});
		const draw = await tx.fmt2026Draw.create({
			data: { prizeId: prize.id, prizeName: prize.name },
		});
		return { id: draw.id, prize: toPublicPrize(prize), createdAt: draw.createdAt.toISOString() };
	});
}

/** Undo the latest draw (a mis-click at the booth) and put its prize back. */
export async function voidLastDraw(): Promise<{ id: string; prizeName: string } | null> {
	return prisma.$transaction(async (tx) => {
		await lockBooth(tx);
		const last = await tx.fmt2026Draw.findFirst({
			where: { voidedAt: null },
			orderBy: { createdAt: 'desc' },
		});
		if (!last) return null;
		await tx.fmt2026Draw.update({ where: { id: last.id }, data: { voidedAt: new Date() } });
		if (last.prizeId) {
			await tx.fmt2026Prize.update({
				where: { id: last.prizeId },
				data: { remaining: { increment: 1 } },
			});
		}
		return { id: last.id, prizeName: last.prizeName };
	});
}

export async function getAdminOverview(): Promise<AdminOverview> {
	const settings = await loadSettings(prisma);
	const [{ prizes, spinsUsed }, draws] = await Promise.all([
		readPool(prisma),
		prisma.fmt2026Draw.findMany({ orderBy: { createdAt: 'desc' }, take: HISTORY_LIMIT }),
	]);
	const summary = summarizePool({ totalSpins: settings.totalSpins, spinsUsed, prizes });
	return {
		settings: {
			totalSpins: settings.totalSpins,
			isOpen: settings.isOpen,
			hasPin: settings.pinHash !== null,
			updatedAt: settings.updatedAt.toISOString(),
		},
		prizes: prizes.map(toAdminPrize),
		spinsUsed,
		...summary,
		draws: draws.map((draw) => ({
			id: draw.id,
			createdAt: draw.createdAt.toISOString(),
			prizeName: draw.prizeName,
			isLuck: draw.prizeId === null,
			voidedAt: draw.voidedAt?.toISOString() ?? null,
		})),
	};
}

export async function configureBoothPin(pin: string): Promise<void> {
	await prisma.$transaction(async (tx) => {
		const settings = await lockBooth(tx);
		if (settings.pinHash) {
			throw new AppError('Quầy đã có PIN. Hãy mở lại phần thiết lập.', 409);
		}
		await tx.fmt2026Settings.update({
			where: { id: SETTINGS_ID },
			data: { pinHash: hashPin(pin), pinVersion: { increment: 1 } },
		});
	});
}

export async function getBoothSetup() {
	const [settings, prizes] = await Promise.all([
		loadSettings(prisma),
		prisma.fmt2026Prize.findMany({
			where: { isActive: true },
			orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
			select: { id: true, name: true, remaining: true },
		}),
	]);
	return { totalSpins: settings.totalSpins, prizes };
}

export async function startBooth(input: BoothSetupInput, pinVersion: number): Promise<void> {
	await prisma.$transaction(async (tx) => {
		const settings = await lockBooth(tx);
		if (settings.pinVersion !== pinVersion || !settings.pinHash) {
			throw new AppError('Mã PIN đã thay đổi. Hãy mở lại phần thiết lập.', 401, 'LOCKED');
		}

		if (settings.totalSpins !== input.previousTotalSpins) {
			throw new AppError(
				'Tổng lượt vừa thay đổi. Hãy mở lại phần thiết lập.',
				409,
				'STOCK_CHANGED',
			);
		}
		const { prizes, spinsUsed } = await readPool(tx);
		const active = prizes.filter((prize) => prize.isActive);
		const changes = new Map(input.prizes.map((prize) => [prize.id, prize]));
		for (const change of changes.values()) {
			const current = active.find((prize) => prize.id === change.id);
			if (current?.remaining !== change.previousRemaining) {
				throw new AppError(
					'Kho quà vừa thay đổi. Hãy mở lại phần thiết lập.',
					409,
					'STOCK_CHANGED',
				);
			}
		}
		const adjusted = active.map((prize) => ({
			...prize,
			remaining: changes.get(prize.id)?.remaining ?? prize.remaining,
		}));
		if (!summarizePool({ totalSpins: input.totalSpins, spinsUsed, prizes: adjusted }).spinsLeft) {
			throw new AppError('Cần có ít nhất một lượt rút để bắt đầu.', 400);
		}
		for (const change of changes.values()) {
			await tx.fmt2026Prize.update({
				where: { id: change.id },
				data: { remaining: change.remaining },
			});
		}
		await tx.fmt2026Settings.update({
			where: { id: SETTINGS_ID },
			data: { totalSpins: input.totalSpins, isOpen: true },
		});
	});
}

function slugify(name: string): string {
	const base = name
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/đ/gi, 'd')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
	return base || 'qua';
}

export async function createPrize(input: PrizeCreateInput): Promise<AdminPrize> {
	return prisma.$transaction(async (tx) => {
		await lockBooth(tx);
		const base = slugify(input.name);
		const taken = await tx.fmt2026Prize.findMany({
			where: { slug: { startsWith: base } },
			select: { slug: true },
		});
		const used = new Set(taken.map((row) => row.slug));
		let slug = base;
		for (let n = 2; used.has(slug); n += 1) slug = `${base}-${n}`;
		const last = await tx.fmt2026Prize.aggregate({ _max: { sortOrder: true } });
		const created = await tx.fmt2026Prize.create({
			data: {
				slug,
				name: input.name,
				remaining: input.remaining,
				tier: input.tier,
				imagePath: input.imagePath ?? null,
				sortOrder: (last._max.sortOrder ?? 0) + 1,
			},
		});
		return toAdminPrize(created);
	});
}

export async function updatePrize(id: string, input: PrizeUpdateInput): Promise<AdminPrize> {
	return prisma.$transaction(async (tx) => {
		await lockBooth(tx);
		const existing = await tx.fmt2026Prize.findUnique({ where: { id }, select: { id: true } });
		if (!existing) throw new AppError('Không tìm thấy món quà', 404);
		const updated = await tx.fmt2026Prize.update({ where: { id }, data: input });
		return toAdminPrize(updated);
	});
}

export async function updateSettings(input: SettingsUpdateInput): Promise<void> {
	const { pin, ...rest } = input;
	await prisma.$transaction(async (tx) => {
		await lockBooth(tx);
		await tx.fmt2026Settings.update({
			where: { id: SETTINGS_ID },
			data: {
				...rest,
				...(pin ? { pinHash: hashPin(pin), pinVersion: { increment: 1 } } : {}),
			},
		});
	});
}
