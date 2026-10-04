'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { adminFetch } from '@/lib/admin/client';

/** One queue per editor/import dialog. A failed file does not stop the remaining files. */
export function useImageUploads() {
	const queue = useRef<Array<() => void>>([]);
	const active = useRef(0);
	const pending = useRef(0);
	const mounted = useRef(true);
	const [progress, setProgress] = useState({ done: 0, total: 0 });
	const [errors, setErrors] = useState<string[]>([]);
	useEffect(() => {
		mounted.current = true;
		const warn = (event: BeforeUnloadEvent) => {
			if (pending.current) event.preventDefault();
		};
		window.addEventListener('beforeunload', warn);
		return () => {
			mounted.current = false;
			window.removeEventListener('beforeunload', warn);
		};
	}, []);

	const uploadFile = useCallback((file: File): Promise<string | null> => {
		if (!pending.current) setProgress({ done: 0, total: 0 });
		pending.current++;
		setProgress((current) => ({ ...current, total: current.total + 1 }));
		return new Promise((resolve) => {
			const run = async () => {
				active.current++;
				let url: string | null = null;
				try {
					const form = new FormData();
					form.append('file', file);
					const payload = await adminFetch<{ url: string }>('/api/uploads', {
						method: 'POST',
						body: form,
					});
					if (!payload?.url) throw new Error('Máy chủ không trả về đường dẫn ảnh');
					url = payload.url;
				} catch (error) {
					if (mounted.current)
						setErrors((current) => [
							...current,
							`${file.name}: ${error instanceof Error ? error.message : 'Không tải ảnh lên được'}`,
						]);
				} finally {
					active.current--;
					pending.current--;
					if (mounted.current) setProgress((current) => ({ ...current, done: current.done + 1 }));
					resolve(url);
					queue.current.shift()?.();
				}
			};
			if (active.current < 3) void run();
			else queue.current.push(() => void run());
		});
	}, []);
	return {
		uploadFile,
		progress,
		errors,
		dismissErrors: () => setErrors([]),
		uploading: progress.done < progress.total,
	};
}
