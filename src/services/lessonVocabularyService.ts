import mongoose from 'mongoose';

import dbConnect from '@/lib/dbConnect';
import Lesson from '@/models/Lesson';
import VocabularyCollection from '@/models/VocabularyCollection';
import VocabularyItem from '@/models/VocabularyItem';
import type { LessonVocabularyItemDTO } from '@/types/lessonVocabulary';

type LessonVocabularyLean = {
	_id: mongoose.Types.ObjectId;
	collectionId: mongoose.Types.ObjectId;
	word: string;
	partOfSpeech: string;
	meaningVi: string;
	meaningEn: string;
	createdAt?: Date;
	updatedAt?: Date;
};

type LessonLean = {
	_id: mongoose.Types.ObjectId;
	vocabCollectionId?: mongoose.Types.ObjectId | null;
	title?: string;
};

function toDTO(doc: LessonVocabularyLean, lessonId: string): LessonVocabularyItemDTO {
	const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date(0);
	const updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : createdAt;
	return {
		id: String(doc._id),
		lessonId,
		word: doc.word,
		partOfSpeech: doc.partOfSpeech ?? '',
		meaningVi: doc.meaningVi,
		meaningEn: doc.meaningEn,
		createdAt: createdAt.toISOString(),
		updatedAt: updatedAt.toISOString(),
	};
}

