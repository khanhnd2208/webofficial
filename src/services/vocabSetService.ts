import mongoose from 'mongoose';

import dbConnect from '@/lib/dbConnect';
import VocabSet, { type IVocabSet } from '@/models/VocabSet';
import type { VocabSetDTO, VocabSetListItemDTO, VocabTermDTO } from '@/types/vocabSet';

/* ────────────── helpers ────────────── */

type LeanDoc = IVocabSet & { _id: mongoose.Types.ObjectId };

function toDTO(doc: LeanDoc): VocabSetDTO {
	return {
		id: String(doc._id),
		title: doc.title,
		description: doc.description ?? '',
		ownerId: String(doc.ownerId),
		ownerName: doc.ownerName,
		terms: (doc.terms ?? []).map((t) => ({
			word: t.word,
			definition: t.definition,
			partOfSpeech: t.partOfSpeech ?? '',
			example: t.example ?? '',
		})),
		termCount: doc.termCount ?? doc.terms?.length ?? 0,
		isPublic: doc.isPublic ?? false,
		createdAt: new Date(doc.createdAt).toISOString(),
		updatedAt: new Date(doc.updatedAt).toISOString(),
	};
}

function toListItem(doc: LeanDoc): VocabSetListItemDTO {
	return {
		id: String(doc._id),
		title: doc.title,
		description: doc.description ?? '',
		ownerName: doc.ownerName,
		ownerId: String(doc.ownerId),
		termCount: doc.termCount ?? doc.terms?.length ?? 0,
		isPublic: doc.isPublic ?? false,
		createdAt: new Date(doc.createdAt).toISOString(),
		updatedAt: new Date(doc.updatedAt).toISOString(),
	};
}

/* ────────────── queries ────────────── */

/** List sets owned by a specific user */
export async function listMyVocabSets(ownerId: string): Promise<VocabSetListItemDTO[]> {
	await dbConnect();
	if (!mongoose.isValidObjectId(ownerId)) return [];
	const items = (await VocabSet.find({ ownerId: new mongoose.Types.ObjectId(ownerId) })
		.select({ terms: 0 })
		.sort({ updatedAt: -1 })
		.limit(200)
		.lean()) as unknown as LeanDoc[];
	return items.map(toListItem);
}

/** List sets with full terms included */
export async function listMyVocabSetsWithTerms(ownerId: string): Promise<VocabSetDTO[]> {
	await dbConnect();
	if (!mongoose.isValidObjectId(ownerId)) return [];
	const items = (await VocabSet.find({ ownerId: new mongoose.Types.ObjectId(ownerId) })
		.sort({ updatedAt: -1 })
		.limit(100)
		.lean()) as unknown as LeanDoc[];
	return items.map(toDTO);
}

/** Get a single set by ID */
export async function getVocabSetById(id: string): Promise<VocabSetDTO | null> {
	await dbConnect();
	if (!mongoose.isValidObjectId(id)) return null;
	const doc = (await VocabSet.findById(id).lean()) as unknown as LeanDoc | null;
	if (!doc) return null;
	return toDTO(doc);
}

/* ────────────── mutations ────────────── */

export async function createVocabSet(params: {
	title: string;
	description?: string;
	visibility?: string;
	terms: VocabTermDTO[];
	ownerId: string;
	ownerName: string;
}): Promise<VocabSetDTO> {
	await dbConnect();
	const doc = await VocabSet.create({
		title: params.title.trim(),
		description: (params.description ?? '').trim(),
		ownerId: new mongoose.Types.ObjectId(params.ownerId),
		ownerName: params.ownerName,
		terms: params.terms.map((t) => ({
			word: t.word.trim(),
			definition: t.definition.trim(),
			partOfSpeech: (t.partOfSpeech ?? '').trim(),
			example: (t.example ?? '').trim(),
		})),
		termCount: params.terms.length,
		isPublic: params.visibility === 'public',
	});
	return toDTO(doc.toObject() as unknown as LeanDoc);
}

