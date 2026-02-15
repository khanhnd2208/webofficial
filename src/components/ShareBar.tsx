'use client';

import { useEffect, useState } from 'react';

interface ShareBarProps {
	url: string;
	title: string;
}

export default function ShareBar({ url, title }: ShareBarProps) {
	const [copied, setCopied] = useState(false);
	const [canShare, setCanShare] = useState(false);

	// Determine native share support on the client only to avoid hydration mismatch
	// eslint-disable-next-line react-hooks/set-state-in-effect
	useEffect(() => { setCanShare(typeof navigator !== 'undefined' && !!navigator.share); }, []);

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			/* ignore */
		}
	}

	async function nativeShare() {
		if (!navigator.share) return;
		try {
			await navigator.share({ title, url });
		} catch {
			/* user cancelled */
		}
	}

	return (
		<div className="flex items-center gap-2">
			{/* Copy link */}
			<button
				onClick={() => void copyLink()}
				className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
					copied
						? 'border-success bg-success-subtle text-success'
						: 'border-border text-muted hover:border-foreground hover:text-foreground'
				}`}
				title="Copy link"
			>
				{copied ? (
					<>
						<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
						</svg>
						Copied!
					</>
				) : (
					<>
						<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
						</svg>
						Link
					</>
				)}
			</button>

			{/* Native share (mobile) */}
			{canShare ? (
				<button
					onClick={() => void nativeShare()}
					className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted transition-all hover:border-foreground hover:text-foreground active:scale-95"
					title="Chia sẻ"
				>
					<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
					</svg>
					Chia sẻ
				</button>
			) : null}
		</div>
	);
}
