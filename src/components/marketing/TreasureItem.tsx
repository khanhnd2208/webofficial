import Image from 'next/image';

import type { TreasureItem as TreasureItemType } from '@/content/treasure';

type TreasureItemProps = {
	item: TreasureItemType;
};

export function TreasureItem({ item }: TreasureItemProps) {
	return (
		<figure className="marketing-card flex flex-col p-5 sm:p-6">
			{item.image ? (
				<div className="premium-media relative mb-5 aspect-[4/3]">
					<Image
						src={item.image}
						alt=""
						fill
						sizes="(max-width: 767px) calc(100vw - 48px), 30vw"
						className="object-cover"
					/>
				</div>
			) : null}
			{item.quote ? (
				<blockquote className="font-display text-xl leading-[1.45] text-ink md:text-2xl">
					“{item.quote}”
				</blockquote>
			) : null}
			<figcaption className="mt-4 text-sm leading-[1.65] text-ink-secondary">{item.caption}</figcaption>
		</figure>
	);
}
