/* ════════════════════════════════════════════════════════════════════════
   vocabSetService.ts — Vocabulary Set Business Logic (Prisma / PostgreSQL)
   
   Key design decisions:
   • Admin owns VocabSet + Word records (source of truth)
   • Users hold UserVocabSet entries (library pointers, not copies)
   • Word.isDeleted  — soft-delete words to hide from UI without losing data
   • UserVocabSet.status — soft_deleted | active; restored on re-download
   • Users always read Words directly from the admin's source VocabSet
   ════════════════════════════════════════════════════════════════════════ */
import { prisma } from '@/lib/prisma';
import type {
	VocabSetDTO,
	VocabSetListItemDTO,
	UserLibrarySetDTO,
	StoreSetDTO,
	StoreListResult,
	CreateVocabSetInput,
	UpdateVocabSetInput,
	WordDTO,
} from '@/types/vocab';
import type { VocabSet, Word } from '@prisma/client';

// ─── Errors ───────────────────────────────────────────────────────────────────
export class AlreadyOwnedError extends Error {
	constructor() {
		super('ALREADY_OWNED');
	}
}

// ─── Mappers ──────────────────────────────────────────────────────────────────
function wordToDTO(w: Word): WordDTO {
	return {
		id: w.id,
		term: w.term,
		definition: w.definition,
		partOfSpeech: w.partOfSpeech,
		example: w.example,
		ndkExplanation: w.ndkExplanation,
		hintsHard: w.hintsHard,
		hintsMedium: w.hintsMedium,
		hintsEasy: w.hintsEasy,
	};
}

function setToDTO(
set: VocabSet & { words: Word[] },
): VocabSetDTO {
	const activeWords = set.words.filter((w) => !w.isDeleted);
	return {
		id: set.id,
		title: set.title,
		description: set.description,
		ownerId: set.ownerId,
		ownerName: set.ownerName,
		words: activeWords.map(wordToDTO),
		wordCount: activeWords.length,
		isArchived: set.isArchived,
		createdAt: set.createdAt.toISOString(),
		updatedAt: set.updatedAt.toISOString(),
	};
}

function setToListItem(
set: VocabSet & { _count: { words: number } },
): VocabSetListItemDTO {
	return {
		id: set.id,
		title: set.title,
		description: set.description,
		ownerId: set.ownerId,
		ownerName: set.ownerName,
		wordCount: set._count.words,
		isArchived: set.isArchived,
		createdAt: set.createdAt.toISOString(),
		updatedAt: set.updatedAt.toISOString(),
	};
}

// ─── User Library ─────────────────────────────────────────────────────────────

/**
 * Get user's active library — includes all non-deleted words.
 */
export async function getUserLibrary(userId: string): Promise<UserLibrarySetDTO[]> {
const entries = await prisma.userVocabSet.findMany({
where: { userId, status: 'active' },
include: {
vocabSet: {
include: { words: { where: { isDeleted: false }, orderBy: { createdAt: 'asc' } } },
},
},
orderBy: { addedAt: 'desc' },
});

return entries.map((entry) => ({
...setToDTO(entry.vocabSet),
libraryEntryId: entry.id,
status: entry.status as 'active',
addedAt: entry.addedAt.toISOString(),
}));
}

/**
 * Soft-delete a set from user's library.
 * Entry is hidden from UI but can be restored via re-download.
 */
export async function softDeleteFromLibrary(
userId: string,
vocabSetId: string,
): Promise<void> {
	const entry = await prisma.userVocabSet.findUnique({
where: { userId_vocabSetId: { userId, vocabSetId } },
});
	if (!entry || entry.status === 'soft_deleted') return; // idempotent

	await prisma.userVocabSet.update({
where: { userId_vocabSetId: { userId, vocabSetId } },
data: { status: 'soft_deleted', deletedAt: new Date() },
	});
}

/**
 * Add a VocabSet to user's library.
 * - If a soft_deleted entry exists → restore to active
 * - If active entry exists → throw AlreadyOwnedError
 * - Otherwise → create new entry
 */
export async function addToLibrary(
userId: string,
vocabSetId: string,
): Promise<void> {
const existing = await prisma.userVocabSet.findUnique({
where: { userId_vocabSetId: { userId, vocabSetId } },
});

if (existing) {
if (existing.status === 'active') throw new AlreadyOwnedError();
// Restore soft-deleted entry
await prisma.userVocabSet.update({
where: { userId_vocabSetId: { userId, vocabSetId } },
data: { status: 'active', deletedAt: null },
});
return;
}

// New entry
await prisma.userVocabSet.create({
data: { userId, vocabSetId },
});
}

// ─── Store (public listing) ────────────────────────────────────────────────────

/**
 * Paginated public store listing (isArchived: false only).
 * Includes alreadyOwned flag for the requesting user.
 */
