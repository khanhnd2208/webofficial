import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { getMySpaceTiles } from '@/content/mySpace';
import type { UserRole } from '@/types/user';
import styles from './toc.module.css';

export interface TocDoor {
	href: string;
	label: string;
	description: ReactNode;
	icon: string;
}

export interface TocSpaceItem extends TocDoor {
	id: string;
}

/** Courses first, then Lớp học and Quản trị for admins. */
const DOOR_ORDER = ['courses', 'teaching', 'admin'];

const tocIcons: Record<string, string> = {
	teaching: '/brand/toc/teaching-v1.webp',
	courses: '/brand/toc/courses-v1.webp',
};

function descriptionFor(id: string): ReactNode {
	if (id === 'courses') return 'Học thêm một điều mới.';
	if (id === 'teaching') return 'Một góc dành cho lớp học.';
	if (id === 'admin') return 'Quản lý không gian của bạn.';
	return '';
}

function doorRank(id: string): number {
	const rank = DOOR_ORDER.indexOf(id);
	return rank === -1 ? DOOR_ORDER.length : rank;
}

/**
 * Flat Mục lục doors. Lớp học (Teaching) and Quản trị appear only for admins,
 * since getMySpaceTiles drops them for everyone else.
 */
export function buildTocItems(role?: UserRole | null): TocSpaceItem[] {
	const tiles = getMySpaceTiles(role)
		.filter((tile) => tile.href)
		.flatMap((tile) => {
			const icon = tocIcons[tile.id] ?? (tile.visual.kind === 'image' ? tile.visual.src : null);
			if (!icon || !tile.href) return [];
			return [
				{
					id: tile.id,
					href: tile.href,
					label: tile.label,
					description: descriptionFor(tile.id),
					icon,
				},
			];
		});
	return tiles.sort((a, b) => doorRank(a.id) - doorRank(b.id));
}

/** → stays on this site; ↗ leaves it. */
function Arrow({ external }: { external: boolean }) {
	return (
		<span className={styles.arrow} data-external={external ? '' : undefined} aria-hidden="true">
			{external ? '↗' : '→'}
		</span>
	);
}

function Door({ item, testId }: { item: TocDoor; testId: string }) {
	return (
		<Link href={item.href} className={styles.door} data-testid={testId}>
			<span className={styles.doorIcon}>
				<Image
					src={item.icon}
					alt=""
					width={112}
					height={112}
					sizes="(max-width: 860px) 64px, 112px"
					loading="eager"
				/>
			</span>
			<span className={styles.doorText}>
				<span className={styles.doorTitle}>
					{item.label}
					<Arrow external={/^https?:/.test(item.href)} />
				</span>
				<span className={styles.doorDescription}>{item.description}</span>
			</span>
		</Link>
	);
}

/** Every Mục lục door at once: Về tôi, then the spaces this visitor may open. */
export default function TocDoors({ about, items }: { about: TocDoor; items: TocSpaceItem[] }) {
	return (
		<nav aria-label="Mục lục" className={styles.navigation}>
			<Door item={about} testId="gate-item-about" />
			{items.map((item) => (
				<Door key={item.id} item={item} testId={`myspace-tile-${item.id}`} />
			))}
		</nav>
	);
}
