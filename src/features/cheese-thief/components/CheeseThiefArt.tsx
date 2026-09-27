import Image from 'next/image';

import { cn } from '@/features/spy-fall/lib/cn';

export type CheeseThiefArtScene =
	| 'mouse'
	| 'moon'
	| 'two-moons'
	| 'cheese'
	| 'stolen'
	| 'secret'
	| 'sunrise'
	| 'ballot'
	| 'tie'
	| 'reveal';

interface Props {
	scene: CheeseThiefArtScene;
	size?: number;
	className?: string;
}

/** Generated screen-print illustrations shared across Cheese Thief game phases. */
export default function CheeseThiefArt({ scene, size = 88, className }: Props) {
	return (
		<Image
			aria-hidden="true"
			alt=""
			className={cn('shrink-0 object-contain', className)}
			draggable={false}
			height={size}
			sizes={`${size}px`}
			src={`/board-game/cheese-thief/art/${scene}.webp`}
			width={size}
		/>
	);
}
