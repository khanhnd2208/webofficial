import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as repo from '../repositories/teachingRepository';
import { createClassNote, mapPublicClassNote, publishClassNote, reorderClassNotes, updateClassNote } from './classNoteService';

vi.mock('../repositories/teachingRepository', () => ({
	getClass: vi.fn(),
	listClassNotes: vi.fn(),
	getClassNote: vi.fn(),
	createClassNote: vi.fn(),
	updateClassNote: vi.fn(),
	deleteClassNote: vi.fn(),
	reorderClassNotes: vi.fn(),
}));

function note(overrides: Record<string, unknown> = {}) {
	return {
		id: 'note-1',
		classId: 'class-1',
		draftTitle: 'Tuần 1',
		draftHtml: '<p>Nội dung</p>',
		publishedTitle: null,
		publishedHtml: null,
		displayOrder: 0,
		publishedAt: null,
		createdAt: new Date('2026-08-25T00:00:00.000Z'),
		updatedAt: new Date('2026-08-25T00:00:00.000Z'),
		...overrides,
	};
}

describe('classNoteService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(repo.getClass).mockResolvedValue({ id: 'class-1' } as never);
		vi.mocked(repo.listClassNotes).mockResolvedValue([]);
	});

	it('creates a sanitized draft with the next display order', async () => {
		vi.mocked(repo.listClassNotes).mockResolvedValue([note()] as never);
		vi.mocked(repo.createClassNote).mockResolvedValue(note({ id: 'note-2', displayOrder: 1 }) as never);

		await createClassNote('class-1', { title: ' Topic A ', html: '<p>Hello<script>alert(1)</script></p>' });

		expect(repo.createClassNote).toHaveBeenCalledWith(expect.objectContaining({
			classId: 'class-1',
			draftTitle: 'Topic A',
			displayOrder: 1,
			draftHtml: '<p>Hello</p>',
		}));
	});

	it('keeps the published snapshot separate when updating a draft', async () => {
		vi.mocked(repo.getClassNote).mockResolvedValue(note({ publishedTitle: 'Cũ', publishedHtml: '<p>Cũ</p>', publishedAt: new Date() }) as never);
		vi.mocked(repo.updateClassNote).mockResolvedValue(note({ draftTitle: 'Mới', draftHtml: '<p>Mới</p>', publishedTitle: 'Cũ', publishedHtml: '<p>Cũ</p>', publishedAt: new Date() }) as never);

		const result = await updateClassNote('class-1', 'note-1', { title: 'Mới', html: '<p>Mới</p>' });

		expect(result.status).toBe('MODIFIED');
		expect(repo.updateClassNote).toHaveBeenCalledWith('note-1', { draftTitle: 'Mới', draftHtml: '<p>Mới</p>' });
	});

	it('rejects publishing a note from another class and exposes only published snapshots', async () => {
		vi.mocked(repo.getClassNote).mockResolvedValue(note({ classId: 'other-class' }) as never);
		await expect(publishClassNote('class-1', 'note-1')).rejects.toMatchObject({ status: 404 });

		expect(mapPublicClassNote(note({ publishedTitle: 'Public', publishedHtml: '<p>Public</p>', publishedAt: new Date() }))).toMatchObject({
			title: 'Public',
			html: '<p>Public</p>',
		});
		expect(mapPublicClassNote(note())).toBeNull();
	});

	it('rejects formatting-only drafts but allows an image-only note to publish', async () => {
		vi.mocked(repo.getClassNote).mockResolvedValue(note({ draftHtml: '<p>&nbsp;</p><p><br></p>' }) as never);
		await expect(publishClassNote('class-1', 'note-1')).rejects.toMatchObject({ status: 422 });

		vi.mocked(repo.getClassNote).mockResolvedValue(note({ draftHtml: '<img src="/uploads/note.webp" alt="Sơ đồ">' }) as never);
		vi.mocked(repo.updateClassNote).mockResolvedValue(note({
			draftHtml: '<img src="/uploads/note.webp" alt="Sơ đồ">',
			publishedTitle: 'Tuần 1',
			publishedHtml: '<img src="/uploads/note.webp" alt="Sơ đồ">',
			publishedAt: new Date(),
		}) as never);
		await expect(publishClassNote('class-1', 'note-1')).resolves.toMatchObject({ status: 'PUBLISHED' });
	});

	it('validates reorder ids against the class note set', async () => {
		vi.mocked(repo.listClassNotes).mockResolvedValue([note(), note({ id: 'note-2', displayOrder: 1 })] as never);
		await expect(reorderClassNotes('class-1', { ids: ['note-1'] })).rejects.toMatchObject({ status: 422 });
		await expect(reorderClassNotes('class-1', { ids: ['note-2', 'note-1'] })).resolves.toHaveLength(2);
	});
});
