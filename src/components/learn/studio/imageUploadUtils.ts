import {
	findImageRefs,
	replaceImageAt,
	replaceImageSrcs,
	imageFileKey,
	type ImageRef,
} from '@/features/learn/images';

let sequence = 0;
export function imagePlaceholder(name = 'anh-dan.png') {
	return `anh-dan-${++sequence}-${encodeURIComponent(name.replace(/^.*[\\/]/, ''))}`;
}

export function pastedHtmlHasText(html: string): boolean {
	if (!html) return false;
	return Boolean(new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim());
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
	return { replacements, unmatched, count: refs.filter((ref) => replacements.has(ref.src)).length };
}

/** Reserve the chosen occurrence before awaiting; edits and duplicate blanks remain independent. */
export async function uploadImageAt(
	index: number,
	file: File,
	read: () => string,
	write: (markdown: string) => void,
	upload: (file: File) => Promise<string | null>,
) {
	const current = read();
	const ref = findImageRefs(current)[index];
	if (!ref) return;
	const marker = imagePlaceholder(file.name);
	write(replaceImageAt(current, index, marker));
	const url = await upload(file);
	if (url) write(replaceImageSrcs(read(), new Map([[marker, url]])));
	else {
		const latest = read();
		const position = findImageRefs(latest).findIndex((image) => image.url === marker);
		if (position >= 0) write(replaceImageAt(latest, position, ref.url));
	}
}
