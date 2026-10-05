'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { StaggerGroup, StaggerItem } from '@/components/motion/StaggerGroup';
import { mySpacePage, type MySpaceTile } from '@/content/mySpace';

function DevelopingIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			width="11"
			height="11"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<rect x="5" y="11" width="14" height="10" rx="1.5" />
			<path d="M8 11V8a4 4 0 0 1 8 0v3" />
		</svg>
	);
}

function ComingSoonBadge() {
	return (
		<span className="mt-2 flex items-center gap-1.5 font-mono text-[0.625rem] tracking-[0.12em] text-ink/50 uppercase">
			<DevelopingIcon className="opacity-70" />
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
	if (tile.visual.kind === 'cards') {
		return (
			<span className={`relative block ${className}`} aria-hidden="true">
				<span className="absolute inset-x-[17%] top-[20%] h-[62%] rotate-[-9deg] border border-[#765625]/60 bg-paper" />
				<span className="absolute inset-x-[17%] top-[20%] h-[62%] rotate-[4deg] border border-[#765625]/70 bg-paper" />
				<span className="absolute inset-x-[17%] top-[20%] h-[62%] rotate-[12deg] border border-[#765625] bg-paper" />
			</span>
		);
	}
	if (tile.visual.kind === 'monogram') {
		return (
			<span className={`flex items-center justify-center ${className}`} aria-hidden="true">
				<span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink font-sans text-xl font-black tracking-wider text-paper shadow-sm transition-transform duration-500 group-hover:scale-105">
					{tile.visual.text}
				</span>
			</span>
		);
	}

	return (
		<Image
			src={tile.visual.src}
			alt=""
			width={size}
			height={size}
			unoptimized={tile.visual.src.endsWith('.svg')}
			loading={tile.featured ? 'eager' : 'lazy'}
			className={`object-contain mix-blend-multiply drop-shadow-[0_7px_10px_rgba(23,23,23,0.08)] ${className}`}
			sizes={`${size}px`}
			aria-hidden
		/>
	);
}

const nameClass = 'font-display text-xl leading-7 font-medium tracking-tight text-ink';

/** Standard tile — quiet illustration over a compact label (EduPortal nav grammar). */
function FlatTile({ tile, locked }: { tile: MySpaceTile; locked?: boolean }) {
	return (
		<>
			<TileImage
				tile={tile}
				size={80}
				className="h-20 w-20 transition-transform duration-500 group-hover:scale-105"
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
				className={`flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-3xl bg-surface-secondary transition-colors duration-300 sm:h-44 sm:w-44 ${
					locked ? '' : 'group-hover:bg-surface-hover'
				}`}
			>
				<TileImage
					tile={tile}
					size={96}
					className="h-24 w-24 transition-transform duration-500 group-hover:scale-105"
				/>
				<span className={nameClass}>{tile.label}</span>
			</span>
			{locked ? <ComingSoonBadge /> : null}
		</>
	);
}

const tileClassName =
	'group flex w-32 flex-col items-center text-center transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-none';

const featuredTileClassName =
	'group flex flex-col items-center text-center transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-none';

const lockedTileClassName =
	'group flex w-32 cursor-not-allowed flex-col items-center bg-transparent p-0 text-center opacity-45 focus-visible:outline-none';

const lockedFeaturedTileClassName =
	'group flex cursor-not-allowed flex-col items-center bg-transparent p-0 text-center opacity-45 focus-visible:outline-none';

/**
 * My Space hub — centered flex-wrap composition of quiet icon tiles with one
 * featured rounded card. Reuses site canvas / display type; chrome stays in
 * the shared site header.
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
