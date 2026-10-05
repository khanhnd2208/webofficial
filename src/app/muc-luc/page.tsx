import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { getMySpaceTiles } from '@/content/mySpace';
import { auth } from '@/lib/auth';
import TocDoors, { type TocSpaceItem } from './TocDoors';
import styles from './toc.module.css';

export const metadata: Metadata = {
	title: 'Mục lục',
	description: 'Tìm hiểu về Duy Khánh, rồi ghé My Space để học, dạy và chơi.',
	alternates: { canonical: absoluteUrl(routes.toc) },
};

const descriptions: Record<string, string> = {
	teaching: 'Một góc dành cho lớp học.',
	courses: 'Học thêm một điều mới.',
	'board-game': 'Cùng chơi, cùng khám phá.',
	admin: 'Quản lý không gian của bạn.',
};

// This page has its own illustration set; destination pages keep their own assets.
const tocIcons: Record<string, string> = {
	teaching: '/brand/toc/teaching-v1.webp',
	courses: '/brand/toc/courses-v1.webp',
	'board-game': '/brand/toc/board-game-v1.webp',
};

const about = {
	href: routes.about,
	label: 'Về tôi',
	description: 'Người thầy, và hành trình trở thành.',
	icon: '/brand/toc/about-v1.webp',
};

export default async function TocPage() {
	const session = await auth();
	const items: TocSpaceItem[] = getMySpaceTiles(session?.user?.role).flatMap((tile) => {
		const icon = tocIcons[tile.id] ?? (tile.visual.kind === 'image' ? tile.visual.src : null);
		if (!tile.href || !icon) return [];
		return [
			{
				id: tile.id,
				href: tile.href,
				label: tile.label,
				description: descriptions[tile.id] ?? '',
				icon,
				accentClass: tile.id === 'teaching' ? styles.teachingTile : undefined,
			},
		];
	});

	return (
		<main className={`personal-book ${styles.page}`} data-testid="gate-home">
			<Image
				src="/brand/toc-journey.webp"
				alt=""
				fill
				sizes="100vw"
				preload
				className={styles.landscape}
				aria-hidden="true"
			/>
			<div className={styles.content}>
				<header className={styles.header}>
					<p className={styles.eyebrow}>Nguyễn Duy Khánh · Mục lục</p>
					<h1>Bạn muốn ghé đâu?</h1>
					<p>Một chút về tôi. Một không gian để học và chơi.</p>
				</header>
				<TocDoors
					about={about}
					space={{
						href: routes.mySpace,
						label: 'My Space',
						description: `${items.length} góc nhỏ để học, dạy và chơi.`,
					}}
					items={items}
				/>
				<footer className={styles.footer}>
					<span>Chưa xong. Và vẫn đang tiếp tục.</span>
					<Link href={routes.contact}>Gửi lời nhắn ↗</Link>
				</footer>
			</div>
		</main>
	);
}
