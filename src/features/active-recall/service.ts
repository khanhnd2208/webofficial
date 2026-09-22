import type { PublishStatus } from '@prisma/client';

import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/utils/slugify';
import {
	ensureTeachingCourse,
	ensureTeachingCourseFromSubject,
	lockActiveCourse,
	throwIfCourseArchived,
} from '@/features/teaching/domain/courseIdentity';

import { prepareRecallCardsForSave } from './cards';
import {
	persistRecallCardWrites,
	planRecallCardWrites,
	RECALL_WRITE_TX,
	type RecallCardCreate,
	type RecallCardUpdate,
} from './persist';
import { previewRecallImport } from './parser';
import { recallVisibleText } from './richText';
import type {
	ActiveRecallImportInput,
	CreateActiveRecallDeckInput,
	UpdateActiveRecallDeckInput,
	UpdateActiveRecallDeckMetaInput,
} from './schemas';
import { ACTIVE_RECALL_MAX_CARDS } from './schemas';
import type { ActiveRecallDeckDTO, ActiveRecallDeckListItem, RecallImportPreview } from './types';

function cardFingerprint(question: string, answer: string) {
	return `${recallVisibleText(question).toLowerCase()}\u0000${recallVisibleText(answer).toLowerCase()}`;
}

const cardSelect = {
	id: true,
	question: true,
	answer: true,
	questionVi: true,
	answerVi: true,
	position: true,
	createdAt: true,
	updatedAt: true,
} as const;

const courseSelect = {
	id: true,
	courseCode: true,
	courseName: true,
} as const;

function mapList(row: {
	id: string;
	slug: string;
	title: string;
	subject: string;
	lessonLabel: string;
	description: string;
	status: PublishStatus;
	position: number;
	updatedAt: Date;
	publishedAt: Date | null;
	courseId: string;
	course?: { id: string; courseCode: string; courseName: string } | null;
	_count: { cards: number; classLinks?: number };
}): ActiveRecallDeckListItem {
	const classLinkCount = row._count.classLinks ?? 0;
	return {
		id: row.id,
		slug: row.slug,
		title: row.title,
		courseId: row.course?.id ?? row.courseId,
		courseCode: row.course?.courseCode ?? '',
		courseName: row.course?.courseName ?? row.subject,
		subject: row.course?.courseName ?? row.subject,
		lessonLabel: row.lessonLabel,
		description: row.description,
		status: row.status,
		position: row.position,
		cardCount: row._count.cards,
		classLinkCount,
		canDelete: row._count.cards === 0 && classLinkCount === 0,
		updatedAt: row.updatedAt.toISOString(),
		publishedAt: row.publishedAt?.toISOString() ?? null,
	};
}

function mapDeck(
	row: Parameters<typeof mapList>[0] & {
		createdAt: Date;
		cards: Array<{
			id: string;
			question: string;
			answer: string;
			questionVi: string;
			answerVi: string;
			position: number;
			createdAt: Date;
			updatedAt: Date;
		}>;
	},
): ActiveRecallDeckDTO {
	return {
		...mapList(row),
		createdAt: row.createdAt.toISOString(),
		cards: row.cards.map((card) => ({
			id: card.id,
			question: card.question,
			answer: card.answer,
			questionVi: card.questionVi,
			answerVi: card.answerVi,
			position: card.position,
			createdAt: card.createdAt.toISOString(),
			updatedAt: card.updatedAt.toISOString(),
		})),
	};
}

async function uniqueSlug(source: string, excludeId?: string) {
	const base = slugify(source) || 'active-recall';
	let candidate = base;
	let index = 2;
	while (
		await prisma.activeRecallDeck.findFirst({
			where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
			select: { id: true },
		})
	) {
		candidate = `${base}-${index}`;
		index += 1;
	}
	return candidate;
}

function assertCurrent(expected: string, actual: Date) {
	if (new Date(expected).getTime() !== actual.getTime()) {
		throw new AppError(
			'Bộ thẻ đã được cập nhật ở nơi khác. Hãy tải lại trước khi lưu.',
			409,
			'STALE_DECK',
		);
	}
}

