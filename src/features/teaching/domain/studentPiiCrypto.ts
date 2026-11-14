import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';

const CIPHER_PREFIX = 'enc:v1:';
const HKDF_SALT = Buffer.from('teaching-student-pii-v1', 'utf8');
const HKDF_INFO = Buffer.from('aes-256-gcm', 'utf8');
const TEST_FALLBACK_SECRET = 'test-only-teaching-pii-fallback-secret';

function resolveEncryptionKey(): Buffer {
	const dedicated = process.env.TEACHING_PII_ENCRYPTION_KEY?.trim();
	if (dedicated) {
		if (/^[0-9a-fA-F]{64}$/.test(dedicated)) {
			return Buffer.from(dedicated, 'hex');
		}
		const asBase64 = Buffer.from(dedicated, 'base64');
		if (asBase64.length === 32 && asBase64.toString('base64') === dedicated) {
			return asBase64;
		}
		return Buffer.from(
			hkdfSync('sha256', Buffer.from(dedicated, 'utf8'), HKDF_SALT, HKDF_INFO, 32),
		);
	}

	const fallbackSecret =
		process.env.AUTH_SECRET?.trim() ||
		process.env.NEXTAUTH_SECRET?.trim() ||
		(process.env.NODE_ENV === 'test' ? TEST_FALLBACK_SECRET : '');

	if (!fallbackSecret) {
		throw new Error(
			'Missing TEACHING_PII_ENCRYPTION_KEY or AUTH_SECRET for student PII encryption',
		);
	}

	return Buffer.from(
		hkdfSync('sha256', Buffer.from(fallbackSecret, 'utf8'), HKDF_SALT, HKDF_INFO, 32),
	);
}

/**
 * Encrypts a single student PII string with AES-256-GCM.
 * Null, empty, or already-encrypted (`enc:v1:...`) values are returned unchanged.
 */
export function encryptStudentPiiField(value: string): string;
export function encryptStudentPiiField(value: string | null): string | null;
export function encryptStudentPiiField(value: string | null | undefined): string | null | undefined;
export function encryptStudentPiiField(
	value: string | null | undefined,
): string | null | undefined {
	if (value == null || value.trim() === '' || value.startsWith(CIPHER_PREFIX)) {
		return value;
	}
	const key = resolveEncryptionKey();
	const iv = randomBytes(12);
	const cipher = createCipheriv('aes-256-gcm', key, iv);
	const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
	const tag = cipher.getAuthTag();
	return `${CIPHER_PREFIX}${iv.toString('base64url')}:${tag.toString('base64url')}:${encrypted.toString('base64url')}`;
}

/**
 * Decrypts a single `enc:v1:...` student PII string.
 * Null, empty, or legacy plaintext values are returned unchanged.
 */
export function decryptStudentPiiField(value: string): string;
export function decryptStudentPiiField(value: string | null): string | null;
export function decryptStudentPiiField(value: string | null | undefined): string | null | undefined;
export function decryptStudentPiiField(
	value: string | null | undefined,
): string | null | undefined {
	if (value == null || value === '' || !value.startsWith(CIPHER_PREFIX)) {
		return value;
	}
	const parts = value.slice(CIPHER_PREFIX.length).split(':');
	if (parts.length !== 3) {
		throw new Error('Invalid encrypted student PII payload');
	}
	const [ivB64, tagB64, dataB64] = parts;
	const key = resolveEncryptionKey();
	const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64url'));
	decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
	const decrypted = Buffer.concat([
		decipher.update(Buffer.from(dataB64, 'base64url')),
		decipher.final(),
	]);
	return decrypted.toString('utf8');
}

export function decryptStudentRecord<T extends { phone: string | null; email: string | null }>(
	student: T,
): T {
	const phone = decryptStudentPiiField(student.phone) ?? null;
	const email = decryptStudentPiiField(student.email) ?? null;
	if (phone === student.phone && email === student.email) {
		return student;
	}
	return { ...student, phone, email };
}

export function decryptClassEnrollments<
	T extends { enrollments: Array<{ student: { phone: string | null; email: string | null } }> },
>(row: T | null): T | null {
	if (!row) return null;
	return {
		...row,
		enrollments: row.enrollments.map((enrollment) => ({
			...enrollment,
			student: decryptStudentRecord(enrollment.student),
		})),
	};
}
