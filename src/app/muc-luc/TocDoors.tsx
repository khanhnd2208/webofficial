import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { routes } from '@/config/routes';
import styles from './toc.module.css';

export interface TocDoor {
	id: string;
	index: string;
	href: string;
	label: string;
	description: ReactNode;
	scope: string;
	icon: string;
}

/** The same two doors for every visitor; admin workspaces live in the account menu. */
export const TOC_DOORS: TocDoor[] = [
	{
		id: 'about',
		index: '01',
		href: routes.contact,
		label: 'Về tôi',
		description: 'Tôi là ai, và cách liên hệ.',
		scope: 'Giới thiệu · Hợp tác · Gửi lời nhắn',
		icon: '/brand/toc/about-v1.webp',
	},
	{
		id: 'learning',
		index: '02',
		href: routes.learnCourses,
		label: 'Học tập',
		description: 'Khóa học tự học và trang lớp của bạn.',
		scope: 'Khóa học · Trang lớp · Ôn tập',
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
			<span className={styles.doorIndex} aria-hidden="true">
				{item.index}
			</span>
			<span className={styles.doorText}>
				<span className={styles.doorTitle}>{item.label}</span>
				<span className={styles.doorDescription}>{item.description}</span>
				<span className={styles.doorScope}>{item.scope}</span>
			</span>
			<span className={styles.doorIcon} aria-hidden="true">
				<Image
					src={item.icon}
					alt=""
					width={72}
					height={72}
					sizes="(max-width: 640px) 52px, 72px"
					loading="eager"
				/>
			</span>
			<span className={styles.doorCue}>
				<Arrow external={/^https?:/.test(item.href)} />
			</span>
		</Link>
	);
}

/** Every Mục lục door at once: Về tôi (01), then Học tập (02). */
export default function TocDoors({ doors = TOC_DOORS }: { doors?: TocDoor[] }) {
	return (
		<nav aria-label="Mục lục" className={styles.navigation}>
			{doors.map((door) => (
				<Door key={door.id} item={door} testId={`gate-item-${door.id}`} />
			))}
		</nav>
	);
}
