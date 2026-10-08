import type { Metadata } from 'next';
import Image from 'next/image';

import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { auth } from '@/lib/auth';
import TocDoors, { buildTocItems } from './TocDoors';
import styles from './toc.module.css';

export const metadata: Metadata = {
	title: 'Mục lục',
	description: 'Một chút về Duy Khánh, và những khóa học.',
	alternates: { canonical: absoluteUrl(routes.toc) },
};

const about = {
	href: routes.about,
	label: 'Về tôi',
	description: 'Người thầy, và hành trình trở thành.',
	icon: '/brand/toc/about-v1.webp',
	eyebrow: 'About me',
};

export default async function TocPage() {
	const session = await auth();
	const items = buildTocItems(session?.user?.role);

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
					<p>Một chút về tôi. Và những khóa học.</p>
				</header>
				<TocDoors about={about} items={items} />
				<footer className={styles.footer}>
					<span>Chưa xong. Và vẫn đang tiếp tục.</span>
				</footer>
			</div>
		</main>
	);
}
