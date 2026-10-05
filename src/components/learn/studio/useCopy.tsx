'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useCopy() {
	const [copied, setCopied] = useState(false);
	const [manual, setManual] = useState<string | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(
		() => () => {
			if (timer.current) clearTimeout(timer.current);
		},
		[],
	);

	const copy = useCallback(async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			if (timer.current) clearTimeout(timer.current);
			timer.current = setTimeout(() => setCopied(false), 1800);
		} catch {
			setManual(text);
		}
	}, []);

	return { copied, copy, manual, clearManual: () => setManual(null) };
}

/** Shown when the clipboard API refuses. The text is selected so ⌘C / Ctrl+C works. */
export function ManualCopyField({ text }: { text: string }) {
	const ref = useRef<HTMLTextAreaElement>(null);
	useEffect(() => {
		ref.current?.focus();
		ref.current?.select();
	}, [text]);
	return (
		<div className="ln-copy-fallback">
			<p>Trình duyệt không sao chép được. Nội dung đã được chọn — nhấn ⌘C hoặc Ctrl+C.</p>
			<textarea
				ref={ref}
				className="ln-input"
				rows={6}
				readOnly
				value={text}
				aria-label="Nội dung cần sao chép"
			/>
		</div>
	);
}