export async function updateVocabSet(params: {
	id: string;
	title?: string;
	description?: string;
	terms?: VocabTermDTO[];
	isPublic?: boolean;
}): Promise<VocabSetDTO | null> {
	await dbConnect();
	if (!mongoose.isValidObjectId(params.id)) return null;

	const update: Record<string, unknown> = {};
	if (params.title !== undefined) update.title = params.title.trim();
	if (params.description !== undefined) update.description = params.description.trim();
	if (params.isPublic !== undefined) update.isPublic = params.isPublic;
	if (params.terms !== undefined) {
		update.terms = params.terms.map((t) => ({
			word: t.word.trim(),
			definition: t.definition.trim(),
			partOfSpeech: (t.partOfSpeech ?? '').trim(),
			example: (t.example ?? '').trim(),
		}));
		update.termCount = params.terms.length;
	}

	const doc = (await VocabSet.findByIdAndUpdate(params.id, { $set: update }, { returnDocument: 'after' }).lean()) as unknown as LeanDoc | null;
	if (!doc) return null;
	return toDTO(doc);
}

export async function deleteVocabSet(id: string): Promise<boolean> {
	await dbConnect();
	if (!mongoose.isValidObjectId(id)) return false;
	const result = await VocabSet.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
	return (result.deletedCount ?? 0) > 0;
}

/* ────────────── store / public sets ────────────── */

/** List all public sets (for the store) */
export async function listPublicSets(): Promise<VocabSetListItemDTO[]> {
	await dbConnect();
	const items = (await VocabSet.find({ isPublic: true })
		.select({ terms: 0 })
		.sort({ updatedAt: -1 })
		.limit(200)
		.lean()) as unknown as LeanDoc[];
	return items.map(toListItem);
}

/** List ALL sets owned by admin (both public and private) — for admin management */
export async function listAdminOwnedSets(adminId: string): Promise<VocabSetListItemDTO[]> {
	await dbConnect();
	if (!mongoose.isValidObjectId(adminId)) return [];
	const items = (await VocabSet.find({ ownerId: new mongoose.Types.ObjectId(adminId) })
		.select({ terms: 0 })
		.sort({ updatedAt: -1 })
		.limit(500)
		.lean()) as unknown as LeanDoc[];
	return items.map(toListItem);
}

/** Get a public set by ID (with terms, for preview / clone) */
export async function getPublicSetById(id: string): Promise<VocabSetDTO | null> {
	await dbConnect();
	if (!mongoose.isValidObjectId(id)) return null;
	const doc = (await VocabSet.findOne({ _id: new mongoose.Types.ObjectId(id), isPublic: true }).lean()) as unknown as LeanDoc | null;
	if (!doc) return null;
	return toDTO(doc);
}

/** Clone a public set into a user's own collection */
export async function cloneVocabSet(params: {
	sourceId: string;
	ownerId: string;
	ownerName: string;
}): Promise<VocabSetDTO | null> {
	await dbConnect();
	if (!mongoose.isValidObjectId(params.sourceId)) return null;

	// Single read — get the source directly
	const source = (await VocabSet.findOne({
		_id: new mongoose.Types.ObjectId(params.sourceId),
		isPublic: true,
	}).lean()) as unknown as LeanDoc | null;
	if (!source) return null;

	const doc = await VocabSet.create({
		title: source.title,
		description: source.description,
		ownerId: new mongoose.Types.ObjectId(params.ownerId),
		ownerName: params.ownerName,
		terms: (source.terms ?? []).map((t) => ({
			word: t.word,
			definition: t.definition,
			partOfSpeech: t.partOfSpeech,
			example: t.example,
		})),
		termCount: source.termCount ?? source.terms?.length ?? 0,
		isPublic: false,
	});
	return toDTO(doc.toObject() as unknown as LeanDoc);
}
