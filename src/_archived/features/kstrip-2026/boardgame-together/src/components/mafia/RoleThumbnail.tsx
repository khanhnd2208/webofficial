import { withBasePath } from '@/lib/basePath';

interface RoleThumbnailProps {
	src: string;
	alt: string;
	size?: 'sm' | 'md' | 'lg';
	className?: string;
}

const SIZE_CLASSES = {
	sm: 'h-10 w-10',
	md: 'h-12 w-12',
	lg: 'h-full w-full',
};

export default function RoleThumbnail({ src, alt, size = 'sm', className }: RoleThumbnailProps) {
	return (
		<img
			src={withBasePath(src)}
			alt={alt}
			className={`shrink-0 rounded-lg object-cover ${SIZE_CLASSES[size]} ${className ?? ''}`}
			draggable={false}
			loading="lazy"
		/>
	);
}
