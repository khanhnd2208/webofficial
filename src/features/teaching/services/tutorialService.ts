import { AppError } from '@/lib/appError';

import { withUniqueConflict } from '../domain/prismaErrors';
import * as repo from '../repositories/teachingRepository';
import type { CreateTutorialInput, UpdateTutorialInput } from '../schemas';
import { mapTutorial } from './mappers';
import { ensureWeeksForTutorial, getTeachingClass, notFound } from './classService';

export async function listTutorials(classId: string) {
	await getTeachingClass(classId);
	const rows = await repo.listTutorials(classId);
	return rows.map((row) => mapTutorial(row, row._count.enrollments));
}

export async function createTutorial(classId: string, input: CreateTutorialInput) {
	const teachingClass = await getTeachingClass(classId);
	const existing = await repo.listTutorials(classId);
	const created = await withUniqueConflict('A tutorial class with this code already exists', () =>
		repo.createTutorial({
			classId,
			code: input.code,
			name: input.name,
			room: input.room ?? '',
			scheduleNote: input.scheduleNote ?? '',
			displayOrder: existing.length,
		}),
	);
	await ensureWeeksForTutorial(classId, created.id, teachingClass.totalWeeks);
	return mapTutorial(created, 0);
}

export async function updateTutorial(tutorialId: string, input: UpdateTutorialInput) {
	const existing = await repo.getTutorial(tutorialId);
	if (!existing) notFound('Tutorial class');
	const updated = await withUniqueConflict('A tutorial class with this code already exists', () =>
		repo.updateTutorial(tutorialId, {
			code: input.code,
			name: input.name,
			room: input.room,
			scheduleNote: input.scheduleNote,
		}),
	);
	return mapTutorial(updated);
}

export async function deleteTutorial(tutorialId: string) {
	const existing = await repo.getTutorial(tutorialId);
	if (!existing) notFound('Tutorial class');
	const siblings = await repo.listTutorials(existing.classId);
	if (siblings.length <= 1) {
		throw new AppError('A class must keep at least one tutorial class', 409, 'CONFLICT');
	}
	await repo.deleteTutorial(tutorialId);
	return { id: tutorialId };
}
