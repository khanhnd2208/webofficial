export const READING_SIZE_STORAGE_KEY = 'active-recall:reading-size';
export const READING_SIZE_EVENT = 'active-recall:reading-size';

export const READING_SIZES = ['small', 'medium', 'large'] as const;

export type ReadingSize = (typeof READING_SIZES)[number];

export const READING_SIZE_LABELS: Record<ReadingSize, string> = {
	small: 'Nhỏ',
	medium: 'Vừa',
	large: 'Lớn',
};

export const DEFAULT_READING_SIZE: ReadingSize = 'medium';

export function parseReadingSize(value: unknown): ReadingSize {
	if (value === 'small' || value === 'medium' || value === 'large') return value;
	return DEFAULT_READING_SIZE;
}

export function readStoredReadingSize(): ReadingSize {
	try {
		return parseReadingSize(localStorage.getItem(READING_SIZE_STORAGE_KEY));
	} catch {
		return DEFAULT_READING_SIZE;
	}
}

export function writeStoredReadingSize(size: ReadingSize) {
	try {
		localStorage.setItem(READING_SIZE_STORAGE_KEY, size);
		window.dispatchEvent(new Event(READING_SIZE_EVENT));
	} catch {
		// Device-local preference is optional.
	}
}

export function subscribeReadingSize(onStoreChange: () => void) {
	window.addEventListener('storage', onStoreChange);
	window.addEventListener(READING_SIZE_EVENT, onStoreChange);
	return () => {
		window.removeEventListener('storage', onStoreChange);
		window.removeEventListener(READING_SIZE_EVENT, onStoreChange);
	};
}
