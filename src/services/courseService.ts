import mongoose from 'mongoose';

import dbConnect from '@/lib/dbConnect';
import Course from '@/models/Course';
import type { AdminCourseListItemDTO, CourseDTO } from '@/types/course';

type CourseLean = {
	_id: mongoose.Types.ObjectId;
	name: string;
	description?: string;
	createdAt?: Date;
	updatedAt?: Date;
};

function toCourseDTO(doc: CourseLean): CourseDTO {
	const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date(0);
	const updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : createdAt;
	return {
		id: String(doc._id),
		name: doc.name,
		description: String(doc.description ?? ''),
		createdAt: createdAt.toISOString(),
		updatedAt: updatedAt.toISOString(),
	};
}

export async function listCourses(): Promise<CourseDTO[]> {
	await dbConnect();
	const rows = (await Course.find({}).sort({ name: 1 }).lean()) as unknown as CourseLean[];
	return rows.map(toCourseDTO);
}

export async function getCourseById(id: string): Promise<CourseDTO | null> {
	const cleaned = String(id ?? '').trim();
	if (!cleaned) return null;
	if (!mongoose.isValidObjectId(cleaned)) return null;

	await dbConnect();
	const found = (await Course.findById(cleaned).lean()) as unknown as CourseLean | null;
	return found ? toCourseDTO(found) : null;
}

export async function createCourse(input: { name: string; description?: string }): Promise<CourseDTO> {
	await dbConnect();
	const name = String(input.name ?? '').trim();
	if (!name) throw new Error('Missing course name');
	const description = String(input.description ?? '').trim();

	const normalized = name.toLowerCase();
	const updated = (await Course.findOneAndUpdate(
		{ name: normalized },
		{ $setOnInsert: { name: normalized, description } },
		{ upsert: true, new: true, runValidators: true }
	).lean()) as unknown as CourseLean | null;

	if (!updated) throw new Error('Create course failed');
	return toCourseDTO(updated);
}

type CourseStatsAgg = {
	_id: mongoose.Types.ObjectId;
	lessonCount: number;
	vocabularyCount: number;
};

export async function listCoursesWithStats(): Promise<AdminCourseListItemDTO[]> {
	await dbConnect();
	const { default: CourseUnit } = await import('@/models/CourseUnit');
	const [courses, stats] = await Promise.all([
		Course.find({}).sort({ name: 1 }).lean() as unknown as Promise<CourseLean[]>,
		CourseUnit.aggregate<CourseStatsAgg>([
			{
				$group: {
					_id: '$courseId',
					unitIds: { $addToSet: '$unitId' },
				},
			},
			{
				$lookup: {
					from: 'lessons',
					let: { unitIds: '$unitIds' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $ne: ['$unitId', null] },
										{ $in: ['$unitId', '$$unitIds'] },
									],
								},
							},
						},
						{ $project: { vocabularyCount: 1 } },
					],
					as: 'lessons',
				},
			},
			{
				$addFields: {
					lessonCount: { $size: '$lessons' },
					vocabularyCount: { $sum: '$lessons.vocabularyCount' },
				},
			},
			{ $project: { lessons: 0, unitIds: 0 } },
		]),
	]);

	const statsByCourseId = new Map<string, { lessonCount: number; vocabularyCount: number }>();
	for (const s of stats) {
		statsByCourseId.set(String(s._id), {
			lessonCount: Number(s.lessonCount ?? 0),
			vocabularyCount: Number(s.vocabularyCount ?? 0),
		});
	}

	return courses.map((c) => {
		const dto = toCourseDTO(c);
		const st = statsByCourseId.get(dto.id) ?? { lessonCount: 0, vocabularyCount: 0 };
		return {
			...dto,
			lessonCount: st.lessonCount,
			vocabularyCount: st.vocabularyCount,
		};
	});
}

export async function renameCourse(params: { id: string; name: string; description?: string }): Promise<CourseDTO> {
	await dbConnect();
	const id = String(params.id ?? '').trim();
	if (!mongoose.isValidObjectId(id)) throw new Error('Invalid course id');
	const name = String(params.name ?? '').trim();
	if (!name) throw new Error('Missing course name');
	const description = params.description === undefined ? undefined : String(params.description ?? '').trim();

	const normalized = name.toLowerCase();
	const update: Record<string, unknown> = { name: normalized };
	if (description !== undefined) update.description = description;
	const updated = (await Course.findByIdAndUpdate(
		new mongoose.Types.ObjectId(id),
		{ $set: update },
		{ new: true, runValidators: true }
	).lean()) as unknown as CourseLean | null;
	if (!updated) throw new Error('Course not found');
	return toCourseDTO(updated);
}

export async function deleteCourse(params: { id: string }): Promise<{ id: string }> {
	await dbConnect();
	const id = String(params.id ?? '').trim();
	if (!mongoose.isValidObjectId(id)) throw new Error('Invalid course id');
	const courseId = new mongoose.Types.ObjectId(id);

	const { default: CourseUnit } = await import('@/models/CourseUnit');
	const attachedCount = await CourseUnit.countDocuments({ courseId });
	if (attachedCount > 0) throw new Error('Course has units; detach/delete units (and lessons) first');

	const deleted = await Course.findByIdAndDelete(courseId);
	if (!deleted) throw new Error('Course not found');
	return { id };
}
