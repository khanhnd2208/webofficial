import Image from 'next/image';

import completeArt from '../../../public/brand/spots/complete-v1.webp';
import emptyArt from '../../../public/brand/spots/empty-v1.webp';
import errorArt from '../../../public/brand/spots/error-v1.webp';
import loginArt from '../../../public/brand/spots/login-v1.webp';
import notFoundArt from '../../../public/brand/spots/not-found-v1.webp';

const illustrations = {
	complete: completeArt,
	empty: emptyArt,
	error: errorArt,
	login: loginArt,
	'not-found': notFoundArt,
};

/** Decorative state artwork: the accompanying text always explains the state. */
export default function SpotIllustration({
	variant,
	size = 128,
	className = '',
}: {
	variant: keyof typeof illustrations;
	size?: number;
	className?: string;
}) {
	const art = illustrations[variant];
	return (
		<Image
			src={art}
			alt=""
			aria-hidden="true"
			width={size}
			height={size}
			sizes={`${size}px`}
			placeholder={art.blurDataURL ? 'blur' : 'empty'}
			className={`object-contain ${className}`}
		/>
	);
}
