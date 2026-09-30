'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useCopy() {
	const [copied, setCopied] = useState(false);
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
			window.prompt('Sao chép nội dung dưới đây', text);
		}
	}, []);

	return { copied, copy };
}