async function findDeckRecord(id: string) {
	return prisma.activeRecallDeck.findUnique({
		where: { id },
		include: {
			course: { select: courseSelect },
			cards: { orderBy: { position: 'asc' }, select: cardSelect },
			_count: { select: { cards: true, classLinks: true } },
		},
	});
}

async function resolveDeckCourse(input: {
	courseId?: string;
	courseCode?: string;
	subject?: string;
}) {
	if (input.courseId) {
		const course = await prisma.teachingCourse.findUnique({ where: { id: input.courseId } });
		if (!course) throw new AppError('Không tìm thấy môn học', 404, 'NOT_FOUND');
		if (course.status === 'ARCHIVED') {
			throw new AppError(
				'Hãy khôi phục môn học trước khi tạo lớp hoặc bộ thẻ mới',
				409,
				'COURSE_ARCHIVED',
			);
		}
		return course;
	}
	if (input.courseCode) {
		const course = await ensureTeachingCourse(prisma, {
			courseCode: input.courseCode,
			courseName: input.subject || input.courseCode,
		});
		throwIfCourseArchived(course.status);
		return course;
	}
	const course = await ensureTeachingCourseFromSubject(prisma, input.subject ?? '');
	throwIfCourseArchived(course.status);
	return course;
}

export async function listPublishedRecallDecks() {
	const rows = await prisma.activeRecallDeck.findMany({
		where: { status: 'PUBLISHED', cards: { some: {} } },
		orderBy: [{ position: 'asc' }, { title: 'asc' }],
		include: { course: { select: courseSelect }, _count: { select: { cards: true, classLinks: true } } },
	});
	return rows.map(mapList);
}

export async function listPublishedRecallDecksForCourse(courseId: string) {
	const rows = await prisma.activeRecallDeck.findMany({
		where: { courseId, status: 'PUBLISHED', cards: { some: {} } },
		orderBy: [{ position: 'asc' }, { title: 'asc' }],
		include: { course: { select: courseSelect }, _count: { select: { cards: true, classLinks: true } } },
	});
	return rows.map(mapList);
}

export async function listPublishedRecallDecksForClass(classId: string) {
	const rows = await prisma.teachingClassRecallDeck.findMany({
		where: {
			classId,
			enabled: true,
			deck: { status: 'PUBLISHED', cards: { some: {} } },
		},
		orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
		include: {
			deck: {
				include: { course: { select: courseSelect }, _count: { select: { cards: true, classLinks: true } } },
			},
		},
	});
	return rows.map((row) => mapList(row.deck));
}

export async function getPublishedRecallDeck(slug: string) {
	const row = await prisma.activeRecallDeck.findFirst({
		where: { slug, status: 'PUBLISHED', cards: { some: {} } },
		include: {
			course: { select: courseSelect },
			cards: { orderBy: { position: 'asc' }, select: cardSelect },
			_count: { select: { cards: true, classLinks: true } },
		},
	});
	return row ? mapDeck(row) : null;
}

export async function getPublishedRecallDeckForClass(classSlug: string, deckSlug: string) {
	const teachingClass = await prisma.teachingClass.findFirst({
		where: { publicSlug: classSlug, attendanceVisible: true, status: 'ACTIVE' },
		select: { id: true, courseId: true },
	});
	if (!teachingClass) return null;
	const row = await prisma.activeRecallDeck.findFirst({
		where: {
			slug: deckSlug,
			courseId: teachingClass.courseId,
			status: 'PUBLISHED',
			cards: { some: {} },
			classLinks: { some: { classId: teachingClass.id, enabled: true } },
		},
		include: {
			course: { select: courseSelect },
			cards: { orderBy: { position: 'asc' }, select: cardSelect },
			_count: { select: { cards: true, classLinks: true } },
		},
	});
	return row ? mapDeck(row) : null;
}

export async function resolvePublicClassSlugForDeck(deckSlug: string) {
	const row = await prisma.teachingClassRecallDeck.findFirst({
		where: {
			enabled: true,
			deck: { slug: deckSlug, status: 'PUBLISHED', cards: { some: {} } },
			class: { attendanceVisible: true, status: 'ACTIVE', publicSlug: { not: null } },
		},
		orderBy: [{ class: { updatedAt: 'desc' } }, { classId: 'desc' }],
		select: { class: { select: { publicSlug: true } } },
	});
	return row?.class.publicSlug ?? null;
}

