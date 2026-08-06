'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { StaggerGroup, StaggerItem } from '@/components/motion/StaggerGroup';
import { mySpacePage, type MySpaceTile } from '@/content/mySpace';

function TileLabel({ tile }: { tile: MySpaceTile }) {
	if (tile.labelLines) {
		return (
			<>
				<span className="sm:hidden">
					{tile.labelLines[0]}
					<br />
					{tile.labelLines[1]}
				</span>
				<span className="hidden sm:inline">{tile.label}</span>
			</>
		);
	}
	return <>{tile.label}</>;
}

function TileVisual({ tile }: { tile: MySpaceTile }) {
	return (
		<>
			<div className="relative mb-6 h-28 w-28 sm:mb-0 sm:h-[7.5rem] sm:w-[7.5rem]">
				{/* Decorative — label below carries the accessible name */}
				<Image
					src={tile.image.src}
					alt=""
					width={120}
					height={120}
					className="h-full w-full object-contain opacity-80 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
					sizes="120px"
					aria-hidden
				/>
			</div>
			<span className="font-display text-[clamp(1.75rem,3vw,2rem)] font-medium tracking-tight text-ink">
				<TileLabel tile={tile} />
			</span>
		</>
	);
}

const tileClassName =
	'group flex flex-col items-center text-center transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] opacity-80 hover:opacity-100 hover:-translate-y-1 focus-visible:opacity-100 focus-visible:-translate-y-1 focus-visible:outline-none sm:gap-6';

/**
 * Ultra-minimalist My Space grid — mobile stack, desktop 2×2.
 * Reuses site canvas / display type; chrome stays in PublicMinimalChrome.
 */
export default function MySpaceGrid({ tiles }: { tiles: MySpaceTile[] }) {
	const [openId, setOpenId] = useState<string | null>(null);

	return (
		<StaggerGroup
			className="grid w-full max-w-sm grid-cols-1 place-items-center gap-14 sm:max-w-3xl sm:grid-cols-2 sm:gap-20 md:gap-24 lg:gap-28"
			staggerMs={0.08}
		>
			{tiles.map((tile) => {
				const isOpen = openId === tile.id;
				const published = tile.status === 'published' && tile.href;

				return (
					<StaggerItem key={tile.id} className="flex w-full flex-col items-center">
						{published ? (
							<Link
								href={tile.href!}
								className={tileClassName}
								data-testid={`myspace-tile-${tile.id}`}
							>
								<TileVisual tile={tile} />
							</Link>
						) : (
							<button
								type="button"
								className={`${tileClassName} cursor-pointer bg-transparent p-0`}
								aria-expanded={isOpen}
								data-testid={`myspace-tile-${tile.id}`}
								onClick={() => setOpenId((current) => (current === tile.id ? null : tile.id))}
							>
								<TileVisual tile={tile} />
							</button>
						)}
						{!published && isOpen ? (
							<p
								className="mt-3 max-w-[14rem] text-center font-sans text-[0.75rem] leading-relaxed text-ink/45"
								role="status"
								data-testid={`myspace-note-${tile.id}`}
							>
								{mySpacePage.comingSoonNote}
							</p>
						) : null}
					</StaggerItem>
				);
			})}
		</StaggerGroup>
	);
}
