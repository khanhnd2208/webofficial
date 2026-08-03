'use client';

import { useEffect } from 'react';

import { trackEvent } from '@/lib/analytics';

export function CaseStudyViewTracker({ slug }: { slug: string }) {
	useEffect(() => {
		trackEvent('case_study_view', { slug, sourcePage: `/du-an/${slug}` });
	}, [slug]);

	return null;
}
