'use client';

import Image from 'next/image';
import { useState } from 'react';

import { learnCourseThumbnailSrc } from '@/features/learn/thumbnail';

import CourseArtwork from './CourseArtwork';

const SIZES = '(max-width: 640px) 96px, 200px';

/** Saved cover, or the default artwork when the course has none or the file fails to load. */
export default function LearnCourseThumb({
	slug,
	thumbnailUrl,
}: {
	slug: string;
	thumbnailUrl: string | null;
}) {
	const src = learnCourseThumbnailSrc(thumbnailUrl);
	const [failed, setFailed] = useState(false);

	if (!src || failed) return <CourseArtwork slug={slug} fill sizes={SIZES} />;

	return (
		<span className="absolute inset-0 block overflow-hidden">
			<Image
				src={src}
				alt=""
				fill
				sizes={SIZES}
				className="object-cover"
				onError={() => setFailed(true)}
			/>
		</span>
	);
}
