import { statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getCardDeck, getRoleImage } from './cardDecks';
import { ROLES } from './roles';

describe('card deck assets', () => {
	it('provides a small, distinct event asset for all 17 roles without replacing classic art', () => {
		expect(ROLES).toHaveLength(17);
		const paths = new Set<string>();
		for (const role of ROLES) {
			expect(getRoleImage(role)).toBe(role.image);
			const image = getRoleImage(role, 'van-son-2026');
			expect(image).not.toBe(role.image);
			const stats = statSync(path.join(process.cwd(), 'public', image));
			expect(stats.size).toBeGreaterThan(0);
			expect(stats.size).toBeLessThanOrEqual(300_000);
			paths.add(image);
		}
		expect(paths.size).toBe(17);
	});

	it('falls back to classic for old or unsupported room data', () => {
		expect(getCardDeck(undefined)).toBe('classic');
		expect(getCardDeck('unknown')).toBe('classic');
		expect(getCardDeck('van-son-2026')).toBe('van-son-2026');
	});
});
