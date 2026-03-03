import type { Metadata } from 'next';
import SuikaGame from './SuikaGame';
import Link from 'next/link';

export const metadata: Metadata = {
	title: 'Rồng Thăng Long | Game Hanoicam',
	description: 'Thả trái cây, ghép đôi để triệu hồi Rồng Thăng Long! Physics mượt, combo multiplier, screen shake, âm thanh sống động.',
};

export default function SuikaPage() {
	return (
		<div className="mx-auto max-w-2xl px-4 py-6">
			{/* Breadcrumb */}
			<nav className="mb-5 flex items-center gap-2 text-xs text-muted">
				<Link href="/games" className="hover:text-foreground transition-colors">
					Game Hanoicam
				</Link>
				<svg className="h-3 w-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
					<path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
				</svg>
				<span className="text-foreground font-semibold">Rồng Thăng Long</span>
			</nav>

			<SuikaGame />
		</div>
	);
}