export async function listAdminRecallDecks() {
	const rows = await prisma.activeRecallDeck.findMany({
		orderBy: [{ updatedAt: 'desc' }],
		include: { course: { select: courseSelect }, _count: { select: { cards: true, classLinks: true } } },
	});
	return rows.map(mapList);
}

export async function listAdminRecallDecksForCourse(courseId: string) {
	const rows = await prisma.activeRecallDeck.findMany({
		where: { courseId },
		orderBy: [{ updatedAt: 'desc' }],
		include: { course: { select: courseSelect }, _count: { select: { cards: true, classLinks: true } } },
	});
	return rows.map(mapList);
}

export async function getAdminRecallDeck(id: string) {
	const row = await findDeckRecord(id);
	return row ? mapDeck(row) : null;
}

export async function createAdminRecallDeck(input: CreateActiveRecallDeckInput) {
	if (input.status === 'PUBLISHED') {
		throw new AppError('Hãy tạo bản nháp, thêm ít nhất một thẻ rồi mới xuất bản', 422);
	}
	const cards = prepareRecallCardsForSave(input.cards ?? []);
	const course = await resolveDeckCourse(input);
	const slug = await uniqueSlug(input.slug || input.title);
	const row = await prisma.$transaction(async (tx) => {
		await lockActiveCourse(tx, course.id);
		const created = await tx.activeRecallDeck.create({
			data: {
				title: input.title,
				slug,
				courseId: course.id,
				subject: course.courseName,
				lessonLabel: input.lessonLabel,
				description: input.description,
				status: input.status,
				publishedAt: null,
				cards: cards.length
					? {
							create: cards.map((card, position) => ({
								question: card.question,
								answer: card.answer,
								questionVi: card.questionVi,
								answerVi: card.answerVi,
								position,
							})),
						}
					: undefined,
			},
			include: {
				course: { select: courseSelect },
				cards: { orderBy: { position: 'asc' }, select: cardSelect },
				_count: { select: { cards: true, classLinks: true } },
			},
		});
		return created;
	}, RECALL_WRITE_TX);
	return mapDeck(row);
}

export async function updateAdminRecallDeck(id: string, input: UpdateActiveRecallDeckInput) {
	const existing = await findDeckRecord(id);
	if (!existing) throw new AppError('Không tìm thấy bộ thẻ', 404);
	assertCurrent(input.expectedUpdatedAt, existing.updatedAt);
	const cards = prepareRecallCardsForSave(
		input.cards,
		new Map(existing.cards.map((card) => [card.id, card])),
	);
	if (existing.status !== 'DRAFT' && input.slug && input.slug !== existing.slug) {
		throw new AppError('Không thể đổi đường dẫn sau khi bộ thẻ đã xuất bản', 422);
	}
	if (input.status === 'PUBLISHED' && cards.length === 0) {
		throw new AppError('Cần ít nhất một thẻ để xuất bản', 422);
	}
	const ids = cards.flatMap((card) => (card.id ? [card.id] : []));
	if (
		new Set(ids).size !== ids.length ||
		ids.some((cardId) => !existing.cards.some((card) => card.id === cardId))
	) {
		throw new AppError('Có thẻ không thuộc bộ này', 422);
	}
	const nextSlug =
		input.slug && existing.status === 'DRAFT' ? await uniqueSlug(input.slug, id) : existing.slug;
	const course = input.courseId
		? await resolveDeckCourse({ courseId: input.courseId, subject: input.subject })
		: existing.course
			? existing.course
			: await resolveDeckCourse({ courseId: existing.courseId, subject: input.subject });
	if (existing.courseId !== course.id && existing.status !== 'DRAFT') {
		throw new AppError('Không thể đổi môn học sau khi bộ thẻ đã xuất bản', 422);
	}
	await prisma.$transaction(async (tx) => {
		if (input.status !== 'ARCHIVED') {
			await lockActiveCourse(tx, course.id);
		}
		const claimed = await tx.activeRecallDeck.updateMany({
			where: { id, updatedAt: existing.updatedAt },
			data: {
				title: input.title,
				slug: nextSlug,
				courseId: course.id,
				subject: course.courseName,
				lessonLabel: input.lessonLabel,
				description: input.description,
				status: input.status,
				publishedAt: input.status === 'PUBLISHED' ? (existing.publishedAt ?? new Date()) : null,
			},
		});
		if (claimed.count !== 1)
			throw new AppError(
				'Bộ thẻ đã được cập nhật ở nơi khác. Hãy tải lại trước khi lưu.',
				409,
				'STALE_DECK',
			);
		if (existing.courseId !== course.id) {
			await tx.teachingClassRecallDeck.deleteMany({ where: { deckId: id } });
		}
		await persistRecallCardWrites(tx, id, planRecallCardWrites(existing.cards, cards));
		if (input.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
			const classes = await tx.teachingClass.findMany({
				where: { courseId: course.id },
				select: { id: true },
			});
			if (classes.length) {
				await tx.teachingClassRecallDeck.createMany({
					data: classes.map((teachingClass) => ({
						classId: teachingClass.id,
						deckId: id,
						enabled: true,
						displayOrder: existing.position,
					})),
					skipDuplicates: true,
				});
			}
		}
	}, RECALL_WRITE_TX);
	return (await getAdminRecallDeck(id))!;
}

