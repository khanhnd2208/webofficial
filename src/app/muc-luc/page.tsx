import type { Metadata } from 'next';
import Image from 'next/image';
import type { StaticImageData } from 'next/image';
import Link from 'next/link';

import aboutArt from '../../../public/brand/toc/about-v1.webp';
import boardGameArt from '../../../public/brand/toc/board-game-v1.webp';
import coursesArt from '../../../public/brand/toc/courses-v1.webp';
import teachingArt from '../../../public/brand/toc/teaching-v1.webp';
import journeyArt from '../../../public/brand/toc-journey.webp';
import adminArt from '../../../public/brand/myspace/admin-v3.webp';
import SharedArtwork from '@/components/site/SharedArtwork';
import RecentClasses from '@/components/site/RecentClasses';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { getMySpaceTiles } from '@/content/mySpace';
import { auth } from '@/lib/auth';
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

// Public destinations reuse these illustrations for shared element navigation.
const tocIcons: Record<string, StaticImageData> = {
	teaching: teachingArt,
	courses: coursesArt,
	'board-game': boardGameArt,
	admin: adminArt,
};

const aboutTiles = [
	{
		id: 'about',
		href: routes.about,
		label: 'Giới thiệu',
		description: 'Người thầy, và hành trình trở thành.',
		icon: aboutArt,
	},
] as const;

export default async function TocPage() {
	const session = await auth();
	const tiles = getMySpaceTiles(session?.user?.role);

	return (
		<main className={`personal-book ${styles.page}`} data-testid="gate-home">
			<Image
				src={journeyArt}
				alt=""
				fill
				placeholder="blur"
				sizes="100vw"
				preload
				className={styles.landscape}
				aria-hidden="true"
			/>
			<div className={styles.content}>
				<header className={styles.header}>
					<p className={styles.eyebrow}>Nguyễn Duy Khánh · Mục lục</p>
					<h1>Bạn muốn ghé đâu?</h1>
					<p className="text-body">Một chút về tôi. Một không gian để học và chơi.</p>
				</header>
				<nav aria-label="Giới thiệu và không gian học tập" className={styles.navigation}>
					<section className={styles.about} aria-labelledby="toc-about">
						<div className={styles.sectionLabel}>
							<h2 id="toc-about">Về tôi</h2>
							<span>Hành trình</span>
						</div>
						<div className={styles.tiles}>
							{aboutTiles.map((tile) => (
								<Link
									key={tile.id}
									href={tile.href}
									className={styles.tile}
									data-testid={`gate-item-${tile.id}`}
								>
									<SharedArtwork name={tile.id} className={styles.icon}>
										<Image
											src={tile.icon}
											alt=""
											width={112}
											height={112}
											placeholder="blur"
											sizes="(max-width: 760px) 88px, 112px"
										/>
									</SharedArtwork>
									<span className={styles.tileTitle}>
										{tile.label}
										<span className={styles.arrow} aria-hidden="true">
											↗
										</span>
									</span>
									<span className={styles.description}>{tile.description}</span>
								</Link>
							))}
						</div>
					</section>
					<section className={styles.space} aria-labelledby="toc-myspace">
						<div className={styles.sectionLabel}>
							<h2 id="toc-myspace">Không gian của tôi</h2>
							<span>Học · Dạy · Chơi</span>
						</div>
						<div className={styles.tiles}>
							{tiles.map((tile) => (
								<Link
									key={tile.id}
									href={tile.href!}
									className={`${styles.tile} ${tile.id === 'teaching' ? styles.teachingTile : ''}`}
									data-testid={`myspace-tile-${tile.id}`}
								>
									<SharedArtwork name={tile.id} className={styles.icon}>
										{tocIcons[tile.id] || tile.visual.kind === 'image' ? (
											<Image
												src={
													tocIcons[tile.id] ?? (tile.visual.kind === 'image' ? tile.visual.src : '')
												}
												alt=""
												width={112}
												height={112}
												placeholder="blur"
												sizes="(max-width: 760px) 88px, 112px"
											/>
										) : null}
									</SharedArtwork>
									<span className={styles.tileTitle}>
										{tile.label}
										<span className={styles.arrow} aria-hidden="true">
											↗
										</span>
									</span>
									<span className={styles.description}>{descriptions[tile.id]}</span>
								</Link>
							))}
						</div>
						<RecentClasses className="mt-5" />
					</section>
				</nav>
				<footer className={styles.footer}>
					<span>Chưa xong. Và vẫn đang tiếp tục.</span>
					<Link href={routes.contact}>Gửi lời nhắn ↗</Link>
				</footer>
			</div>
		</main>
	);
}
