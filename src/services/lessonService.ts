import mongoose from 'mongoose';

import dbConnect from '@/lib/dbConnect';
import Lesson from '@/models/Lesson';
import Unit from '@/models/Unit';
import type { AdminLessonListItemDTO, LessonDTO } from '@/types/lesson';

type LessonLean = {
	_id: mongoose.Types.ObjectId;
	unitId?: mongoose.Types.ObjectId;
	title: string;
	content: string;
	vocabCollectionId?: mongoose.Types.ObjectId;
	vocabularyCount: number;
	createdAt?: Date;
	updatedAt?: Date;
};

type LessonListLean = {
	_id: mongoose.Types.ObjectId;
	unitId?: mongoose.Types.ObjectId;
	title: string;
	vocabCollectionId?: mongoose.Types.ObjectId;
	vocabularyCount?: number;
	createdAt?: Date;
	updatedAt?: Date;
};

function toLessonDTO(doc: LessonLean): LessonDTO {
	const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date(0);
	const updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : createdAt;
	return {
		id: String(doc._id),
		unitId: doc.unitId ? String(doc.unitId) : undefined,
		title: doc.title,
		content: doc.content,
		vocabCollectionId: doc.vocabCollectionId ? String(doc.vocabCollectionId) : undefined,
		vocabularyCount: typeof doc.vocabularyCount === 'number' ? doc.vocabularyCount : 0,
		createdAt: createdAt.toISOString(),
		updatedAt: updatedAt.toISOString(),
	};
}

function toAdminLessonListItemDTO(doc: LessonListLean): AdminLessonListItemDTO {
	const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date(0);
	const updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : createdAt;
	const vocabularyCount = typeof doc.vocabularyCount === 'number' ? doc.vocabularyCount : 0;
	return {
		id: String(doc._id),
		unitId: doc.unitId ? String(doc.unitId) : undefined,
		title: doc.title,
		vocabCollectionId: doc.vocabCollectionId ? String(doc.vocabCollectionId) : undefined,
		vocabularyCount,
		createdAt: createdAt.toISOString(),
		updatedAt: updatedAt.toISOString(),
	};
}

export async function createLesson(input: {
	unitId: string;
	title: string;
	content: string;
}): Promise<LessonDTO> {
	await dbConnect();
	const title = String(input.title ?? '').trim();
	const content = String(input.content ?? '');
	if (!title) throw new Error('Missing title');

	const unitIdRaw = String(input.unitId ?? '').trim();
	if (!unitIdRaw) throw new Error('Missing unitId');
	if (!mongoose.isValidObjectId(unitIdRaw)) throw new Error('Invalid unitId');
	const unit = await Unit.findById(new mongoose.Types.ObjectId(unitIdRaw)).select({ _id: 1 }).lean();
	if (!unit) throw new Error('Unit not found');
	const unitObjectId = new mongoose.Types.ObjectId(unitIdRaw);

	// Enforce hierarchy: Units must belong to a course before they can have lessons.
	const { default: CourseUnit } = await import('@/models/CourseUnit');
	const attachCount = await CourseUnit.countDocuments({ unitId: unitObjectId });
	if (attachCount !== 1) throw new Error('Unit must be attached to exactly one course');

	const created = await Lesson.create({
		unitId: unitObjectId,
		title,
		content,
		vocabCollectionId: undefined,
		vocabularyCount: 0,
	});

	return toLessonDTO(created.toObject() as unknown as LessonLean);
}

export async function getLessonById(id: string): Promise<LessonDTO | null> {
	const cleaned = String(id ?? '').trim();
	if (!cleaned) return null;
	if (!mongoose.isValidObjectId(cleaned)) return null;

	await dbConnect();

	const found = (await Lesson.findById(cleaned).lean()) as unknown as LessonLean | null;
	if (!found) return null;
	return toLessonDTO(found);
}

