export const FIRE_MODE_STORAGE_KEY = 'active-recall:fire';
export const FIRE_MODE_EVENT = 'active-recall:fire';

/** Fire is on unless this device turned it off. */
export function readStoredFireMode(): boolean {
	try {
		return localStorage.getItem(FIRE_MODE_STORAGE_KEY) !== 'off';
	} catch {
		return true;
	}
}

export function writeStoredFireMode(on: boolean) {
	try {
		localStorage.setItem(FIRE_MODE_STORAGE_KEY, on ? 'on' : 'off');
		window.dispatchEvent(new Event(FIRE_MODE_EVENT));
	} catch {
		// Device-local preference is optional.
	}
}

export function subscribeFireMode(onStoreChange: () => void) {
	window.addEventListener('storage', onStoreChange);
	window.addEventListener(FIRE_MODE_EVENT, onStoreChange);
	return () => {
		window.removeEventListener('storage', onStoreChange);
		window.removeEventListener(FIRE_MODE_EVENT, onStoreChange);
	};
}
