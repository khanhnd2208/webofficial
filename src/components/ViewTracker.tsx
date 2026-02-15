'use client';

import { useEffect } from 'react';

export default function ViewTracker({ slug }: { slug: string }) {
	useEffect(() => {
		void fetch(`/api/posts/${slug}/views`, { method: 'POST' }).catch(() => {});
	}, [slug]);

	return null;
}
