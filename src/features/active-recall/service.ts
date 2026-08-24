import type { PublishStatus } from '@prisma/client';

import { AppError } from '@/lib/appError';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/utils/slugify';

import { previewRecallImport } from './parser';
import type {
	ActiveRecallImportInput,
	CreateActiveRecallDeckInput,
	UpdateActiveRecallDeckInput,
} from './schemas';
import { ACTIVE_RECALL_MAX_CARDS } from './schemas';
import type { ActiveRecallDeckDTO, ActiveRecallDeckListItem, RecallImportPreview } from './types';

const cardSelect = {
	id: true,
	question: true,
	answer: true,
	position: true,
	createdAt: true,
	updatedAt: true,
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
	_count: { cards: number };
}): ActiveRecallDeckListItem {
	return {
		id: row.id,
		slug: row.slug,
		title: row.title,
		subject: row.subject,
		lessonLabel: row.lessonLabel,
		description: row.description,
		status: row.status,
		position: row.position,
		cardCount: row._count.cards,
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
			cards: { orderBy: { position: 'asc' }, select: cardSelect },
			_count: { select: { cards: true } },
		},
	});
}

export async function listPublishedRecallDecks() {
	const rows = await prisma.activeRecallDeck.findMany({
		where: { status: 'PUBLISHED', cards: { some: {} } },
		orderBy: [{ position: 'asc' }, { title: 'asc' }],
		include: { _count: { select: { cards: true } } },
	});
	return rows.map(mapList);
}

export async function getPublishedRecallDeck(slug: string) {
	const row = await prisma.activeRecallDeck.findFirst({
		where: { slug, status: 'PUBLISHED', cards: { some: {} } },
		include: {
			cards: { orderBy: { position: 'asc' }, select: cardSelect },
			_count: { select: { cards: true } },
		},
	});
	return row ? mapDeck(row) : null;
}

export async function listAdminRecallDecks() {
	const rows = await prisma.activeRecallDeck.findMany({
		orderBy: [{ updatedAt: 'desc' }],
		include: { _count: { select: { cards: true } } },
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
	const slug = await uniqueSlug(input.slug || input.title);
	const row = await prisma.activeRecallDeck.create({
		data: {
			title: input.title,
			slug,
			subject: input.subject,
			lessonLabel: input.lessonLabel,
			description: input.description,
			status: input.status,
			publishedAt: null,
		},
		include: { cards: { select: cardSelect }, _count: { select: { cards: true } } },
	});
	return mapDeck(row);
}

export async function updateAdminRecallDeck(id: string, input: UpdateActiveRecallDeckInput) {
	const existing = await findDeckRecord(id);
	if (!existing) throw new AppError('Không tìm thấy bộ thẻ', 404);
	assertCurrent(input.expectedUpdatedAt, existing.updatedAt);
	if (existing.status !== 'DRAFT' && input.slug && input.slug !== existing.slug) {
		throw new AppError('Không thể đổi đường dẫn sau khi bộ thẻ đã xuất bản', 422);
	}
	if (input.status === 'PUBLISHED' && input.cards.length === 0) {
		throw new AppError('Cần ít nhất một thẻ để xuất bản', 422);
	}
	const ids = input.cards.flatMap((card) => (card.id ? [card.id] : []));
	if (
		new Set(ids).size !== ids.length ||
		ids.some((cardId) => !existing.cards.some((card) => card.id === cardId))
	) {
		throw new AppError('Có thẻ không thuộc bộ này', 422);
	}
	const nextSlug =
		input.slug && existing.status === 'DRAFT' ? await uniqueSlug(input.slug, id) : existing.slug;
	await prisma.$transaction(async (tx) => {
		const claimed = await tx.activeRecallDeck.updateMany({
			where: { id, updatedAt: existing.updatedAt },
			data: {
				title: input.title,
				slug: nextSlug,
				subject: input.subject,
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
		await tx.activeRecallCard.deleteMany({
			where: { deckId: id, ...(ids.length ? { id: { notIn: ids } } : {}) },
		});
		for (const [position, card] of input.cards.entries()) {
			if (card.id) {
				await tx.activeRecallCard.update({
					where: { id: card.id },
					data: { question: card.question, answer: card.answer, position },
				});
			} else {
				await tx.activeRecallCard.create({
					data: { deckId: id, question: card.question, answer: card.answer, position },
				});
			}
		}
	});
	return (await getAdminRecallDeck(id))!;
}

export async function archiveAdminRecallDeck(id: string) {
	const existing = await prisma.activeRecallDeck.findUnique({
		where: { id },
		select: { id: true },
	});
	if (!existing) throw new AppError('Không tìm thấy bộ thẻ', 404);
	await prisma.activeRecallDeck.update({
		where: { id },
		data: { status: 'ARCHIVED', publishedAt: null },
	});
}

function applyImportActions(
	preview: RecallImportPreview,
	existing: ActiveRecallDeckDTO,
	mode: 'append' | 'replace' = 'append',
) {
	const existingById = new Map(existing.cards.map((card) => [card.id, card]));
	const duplicate = new Set(existing.cards.map((card) => `${card.question}\u0000${card.answer}`));
	for (const row of preview.rows) {
		if (row.errors.length) continue;
		if (row.id && !existingById.has(row.id)) {
			row.errors.push('ID thẻ không thuộc bộ này');
			continue;
		}
		if (row.id) row.action = mode === 'replace' ? 'create' : 'update';
		else if (mode === 'replace') row.action = 'create';
		else if (duplicate.has(`${row.question}\u0000${row.answer}`)) row.action = 'skip';
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
	if (preview.summary.invalid || !preview.summary.valid) {
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
		let position = input.mode === 'replace' ? 0 : existing.cards.length;
		for (const row of active) {
			if (row.action === 'update' && row.id && input.mode !== 'replace') {
				await tx.activeRecallCard.update({
					where: { id: row.id },
					data: { question: row.question, answer: row.answer, position: row.order ?? position },
				});
			} else {
				await tx.activeRecallCard.create({
					data: {
						...(input.mode === 'replace' && row.id ? { id: row.id } : {}),
						deckId: id,
						question: row.question,
						answer: row.answer,
						position: row.order ?? position,
					},
				});
			}
			position += 1;
		}
	});
	return { deck: (await getAdminRecallDeck(id))!, preview };
}