export async function updateAdminRecallDeckMeta(id: string, input: UpdateActiveRecallDeckMetaInput) {
	const existing = await findDeckRecord(id);
	if (!existing) throw new AppError('Không tìm thấy bộ thẻ', 404);
	assertCurrent(input.expectedUpdatedAt, existing.updatedAt);
	const nextStatus = input.status ?? existing.status;
	if (nextStatus === 'PUBLISHED' && existing._count.cards === 0) {
		throw new AppError('Cần ít nhất một thẻ để xuất bản', 422);
	}
	await prisma.$transaction(async (tx) => {
		if (nextStatus !== 'ARCHIVED') {
			await lockActiveCourse(tx, existing.courseId);
		}
		const claimed = await tx.activeRecallDeck.updateMany({
			where: { id, updatedAt: existing.updatedAt },
			data: {
				title: input.title ?? existing.title,
				lessonLabel: input.lessonLabel ?? existing.lessonLabel,
				status: nextStatus,
				publishedAt:
					nextStatus === 'PUBLISHED'
						? (existing.publishedAt ?? new Date())
						: nextStatus === 'ARCHIVED'
							? null
							: existing.publishedAt,
			},
		});
		if (claimed.count !== 1) {
			throw new AppError(
				'Bộ thẻ đã được cập nhật ở nơi khác. Hãy tải lại trước khi lưu.',
				409,
				'STALE_DECK',
			);
		}
		if (nextStatus === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
			const classes = await tx.teachingClass.findMany({
				where: { courseId: existing.courseId },
				select: { id: true },
			});
			if (classes.length) {
				await tx.teachingClassRecallDeck.createMany({
					data: classes.map((teachingClass) => ({
						classId: teachingClass.id,
						deckId: id,
						enabled: true,
						displayOrder: existing.position,
					})),
					skipDuplicates: true,
				});
			}
		}
	}, RECALL_WRITE_TX);
	return (await getAdminRecallDeck(id))!;
}

export async function archiveAdminRecallDeck(id: string) {
	const existing = await findDeckRecord(id);
	if (!existing) throw new AppError('Không tìm thấy bộ thẻ', 404);
	return updateAdminRecallDeckMeta(id, {
		status: 'ARCHIVED',
		expectedUpdatedAt: existing.updatedAt.toISOString(),
	});
}

export async function deleteAdminRecallDeck(id: string) {
	const existing = await findDeckRecord(id);
	if (!existing) throw new AppError('Không tìm thấy bộ thẻ', 404);
	const cardCount = existing._count.cards;
	const classLinkCount = existing._count.classLinks ?? 0;
	if (cardCount > 0 || classLinkCount > 0) {
		throw new AppError(
			'Chỉ xóa được bộ thẻ trống và chưa gắn với lớp',
			409,
			'HAS_DEPENDENCIES',
			undefined,
			{ cards: cardCount || undefined, classLinks: classLinkCount || undefined },
		);
	}
	await prisma.activeRecallDeck.delete({ where: { id } });
	return { id };
}

