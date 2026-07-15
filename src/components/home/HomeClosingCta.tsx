import Link from 'next/link';

import { homePageContent } from '@/content/home';

import styles from './home.module.css';

export default function HomeClosingCta() {
	const { closing } = homePageContent;

	return (
		<section className={`${styles.section} ${styles.closing}`} aria-labelledby="closing-title">
			<svg className={styles.closingRoad} viewBox="0 0 960 220" fill="none" aria-hidden="true">
				<path d="M55 206C147 128 241 190 320 124C392 64 474 147 547 83C612 25 704 96 789 44C831 18 870 20 910 31" />
				<path d="M69 212C154 149 239 204 332 139C403 89 483 163 558 103C628 46 710 117 799 62C838 38 872 38 919 48" />
			</svg>

			<div className={`shell ${styles.closingInner}`}>
				<blockquote className={styles.closingQuote}>
					<span>{closing.quote[0]}</span>
					<span>{closing.quote[1]}</span>
				</blockquote>
				<h2 id="closing-title">{closing.title}</h2>
				<div className={styles.closingCopy}>
					{closing.paragraphs.map((paragraph) => (
						<p key={paragraph}>{paragraph}</p>
					))}
				</div>
				<div className={styles.closingActions}>
					<Link
						href={closing.primaryCta.href}
						className={styles.primaryButton}
						data-umami-event="home_closing_connect_click"
						data-umami-event-source-page="/"
					>
						<span>{closing.primaryCta.label}</span>
						<span className={styles.arrow} aria-hidden>
							→
						</span>
					</Link>
					<Link href={closing.secondaryCta.href} className={styles.textLink}>
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