export async function listLessons(params: { page?: number; limit?: number; unitId?: string } = {}): Promise<{
	items: AdminLessonListItemDTO[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}> {
	const page = Math.max(1, Math.floor(params.page ?? 1));
	const limit = Math.min(50, Math.max(1, Math.floor(params.limit ?? 20)));

	await dbConnect();

	const filter: Record<string, unknown> = {};
	if (params.unitId && params.unitId.trim()) {
		if (!mongoose.isValidObjectId(params.unitId.trim())) throw new Error('Invalid unitId');
		filter.unitId = new mongoose.Types.ObjectId(params.unitId.trim());
	}

	const [total, items] = await Promise.all([
		Lesson.countDocuments(filter),
		Lesson.find(filter)
			.select({ unitId: 1, title: 1, vocabCollectionId: 1, vocabularyCount: 1, createdAt: 1, updatedAt: 1 })
			.sort({ updatedAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit)
			.lean(),
	]);

	const totalPages = Math.max(1, Math.ceil(total / limit));
	return {
		items: (items as unknown as LessonListLean[]).map(toAdminLessonListItemDTO),
		page,
		limit,
		total,
		totalPages,
	};
}

export async function updateLesson(params: {
	id: string;
	unitId: string;
	title: string;
	content: string;
	vocabCollectionId?: string;
}): Promise<LessonDTO> {
	await dbConnect();
	const id = String(params.id ?? '').trim();
	if (!mongoose.isValidObjectId(id)) throw new Error('Invalid lesson id');

	const title = String(params.title ?? '').trim();
	const content = String(params.content ?? '');
	if (!title) throw new Error('Missing title');

	const unitIdRaw = String(params.unitId ?? '').trim();
	if (!unitIdRaw) throw new Error('Missing unitId');
	if (!mongoose.isValidObjectId(unitIdRaw)) throw new Error('Invalid unitId');
	const unitObjectId = new mongoose.Types.ObjectId(unitIdRaw);
	const unit = await Unit.findById(unitObjectId).select({ _id: 1 }).lean();
	if (!unit) throw new Error('Unit not found');
	const { default: CourseUnit } = await import('@/models/CourseUnit');
	const attachCount = await CourseUnit.countDocuments({ unitId: unitObjectId });
	if (attachCount !== 1) throw new Error('Unit must be attached to exactly one course');

	let vocabCollectionObjectId: mongoose.Types.ObjectId | null | undefined;
	const vocabCollectionIdRaw = String(params.vocabCollectionId ?? '').trim();
	if (!vocabCollectionIdRaw) {
		vocabCollectionObjectId = null;
	} else {
		if (!mongoose.isValidObjectId(vocabCollectionIdRaw)) throw new Error('Invalid vocabCollectionId');
		const { default: VocabularyCollection } = await import('@/models/VocabularyCollection');
		const exists = await VocabularyCollection.exists({ _id: new mongoose.Types.ObjectId(vocabCollectionIdRaw) });
		if (!exists) throw new Error('Vocabulary collection not found');
		vocabCollectionObjectId = new mongoose.Types.ObjectId(vocabCollectionIdRaw);
	}

	const updated = (await Lesson.findByIdAndUpdate(
		new mongoose.Types.ObjectId(id),
		{
			$set: {
				title,
				content,
				unitId: unitObjectId,
				...(vocabCollectionObjectId === undefined ? {} : { vocabCollectionId: vocabCollectionObjectId }),
			},
		},
		{ returnDocument: 'after', runValidators: true }
	).lean()) as unknown as LessonLean | null;

	if (!updated) throw new Error('Lesson not found');
	return toLessonDTO(updated);
}

export async function deleteLesson(params: { id: string }): Promise<{ id: string }> {
	await dbConnect();
	const id = String(params.id ?? '').trim();
	if (!mongoose.isValidObjectId(id)) throw new Error('Invalid lesson id');
	const lessonId = new mongoose.Types.ObjectId(id);

	// Get lesson to find its vocabulary collection before deleting
	const lesson = await Lesson.findById(lessonId).select({ vocabCollectionId: 1 }).lean();
	if (!lesson) throw new Error('Lesson not found');

	// Delete the lesson
	await Lesson.findByIdAndDelete(lessonId);

	// Clean up orphaned vocabulary data
	const vocabCollectionId = (lesson as unknown as { vocabCollectionId?: mongoose.Types.ObjectId }).vocabCollectionId;
	if (vocabCollectionId && mongoose.isValidObjectId(String(vocabCollectionId))) {
		const collOid = new mongoose.Types.ObjectId(String(vocabCollectionId));
		// Check if any other lesson references this collection
		const otherLessonCount = await Lesson.countDocuments({ vocabCollectionId: collOid });
		if (otherLessonCount === 0) {
			// No other lessons use this collection — safe to delete items + collection
			const { default: VocabularyItem } = await import('@/models/VocabularyItem');
			const { default: VocabularyCollection } = await import('@/models/VocabularyCollection');
			await Promise.all([
				VocabularyItem.deleteMany({ collectionId: collOid }),
				VocabularyCollection.findByIdAndDelete(collOid),
			]);
		}
	}

	return { id };
}
