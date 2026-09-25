'use client';

interface Props {
	error: string | null;
	onRetry: () => void;
}

export default function ConnectionBanner({ error, onRetry }: Props) {
	if (!error) return null;

	const isOffline =
		error.includes('kết nối') ||
		error.includes('Mất kết nối') ||
		error.includes('network') ||
		error.includes('fetch');

	return (
		<div
			className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning-subtle px-4 py-3 text-sm"
			role="status"
		>
			<span className="text-warning-foreground">
				{isOffline ? '⚠ ' : ''}
				{error}
			</span>
			<button
				type="button"
				onClick={onRetry}
				className="shrink-0 font-semibold text-accent hover:underline"
			>
				Thử lại
			</button>
		</div>
	);
}
