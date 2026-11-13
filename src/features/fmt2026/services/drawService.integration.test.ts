import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@/lib/prisma';

import { verifyPin } from './boothUnlock';
import {
	configureBoothPin,
	createPrize,
	drawOnce,
	getAdminOverview,
	getBoothState,
	getPinState,
	startBooth,
	updatePrize,
	updateSettings,
	voidLastDraw,
} from './drawService';

vi.mock('server-only', () => ({}));

async function resetBooth(totalSpins: number, isOpen = true) {
	await prisma.fmt2026Draw.deleteMany();
	await prisma.fmt2026Prize.deleteMany();
	await prisma.fmt2026Settings.upsert({
		where: { id: 1 },
		update: { totalSpins, isOpen, pinHash: null, pinVersion: 0 },
		create: { id: 1, totalSpins, isOpen },
	});
}

describe('FMT 2026 draw service', () => {
	beforeEach(async () => {
		await resetBooth(4);
	});

	afterAll(async () => {
		await prisma.fmt2026Draw.deleteMany();
		await prisma.fmt2026Prize.deleteMany();
		await prisma.fmt2026Settings.deleteMany();
	});

	it('gives every planned spin out exactly once, then reports sold out', async () => {
		await createPrize({ name: 'Sổ FMT', remaining: 2, tier: 'common' });
		const results = [];
		for (let i = 0; i < 4; i += 1) results.push(await drawOnce());

		expect(results.filter((r) => r.prize?.name === 'Sổ FMT')).toHaveLength(2);
		expect(results.filter((r) => r.prize === null)).toHaveLength(2);
		await expect(drawOnce()).rejects.toMatchObject({ code: 'SOLD_OUT' });

		const state = await getBoothState(false);
		expect(state.spinsLeft).toBe(0);
		expect(state.prizes[0]?.remaining).toBe(0);
	});

	it('never hands out the last prize twice under parallel clicks', async () => {
		await resetBooth(1);
		await createPrize({ name: 'Áo hoodie zip FMT', remaining: 1, tier: 'epic' });

		const settled = await Promise.allSettled(Array.from({ length: 5 }, () => drawOnce()));
		const won = settled.filter((r) => r.status === 'fulfilled');
		expect(won).toHaveLength(1);
		expect(settled.filter((r) => r.status === 'rejected')).toHaveLength(4);

		const overview = await getAdminOverview();
		expect(overview.prizes[0]?.remaining).toBe(0);
		expect(overview.spinsUsed).toBe(1);
	});

	it('refuses to draw while the booth is closed', async () => {
		await updateSettings({ isOpen: false });
		await createPrize({ name: 'Túi FMT', remaining: 3, tier: 'rare' });
		await expect(drawOnce()).rejects.toMatchObject({ code: 'BOOTH_CLOSED' });
	});

	it('undoes the latest draw and puts the prize back', async () => {
		await resetBooth(1);
		const prize = await createPrize({ name: 'Bình nước FMT', remaining: 1, tier: 'rare' });
		await drawOnce();
		expect((await getAdminOverview()).prizes[0]?.remaining).toBe(0);

		const undone = await voidLastDraw();
		expect(undone?.prizeName).toBe('Bình nước FMT');
		const overview = await getAdminOverview();
		expect(overview.prizes.find((p) => p.id === prize.id)?.remaining).toBe(1);
		expect(overview.spinsUsed).toBe(0);
		expect(overview.draws[0]?.voidedAt).not.toBeNull();
	});

	it('sets the initial booth PIN only once', async () => {
		await configureBoothPin('2468');
		const { pinHash } = await getPinState();
		expect(verifyPin('2468', pinHash)).toBe(true);
		await expect(configureBoothPin('1357')).rejects.toMatchObject({ status: 409 });
		expect((await getPinState()).pinHash).toBe(pinHash);
	});

	it('rejects stale setup stock and starts atomically without erasing draws', async () => {
		const prize = await createPrize({ name: 'Sổ', remaining: 2, tier: 'common' });
		await drawOnce();
		await updateSettings({ isOpen: false, pin: '2468' });
		const { pinVersion } = await getPinState();
		const snapshot = await getAdminOverview();
		const previousRemaining = snapshot.prizes[0]!.remaining;
		const input = {
			totalSpins: 12,
			previousTotalSpins: 4,
			prizes: [{ id: prize.id, remaining: 5, previousRemaining }],
		};

		await updatePrize(prize.id, { remaining: previousRemaining + 1 });
		await expect(startBooth(input, pinVersion)).rejects.toMatchObject({ code: 'STOCK_CHANGED' });
		expect((await getAdminOverview()).settings).toMatchObject({ isOpen: false, totalSpins: 4 });
		input.prizes[0]!.previousRemaining += 1;
		await startBooth(input, pinVersion);
		expect(await getAdminOverview()).toMatchObject({
			settings: { isOpen: true, totalSpins: 12 },
			spinsUsed: 1,
			prizes: [{ id: prize.id, remaining: 5 }],
		});
	});

	it('lets an admin change stock and planned spins at any time', async () => {
		const prize = await createPrize({ name: 'Áo FMT đỏ', remaining: 1, tier: 'common' });
		await updatePrize(prize.id, { remaining: 3 });
		await updateSettings({ totalSpins: 10 });

		const overview = await getAdminOverview();
		expect(overview).toMatchObject({ prizesLeft: 3, luckLeft: 7, spinsLeft: 10 });
	});

	it('stores a hashed PIN and bumps its version on change', async () => {
		await updateSettings({ pin: '2026' });
		const first = await getPinState();
		expect(first.pinHash).not.toContain('2026');
		expect(verifyPin('2026', first.pinHash)).toBe(true);
		expect(verifyPin('1111', first.pinHash)).toBe(false);

		await updateSettings({ pin: '9999' });
		expect((await getPinState()).pinVersion).toBe(first.pinVersion + 1);
	});

	it('gives duplicate names their own slug', async () => {
		const a = await createPrize({ name: 'Sổ FMT', remaining: 1, tier: 'common' });
		const b = await createPrize({ name: 'Sổ FMT', remaining: 1, tier: 'common' });
		expect(a.slug).toBe('so-fmt');
		expect(b.slug).toBe('so-fmt-2');
	});
});
