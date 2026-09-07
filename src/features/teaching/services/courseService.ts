import { AppError } from '@/lib/appError';

import {
	collectTermSuggestions,
	dependencyConflict,
	summarizeCourseArchiveBlockers,
	summarizeCourseDeleteBlockers,
} from '../domain/adminLifecycle';
import {
	ensureTeachingCourse,
	normalizeCourseCode,
	throwIfCourseArchived,
} from '../domain/courseIdentity';
import { withUniqueConflict } from '../domain/prismaErrors';
import * as repo from '../repositories/teachingRepository';
import type { CreateTeachingCourseInput, UpdateTeachingCourseInput } from '../schemas';
import type { TeachingCourseListItem, TeachingCourseRecord, TeachingCourseStatus } from '../types';
import { listTeachingClasses } from './classService';

function mapCourse(row: {
	id: string;
	courseCode: string;
	courseName: string;
	status: TeachingCourseStatus;
	createdAt: Date;
	updatedAt: Date;
}): TeachingCourseRecord {
	return {
		id: row.id,
		courseCode: row.courseCode,
		courseName: row.courseName,
		status: row.status,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

export async function assertCourseIsActive(id: string) {
	const course = await repo.getCourse(id);
	if (!course) throw new AppError('Không tìm thấy môn học', 404, 'NOT_FOUND');
	throwIfCourseArchived(course.status);
	return course;
}

export async function listTeachingCourses(): Promise<TeachingCourseListItem[]> {
	const [courses, classes] = await Promise.all([repo.listCourses(), listTeachingClasses()]);
	const classesByCourse = new Map<string, typeof classes>();
	for (const teachingClass of classes) {
		const current = classesByCourse.get(teachingClass.courseId) ?? [];
		current.push(teachingClass);
		classesByCourse.set(teachingClass.courseId, current);
	}
	return courses.map((course) => {
		const courseClasses = classesByCourse.get(course.id) ?? [];
		const activeClassCount = course.classes.filter((item) => item.status === 'ACTIVE').length;
		const deckCount = course._count.decks;
		const publishedDeckCount = course.decks.filter((item) => item.status === 'PUBLISHED').length;
		const activeDeckCount = course.decks.filter((item) => item.status !== 'ARCHIVED').length;
		const archiveBlockers = summarizeCourseArchiveBlockers({
			activeClassCount,
			activeDeckCount,
		});
		const deleteBlockers = summarizeCourseDeleteBlockers({
			classCount: course._count.classes,
			deckCount,
		});
		return {
			...mapCourse(course),
			classCount: course._count.classes,
			activeClassCount,
			tutorialCount: course.classes.reduce((sum, item) => sum + item._count.tutorials, 0),
			deckCount,
			publishedDeckCount,
			activeDeckCount,
			canDelete: Object.keys(deleteBlockers).length === 0,
			canArchive: Object.keys(archiveBlockers).length === 0,
			archiveBlockers,
			deleteBlockers,
			classes: courseClasses,
		};
	});
}

export async function listTeachingTerms() {
	const rows = await repo.listDistinctTerms();
	return collectTermSuggestions(rows.map((row) => row.term));
}

export async function getTeachingCourse(id: string): Promise<TeachingCourseRecord> {
	const row = await repo.getCourse(id);
	if (!row) throw new AppError('Không tìm thấy môn học', 404, 'NOT_FOUND');
	return mapCourse(row);
}

export async function getTeachingCourseWorkspace(id: string) {
	const [course, courses] = await Promise.all([getTeachingCourse(id), listTeachingCourses()]);
	const item = courses.find((entry) => entry.id === id);
	if (!item) throw new AppError('Không tìm thấy môn học', 404, 'NOT_FOUND');
	return { ...item, ...course };
}

export async function createTeachingCourse(input: CreateTeachingCourseInput) {
	const courseCode = normalizeCourseCode(input.courseCode);
	const courseName = input.courseName.trim();
	const created = await withUniqueConflict('Mã học phần này đã tồn tại', () =>
		repo.prisma.teachingCourse.create({
			data: { courseCode, courseName, status: 'ACTIVE' },
		}),
	);
	return mapCourse(created);
}

export async function updateTeachingCourse(id: string, input: UpdateTeachingCourseInput) {
	const existing = await repo.getCourse(id);
	if (!existing) throw new AppError('Không tìm thấy môn học', 404, 'NOT_FOUND');
	const courseCode = normalizeCourseCode(input.courseCode?.trim() || existing.courseCode);
	const courseName = input.courseName?.trim() || existing.courseName;
	const status = input.status ?? existing.status;
	const updated = await withUniqueConflict('Mã học phần này đã tồn tại', () =>
		repo.prisma.$transaction(async (tx) => {
			const locked = await tx.$queryRaw<Array<{ id: string; status: string }>>`
				SELECT id, status::text AS status FROM "TeachingCourse" WHERE id = ${id} FOR UPDATE
			`;
			if (!locked[0]) throw new AppError('Không tìm thấy môn học', 404, 'NOT_FOUND');
			if (status === 'ARCHIVED' && locked[0].status !== 'ARCHIVED') {
				const [activeClassCount, activeDeckCount] = await Promise.all([
					tx.teachingClass.count({ where: { courseId: id, status: 'ACTIVE' } }),
					tx.activeRecallDeck.count({ where: { courseId: id, status: { not: 'ARCHIVED' } } }),
				]);
				const archiveBlockers = summarizeCourseArchiveBlockers({
					activeClassCount,
					activeDeckCount,
				});
				if (Object.keys(archiveBlockers).length > 0) {
					throw dependencyConflict(
						'Hãy lưu trữ hết lớp và bộ thẻ đang hoạt động trước khi lưu trữ môn học',
						archiveBlockers,
					);
				}
			}
			const result = await tx.teachingCourse.update({
				where: { id },
				data: { courseCode, courseName, status },
			});
			if (courseCode !== existing.courseCode || courseName !== existing.courseName) {
				await tx.teachingClass.updateMany({
					where: { courseId: id },
					data: { courseCode, courseName },
				});
				await tx.activeRecallDeck.updateMany({
					where: { courseId: id },
					data: { subject: courseName },
				});
			}
			return result;
		}),
	);
	return mapCourse(updated);
}

export async function deleteTeachingCourse(id: string) {
	const existing = await repo.getCourse(id);
	if (!existing) throw new AppError('Không tìm thấy môn học', 404, 'NOT_FOUND');
	const [classCount, deckCount] = await Promise.all([
		repo.prisma.teachingClass.count({ where: { courseId: id } }),
		repo.prisma.activeRecallDeck.count({ where: { courseId: id } }),
	]);
	const deleteBlockers = summarizeCourseDeleteBlockers({ classCount, deckCount });
	if (Object.keys(deleteBlockers).length > 0) {
		throw dependencyConflict(
			'Chỉ xóa được môn học khi chưa có lớp và bộ thẻ',
			deleteBlockers,
		);
	}
	await repo.prisma.teachingCourse.delete({ where: { id } });
	return { id };
}

export async function resolveCourseForClassInput(input: {
	courseId?: string;
	courseCode?: string;
	courseName?: string;
}) {
	if (input.courseId) {
		return assertCourseIsActive(input.courseId);
	}
	if (!input.courseCode || !input.courseName) {
		throw new AppError('Hãy chọn môn học', 422, 'VALIDATION');
	}
	const course = await ensureTeachingCourse(repo.prisma, {
		courseCode: input.courseCode,
		courseName: input.courseName,
	});
	throwIfCourseArchived(course.status);
	return course;
}
