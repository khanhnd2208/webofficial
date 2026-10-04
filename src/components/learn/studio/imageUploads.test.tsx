import { act, renderHook, waitFor } from '@testing-library/react';
import { Editor } from '@tiptap/core';
import { describe, expect, it, vi } from 'vitest';

import { findImageRefs } from '@/features/learn/images';
import { learnEditorExtensions } from './editorExtensions';
import {
	droppedImageFiles,
	matchImageFiles,
	insertImageFiles,
	preparePastedImages,
	resolvePastedImages,
} from './imageUploadUtils';
import { useImageUploads } from './useImageUploads';

const { adminFetch } = vi.hoisted(() => ({ adminFetch: vi.fn() }));
vi.mock('@/lib/admin/client', () => ({ adminFetch }));

function editor() {
	return new Editor({
		extensions: learnEditorExtensions(),
		content: 'Before\n\nAfter',
		contentType: 'markdown',
	});
}

describe('image uploads', () => {
	it('attaches all matching references, rejects ambiguous duplicate files and reports unmatched files', async () => {
		const upload = vi.fn().mockResolvedValue('/uploads/hinh.webp');
		const refs = findImageRefs('![a](folder/hinh-1.png#w=50)\n![b](hinh-1.jpg "caption")');
		const files = ['HINH-1.jpeg', 'hinh-1.webp', 'other.png'].map(
			(name) => new File(['x'], name, { type: 'image/png' }),
		);
		const result = await matchImageFiles(refs, files, upload);
		expect(upload).toHaveBeenCalledTimes(1);
		expect(result.replacements.size).toBe(2);
		expect(result.unmatched).toEqual(['hinh-1.webp', 'other.png']);
	});
	it('reads all directory pages recursively instead of stopping at the first page', async () => {
		const file = new File(['x'], 'hinh-1.png', { type: 'image/png' });
		const entry = {
			isFile: true,
			isDirectory: false,
			file: (resolve: (value: File) => void) => resolve(file),
		};
		const pages = [[entry], [entry], []];
		const directory = {
			isDirectory: true,
			isFile: false,
			createReader: () => ({
				readEntries: (resolve: (value: unknown[]) => void) => resolve(pages.shift() ?? []),
			}),
		};
		const transfer = {
			items: [{ webkitGetAsEntry: () => directory }],
			files: [],
		} as unknown as DataTransfer;
		expect(await droppedImageFiles(transfer)).toEqual([file, file]);
	});
	it('limits requests to three and continues after a named failure', async () => {
		const finishes: Array<(value: { url: string }) => void> = [];
		adminFetch.mockImplementation(() => new Promise((resolve) => finishes.push(resolve)));
		const { result } = renderHook(useImageUploads);
		let tasks: Array<Promise<string | null>> = [];
		act(() => {
			tasks = Array.from({ length: 5 }, (_, i) =>
				result.current.uploadFile(new File(['x'], `${i}.png`, { type: 'image/png' })),
			);
		});
		expect(adminFetch).toHaveBeenCalledTimes(3);
		await act(async () => {
			finishes[0]({ url: '/uploads/0.webp' });
		});
		expect(adminFetch).toHaveBeenCalledTimes(4);
		await act(async () => {
			finishes[1]({ url: '/uploads/1.webp' });
		});
		expect(adminFetch).toHaveBeenCalledTimes(5);
		await act(async () => {
			for (const finish of finishes.slice(2)) finish({ url: '/uploads/next.webp' });
			await Promise.all(tasks);
		});
		expect(result.current.uploading).toBe(false);
		adminFetch.mockRejectedValueOnce(new Error('Too large'));
		await act(async () => {
			await result.current.uploadFile(new File(['x'], 'bad.png'));
		});
		expect(result.current.errors).toEqual(['bad.png: Too large']);
	});
	it('keeps insertion order and original position despite later selection changes', async () => {
		const current = editor();
		const finishes: Array<(url: string) => void> = [];
		const upload = vi.fn(() => new Promise<string>((resolve) => finishes.push(resolve)));
		const files = [new File(['a'], 'image.png'), new File(['b'], 'second.png')];
		const task = insertImageFiles(current, files, 8, upload);
		current.commands.setTextSelection(current.state.doc.content.size - 1);
		finishes[1]('/uploads/second.webp');
		finishes[0]('/uploads/first.webp');
		await task;
		const md = current.getMarkdown();
		expect(md.indexOf('/uploads/first.webp')).toBeLessThan(md.indexOf('/uploads/second.webp'));
		expect(md.indexOf('/uploads/second.webp')).toBeLessThan(md.indexOf('After'));
		expect(md).toContain('![](/uploads/first.webp)');
		current.destroy();
	});
	it('hands a late upload to the fallback when the editor closed mid-upload', async () => {
		const current = editor();
		let finish: (url: string) => void = () => {};
		const upload = vi.fn(() => new Promise<string>((resolve) => (finish = resolve)));
		const detached = vi.fn();
		const task = insertImageFiles(current, [new File(['a'], 'shot.png')], 8, upload, detached);
		const placeholder = findImageRefs(current.getMarkdown())[0].src;
		current.destroy();
		finish('/uploads/late.webp');
		await task;
		expect(detached).toHaveBeenCalledWith(new Map([[placeholder, '/uploads/late.webp']]));
	});
	it('retains pasted text and local-file placeholders without persisting base64', async () => {
		const current = editor();
		const pending = new Map<string, string>();
		const html = preparePastedImages(
			'<p>Text</p><img src="data:image/png;base64,YQ=="><img src="file:///x.png">',
			pending,
		);
		expect(html).not.toContain('data:');
		current.commands.insertContent(html);

		const upload = vi.fn().mockResolvedValue('/uploads/pasted.webp');
		await resolvePastedImages(current, pending, upload);
		expect(current.getMarkdown()).toContain('/uploads/pasted.webp');
		expect(current.getMarkdown()).toContain('x.png');
		expect(current.getMarkdown()).toContain('Text');
		expect(current.getMarkdown()).not.toContain('base64');
		await waitFor(() => expect(upload).toHaveBeenCalledTimes(1));
		current.destroy();
	});
});
