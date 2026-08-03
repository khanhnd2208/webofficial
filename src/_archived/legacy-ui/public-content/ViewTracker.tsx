'use client';

import { useEffect, useRef } from 'react';

export default function ViewTracker({ slug }: { slug: string }) {
	const tracked = useRef(false);

	useEffect(() => {
		if (tracked.current) return;
		tracked.current = true;
		void fetch(`/api/posts/${slug}/views`, { method: 'POST' }).catch(() => {});
	}, [slug]);

	return null;
}