async function getOrCreateCollectionIdForLesson(lessonObjectId: mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId> {
	const lesson = (await Lesson.findById(lessonObjectId).select({ vocabCollectionId: 1, title: 1 }).lean()) as unknown as LessonLean | null;
	if (!lesson) throw new Error('Lesson not found');
	if (lesson.vocabCollectionId && mongoose.isValidObjectId(String(lesson.vocabCollectionId))) {
		return new mongoose.Types.ObjectId(String(lesson.vocabCollectionId));
	}

	const created = await VocabularyCollection.create({ name: String(lesson.title ?? '').trim() });
	await Lesson.updateOne(
		{ _id: lessonObjectId },
		{ $set: { vocabCollectionId: created._id } }
	);
	return created._id as unknown as mongoose.Types.ObjectId;
}

async function refreshCounts(collectionObjectId: mongoose.Types.ObjectId): Promise<number> {
	const count = await VocabularyItem.countDocuments({ collectionId: collectionObjectId });
	await Promise.all([
		VocabularyCollection.updateOne({ _id: collectionObjectId }, { $set: { itemCount: Number(count) } }),
		Lesson.updateMany({ vocabCollectionId: collectionObjectId }, { $set: { vocabularyCount: Number(count) } }),
	]);
	return Number(count);
}

export async function listLessonVocabulary(lessonId: string): Promise<LessonVocabularyItemDTO[]> {
	const cleaned = String(lessonId ?? '').trim();
	if (!mongoose.isValidObjectId(cleaned)) return [];

	await dbConnect();
	const lessonObjectId = new mongoose.Types.ObjectId(cleaned);
	const lesson = (await Lesson.findById(lessonObjectId).select({ vocabCollectionId: 1 }).lean()) as unknown as LessonLean | null;
	if (!lesson?.vocabCollectionId) return [];

	const collectionObjectId = new mongoose.Types.ObjectId(String(lesson.vocabCollectionId));
	const items = (await VocabularyItem.find({ collectionId: collectionObjectId })
		.sort({ word: 1 })
		.lean()) as unknown as LessonVocabularyLean[];
	return items.map((it) => toDTO(it, cleaned));
}

export async function upsertLessonVocabularyItems(params: {
	lessonId: string;
	items: Array<{
		word: string;
		partOfSpeech: string;
		meaningVi: string;
		meaningEn: string;
	}>;
}): Promise<{ lessonId: string; total: number; upserted: number }> {
	const lessonIdRaw = String(params.lessonId ?? '').trim();
	if (!mongoose.isValidObjectId(lessonIdRaw)) throw new Error('Invalid lessonId');

	await dbConnect();
	const lessonObjectId = new mongoose.Types.ObjectId(lessonIdRaw);
	const collectionObjectId = await getOrCreateCollectionIdForLesson(lessonObjectId);

	const normalized = new Map<string, { word: string; partOfSpeech: string; meaningVi: string; meaningEn: string }>();
	for (const it of params.items ?? []) {
		const word = String(it.word ?? '').trim();
		const partOfSpeech = String(it.partOfSpeech ?? '').trim();
		const meaningVi = String(it.meaningVi ?? '').trim();
		const meaningEn = String(it.meaningEn ?? '').trim();
		if (!word || !meaningVi || !meaningEn) continue;
		normalized.set(word, { word, partOfSpeech, meaningVi, meaningEn });
	}

	const items = Array.from(normalized.values());

	if (items.length === 0) {
		await VocabularyItem.deleteMany({ collectionId: collectionObjectId });
		await refreshCounts(collectionObjectId);
		return { lessonId: lessonIdRaw, total: 0, upserted: 0 };
	}

	const bulk = items.map((it) => ({
		updateOne: {
			filter: { collectionId: collectionObjectId, word: it.word },
			update: {
				$set: {
					collectionId: collectionObjectId,
					partOfSpeech: it.partOfSpeech,
					meaningVi: it.meaningVi,
					meaningEn: it.meaningEn,
				},
			},
			upsert: true,
		},
	}));

	const result = await VocabularyItem.bulkWrite(bulk, { ordered: false });
	const upserted = (result.upsertedCount ?? 0) + (result.modifiedCount ?? 0);
	const total = await refreshCounts(collectionObjectId);
	return { lessonId: lessonIdRaw, total, upserted };
}

export async function clearLessonVocabulary(lessonId: string): Promise<{ lessonId: string; deleted: number }> {
	const cleaned = String(lessonId ?? '').trim();
	if (!mongoose.isValidObjectId(cleaned)) throw new Error('Invalid lessonId');
	await dbConnect();
	const lessonObjectId = new mongoose.Types.ObjectId(cleaned);
	const lesson = (await Lesson.findById(lessonObjectId).select({ vocabCollectionId: 1 }).lean()) as unknown as LessonLean | null;
	if (!lesson?.vocabCollectionId) return { lessonId: cleaned, deleted: 0 };
	const collectionObjectId = new mongoose.Types.ObjectId(String(lesson.vocabCollectionId));
	const result = await VocabularyItem.deleteMany({ collectionId: collectionObjectId });
	await refreshCounts(collectionObjectId);
	return { lessonId: cleaned, deleted: Number(result.deletedCount ?? 0) };
}

export async function upsertLessonVocabularyItem(params: {
	lessonId: string;
	item: { word: string; partOfSpeech?: string; meaningVi: string; meaningEn: string };
}): Promise<{ lessonId: string; total: number; upserted: number }> {
	const lessonIdRaw = String(params.lessonId ?? '').trim();
	if (!mongoose.isValidObjectId(lessonIdRaw)) throw new Error('Invalid lessonId');
	await dbConnect();
	const lessonObjectId = new mongoose.Types.ObjectId(lessonIdRaw);
	const collectionObjectId = await getOrCreateCollectionIdForLesson(lessonObjectId);

	const word = String(params.item.word ?? '').trim();
	const partOfSpeech = String(params.item.partOfSpeech ?? '').trim();
	const meaningVi = String(params.item.meaningVi ?? '').trim();
	const meaningEn = String(params.item.meaningEn ?? '').trim();
	if (!word || !meaningVi || !meaningEn) throw new Error('Missing required fields');

	const result = await VocabularyItem.updateOne(
		{ collectionId: collectionObjectId, word },
		{ $set: { collectionId: collectionObjectId, partOfSpeech, meaningVi, meaningEn } },
		{ upsert: true }
	);
	const upserted = Number((result as unknown as { modifiedCount?: number; upsertedCount?: number }).modifiedCount ?? 0) +
		Number((result as unknown as { modifiedCount?: number; upsertedCount?: number }).upsertedCount ?? 0);
	const total = await refreshCounts(collectionObjectId);
	return { lessonId: lessonIdRaw, total, upserted };
}

export async function deleteLessonVocabularyItem(params: { lessonId: string; word: string }): Promise<{ lessonId: string; deleted: number; total: number }> {
	const lessonIdRaw = String(params.lessonId ?? '').trim();
	if (!mongoose.isValidObjectId(lessonIdRaw)) throw new Error('Invalid lessonId');
	await dbConnect();

	const word = String(params.word ?? '').trim();
	if (!word) throw new Error('Missing word');
	const lessonObjectId = new mongoose.Types.ObjectId(lessonIdRaw);
	const lesson = (await Lesson.findById(lessonObjectId).select({ vocabCollectionId: 1 }).lean()) as unknown as LessonLean | null;
	if (!lesson?.vocabCollectionId) return { lessonId: lessonIdRaw, deleted: 0, total: 0 };
	const collectionObjectId = new mongoose.Types.ObjectId(String(lesson.vocabCollectionId));
	const result = await VocabularyItem.deleteOne({ collectionId: collectionObjectId, word });
	const total = await refreshCounts(collectionObjectId);
	return { lessonId: lessonIdRaw, deleted: Number(result.deletedCount ?? 0), total };
}
