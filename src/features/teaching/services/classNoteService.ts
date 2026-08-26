import { AppError } from '@/lib/appError';

import { sanitizeTeachingHtml } from '../domain/sanitize';
import * as repo from '../repositories/teachingRepository';
import type {
	CreateTeachingClassNoteInput,
	ReorderTeachingClassNotesInput,
	UpdateTeachingClassNoteInput,
} from '../schemas';
import type { PublicClassNote, TeachingClassNoteRecord } from '../types';
import { notFound } from './classService';

function statusFor(note: { publishedAt: Date | null; publishedTitle: string | null; publishedHtml: string | null; draftTitle: string; draftHtml: string }) {
	if (note.publishedAt === null || note.publishedTitle === null || note.publishedHtml === null) return 'DRAFT' as const;
	return note.publishedTitle === note.draftTitle && note.publishedHtml === note.draftHtml
		? 'PUBLISHED' as const
		: 'MODIFIED' as const;
}

function mapNote(note: Awaited<ReturnType<typeof repo.getClassNote>>): TeachingClassNoteRecord {
	if (!note) notFound('Class note');
	return {
		id: note.id,
		classId: note.classId,
		draftTitle: note.draftTitle,
		draftHtml: note.draftHtml,
		publishedTitle: note.publishedTitle,
		publishedHtml: note.publishedHtml,
		displayOrder: note.displayOrder,
		publishedAt: note.publishedAt?.toISOString() ?? null,
		updatedAt: note.updatedAt.toISOString(),
		status: statusFor(note),
	};
}

export async function getClassNotes(classId: string): Promise<TeachingClassNoteRecord[]> {
	const teachingClass = await repo.getClass(classId);
	if (!teachingClass) notFound();
	const notes = await repo.listClassNotes(classId);
	return notes.map((note) => mapNote(note));
}

export async function createClassNote(
	classId: string,
	input: CreateTeachingClassNoteInput,
): Promise<TeachingClassNoteRecord> {
	const teachingClass = await repo.getClass(classId);
	if (!teachingClass) notFound();
	const notes = await repo.listClassNotes(classId);
	const created = await repo.createClassNote({
		classId,
		draftTitle: input.title.trim(),
		draftHtml: sanitizeTeachingHtml(input.html ?? ''),
		displayOrder: notes.length,
	});
	return mapNote(created);
}

export async function updateClassNote(
	classId: string,
	noteId: string,
	input: UpdateTeachingClassNoteInput,
): Promise<TeachingClassNoteRecord> {
	const existing = await repo.getClassNote(noteId);
	if (!existing || existing.classId !== classId) notFound('Class note');
	const updated = await repo.updateClassNote(noteId, {
		draftTitle: input.title === undefined ? undefined : input.title.trim(),
		draftHtml: input.html === undefined ? undefined : sanitizeTeachingHtml(input.html),
	});
	return mapNote(updated);
}

export async function deleteClassNote(classId: string, noteId: string) {
	const existing = await repo.getClassNote(noteId);
	if (!existing || existing.classId !== classId) notFound('Class note');
	await repo.deleteClassNote(noteId);
	const notes = await repo.listClassNotes(classId);
	await repo.reorderClassNotes(classId, notes.map((note) => note.id));
	return { id: noteId };
}

export async function publishClassNote(classId: string, noteId: string): Promise<TeachingClassNoteRecord> {
	const existing = await repo.getClassNote(noteId);
	if (!existing || existing.classId !== classId) notFound('Class note');
	if (!existing.draftTitle.trim() || !sanitizeTeachingHtml(existing.draftHtml).trim()) {
		throw new AppError('Tiêu đề và nội dung không được để trống khi xuất bản.', 422, 'VALIDATION');
	}
	const updated = await repo.updateClassNote(noteId, {
		publishedTitle: existing.draftTitle,
		publishedHtml: sanitizeTeachingHtml(existing.draftHtml),
		publishedAt: new Date(),
	});
	return mapNote(updated);
}

export async function unpublishClassNote(classId: string, noteId: string): Promise<TeachingClassNoteRecord> {
	const existing = await repo.getClassNote(noteId);
	if (!existing || existing.classId !== classId) notFound('Class note');
	const updated = await repo.updateClassNote(noteId, {
		publishedTitle: null,
		publishedHtml: null,
		publishedAt: null,
	});
	return mapNote(updated);
}

export async function reorderClassNotes(
	classId: string,
	input: ReorderTeachingClassNotesInput,
): Promise<TeachingClassNoteRecord[]> {
	const notes = await repo.listClassNotes(classId);
	const known = new Set(notes.map((note) => note.id));
	const unique = new Set(input.ids);
	if (input.ids.length !== notes.length || unique.size !== input.ids.length || input.ids.some((id) => !known.has(id))) {
		throw new AppError('Danh sách sắp xếp không hợp lệ.', 422, 'VALIDATION');
	}
	await repo.reorderClassNotes(classId, input.ids);
	return getClassNotes(classId);
}

export function mapPublicClassNote(note: {
	id: string;
	publishedTitle: string | null;
	publishedHtml: string | null;
	publishedAt: Date | null;
}): PublicClassNote | null {
	if (note.publishedTitle === null || note.publishedHtml === null || note.publishedAt === null) return null;
	return {
		id: note.id,
		title: note.publishedTitle,
		html: sanitizeTeachingHtml(note.publishedHtml),
		publishedAt: note.publishedAt.toISOString(),
	};
}
