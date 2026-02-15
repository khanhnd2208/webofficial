import mongoose from 'mongoose';

import dbConnect from '@/lib/dbConnect';
import Course from '@/models/Course';
import Lesson from '@/models/Lesson';
import Unit from '@/models/Unit';
import type { CourseUnitListItemDTO } from '@/types/courseUnit';
import type { UnitDTO } from '@/types/unit';

type CourseUnitLean = {
	_id: mongoose.Types.ObjectId;
	courseId: mongoose.Types.ObjectId;
	unitId: mongoose.Types.ObjectId;
	order: number;
	createdAt?: Date;
	updatedAt?: Date;
};

type UnitLean = {
	_id: mongoose.Types.ObjectId;
	name: string;
	createdAt?: Date;
	updatedAt?: Date;
};

function toUnitDTO(doc: UnitLean): UnitDTO {
	const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date(0);
	const updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : createdAt;
	return {
		id: String(doc._id),
		name: doc.name,
		createdAt: createdAt.toISOString(),
		updatedAt: updatedAt.toISOString(),
	};
}

function toCourseUnitListItemDTO(doc: CourseUnitLean, unit: UnitDTO): CourseUnitListItemDTO {
	const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date(0);
	const updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : createdAt;
	return {
		id: String(doc._id),
		courseId: String(doc.courseId),
		unitId: String(doc.unitId),
		order: typeof doc.order === 'number' ? doc.order : 0,
		createdAt: createdAt.toISOString(),
		updatedAt: updatedAt.toISOString(),
		unit,
	};
}

export async function listCourseUnits(params?: { courseId?: string }): Promise<CourseUnitListItemDTO[]> {
	await dbConnect();
	
	const { default: CourseUnit } = await import('@/models/CourseUnit');
	
	let rows: CourseUnitLean[];
	if (params?.courseId) {
		const courseIdRaw = String(params.courseId).trim();
		if (!mongoose.isValidObjectId(courseIdRaw)) throw new Error('Invalid courseId');
		const courseObjectId = new mongoose.Types.ObjectId(courseIdRaw);
		rows = (await CourseUnit.find({ courseId: courseObjectId })
			.sort({ order: 1, createdAt: 1 })
			.lean()) as unknown as CourseUnitLean[];
	} else {
		// List all course units
		rows = (await CourseUnit.find({})
			.sort({ order: 1, createdAt: 1 })
			.lean()) as unknown as CourseUnitLean[];
	}

	if (rows.length === 0) return [];

	const unitIds = rows.map((r) => r.unitId);
	const units = (await Unit.find({ _id: { $in: unitIds } }).lean()) as unknown as UnitLean[];
	const unitById = new Map(units.map((u) => [String(u._id), toUnitDTO(u)] as const));

	return rows
		.map((r) => {
			const unit = unitById.get(String(r.unitId));
			if (!unit) return null;
			return toCourseUnitListItemDTO(r, unit);
		})
		.filter(Boolean) as CourseUnitListItemDTO[];
}

export async function attachUnitToCourse(params: {
	courseId: string;
	unitId: string;
	order?: number;
}): Promise<CourseUnitListItemDTO> {
	await dbConnect();
	const courseIdRaw = String(params.courseId ?? '').trim();
	if (!mongoose.isValidObjectId(courseIdRaw)) throw new Error('Invalid courseId');
	const unitIdRaw = String(params.unitId ?? '').trim();
	if (!mongoose.isValidObjectId(unitIdRaw)) throw new Error('Invalid unitId');
	const requestedOrder = Number.isFinite(params.order) ? Number(params.order) : undefined;

	const courseObjectId = new mongoose.Types.ObjectId(courseIdRaw);
	const unitObjectId = new mongoose.Types.ObjectId(unitIdRaw);

	const [courseExists, unitExists] = await Promise.all([
		Course.exists({ _id: courseObjectId }),
		Unit.exists({ _id: unitObjectId }),
	]);
	if (!courseExists) throw new Error('Course not found');
	if (!unitExists) throw new Error('Unit not found');

	const { default: CourseUnit } = await import('@/models/CourseUnit');

	// Simplify the hierarchy: a unit can belong to only one course.
	const attachedElsewhere = await CourseUnit.exists({ unitId: unitObjectId, courseId: { $ne: courseObjectId } });
	if (attachedElsewhere) throw new Error('Unit is already attached to another course');

	const existing = (await CourseUnit.findOne({ courseId: courseObjectId, unitId: unitObjectId }).lean()) as unknown as CourseUnitLean | null;

	if (existing && requestedOrder === undefined) {
		const unit = (await Unit.findById(unitObjectId).lean()) as unknown as UnitLean | null;
		if (!unit) throw new Error('Unit not found');
		return toCourseUnitListItemDTO(existing, toUnitDTO(unit));
	}

	let resolvedOrder = requestedOrder;
	if (!existing && resolvedOrder === undefined) {
		const last = (await CourseUnit.find({ courseId: courseObjectId })
			.sort({ order: -1, createdAt: -1 })
			.limit(1)
			.lean()) as unknown as CourseUnitLean[];
		const lastOrder = last[0]?.order;
		resolvedOrder = typeof lastOrder === 'number' && Number.isFinite(lastOrder) ? lastOrder + 1 : 1;
	}

	const updated = (await CourseUnit.findOneAndUpdate(
		{ courseId: courseObjectId, unitId: unitObjectId },
		{ $set: { order: resolvedOrder ?? 0 }, $setOnInsert: { courseId: courseObjectId, unitId: unitObjectId } },
		{ upsert: true, returnDocument: 'after', runValidators: true }
	).lean()) as unknown as CourseUnitLean | null;

	if (!updated) throw new Error('Attach unit failed');
	const unit = (await Unit.findById(unitObjectId).lean()) as unknown as UnitLean | null;
	if (!unit) throw new Error('Unit not found');

	return toCourseUnitListItemDTO(updated, toUnitDTO(unit));
}

export async function detachUnitFromCourse(params: { courseId: string; unitId: string }): Promise<{ courseId: string; unitId: string }> {
	await dbConnect();
	const courseIdRaw = String(params.courseId ?? '').trim();
	if (!mongoose.isValidObjectId(courseIdRaw)) throw new Error('Invalid courseId');
	const unitIdRaw = String(params.unitId ?? '').trim();
	if (!mongoose.isValidObjectId(unitIdRaw)) throw new Error('Invalid unitId');
	const unitObjectId = new mongoose.Types.ObjectId(unitIdRaw);

	const lessonCount = await Lesson.countDocuments({ unitId: unitObjectId });
	if (lessonCount > 0) throw new Error('Unit has lessons; move/delete lessons first');

	const { default: CourseUnit } = await import('@/models/CourseUnit');
	await CourseUnit.deleteOne({
		courseId: new mongoose.Types.ObjectId(courseIdRaw),
		unitId: unitObjectId,
	});
	return { courseId: courseIdRaw, unitId: unitIdRaw };
}
