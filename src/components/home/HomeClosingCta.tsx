import Link from 'next/link';

import { homePageContent } from '@/content/home';

import styles from './home.module.css';

export default function HomeClosingCta() {
	const { closing } = homePageContent;

	return (
		<section className={`${styles.section} ${styles.closing}`} aria-labelledby="closing-title">
			<div className={`shell ${styles.closingInner}`}>
				<h2 id="closing-title">{closing.title}</h2>
				<div className={styles.closingCopy}>
					{closing.paragraphs.map((paragraph) => (
						<p key={paragraph}>{paragraph}</p>
					))}
				</div>
				<div className={styles.closingActions}>
					<Link
						href={closing.primaryCta.href}
						className={styles.textLink}
						data-umami-event="home_closing_writing_click"
						data-umami-event-source-page="/"
					>
						<span>{closing.primaryCta.label}</span>
						<span className={styles.arrow} aria-hidden>
							→
						</span>
					</Link>
					<Link
						href={closing.secondaryCta.href}
						className={styles.textLink}
						data-umami-event="home_closing_message_click"
					>
						<span>{closing.secondaryCta.label}</span>
						<span className={styles.arrow} aria-hidden>
							→
						</span>
					</Link>
				</div>
			</div>
		</section>
	);
}
