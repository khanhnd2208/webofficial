const PREFIX = 'my-class:vocab-draft:';

function scopedKey(key: string) {
	try {
		const scope = localStorage.getItem('my-class:storage-scope') ?? 'anonymous';
		return `${PREFIX}${scope}:${key}`;
	} catch {
		return `${PREFIX}anonymous:${key}`;
	}
}

export function readPracticeDraft<T>(key: string): T | null {
	try {
		const raw = sessionStorage.getItem(scopedKey(key));
		if (!raw) return null;
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}

export function writePracticeDraft(key: string, value: unknown) {
	try {
		sessionStorage.setItem(scopedKey(key), JSON.stringify(value));
	} catch {
		/* private mode */
	}
}

export function clearPracticeDraft(key: string) {
	try {
		sessionStorage.removeItem(scopedKey(key));
	} catch {
		/* private mode */
	}
}
