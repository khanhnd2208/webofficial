import { AppError } from '@/lib/appError';
import { slugify } from '@/utils/slugify';

import type {
	CreateCourseInput,
	CreateLessonInput,
	CreateModuleInput,
	UpdateCourseInput,
	UpdateLessonInput,
	UpdateModuleInput,
} from '../schemas';
import * as repo from '../repositories/courseRepository';
import type {
	CourseDetail,
	CourseListItem,
	LessonDTO,
	ModuleDTO,
	PublicCourseIntro,
} from '../types';

function normalizeOptionalUrl(value: string | null | undefined): string | null {
	if (value === undefined) return null;
	if (value === null || value === '') return null;
	return value;
}

async function uniqueCourseSlug(base: string, excludeId?: string): Promise<string> {
	const root = slugify(base) || 'khoa-hoc';
	let candidate = root;
	let i = 2;
	while (await repo.slugExists(candidate, excludeId)) {
		candidate = `${root}-${i}`;
		i += 1;
	}
	return candidate;
}

async function uniqueLessonSlug(
	moduleId: string,
	base: string,
	excludeId?: string,
): Promise<string> {
	const root = slugify(base) || 'bai-hoc';
	let candidate = root;
	let i = 2;
	while (await repo.lessonSlugExists(moduleId, candidate, excludeId)) {
		candidate = `${root}-${i}`;
		i += 1;
	}
	return candidate;
}

export async function listAdminCourses(): Promise<CourseListItem[]> {
	return repo.listCourses();
}

export async function listPublicCourseTeasers() {
	return repo.listPublicCourseTeasers();
}

export async function getPublicCourseBySlug(slug: string): Promise<PublicCourseIntro> {
	const course = await repo.findPublicCourseBySlug(slug);
	if (!course) throw new AppError('Không tìm thấy khóa học', 404);
	return repo.mapPublicCourseIntro(course);
}

export async function getAdminCourse(id: string): Promise<CourseDetail> {
	const course = await repo.findCourseById(id);
	if (!course) throw new AppError('Không tìm thấy khóa học', 404);
	return repo.mapCourseDetail(course);
}

export async function createAdminCourse(input: CreateCourseInput): Promise<CourseDetail> {
	const slug = await uniqueCourseSlug(input.slug ?? input.title);
	const created = await repo.createCourse({
		slug,
		title: input.title.trim(),
		summary: input.summary?.trim() ?? '',
		description: input.description ?? '',
		thumbnailUrl: normalizeOptionalUrl(input.thumbnailUrl),
	});
	const full = await repo.findCourseById(created.id);
	if (!full) throw new AppError('Không tạo được khóa học', 500);
	return repo.mapCourseDetail(full);
}

export async function updateAdminCourse(
	id: string,
	input: UpdateCourseInput,
): Promise<CourseDetail> {
	const existing = await repo.findCourseById(id);
	if (!existing) throw new AppError('Không tìm thấy khóa học', 404);

	if (input.status === 'PUBLISHED') {
		const check = await validatePublishRequirements(id);
		if (!check.ok) {
			throw new AppError(check.error, 422, 'PUBLISH_REQUIREMENTS_NOT_MET', {
				status: check.error,
			});
		}
	}

	const data: Parameters<typeof repo.updateCourse>[1] = {};
	if (input.title !== undefined) data.title = input.title.trim();
	if (input.summary !== undefined) data.summary = input.summary.trim();
	if (input.description !== undefined) data.description = input.description;
	if (input.thumbnailUrl !== undefined)
		data.thumbnailUrl = normalizeOptionalUrl(input.thumbnailUrl);
	if (input.visibility !== undefined) data.visibility = input.visibility;
	if (input.audience !== undefined) data.audience = input.audience.trim();
	if (input.learningOutcomes !== undefined) data.learningOutcomes = input.learningOutcomes;
	if (input.format !== undefined) data.format = input.format.trim();
	if (input.durationText !== undefined) data.durationText = input.durationText.trim();
	if (input.prerequisites !== undefined) data.prerequisites = input.prerequisites;
	if (input.slug !== undefined) {
		data.slug = await uniqueCourseSlug(input.slug, id);
	}
	if (input.status !== undefined) {
		data.status = input.status;
		if (input.status === 'PUBLISHED' && !existing.publishedAt) {
			data.publishedAt = new Date();
		}
		if (input.status === 'DRAFT') {
			data.publishedAt = existing.publishedAt;
		}
	}

	await repo.updateCourse(id, data);
	const full = await repo.findCourseById(id);
	if (!full) throw new AppError('Không tìm thấy khóa học', 404);
	return repo.mapCourseDetail(full);
}

