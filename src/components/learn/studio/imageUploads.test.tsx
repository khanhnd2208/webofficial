import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { findImageRefs } from '@/features/learn/images';
import { uploadImageAt, droppedImageFiles, matchImageFiles } from './imageUploadUtils';
import { useImageUploads } from './useImageUploads';

const { adminFetch } = vi.hoisted(() => ({ adminFetch: vi.fn() }));
vi.mock('@/lib/admin/client', () => ({ adminFetch }));

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
		// Each file is checked (and shrunk if needed) before its request starts.
		await act(async () => {
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
});

describe('individual Markdown image slots', () => {
	it('reserves one of two identical blanks while the author keeps typing', async () => {
		let markdown = '![a]()\n![a]()';
		let finish!: (url: string | null) => void;
		const pending = uploadImageAt(
			1,
			new File(['x'], 'screenshot.png'),
			() => markdown,
			(next) => {
				markdown = next;
			},
			() =>
				new Promise((resolve) => {
					finish = resolve;
				}),
		);
		markdown = 'New paragraph\n' + markdown;
		finish('/uploads/chosen.webp');
		await pending;
		expect(markdown).toBe('New paragraph\n![a]()\n![a](/uploads/chosen.webp)');
	});
	it('restores an empty slot after upload failure without losing new text', async () => {
		let markdown = '![a](<> "caption")';
		await uploadImageAt(
			0,
			new File(['x'], 'random.png'),
			() => markdown,
			(next) => {
				markdown = next;
			},
			async () => {
				markdown += '\nMore text';
				return null;
			},
		);
		expect(markdown).toBe('![a](<> "caption")\nMore text');
	});
	it('does not recreate a placeholder deleted during upload', async () => {
		let markdown = '![a](old.png#w=50)';
		await uploadImageAt(
			0,
			new File(['x'], 'random.png'),
			() => markdown,
			(next) => {
				markdown = next;
			},
			async () => {
				markdown = 'Deleted image';
				return '/uploads/new.webp';
			},
		);
		expect(markdown).toBe('Deleted image');
	});
});
