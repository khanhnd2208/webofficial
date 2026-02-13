import mongoose from 'mongoose';

import dbConnect from '@/lib/dbConnect';
import Lesson from '@/models/Lesson';
import Unit from '@/models/Unit';
import type { UnitDTO } from '@/types/unit';

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

export async function listUnits(): Promise<UnitDTO[]> {
	await dbConnect();
	const rows = (await Unit.find({})
		.sort({ name: 1 })
		.lean()) as unknown as UnitLean[];
	return rows.map(toUnitDTO);
}

export async function getUnitById(id: string): Promise<UnitDTO | null> {
	const cleaned = String(id ?? '').trim();
	if (!cleaned || !mongoose.isValidObjectId(cleaned)) return null;
	await dbConnect();
	const unit = (await Unit.findById(new mongoose.Types.ObjectId(cleaned)).lean()) as unknown as UnitLean | null;
	if (!unit) return null;
	return toUnitDTO(unit);
}

export async function createUnit(params: { name: string }): Promise<UnitDTO> {
	await dbConnect();
	const name = String(params.name ?? '').trim();
	if (!name) throw new Error('Missing unit name');

	const created = await Unit.create({ name });
	return toUnitDTO(created.toObject() as unknown as UnitLean);
}

export async function renameUnit(params: { id: string; name: string }): Promise<UnitDTO> {
	await dbConnect();
	const id = String(params.id ?? '').trim();
	if (!mongoose.isValidObjectId(id)) throw new Error('Invalid unit id');
	const name = String(params.name ?? '').trim();
	if (!name) throw new Error('Missing unit name');
	const update: Record<string, unknown> = { name };

	const updated = (await Unit.findByIdAndUpdate(new mongoose.Types.ObjectId(id), { $set: update }, { new: true, runValidators: true }).lean()) as unknown as UnitLean | null;
	if (!updated) throw new Error('Unit not found');
	return toUnitDTO(updated);
}

export async function deleteUnit(params: { id: string }): Promise<{ id: string }> {
	await dbConnect();
	const id = String(params.id ?? '').trim();
	if (!mongoose.isValidObjectId(id)) throw new Error('Invalid unit id');
	const unitId = new mongoose.Types.ObjectId(id);

	const { default: CourseUnit } = await import('@/models/CourseUnit');
	const attachedCount = await CourseUnit.countDocuments({ unitId });
	if (attachedCount > 0) throw new Error('Unit is attached to courses; detach it first');

	const lessonCount = await Lesson.countDocuments({ unitId });
	if (lessonCount > 0) throw new Error('Unit has lessons; delete/move lessons first');

	const deleted = await Unit.findByIdAndDelete(unitId);
	if (!deleted) throw new Error('Unit not found');
	return { id };
}
