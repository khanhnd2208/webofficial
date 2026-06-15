'use client';

import { useRef } from 'react';
import QRCode from 'react-qr-code';

interface QrCodePanelProps {
	url: string;
	title?: string;
}

export default function QrCodePanel({ url, title = 'message-qr' }: QrCodePanelProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	const downloadPng = async () => {
		const svg = containerRef.current?.querySelector('svg');
		if (!svg) return;

		const svgData = new XMLSerializer().serializeToString(svg);
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const img = new Image();
		const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
		const objectUrl = URL.createObjectURL(svgBlob);

		img.onload = () => {
			const padding = 32;
			canvas.width = img.width + padding * 2;
			canvas.height = img.height + padding * 2;
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(img, padding, padding);
			URL.revokeObjectURL(objectUrl);

			canvas.toBlob((blob) => {
				if (!blob) return;
				const a = document.createElement('a');
				a.href = URL.createObjectURL(blob);
				a.download = `${title}.png`;
				a.click();
				URL.revokeObjectURL(a.href);
			}, 'image/png');
		};

		img.src = objectUrl;
	};

	const copyLink = async () => {
		try {
			await navigator.clipboard.writeText(url);
		} catch {
			/* ignore */
		}
	};

	return (
		<div className="flex flex-col items-center gap-4">
			<div
				ref={containerRef}
				className="rounded-2xl border border-border bg-white p-6 shadow-sm"
			>
				<QRCode value={url} size={200} level="M" />
			</div>

			<p className="max-w-xs break-all text-center text-xs text-muted">{url}</p>

			<div className="flex flex-wrap justify-center gap-2">
				<button
					type="button"
					onClick={() => void copyLink()}
					className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-hover"
				>
					Copy link
				</button>
				<button
					type="button"
					onClick={() => void downloadPng()}
					className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
				>
					Tải QR (.png)
				</button>
			</div>
		</div>
	);
}
