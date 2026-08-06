const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
	return Array.from(new Uint8Array(buffer))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export function generateSalt(): string {
	if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
		const bytes = new Uint8Array(16);
		crypto.getRandomValues(bytes);
		return toHex(bytes.buffer);
	}
	return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function hashPin(pin: string, salt: string): Promise<string> {
	const data = encoder.encode(`${salt}:${pin}`);
	if (typeof crypto !== 'undefined' && crypto.subtle) {
		const hash = await crypto.subtle.digest('SHA-256', data);
		return toHex(hash);
	}
	// Fallback for environments without subtle (shouldn't happen in browser)
	return `${salt}:${pin}`;
}

export async function verifyPin(pin: string, salt: string, expectedHash: string): Promise<boolean> {
	const hash = await hashPin(pin, salt);
	return hash === expectedHash;
}

export function isValidPin(pin: string, length: 4 | 6 = 4): boolean {
	return new RegExp(`^\\d{${length}}$`).test(pin);
}
