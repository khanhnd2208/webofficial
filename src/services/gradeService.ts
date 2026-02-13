import mongoose from 'mongoose';

import dbConnect from '@/lib/dbConnect';
import Grade from '@/models/Grade';
import type { CreateGradeInput, GradeDTO } from '@/types/grade';

type GradeLean = {
	_id: mongoose.Types.ObjectId;
	studentId: mongoose.Types.ObjectId;
	course: string;
	score: number;
	note?: string;
	createdAt?: Date;
	updatedAt?: Date;
};

function toGradeDTO(doc: GradeLean): GradeDTO {
	const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date(0);
	const updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : new Date(0);
	return {
		id: String(doc._id),
		studentId: String(doc.studentId),
		course: doc.course,
		score: doc.score,
		note: doc.note ?? undefined,
		createdAt: createdAt.toISOString(),
		updatedAt: updatedAt.toISOString(),
	};
}

export async function listGrades(params: { studentId?: string } = {}): Promise<GradeDTO[]> {
	await dbConnect();

	const filter: Record<string, unknown> = {};
	if (params.studentId) {
		if (!mongoose.isValidObjectId(params.studentId)) {
			throw new Error('Invalid studentId');
		}
		filter.studentId = new mongoose.Types.ObjectId(params.studentId);
	}

	const grades = (await Grade.find(filter).sort({ createdAt: -1 }).lean()) as unknown as GradeLean[];
	return grades.map(toGradeDTO);
}

export async function createGrade(input: CreateGradeInput): Promise<GradeDTO> {
	await dbConnect();

	if (!mongoose.isValidObjectId(input.studentId)) {
		throw new Error('Invalid studentId');
	}
	if (!input.course?.trim()) {
		throw new Error('Missing course');
	}
	if (typeof input.score !== 'number' || Number.isNaN(input.score)) {
		throw new Error('Invalid score');
	}

	const created = await Grade.create({
		studentId: new mongoose.Types.ObjectId(input.studentId),
		course: input.course.trim(),
		score: input.score,
		note: input.note,
	});

	return toGradeDTO(created.toObject() as unknown as GradeLean);
}