export async function deleteAdminCourse(id: string): Promise<void> {
	const existing = await repo.findCourseById(id);
	if (!existing) throw new AppError('Không tìm thấy khóa học', 404);
	await repo.deleteCourse(id);
}

export async function createAdminModule(
	courseId: string,
	input: CreateModuleInput,
): Promise<ModuleDTO> {
	const course = await repo.findCourseById(courseId);
	if (!course) throw new AppError('Không tìm thấy khóa học', 404);
	const position = await repo.nextModulePosition(courseId);
	const created = await repo.createModule({
		courseId,
		title: input.title.trim(),
		description: input.description?.trim() ?? '',
		position,
	});
	return repo.mapModule({ ...created, lessons: [] });
}

export async function updateAdminModule(
	moduleId: string,
	input: UpdateModuleInput,
): Promise<ModuleDTO> {
	const mod = await repo.findModuleById(moduleId);
	if (!mod) throw new AppError('Không tìm thấy chương', 404);
	const updated = await repo.updateModule(moduleId, {
		...(input.title !== undefined ? { title: input.title.trim() } : {}),
		...(input.description !== undefined ? { description: input.description.trim() } : {}),
	});
	return repo.mapModule({ ...updated, lessons: mod.lessons });
}

export async function deleteAdminModule(moduleId: string): Promise<void> {
	const mod = await repo.findModuleById(moduleId);
	if (!mod) throw new AppError('Không tìm thấy chương', 404);
	await repo.deleteModule(moduleId);
}

export async function reorderAdminModules(
	courseId: string,
	orderedIds: string[],
): Promise<CourseDetail> {
	const course = await repo.findCourseById(courseId);
	if (!course) throw new AppError('Không tìm thấy khóa học', 404);
	const existingIds = new Set(course.modules.map((m) => m.id));
	if (orderedIds.length !== existingIds.size || orderedIds.some((id) => !existingIds.has(id))) {
		throw new AppError('Danh sách thứ tự chương không hợp lệ', 400);
	}
	await repo.reorderModules(courseId, orderedIds);
	return getAdminCourse(courseId);
}

export async function createAdminLesson(
	moduleId: string,
	input: CreateLessonInput,
): Promise<LessonDTO> {
	const mod = await repo.findModuleById(moduleId);
	if (!mod) throw new AppError('Không tìm thấy chương', 404);
	const slug = await uniqueLessonSlug(moduleId, input.slug ?? input.title);
	const position = await repo.nextLessonPosition(moduleId);
	const created = await repo.createLesson({
		moduleId,
		slug,
		title: input.title.trim(),
		contentHtml: input.contentHtml ?? '',
		videoUrl: normalizeOptionalUrl(input.videoUrl),
		position,
	});
	return repo.mapLesson(created);
}

