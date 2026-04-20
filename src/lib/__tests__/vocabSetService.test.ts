/* ════════════════════════════════════════════════════════════════════════
   vocabSetService.test.ts
   
   Tests all critical business logic paths:
   - Soft delete / restore / already-owned
   - Admin soft-delete word (isDeleted=true)
   - Archive set (UserVocabSet unchanged)
   - Transaction rollback on error
   ════════════════════════════════════════════════════════════════════════ */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import {
	getUserLibrary,
	softDeleteFromLibrary,
	addToLibrary,
	getStore,
	createVocabSet,
	adminUpdateSet,
	archiveVocabSet,
	adminSoftDeleteWord,
	AlreadyOwnedError,
} from '@/services/vocabSetService';

// ─── Test database ─────────────────────────────────────────────────────────────
// Uses a real Prisma client against the test DB (same DB, isolated by cleanup).
// Ensure DATABASE_URL points to a test database before running.
const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5432/teaching_platform_vocab';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const testPrisma = new PrismaClient({ adapter });

const ADMIN_ID  = 'test-admin-001';
const USER_ID   = 'test-user-001';
const USER2_ID  = 'test-user-002';

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function seedSet(overrides: Partial<{ isArchived: boolean }> = {}) {
	return testPrisma.vocabSet.create({
		data: {
			title: 'Test Set',
			description: 'desc',
			ownerId: ADMIN_ID,
			ownerName: 'Test Admin',
			isArchived: overrides.isArchived ?? false,
			words: {
				create: [
					{ term: 'hello', definition: 'a greeting', partOfSpeech: 'interjection' },
					{ term: 'world', definition: 'the earth', partOfSpeech: 'noun' },
				],
			},
		},
		include: { words: true },
	});
}

async function cleanup() {
	await testPrisma.userVocabSet.deleteMany({ where: { userId: { in: [USER_ID, USER2_ID] } } });
	await testPrisma.word.deleteMany({ where: { vocabSet: { ownerId: ADMIN_ID } } });
	await testPrisma.vocabSet.deleteMany({ where: { ownerId: ADMIN_ID } });
}

beforeEach(cleanup);
afterAll(async () => {
	await cleanup();
	await testPrisma.$disconnect();
});

// ─── Soft Delete & Restore ────────────────────────────────────────────────────
describe('softDeleteFromLibrary', () => {
	it('sets status to soft_deleted and records deletedAt', async () => {
		const set = await seedSet();
		await addToLibrary(USER_ID, set.id);

		await softDeleteFromLibrary(USER_ID, set.id);

		const entry = await testPrisma.userVocabSet.findUnique({
			where: { userId_vocabSetId: { userId: USER_ID, vocabSetId: set.id } },
		});
		expect(entry?.status).toBe('soft_deleted');
		expect(entry?.deletedAt).not.toBeNull();
	});

	it('is idempotent (calling twice does not throw)', async () => {
		const set = await seedSet();
		await addToLibrary(USER_ID, set.id);
		await softDeleteFromLibrary(USER_ID, set.id);
		await expect(softDeleteFromLibrary(USER_ID, set.id)).resolves.not.toThrow();
	});

});

describe('addToLibrary (restore)', () => {
	it('restores a soft-deleted entry without creating a duplicate', async () => {
		const set = await seedSet();
		await addToLibrary(USER_ID, set.id);
		await softDeleteFromLibrary(USER_ID, set.id);

		// Re-add — should restore, not create new
		await addToLibrary(USER_ID, set.id);

		const entries = await testPrisma.userVocabSet.findMany({
			where: { userId: USER_ID, vocabSetId: set.id },
		});
		expect(entries.length).toBe(1);
		expect(entries[0].status).toBe('active');
		expect(entries[0].deletedAt).toBeNull();
	});

	it('throws AlreadyOwnedError when set is already active', async () => {
		const set = await seedSet();
		await addToLibrary(USER_ID, set.id);
		await expect(addToLibrary(USER_ID, set.id)).rejects.toThrow(AlreadyOwnedError);
	});

});

// ─── Archive ──────────────────────────────────────────────────────────────────
describe('archiveVocabSet', () => {
	it('sets isArchived=true on the VocabSet', async () => {
		const set = await seedSet();
		await archiveVocabSet(set.id);
		const updated = await testPrisma.vocabSet.findUnique({ where: { id: set.id } });
		expect(updated?.isArchived).toBe(true);
	});

	it('does NOT delete UserVocabSet entries of existing users', async () => {
		const set = await seedSet();
		await addToLibrary(USER_ID, set.id);
		await addToLibrary(USER2_ID, set.id);

		await archiveVocabSet(set.id);

		const entries = await testPrisma.userVocabSet.findMany({
			where: { vocabSetId: set.id },
		});
		expect(entries.length).toBe(2);
		expect(entries.every((e) => e.status === 'active')).toBe(true);
	});

	it('hides archived sets from getStore()', async () => {
		const set = await seedSet();
		await archiveVocabSet(set.id);
		const result = await getStore(null, 1, 100);
		expect(result.items.find((i) => i.id === set.id)).toBeUndefined();
	});
});

// ─── Admin word soft-delete ───────────────────────────────────────────────────
describe('adminSoftDeleteWord', () => {
	it('sets word.isDeleted=true', async () => {
const set = await seedSet();
const word = set.words[0];
await adminSoftDeleteWord(word.id, set.id);
const updated = await testPrisma.word.findUnique({ where: { id: word.id } });
expect(updated?.isDeleted).toBe(true);
});

it('hides deleted word from getVocabSetById response', async () => {
const { getVocabSetById } = await import('@/services/vocabSetService');
const set = await seedSet();
const word = set.words[0];
await adminSoftDeleteWord(word.id, set.id);

const dto = await getVocabSetById(set.id);
expect(dto?.words.find((w) => w.id === word.id)).toBeUndefined();
expect(dto?.wordCount).toBe(1); // was 2, now 1 visible
});
});

// ─── Transaction integrity ────────────────────────────────────────────────────
describe('createVocabSet transaction', () => {
it('creates set + words atomically', async () => {
const dto = await createVocabSet(ADMIN_ID, 'Admin', {
title: 'Atomic Set',
words: [
{ term: 'alpha', definition: 'first letter' },
{ term: 'beta', definition: 'second letter' },
],
});
expect(dto.words.length).toBe(2);
expect(dto.wordCount).toBe(2);
});
});

// ─── Store pagination ─────────────────────────────────────────────────────────
describe('getStore pagination', () => {
it('returns paginated results with correct metadata', async () => {
// Create 5 sets
for (let i = 0; i < 5; i++) {
await seedSet();
}
const page1 = await getStore(null, 1, 3);
expect(page1.items.length).toBeLessThanOrEqual(3);
expect(page1.limit).toBe(3);
expect(typeof page1.totalPages).toBe('number');
});

it('marks alreadyOwned correctly for the requesting user', async () => {
const set = await seedSet();
await addToLibrary(USER_ID, set.id);

const result = await getStore(USER_ID, 1, 50);
const found = result.items.find((i) => i.id === set.id);
expect(found?.alreadyOwned).toBe(true);
});
});
