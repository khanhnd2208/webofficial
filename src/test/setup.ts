import { vi } from 'vitest';

// Silence console.error from expected API error tests unless DEBUG=1
if (!process.env.DEBUG) {
	vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
		const msg = String(args[0] ?? '');
		if (msg.includes('[API Error]')) return;

		console.warn(...args);
	});
}