export async function updateAdminLesson(
	lessonId: string,
	input: UpdateLessonInput,
): Promise<LessonDTO> {
	const lesson = await repo.findLessonById(lessonId);
	if (!lesson) throw new AppError('Không tìm thấy bài học', 404);

	const nextTitle = input.title !== undefined ? input.title.trim() : lesson.title;
	const nextHtml = input.contentHtml !== undefined ? input.contentHtml : lesson.contentHtml;
	const nextVideo =
		input.videoUrl !== undefined ? normalizeOptionalUrl(input.videoUrl) : lesson.videoUrl;
	const nextStatus = input.status ?? lesson.status;

	if (nextStatus === 'PUBLISHED') {
		const fields: Record<string, string> = {};
		if (!nextTitle.trim()) fields.title = 'Bài học cần tiêu đề.';
		const hasContent = nextHtml.trim() !== '';
		const hasVideo = Boolean(nextVideo && nextVideo.trim());
		if (!hasContent && !hasVideo) {
			fields.contentHtml = 'Cần nội dung bài học hoặc đường dẫn video hợp lệ.';
			fields.videoUrl = 'Cần nội dung bài học hoặc đường dẫn video hợp lệ.';
		}
		if (Object.keys(fields).length > 0) {
			throw new AppError(
				'Chưa đủ điều kiện xuất bản bài học',
				422,
				'PUBLISH_REQUIREMENTS_NOT_MET',
				fields,
			);
		}
	}

	const data: Parameters<typeof repo.updateLesson>[1] = {};
	if (input.title !== undefined) data.title = input.title.trim();
	if (input.contentHtml !== undefined) data.contentHtml = input.contentHtml;
	if (input.videoUrl !== undefined) data.videoUrl = normalizeOptionalUrl(input.videoUrl);
	if (input.status !== undefined) data.status = input.status;
	if (input.slug !== undefined) {
		data.slug = await uniqueLessonSlug(lesson.moduleId, input.slug, lessonId);
	}

	const updated = await repo.updateLesson(lessonId, data);
	return repo.mapLesson(updated);
}

export async function deleteAdminLesson(lessonId: string): Promise<void> {
	const lesson = await repo.findLessonById(lessonId);
	if (!lesson) throw new AppError('Không tìm thấy bài học', 404);
	await repo.deleteLesson(lessonId);
}

export async function getAdminLessonForEditor(
	lessonId: string,
	courseId: string,
): Promise<{ lesson: LessonDTO; moduleId: string; moduleName: string }> {
	const lesson = await repo.findLessonById(lessonId);
	if (!lesson) throw new AppError('Không tìm thấy bài học', 404);
	if (lesson.module.courseId !== courseId)
		throw new AppError('Bài học không thuộc khóa học này', 404);
	return {
		lesson: repo.mapLesson(lesson),
		moduleId: lesson.moduleId,
		moduleName: lesson.module.title,
	};
}

/** Returns { ok: true } if safe to publish, or { ok: false, error } if requirements not met. */
export async function validatePublishRequirements(
	courseId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
	const course = await repo.findCourseById(courseId);
	if (!course) throw new AppError('Không tìm thấy khóa học', 404);

	if (course.modules.length === 0) {
		return { ok: false, error: 'Khóa học cần ít nhất 1 chương.' };
	}

	const hasPublishedLesson = course.modules.some((mod) =>
		mod.lessons.some(
			(l) =>
				l.status === 'PUBLISHED' &&
				(l.contentHtml.trim() !== '' || (l.videoUrl && l.videoUrl.trim() !== '')),
		),
	);

	if (!hasPublishedLesson) {
		return {
			ok: false,
			error: 'Khóa học cần ít nhất 1 bài học đã xuất bản có nội dung hoặc video.',
		};
	}

	return { ok: true };
}

export async function reorderAdminLessons(
	moduleId: string,
	orderedIds: string[],
): Promise<ModuleDTO> {
	const mod = await repo.findModuleById(moduleId);
	if (!mod) throw new AppError('Không tìm thấy chương', 404);
	const existingIds = new Set(mod.lessons.map((l) => l.id));
	if (orderedIds.length !== existingIds.size || orderedIds.some((id) => !existingIds.has(id))) {
		throw new AppError('Danh sách thứ tự bài học không hợp lệ', 400);
	}
	await repo.reorderLessons(moduleId, orderedIds);
	const refreshed = await repo.findModuleById(moduleId);
	if (!refreshed) throw new AppError('Không tìm thấy chương', 404);
	return repo.mapModule(refreshed);
}
