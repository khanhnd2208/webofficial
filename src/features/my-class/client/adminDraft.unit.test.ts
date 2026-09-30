import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
	clearWorkspaceDraft,
	dismissWorkspaceDraft,
	isWorkspaceDraftDismissed,
	normalizeDraftHtml,
	readWorkspaceDraft,
	workspaceDraftDiffers,
	workspaceDraftKey,
	writeWorkspaceDraft,
} from './adminDraft';

function memoryStorage(): Storage {
	const values = new Map<string, string>();
	return {
		get length() {
			return values.size;
		},
		clear: () => values.clear(),
		getItem: (key) => values.get(key) ?? null,
		key: (index) => [...values.keys()][index] ?? null,
		removeItem: (key) => values.delete(key),
		setItem: (key, value) => values.set(key, value),
	};
}

describe('admin workspace drafts', () => {
	beforeEach(() => {
		vi.stubGlobal('localStorage', memoryStorage());
		vi.useRealTimers();
	});

	it('scopes drafts by course, node type, and node id', () => {
		writeWorkspaceDraft({
			courseId: 'course-a',
			nodeType: 'unit',
			nodeId: 'unit-1',
			title: 'Draft title',
			slug: 'draft-title',
			summary: '',
			foundationHtml: '<p>Draft</p>',
			academicHtml: '',
			expertHtml: '',
			baseUpdatedAt: '2026-08-15T00:00:00.000Z',
		});

		expect(readWorkspaceDraft('course-a', 'unit', 'unit-1')?.title).toBe('Draft title');
		expect(readWorkspaceDraft('course-b', 'unit', 'unit-1')).toBeNull();
		expect(readWorkspaceDraft('course-a', 'section', 'unit-1')).toBeNull();
		expect(workspaceDraftKey('course-a', 'unit', 'unit-1')).toContain('course-a:unit:unit-1');

		clearWorkspaceDraft('course-a', 'unit', 'unit-1');
		expect(readWorkspaceDraft('course-a', 'unit', 'unit-1')).toBeNull();
	});

	it('removes drafts older than seven days', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-08-01T00:00:00.000Z'));
		writeWorkspaceDraft({
			courseId: 'course-a',
			nodeType: 'unit',
			nodeId: 'unit-1',
			title: 'Expired',
			summary: '',
			baseUpdatedAt: '2026-08-01T00:00:00.000Z',
		});

		vi.setSystemTime(new Date('2026-08-09T00:00:00.000Z'));
		expect(readWorkspaceDraft('course-a', 'unit', 'unit-1')).toBeNull();
		expect(localStorage.getItem(workspaceDraftKey('course-a', 'unit', 'unit-1'))).toBeNull();
	});

	it('treats empty Tiptap paragraphs as unchanged content', () => {
		expect(normalizeDraftHtml('<p></p>')).toBe('');
		expect(normalizeDraftHtml('<p><br></p>')).toBe('');
		expect(
			workspaceDraftDiffers(
				{
					title: 'HRM là gì?',
					summary: ' ',
					foundationHtml: '<p></p>',
					academicHtml: '<p>Academic</p>',
					expertHtml: '',
				},
				{
					title: 'HRM là gì?',
					summary: '',
					foundationHtml: '',
					academicHtml: '<p>Academic</p>\n',
					expertHtml: '<p></p>',
				},
			),
		).toBe(false);
	});

	it('treats Tiptap list and mark serialization as unchanged content', () => {
		expect(
			workspaceDraftDiffers(
				{
					title: 'Ví dụ',
					summary: 'Tóm tắt',
					foundationHtml: '<ul><li><p>Điểm chính</p></li><li><p><strong>HRM</strong></p></li></ul>',
					academicHtml:
						'<p><a href="https://example.com" class="text-accent" target="_blank" rel="noopener">Nguồn</a></p>',
					expertHtml: '<p><em>Ghi chú</em></p>',
				},
				{
					title: 'Ví dụ',
					summary: 'Tóm tắt',
					foundationHtml: '<ul><li>Điểm chính</li><li><b>HRM</b></li></ul>',
					academicHtml: '<p><a href="https://example.com">Nguồn</a></p>',
					expertHtml: '<p><i>Ghi chú</i></p>',
				},
			),
		).toBe(false);
	});

	it('remembers a dismissed recovery prompt for the same draft', () => {
		vi.stubGlobal('sessionStorage', memoryStorage());
		writeWorkspaceDraft({
			courseId: 'course-a',
			nodeType: 'unit',
			nodeId: 'unit-1',
			title: 'Changed',
			summary: '',
			baseUpdatedAt: '2026-08-15T00:00:00.000Z',
		});
		const draft = readWorkspaceDraft('course-a', 'unit', 'unit-1');
		expect(draft).toBeTruthy();
		expect(isWorkspaceDraftDismissed(draft!)).toBe(false);
		dismissWorkspaceDraft(draft!);
		expect(isWorkspaceDraftDismissed(draft!)).toBe(true);
	});
});
