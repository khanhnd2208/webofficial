/**
 * Known application error — safe to expose message to clients.
 * Separated from apiUtils to avoid pulling auth into service-layer imports.
 */
export class AppError extends Error {
	constructor(
		message: string,
		public readonly status: number = 400,
		public readonly code?: string,
		public readonly fields?: Record<string, string>,
		public readonly details?: unknown,
	) {
		super(message);
		this.name = 'AppError';
	}
}
