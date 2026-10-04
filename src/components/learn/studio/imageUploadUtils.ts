import type { Editor } from '@tiptap/core';

import { imageFileKey, imageSrcStatus, type ImageRef } from '@/features/learn/images';

let sequence = 0;
export function imagePlaceholder(name = 'anh-dan.png') {
	return `anh-dan-${++sequence}-${encodeURIComponent(name.replace(/^.*[\\/]/, ''))}`;
}

export function imageAlt(file: File) {
	return /^(image|clipboard|pasted[ -]?image)([ -]?\d+)?\.[^.]+$/i.test(file.name)
		? ''
		: file.name.replace(/\.[^.]+$/, '');
}

export function replaceEditorImages(editor: Editor, replacements: ReadonlyMap<string, string>) {
	if (editor.isDestroyed) return;
	const tr = editor.state.tr;
	editor.state.doc.descendants((node, pos) => {
		if (node.type.name !== 'image') return;
		const src = replacements.get(String(node.attrs.src));
		if (src) tr.setNodeMarkup(pos, undefined, { ...node.attrs, src });
	});
	if (tr.docChanged) editor.view.dispatch(tr);
}

/** Reserve each position immediately; subsequent editing and uploads cannot move it. */
export async function insertImageFiles(
	editor: Editor,
	files: File[],
	position: number,
	upload: (file: File) => Promise<string | null>,
) {
	const items = files.map((file) => ({ file, src: imagePlaceholder(file.name) }));
	editor
		.chain()
		.focus()
		.insertContentAt(
			position,
			items.map(({ file, src }) => ({ type: 'image', attrs: { src, alt: imageAlt(file) } })),
		)
		.run();
	await Promise.all(
		items.map(async ({ file, src }) => {
			const url = await upload(file);
			if (url) replaceEditorImages(editor, new Map([[src, url]]));
		}),
	);
}

export function pastedHtmlHasText(html: string): boolean {
	if (!html) return false;
	return Boolean(new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim());
}

/** Store temporary URLs out of the document, so autosave never persists base64. */
export function preparePastedImages(html: string, pending: Map<string, string>): string {
	const doc = new DOMParser().parseFromString(html, 'text/html');
	for (const image of doc.querySelectorAll('img')) {
		const src = image.getAttribute('src') ?? '';
		if (imageSrcStatus(src) === 'ready') continue;
		const placeholder = imagePlaceholder(src.startsWith('file:') ? src : 'anh.png');
		pending.set(placeholder, src);
		image.setAttribute('src', placeholder);
	}
	return doc.body.innerHTML;
}

export async function resolvePastedImages(
	editor: Editor,
	pending: Map<string, string>,
	upload: (file: File) => Promise<string | null>,
) {
	const inserted: string[] = [];
	editor.state.doc.descendants((node) => {
		if (node.type.name === 'image' && pending.has(String(node.attrs.src)))
			inserted.push(String(node.attrs.src));
	});
	await Promise.all(
		inserted.map(async (placeholder) => {
			const original = pending.get(placeholder) ?? '';
			pending.delete(placeholder);
			if (!/^(data:|blob:|https?:\/\/|\/\/)/i.test(original)) return;
			try {
				let blob: Blob;
				if (original.startsWith('data:')) {
					const comma = original.indexOf(',');
					if (comma < 0) throw new Error('Ảnh dán không hợp lệ');
					const header = original.slice(5, comma);
					const body = original.slice(comma + 1);
					const decoded = /;base64/i.test(header) ? atob(body) : decodeURIComponent(body);
					blob = new Blob([Uint8Array.from(decoded, (char) => char.charCodeAt(0))], {
						type: header.split(';')[0],
					});
				} else {
					const res = await fetch(original, {
						credentials: 'omit',
						signal: AbortSignal.timeout(15000),
					});
					if (!res.ok) throw new Error('Không đọc được ảnh dán');
					blob = await res.blob();
				}
				if (!blob.type.startsWith('image/')) throw new Error('Nội dung không phải ảnh');
				const url = await upload(new File([blob], placeholder, { type: blob.type }));
				if (url) replaceEditorImages(editor, new Map([[placeholder, url]]));
				else if (imageSrcStatus(original) === 'external')
					replaceEditorImages(editor, new Map([[placeholder, original]]));
			} catch {
				if (imageSrcStatus(original) === 'external')
					replaceEditorImages(editor, new Map([[placeholder, original]]));
			}
		}),
	);
}

/** Chromium directory readers return pages of entries; read until an empty page. */
export async function droppedImageFiles(transfer: DataTransfer): Promise<File[]> {
	const entries = [...(transfer.items ?? [])]
		.map((item) => item.webkitGetAsEntry?.())
		.filter((entry): entry is FileSystemEntry => Boolean(entry));
	if (!entries.length) return [...transfer.files].filter((file) => file.type.startsWith('image/'));
	async function read(entry: FileSystemEntry): Promise<File[]> {
		if (entry.isFile) {
			const file = await new Promise<File>((resolve, reject) =>
				(entry as FileSystemFileEntry).file(resolve, reject),
			);
			return file.type.startsWith('image/') ? [file] : [];
		}
		if (!entry.isDirectory) return [];
		const reader = (entry as FileSystemDirectoryEntry).createReader();
		const children: FileSystemEntry[] = [];
		while (true) {
			const page = await new Promise<FileSystemEntry[]>((resolve, reject) =>
				reader.readEntries(resolve, reject),
			);
			if (!page.length) break;
			children.push(...page);
		}
		return (await Promise.all(children.map(read))).flat();
	}
	return (await Promise.all(entries.map(read))).flat();
}

export async function matchImageFiles(
	refs: ImageRef[],
	files: File[],
	upload: (file: File) => Promise<string | null>,
) {
	const replacements = new Map<string, string>();
	const unmatched: string[] = [];
	const seen = new Set<string>();
	await Promise.all(
		files.map(async (file) => {
			const key = imageFileKey(file.name);
			const matching = refs.filter(
				(ref) => ref.status !== 'ready' && imageFileKey(ref.url) === key,
			);
			if (!key || !matching.length || seen.has(key)) {
				unmatched.push(file.name);
				return;
			}
			seen.add(key);
			const url = await upload(file);
			if (url) for (const ref of matching) replacements.set(ref.src, url);
		}),
	);
	return { replacements, unmatched };
}
