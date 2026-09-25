export function hapticLight() {
	if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
		navigator.vibrate(12);
	}
}

export function hapticMedium() {
	if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
		navigator.vibrate(24);
	}
}

export function hapticUrgent() {
	if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
		navigator.vibrate([30, 40, 30]);
	}
}