export async function getStore(
userId: string | null,
page = 1,
limit = 20,
): Promise<StoreListResult> {
const skip = (page - 1) * limit;

const [sets, total] = await prisma.$transaction([
prisma.vocabSet.findMany({
where: { isArchived: false },
orderBy: { updatedAt: 'desc' },
skip,
take: limit,
include: { _count: { select: { words: { where: { isDeleted: false } } } } },
}),
prisma.vocabSet.count({ where: { isArchived: false } }),
]);

// Fetch ownership status for the current user in one query
let ownedIds = new Set<string>();
if (userId) {
const owned = await prisma.userVocabSet.findMany({
where: { userId, vocabSetId: { in: sets.map((s) => s.id) }, status: 'active' },
select: { vocabSetId: true },
});
ownedIds = new Set(owned.map((o) => o.vocabSetId));
}

const items: StoreSetDTO[] = sets.map((set) => ({
...setToListItem(set),
alreadyOwned: ownedIds.has(set.id),
}));

return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/**
 * Get a single VocabSet with all active words (public access).
 */
export async function getVocabSetById(id: string): Promise<VocabSetDTO | null> {
const set = await prisma.vocabSet.findUnique({
where: { id },
include: { words: { where: { isDeleted: false }, orderBy: { createdAt: 'asc' } } },
});
if (!set) return null;
return setToDTO(set);
}

// ─── Admin mutations ──────────────────────────────────────────────────────────

/**
 * Create a new VocabSet with its words in one atomic transaction.
 * If word creation fails, the VocabSet is also rolled back (no orphan data).
 */
export async function createVocabSet(
ownerId: string,
ownerName: string,
input: CreateVocabSetInput,
): Promise<VocabSetDTO> {
const set = await prisma.$transaction(async (tx) => {
const created = await tx.vocabSet.create({
data: {
title: input.title.trim(),
description: input.description?.trim() ?? '',
ownerId,
ownerName,
words: {
create: input.words.map((w) => ({
term: w.term.trim(),
definition: w.definition.trim(),
partOfSpeech: w.partOfSpeech?.trim() ?? '',
example: w.example?.trim() ?? '',
ndkExplanation: w.ndkExplanation ?? null,
hintsHard: w.hintsHard ?? [],
hintsMedium: w.hintsMedium ?? [],
hintsEasy: w.hintsEasy ?? [],
})),
},
},
include: { words: { where: { isDeleted: false }, orderBy: { createdAt: 'asc' } } },
});
return created;
});

return setToDTO(set);
}

/**
 * Update VocabSet metadata and/or words in one atomic transaction.
 * - Upsert words (create new, update existing by id)
 * - Soft-delete words via deleteWordIds (sets isDeleted=true)
 */
export async function adminUpdateSet(
setId: string,
input: UpdateVocabSetInput,
): Promise<VocabSetDTO | null> {
const set = await prisma.$transaction(async (tx) => {
// 1. Update set metadata
if (input.title !== undefined || input.description !== undefined || input.isArchived !== undefined) {
await tx.vocabSet.update({
where: { id: setId },
data: {
...(input.title && { title: input.title.trim() }),
...(input.description !== undefined && { description: input.description.trim() }),
...(input.isArchived !== undefined && { isArchived: input.isArchived }),
},
});
}

		// 2. Soft-delete specified words
if (input.deleteWordIds?.length) {
await tx.word.updateMany({
where: { id: { in: input.deleteWordIds }, vocabSetId: setId },
data: { isDeleted: true },
});
}

// 3. Upsert words
if (input.words?.length) {
for (const w of input.words) {
if (w.id) {
// Update existing
await tx.word.update({
where: { id: w.id },
data: {
term: w.term.trim(),
definition: w.definition.trim(),
partOfSpeech: w.partOfSpeech?.trim() ?? '',
example: w.example?.trim() ?? '',
ndkExplanation: w.ndkExplanation ?? null,
hintsHard: w.hintsHard ?? [],
hintsMedium: w.hintsMedium ?? [],
hintsEasy: w.hintsEasy ?? [],
isDeleted: false, // re-activate if it was soft-deleted
},
});
} else {
// Create new
await tx.word.create({
data: {
vocabSetId: setId,
term: w.term.trim(),
definition: w.definition.trim(),
partOfSpeech: w.partOfSpeech?.trim() ?? '',
example: w.example?.trim() ?? '',
ndkExplanation: w.ndkExplanation ?? null,
hintsHard: w.hintsHard ?? [],
hintsMedium: w.hintsMedium ?? [],
hintsEasy: w.hintsEasy ?? [],
},
});
}
}
}

return tx.vocabSet.findUnique({
where: { id: setId },
include: { words: { where: { isDeleted: false }, orderBy: { createdAt: 'asc' } } },
});
});

if (!set) return null;
return setToDTO(set);
}

/**
 * Archive a VocabSet from the store (isArchived = true).
 * Users who already have it keep access.
 */
export async function archiveVocabSet(setId: string): Promise<void> {
await prisma.vocabSet.update({
where: { id: setId },
data: { isArchived: true },
});
}

/**
 * Soft-delete a single word (sets isDeleted=true).
 */
export async function adminSoftDeleteWord(wordId: string, setId: string): Promise<void> {
await prisma.word.update({
where: { id: wordId, vocabSetId: setId },
data: { isDeleted: true },
});
}

/**
 * Get all sets owned by an admin (for admin panel).
 */
export async function listAdminOwnedSets(_adminId?: string): Promise<VocabSetListItemDTO[]> {
const sets = await prisma.vocabSet.findMany({
orderBy: { updatedAt: 'desc' },
include: { _count: { select: { words: { where: { isDeleted: false } } } } },
});
return sets.map(setToListItem);
}

/** Alias kept for callers that haven't been updated yet. Returns active library entries only. */
export const listMyVocabSets = getUserLibrary;
