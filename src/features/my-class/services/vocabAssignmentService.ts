import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';
import { parseVocabCsv } from '@/lib/vocab/parseVocabCsv';
import type { VocabCsvParseResult } from '@/lib/vocab/parseVocabCsv';
import {
	addToLibrary,
	AlreadyOwnedError,
	getActiveLibraryEntry,
	getVocabSetById,
	wordWriteData,
} from '@/services/vocabSetService';
import type { CreateWordInput } from '@/types/vocab';

import { courseVocabScopeKey, isLearnerVisibleVocabAssignment, lessonVocabScopeKey } from '../domain/vocabScope';
import * as courseRepo from '../repositories/courseRepository';
import * as vocabRepo from '../repositories/vocabAssignmentRepository';
import type { VocabCsvImportInput } from '../schemas';
import { mapVocabAssignment } from './mappers';

export async function listCourseVocabAssignments(courseId: string, options?: { publicOnly?: boolean }) {
	const rows = await vocabRepo.listAssignments(courseId);
	return rows
		.filter((row) => (options?.publicOnly ? isLearnerVisibleVocabAssignment(row) : true))
		.map(mapVocabAssignment);
}

export async function getAssignedVocabSet(courseSlug: string, vocabSetId: string) {
	const course = await courseRepo.findPublishedCourse(courseSlug);
	if (!course) throw new AppError('Không tìm thấy lớp học', 404);
	const assignment = await vocabRepo.findAssignment(course.id, vocabSetId);
	if (!assignment) throw new AppError('Bộ từ không thuộc khóa học này', 404);
	if (assignment.vocabSet.isArchived) throw new AppError('Bộ từ không còn khả dụng', 404);
	if (!isLearnerVisibleVocabAssignment(assignment)) {
		throw new AppError('Bộ từ không thuộc khóa học này', 404);
	}
	const set = await getVocabSetById(vocabSetId);
	if (!set || set.isArchived) throw new AppError('Bộ từ không còn khả dụng', 404);
	return { course: { id: course.id, slug: course.slug, title: course.title }, assignment: mapVocabAssignment(assignment), set };
}

export async function assignVocabSet(courseId: string, input: { vocabSetId: string; lessonId?: string | null; position?: number }) {
	const course = await courseRepo.findAdminCourse(courseId);
	if (!course) throw new AppError('Không tìm thấy Course', 404);
	const set = await prisma.vocabSet.findUnique({ where: { id: input.vocabSetId } });
	if (!set) throw new AppError('Không tìm thấy bộ từ', 404);
	if (set.isArchived) throw new AppError('Không thể gắn bộ từ đã lưu trữ', 422);
	const lessonId: string | null = input.lessonId ?? null;
	if (lessonId) {
		const lesson = await courseRepo.findLesson(lessonId);
		if (!lesson || lesson.courseId !== courseId) throw new AppError('Lesson không thuộc Course', 422);
	}
	const scopeKey = lessonId ? lessonVocabScopeKey(lessonId, input.vocabSetId) : courseVocabScopeKey(courseId, input.vocabSetId);
	const existing = await prisma.myClassVocabAssignment.findUnique({ where: { scopeKey } });
	if (existing) throw new AppError('Bộ từ đã được gắn vào phạm vi này', 409, 'CONFLICT');
	const max = await prisma.myClassVocabAssignment.aggregate({
		where: { courseId, lessonId },
		_max: { position: true },
	});
	return prisma.myClassVocabAssignment.create({
		data: {
			courseId,
			lessonId,
			vocabSetId: input.vocabSetId,
			scopeKey,
			position: input.position ?? (max._max.position ?? -1) + 1,
		},
	});
}

export async function updateVocabAssignment(courseId: string, id: string, input: { lessonId?: string | null; position?: number }) {
	const row = await vocabRepo.findAssignmentById(id);
	if (!row || row.courseId !== courseId) throw new AppError('Không tìm thấy gắn kết từ vựng', 404);
	let lessonId = row.lessonId;
	if (input.lessonId !== undefined) {
		if (input.lessonId) {
			const lesson = await courseRepo.findLesson(input.lessonId);
			if (!lesson || lesson.courseId !== courseId) throw new AppError('Lesson không thuộc Course', 422);
			lessonId = input.lessonId;
		} else {
			lessonId = null;
		}
	}
	const scopeKey = lessonId ? lessonVocabScopeKey(lessonId, row.vocabSetId) : courseVocabScopeKey(courseId, row.vocabSetId);
	const clash = await prisma.myClassVocabAssignment.findUnique({ where: { scopeKey } });
	if (clash && clash.id !== id) throw new AppError('Bộ từ đã được gắn vào phạm vi này', 409, 'CONFLICT');
	return prisma.myClassVocabAssignment.update({
		where: { id },
		data: {
			lessonId,
			scopeKey,
			...(input.position !== undefined ? { position: input.position } : {}),
		},
	});
}

