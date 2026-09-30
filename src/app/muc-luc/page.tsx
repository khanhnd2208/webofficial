import type { Metadata } from 'next';
import { TeachingMark } from '@/components/site/TeachingMark';
import Image from 'next/image';
import Link from 'next/link';

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

// This page has its own illustration set; destination pages keep their own assets.
const tocIcons: Record<string, string> = {
	courses: '/brand/toc/courses-v1.webp',
	'board-game': '/brand/toc/board-game-v1.webp',
};

const aboutTiles = [
	{
		id: 'about',
		href: routes.about,
		label: 'Giới thiệu',
		description: 'Người thầy, và hành trình trở thành.',
		icon: '/brand/toc/about-v1.webp',
	},
] as const;

export default async function TocPage() {
	const session = await auth();
	const tiles = getMySpaceTiles(session?.user?.role);

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
				<nav aria-label="About Me và My Space" className={styles.navigation}>
					<section className={styles.about} aria-labelledby="toc-about">
						<div className={styles.sectionLabel}>
							<h2 id="toc-about">About Me</h2>
							<span>Về tôi</span>
						</div>
						<div className={styles.tiles}>
							{aboutTiles.map((tile) => (
								<Link
									key={tile.id}
									href={tile.href}
									className={styles.tile}
									data-testid={`gate-item-${tile.id}`}
								>
									<span className={styles.icon}>
										<Image
											src={tile.icon}
											alt=""
											width={112}
											height={112}
											sizes="(max-width: 760px) 88px, 112px"
										/>
									</span>
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
							<h2 id="toc-myspace">My Space</h2>
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
									<span className={styles.icon}>
										{tile.id === 'teaching' ? (
											<TeachingMark className={styles.teachingMark} />
										) : tile.visual.kind === 'image' ? (
											<Image
												src={tocIcons[tile.id] ?? tile.visual.src}
												alt=""
												width={112}
												height={112}
												sizes="(max-width: 760px) 88px, 112px"
											/>
										) : null}
									</span>
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
