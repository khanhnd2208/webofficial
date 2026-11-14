import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	decryptStudentPiiField,
	decryptStudentRecord,
	encryptStudentPiiField,
} from './studentPiiCrypto';

describe('studentPiiCrypto', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('encrypts and decrypts phone and email values roundtrip', () => {
		vi.stubEnv('AUTH_SECRET', 'unit-test-secret');
		const encryptedPhone = encryptStudentPiiField('0901234567');
		const encryptedEmail = encryptStudentPiiField('student@example.edu');

		expect(encryptedPhone).toMatch(/^enc:v1:/);
		expect(encryptedEmail).toMatch(/^enc:v1:/);
		expect(encryptedPhone).not.toContain('0901234567');
		expect(encryptedEmail).not.toContain('student@example.edu');

		expect(decryptStudentPiiField(encryptedPhone)).toBe('0901234567');
		expect(decryptStudentPiiField(encryptedEmail)).toBe('student@example.edu');
	});

	it('is idempotent when encrypting already-encrypted values', () => {
		vi.stubEnv('AUTH_SECRET', 'unit-test-secret');
		const once = encryptStudentPiiField('0901234567');
		const twice = encryptStudentPiiField(once);
		expect(twice).toBe(once);
	});

	it('passes through null, empty, and legacy plaintext values on decrypt', () => {
		expect(encryptStudentPiiField(null)).toBeNull();
		expect(encryptStudentPiiField('')).toBe('');
		expect(decryptStudentPiiField(null)).toBeNull();
		expect(decryptStudentPiiField('')).toBe('');
		expect(decryptStudentPiiField('0901234567')).toBe('0901234567');
	});

	it('supports dedicated 64-hex TEACHING_PII_ENCRYPTION_KEY', () => {
		vi.stubEnv('TEACHING_PII_ENCRYPTION_KEY', 'a'.repeat(64));
		const encrypted = encryptStudentPiiField('user@example.com');
		expect(decryptStudentPiiField(encrypted)).toBe('user@example.com');
	});

	it('decrypts student records without mutating input', () => {
		vi.stubEnv('AUTH_SECRET', 'unit-test-secret');
		const row = {
			id: 'stu-1',
			phone: encryptStudentPiiField('0912345678'),
			email: encryptStudentPiiField('sv@hanu.edu.vn'),
		};
		const decrypted = decryptStudentRecord(row);
		expect(decrypted).toEqual({
			id: 'stu-1',
			phone: '0912345678',
			email: 'sv@hanu.edu.vn',
		});
		expect(row.phone).toMatch(/^enc:v1:/);
	});
});