export async function unassignVocabSet(courseId: string, id: string) {
	const row = await vocabRepo.findAssignmentById(id);
	if (!row || row.courseId !== courseId) throw new AppError('Không tìm thấy gắn kết từ vựng', 404);
	await prisma.myClassVocabAssignment.delete({ where: { id } });
	if (row.vocabSet.isCourseOnly) {
		const [remaining, libraryLinks] = await Promise.all([
			prisma.myClassVocabAssignment.count({ where: { vocabSetId: row.vocabSetId } }),
			prisma.userVocabSet.count({ where: { vocabSetId: row.vocabSetId, status: 'active' } }),
		]);
		if (remaining === 0 && libraryLinks === 0 && !row.vocabSet.isArchived) {
			await prisma.vocabSet.update({
				where: { id: row.vocabSetId },
				data: { isArchived: true },
			});
		}
	}
	return { id };
}

export async function searchVocabSets(q: string, options?: { courseId?: string }) {
	const needle = q.trim();
	const courseId = options?.courseId;
	return prisma.vocabSet.findMany({
		where: {
			isArchived: false,
			AND: [
				needle
					? {
							OR: [
								{ title: { contains: needle, mode: 'insensitive' } },
								{ description: { contains: needle, mode: 'insensitive' } },
							],
						}
					: {},
				courseId
					? {
							OR: [
								{ isCourseOnly: false },
								{ myClassAssignments: { some: { courseId } } },
							],
						}
					: {},
			],
		},
		take: 50,
		orderBy: { updatedAt: 'desc' },
		include: {
			_count: { select: { words: { where: { isDeleted: false } } } },
			myClassAssignments: courseId
				? {
						where: { courseId },
						select: {
							id: true,
							lessonId: true,
							lesson: { select: { id: true, title: true } },
						},
					}
				: false,
		},
	});
}

export type VocabCsvPreview = VocabCsvParseResult & { canImport: boolean };

export function previewVocabCsvImport(csv: string): VocabCsvPreview {
	const parsed = parseVocabCsv(csv);
	return { ...parsed, canImport: parsed.wordCount > 0 && parsed.errors.length === 0 };
}

export async function importVocabSetForScope(
	courseId: string,
	actor: { id: string; name: string },
	input: VocabCsvImportInput,
) {
	const preview = previewVocabCsvImport(input.csv);
	if (!preview.canImport) {
		const first = preview.errors[0];
		throw new AppError(first?.message ?? 'CSV chưa hợp lệ — hãy xem trước trước khi lưu', 422);
	}

	const course = await courseRepo.findAdminCourse(courseId);
	if (!course) throw new AppError('Không tìm thấy Course', 404);

	const lessonId = input.lessonId ?? null;
	const lesson = lessonId ? await courseRepo.findLesson(lessonId) : null;
	if (lessonId && (!lesson || lesson.courseId !== courseId)) {
		throw new AppError('Lesson không thuộc Course', 422);
	}
	let title = input.title?.trim() ?? '';
	if (!title) {
		if (lessonId) {
			title = `${lesson!.title} — Từ vựng`;
		} else {
			title = `${course.title} — Từ vựng`;
		}
	}

	if (input.targetSetId) {
		const existing = await prisma.vocabSet.findUnique({ where: { id: input.targetSetId } });
		if (!existing) throw new AppError('Không tìm thấy bộ từ', 404);
		const assignedToCourse = await prisma.myClassVocabAssignment.findFirst({
			where: { courseId, vocabSetId: existing.id },
		});
		if (!assignedToCourse) {
			throw new AppError('Chỉ được cập nhật bộ từ đã gắn vào khóa học này', 403);
		}
		const scopeKey = lessonId
			? lessonVocabScopeKey(lessonId, existing.id)
			: courseVocabScopeKey(courseId, existing.id);
		const assignment = await prisma.$transaction(async (tx) => {
			if (input.strategy === 'replace') {
				await tx.word.updateMany({
					where: { vocabSetId: existing.id },
					data: { isDeleted: true },
				});
			}
			await tx.vocabSet.update({
				where: { id: existing.id },
				data: {
					title,
					...(input.description !== undefined
						? { description: input.description.trim() }
						: {}),
				},
			});
			await tx.word.createMany({
				data: preview.words.map((word) => ({
					vocabSetId: existing.id,
					...wordWriteData(word),
				})),
			});
			const alreadyAssigned = await tx.myClassVocabAssignment.findUnique({
				where: { scopeKey },
			});
			if (alreadyAssigned) return alreadyAssigned;
			const max = await tx.myClassVocabAssignment.aggregate({
				where: { courseId, lessonId },
				_max: { position: true },
			});
			return tx.myClassVocabAssignment.create({
				data: {
					courseId,
					lessonId,
					vocabSetId: existing.id,
					scopeKey,
					position: (max._max.position ?? -1) + 1,
				},
			});
		});
		const set = await getVocabSetById(existing.id);
		return { set, assignment, preview };
	}

	const created = await prisma.$transaction(async (tx) => {
		const set = await tx.vocabSet.create({
			data: {
				title,
				description: input.description?.trim() ?? '',
				ownerId: actor.id,
				ownerName: actor.name || 'Admin',
				isCourseOnly: true,
				words: {
					create: preview.words.map(wordWriteData),
				},
			},
		});
		const max = await tx.myClassVocabAssignment.aggregate({
			where: { courseId, lessonId },
			_max: { position: true },
		});
		const scopeKey = lessonId
			? lessonVocabScopeKey(lessonId, set.id)
			: courseVocabScopeKey(courseId, set.id);
		const assignment = await tx.myClassVocabAssignment.create({
			data: {
				courseId,
				lessonId,
				vocabSetId: set.id,
				scopeKey,
				position: (max._max.position ?? -1) + 1,
			},
		});
		return { setId: set.id, assignment };
	});
	const set = await getVocabSetById(created.setId);
	return { set, assignment: created.assignment, preview };
}

