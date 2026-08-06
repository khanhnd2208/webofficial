/**
 * Known application error — safe to expose code (+ optional params) to clients.
 */
export class AppError extends Error {
	constructor(
		public readonly code: string,
		public readonly status: number = 400,
		public readonly params?: Record<string, string | number>,
	) {
		super(code);
		this.name = 'AppError';
	}
}
