'use client';

import { TeachingMark } from '@/components/site/TeachingMark';
import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import Link from 'next/link';
import { useState } from 'react';

import adminArt from '../../../public/brand/myspace/admin-v3.webp';
import boardGameArt from '../../../public/brand/myspace/board-game-v3.webp';
import coursesArt from '../../../public/brand/myspace/courses-v3.webp';
import teachingArt from '../../../public/brand/myspace/teaching-v3.webp';
import { StaggerGroup, StaggerItem } from '@/components/motion/StaggerGroup';
import { mySpacePage, type MySpaceTile } from '@/content/mySpace';

const tileArt = {
	teaching: teachingArt,
	courses: coursesArt,
	'board-game': boardGameArt,
	admin: adminArt,
} as const;

function ComingSoonBadge() {
	return (
		<span className="mt-2 flex items-center gap-1.5 font-mono text-caption tracking-[0.08em] text-ink/50 uppercase">
			<Icon name="lock" size={14} className="opacity-70" />
			{mySpacePage.comingSoonLabel}
		</span>
	);
}

function TileImage({
	tile,
	size,
	className,
}: {
	tile: MySpaceTile;
	size: number;
	className: string;
}) {
	if (tile.visual.kind === 'mark')
		return (
			<TeachingMark
				className={`teaching-destination-mark text-[var(--teaching-accent)] ${className}`}
			/>
		);
	if (tile.visual.kind === 'cards') {
		return (
			<span className={`relative block ${className}`} aria-hidden="true">
				<span className="absolute inset-x-[17%] top-[20%] h-[62%] rotate-[-9deg] border border-bronze/60 bg-paper" />
				<span className="absolute inset-x-[17%] top-[20%] h-[62%] rotate-[4deg] border border-bronze/70 bg-paper" />
				<span className="absolute inset-x-[17%] top-[20%] h-[62%] rotate-[12deg] border border-bronze bg-paper" />
			</span>
		);
	}
	if (tile.visual.kind === 'monogram') {
		return (
			<span className={`flex items-center justify-center ${className}`} aria-hidden="true">
				<span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink font-sans text-title font-black tracking-wider text-paper shadow-sm transition-transform duration-150 group-hover:scale-105">
					{tile.visual.text}
				</span>
			</span>
		);
	}

	const art = tileArt[tile.id as keyof typeof tileArt];
	return (
		<Image
			src={art ?? tile.visual.src}
			alt=""
			width={size}
			height={size}
			placeholder={art ? 'blur' : 'empty'}
			unoptimized={tile.visual.src.endsWith('.svg')}
			loading={tile.featured ? 'eager' : 'lazy'}
			className={`object-contain mix-blend-multiply  ${className}`}
			sizes={`${size}px`}
			aria-hidden
		/>
	);
}

const nameClass = 'font-display text-title leading-7 font-medium tracking-tight text-ink';

/** Standard tile — quiet illustration over a compact label (EduPortal nav grammar). */
function FlatTile({ tile, locked }: { tile: MySpaceTile; locked?: boolean }) {
	return (
		<>
			<TileImage
				tile={tile}
				size={80}
				className="h-20 w-20 transition-transform duration-150 group-hover:scale-105"
			/>
			<span className={nameClass}>{tile.label}</span>
			{locked ? <ComingSoonBadge /> : null}
		</>
	);
}

/** Featured tile — elevated rounded square with the label inside, one per hub. */
function FeaturedTile({ tile, locked }: { tile: MySpaceTile; locked?: boolean }) {
	return (
		<>
			<span
				className={`flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-3xl bg-surface-secondary transition-colors duration-250 sm:h-44 sm:w-44 ${
					tile.id === 'teaching'
						? 'bg-[var(--teaching-selected)] group-hover:bg-[var(--teaching-selected-hover)]'
						: locked
							? ''
							: 'group-hover:bg-surface-hover'
				}`}
			>
				<TileImage
					tile={tile}
					size={96}
					className="h-24 w-24 transition-transform duration-150 group-hover:scale-105"
				/>
				<span className={nameClass}>{tile.label}</span>
			</span>
			{locked ? <ComingSoonBadge /> : null}
		</>
	);
}

const tileClassName =
	'group flex w-32 flex-col items-center text-center transition-transform duration-150 ease-[var(--ui-ease)] hover:-translate-y-1 active:scale-[0.98] focus-visible:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent';

const featuredTileClassName =
	'group flex flex-col items-center text-center transition-transform duration-150 ease-[var(--ui-ease)] hover:-translate-y-1 active:scale-[0.98] focus-visible:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent';

const lockedTileClassName =
	'group flex w-32 cursor-not-allowed flex-col items-center bg-transparent p-0 text-center opacity-45 focus-visible:outline-none';

const lockedFeaturedTileClassName =
	'group flex cursor-not-allowed flex-col items-center bg-transparent p-0 text-center opacity-45 focus-visible:outline-none';

/**
 * My Space hub — centered flex-wrap composition of quiet icon tiles with one
 * featured rounded card. Reuses site canvas / display type; chrome stays in
 * PublicMinimalChrome.
 */
export default function MySpaceGrid({ tiles }: { tiles: MySpaceTile[] }) {
	const [openId, setOpenId] = useState<string | null>(null);

	return (
		<StaggerGroup
			className="flex w-full max-w-[50rem] flex-wrap items-center justify-center gap-x-12 gap-y-14 sm:gap-x-24 sm:gap-y-16 lg:gap-x-28"
			staggerMs={0.08}
		>
			{tiles.map((tile) => {
				const isOpen = openId === tile.id;
				const published = tile.status === 'published' && tile.href;
				const TileBody = tile.featured ? FeaturedTile : FlatTile;

				return (
					<StaggerItem key={tile.id} className="flex flex-col items-center">
						{published ? (
							<Link
								href={tile.href!}
								className={tile.featured ? featuredTileClassName : tileClassName}
								data-testid={`myspace-tile-${tile.id}`}
							>
								<TileBody tile={tile} />
							</Link>
						) : (
							<button
								type="button"
								className={tile.featured ? lockedFeaturedTileClassName : lockedTileClassName}
								aria-expanded={isOpen}
								data-testid={`myspace-tile-${tile.id}`}
								onClick={() => setOpenId((current) => (current === tile.id ? null : tile.id))}
							>
								<TileBody tile={tile} locked />
							</button>
						)}
						{!published && isOpen ? (
							<p
								className="mt-3 max-w-[14rem] text-center font-sans text-caption leading-relaxed text-ink/45"
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
