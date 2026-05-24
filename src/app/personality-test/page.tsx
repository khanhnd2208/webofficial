import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
	title: 'Personality Test | HANOICAM',
	description: 'Tính năng này tạm thời không khả dụng.',
};

export default function PersonalityTestUnavailablePage() {
	return (
		<main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
			<div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-surface-hover">
				<svg
					className="h-8 w-8 text-muted"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={1.5}
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
					/>
				</svg>
			</div>

			<h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
				Tạm thời không khả dụng
			</h1>
			<p className="mt-3 max-w-sm text-base text-foreground-secondary">
				Tính năng Personality Test hiện không khả dụng. Sẽ quay lại vào một ngày không xa.
			</p>

			<Link
				href="/"
				className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-background transition-all hover:scale-105 active:scale-95"
			>
				← Về trang chủ
			</Link>
		</main>
	);
}
