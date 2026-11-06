import Link from 'next/link';

import { routes } from '@/config/routes';
import { UNRELEASED_CLOSED_MESSAGE } from '@/features/unreleased-quiz/availability';

import styles from './unreleased.module.css';

export function UnreleasedClosedNotice() {
	return (
		<div className={styles.root}>
			<header className={styles.topbar}>
				<div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
					<Link href={routes.home} className={styles.brand}>
						HANU CAREER READY
					</Link>
					<span className={styles.chip}>UNRELEASED</span>
				</div>
			</header>

			<main className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-6xl items-center px-4 py-16 sm:px-6">
				<div className="max-w-3xl">
					<p className={styles.label}>UNRELEASED / Hẹn gặp lại</p>
					<h1 className={`${styles.display} mt-5 text-[2.75rem] sm:text-6xl lg:text-[4.5rem]`}>
						{UNRELEASED_CLOSED_MESSAGE}
					</h1>
					<p className={`${styles.muted} mt-7 max-w-xl text-[1.05rem] leading-[1.75]`}>
						Workshop UNRELEASED đã khép lại. Cảm ơn mọi người đã tham gia và đồng hành cùng mình!
					</p>
					<Link href={routes.home} className={`${styles.cta} mt-9`}>
						Về trang chủ <span aria-hidden="true">→</span>
					</Link>
				</div>
			</main>
		</div>
	);
}
