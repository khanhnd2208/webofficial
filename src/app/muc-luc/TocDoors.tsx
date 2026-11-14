import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { routes } from '@/config/routes';
import styles from './toc.module.css';

export interface TocDoor {
	id: string;
	href: string;
	label: string;
	description: ReactNode;
	icon: string;
}

/** The same two doors for every visitor; admin workspaces live in the account menu. */
export const TOC_DOORS: TocDoor[] = [
	{
		id: 'about',
		href: routes.contact,
		label: 'Về tôi',
		description: 'Tôi là ai, và cách liên hệ.',
		icon: '/brand/toc/about-v1.webp',
	},
	{
		id: 'learning',
		href: routes.learnCourses,
		label: 'Học tập',
		description: 'Khóa học tự học và trang lớp của bạn.',
		icon: '/brand/toc/courses-v1.webp',
	},
];

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

/** Every Mục lục door at once: Về tôi, then Học tập. */
export default function TocDoors({ doors = TOC_DOORS }: { doors?: TocDoor[] }) {
	return (
		<nav aria-label="Mục lục" className={styles.navigation}>
			{doors.map((door) => (
				<Door key={door.id} item={door} testId={`gate-item-${door.id}`} />
			))}
		</nav>
	);
}