export async function createAndAssignVocabSet(
	actor: { id: string; name: string },
	input: {
		title: string;
		description?: string;
		words: CreateWordInput[];
		courseId?: string;
		lessonId?: string | null;
	},
) {
	const words = input.words.filter((word) => word.term.trim() && (word.meaningVi || word.meaningEn || word.definition));
	if (!words.length) throw new AppError('Cần ít nhất một từ có nghĩa', 422);
	if (input.courseId) {
		const course = await courseRepo.findAdminCourse(input.courseId);
		if (!course) throw new AppError('Không tìm thấy Course', 404);
		const lessonId = input.lessonId ?? null;
		if (lessonId) {
			const lesson = await courseRepo.findLesson(lessonId);
			if (!lesson || lesson.courseId !== input.courseId) {
				throw new AppError('Lesson không thuộc Course', 422);
			}
		}
		const created = await prisma.$transaction(async (tx) => {
			const set = await tx.vocabSet.create({
				data: {
					title: input.title.trim(),
					description: input.description?.trim() ?? '',
					ownerId: actor.id,
					ownerName: actor.name || 'Admin',
					isCourseOnly: true,
					words: { create: words.map(wordWriteData) },
				},
			});
			const max = await tx.myClassVocabAssignment.aggregate({
				where: { courseId: input.courseId, lessonId },
				_max: { position: true },
			});
			const assignment = await tx.myClassVocabAssignment.create({
				data: {
					courseId: input.courseId!,
					lessonId,
					vocabSetId: set.id,
					scopeKey: lessonId
						? lessonVocabScopeKey(lessonId, set.id)
						: courseVocabScopeKey(input.courseId!, set.id),
					position: (max._max.position ?? -1) + 1,
				},
			});
			return { setId: set.id, assignment };
		});
		const set = await getVocabSetById(created.setId);
		return { set, assignment: created.assignment };
	}

	const set = await prisma.vocabSet.create({
		data: {
			title: input.title.trim(),
			description: input.description?.trim() ?? '',
			ownerId: actor.id,
			ownerName: actor.name || 'Admin',
			isCourseOnly: true,
			words: { create: words.map(wordWriteData) },
		},
	});
	return { set: await getVocabSetById(set.id), assignment: null };
}

export async function addAssignedVocabToLibrary(
	userId: string,
	courseSlug: string,
	vocabSetId: string,
) {
	const data = await getAssignedVocabSet(courseSlug, vocabSetId);
	try {
		await addToLibrary(userId, vocabSetId, {
			source: 'MY_CLASS',
			sourceCourseId: data.course.id,
		});
	} catch (error) {
		if (error instanceof AlreadyOwnedError) {
			return { saved: true, alreadyOwned: true, set: data.set };
		}
		throw error;
	}
	return { saved: true, alreadyOwned: false, set: data.set };
}

export async function getAssignedVocabLibraryState(userId: string | null, vocabSetId: string) {
	if (!userId) return { saved: false };
	const entry = await getActiveLibraryEntry(userId, vocabSetId);
	return { saved: Boolean(entry) };
}
