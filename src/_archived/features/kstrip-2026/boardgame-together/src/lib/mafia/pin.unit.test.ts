import { describe, expect, it } from 'vitest';

import { generateSalt, hashPin, isValidPin, verifyPin } from './pin';

describe('pin', () => {
	it('generates salt', () => {
		const salt = generateSalt();
		expect(salt.length).toBeGreaterThan(0);
	});

	it('hashes pin deterministically', async () => {
		const salt = 'testsalt';
		const hash1 = await hashPin('1234', salt);
		const hash2 = await hashPin('1234', salt);
		expect(hash1).toBe(hash2);
	});

	it('different pins produce different hashes', async () => {
		const salt = 'testsalt';
		const hash1 = await hashPin('1234', salt);
		const hash2 = await hashPin('5678', salt);
		expect(hash1).not.toBe(hash2);
	});

	it('verifies correct pin', async () => {
		const salt = 'testsalt';
		const hash = await hashPin('1234', salt);
		expect(await verifyPin('1234', salt, hash)).toBe(true);
		expect(await verifyPin('9999', salt, hash)).toBe(false);
	});

	it('validates pin format', () => {
		expect(isValidPin('1234', 4)).toBe(true);
		expect(isValidPin('123', 4)).toBe(false);
		expect(isValidPin('123456', 6)).toBe(true);
		expect(isValidPin('12345', 6)).toBe(false);
	});
});
