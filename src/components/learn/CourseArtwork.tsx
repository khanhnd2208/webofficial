import Image from 'next/image';
import { COURSE_ARTWORK_BY_SLUG, DEFAULT_COURSE_ARTWORK } from '@/config/courseArtwork';

import aiArt from '../../../public/brand/courses/ai-foundations-v1.webp';
import businessArt from '../../../public/brand/courses/business-systems-v1.webp';
import growthArt from '../../../public/brand/courses/human-growth-v1.webp';
import projectArt from '../../../public/brand/courses/project-management-v1.webp';

/** Topic metaphors share one hand and palette; titles remain accessible live text. */
export default function CourseArtwork({
	slug,
	className = '',
}: {
	slug?: string;
	className?: string;
}) {
	const artwork = { ai: aiArt, business: businessArt, growth: growthArt, project: projectArt };
	const art = artwork[(slug && COURSE_ARTWORK_BY_SLUG[slug]) || DEFAULT_COURSE_ARTWORK];
	return (
		<span className={`relative block aspect-[16/10] overflow-hidden ${className}`}>
			<Image
				src={art}
				alt=""
				fill
				placeholder={art.blurDataURL ? 'blur' : 'empty'}
				sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 540px"
				className="object-cover"
			/>
		</span>
	);
}