function applyImportActions(
	preview: RecallImportPreview,
	existing: ActiveRecallDeckDTO,
	mode: 'append' | 'replace' = 'append',
) {
	const existingById = new Map(existing.cards.map((card) => [card.id, card]));
	const duplicate = new Set(existing.cards.map((card) => cardFingerprint(card.question, card.answer)));
	for (const row of preview.rows) {
		if (row.errors.length) continue;
		if (row.id && !existingById.has(row.id)) {
			row.errors.push('ID thẻ không thuộc bộ này');
			continue;
		}
		if (row.id) row.action = mode === 'replace' ? 'create' : 'update';
		else if (mode === 'replace') row.action = 'create';
		else if (duplicate.has(cardFingerprint(row.question, row.answer))) row.action = 'skip';
		else row.action = 'create';
	}
	let resultingCardCount = mode === 'replace' ? 0 : existing.cards.length;
	for (const row of preview.rows) {
		if (row.errors.length || row.action === 'skip') continue;
		if (row.action === 'create') resultingCardCount += 1;
		if (resultingCardCount > ACTIVE_RECALL_MAX_CARDS) {
			row.errors.push(`Mỗi bộ chỉ được có tối đa ${ACTIVE_RECALL_MAX_CARDS} thẻ`);
		}
	}
	const valid = preview.rows.filter((row) => row.errors.length === 0).length;
	preview.summary = {
		...preview.summary,
		valid,
		invalid: preview.rows.length - valid,
		duplicates: preview.rows.filter((row) => row.action === 'skip').length,
	};
	return preview;
}

export async function previewAdminRecallImport(
	id: string,
	text: string,
	mode: 'append' | 'replace' = 'append',
) {
	const deck = await getAdminRecallDeck(id);
	if (!deck) throw new AppError('Không tìm thấy bộ thẻ', 404);
	return applyImportActions(previewRecallImport(text), deck, mode);
}

export async function importAdminRecallCards(id: string, input: ActiveRecallImportInput) {
	const existing = await getAdminRecallDeck(id);
	if (!existing) throw new AppError('Không tìm thấy bộ thẻ', 404);
	if (input.expectedUpdatedAt) assertCurrent(input.expectedUpdatedAt, new Date(existing.updatedAt));
	const preview = applyImportActions(previewRecallImport(input.text), existing, input.mode);
	if (preview.summary.orphanAnswers || preview.summary.invalid || !preview.summary.valid) {
		const message = preview.summary.orphanAnswers
			? `Không thể import: có ${preview.summary.orphanAnswers} đáp án thiếu câu hỏi`
			: 'Dữ liệu import chưa hợp lệ';
		throw new AppError(message, 422);
	}
	const active = preview.rows.filter((row) => row.action !== 'skip');
	await prisma.$transaction(async (tx) => {
		const claimed = await tx.activeRecallDeck.updateMany({
			where: { id, updatedAt: new Date(existing.updatedAt) },
			data: { updatedAt: new Date() },
		});
		if (claimed.count !== 1)
			throw new AppError(
				'Bộ thẻ đã được cập nhật ở nơi khác. Hãy tải lại trước khi import.',
				409,
				'STALE_DECK',
			);
		if (input.mode === 'replace') await tx.activeRecallCard.deleteMany({ where: { deckId: id } });
		const toCreate: RecallCardCreate[] = [];
		const toUpdate: RecallCardUpdate[] = [];
		let position = input.mode === 'replace' ? 0 : existing.cards.length;
		for (const row of active) {
			const nextPosition = row.order ?? position;
			if (row.action === 'update' && row.id && input.mode !== 'replace') {
				toUpdate.push({
					id: row.id,
					question: row.question,
					answer: row.answer,
					questionVi: row.questionVi ?? '',
					answerVi: row.answerVi ?? '',
					position: nextPosition,
				});
			} else {
				toCreate.push({
					...(input.mode === 'replace' && row.id ? { id: row.id } : {}),
					question: row.question,
					answer: row.answer,
					questionVi: row.questionVi ?? '',
					answerVi: row.answerVi ?? '',
					position: nextPosition,
				});
			}
			position += 1;
		}
		await persistRecallCardWrites(
			tx,
			id,
			{ keepIds: [], toCreate, toUpdate },
			{ deleteMissing: false },
		);
	}, RECALL_WRITE_TX);
	return { deck: (await getAdminRecallDeck(id))!, preview };
}
