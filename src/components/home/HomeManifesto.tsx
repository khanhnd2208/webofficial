import { homePageContent } from '@/content/home';

import HomeSectionHeading from './HomeSectionHeading';
import styles from './home.module.css';

export default function HomeManifesto() {
	const { manifesto, principles } = homePageContent;

	return (
		<section
			id="manifesto"
			className={`${styles.section} ${styles.manifesto}`}
			aria-labelledby="manifesto-title"
		>
			<svg
				className={styles.roadContinuation}
				viewBox="0 0 260 640"
				fill="none"
				aria-hidden="true"
				preserveAspectRatio="none"
			>
				<path
					pathLength="1"
					d="M136 0C148 68 92 104 118 168C142 227 199 249 178 319C158 386 73 398 89 480C101 542 160 557 150 640"
				/>
			</svg>

			<div className={`shell ${styles.manifestoInner}`}>
				<div className={styles.manifestoLead}>
					<HomeSectionHeading
						eyebrow={manifesto.eyebrow}
						title={manifesto.title}
						id="manifesto-title"
					/>
					<div className={styles.manifestoCopy}>
						{manifesto.paragraphs.map((paragraph) => (
							<p key={paragraph}>{paragraph}</p>
						))}
					</div>
				</div>

				<blockquote className={styles.brandQuote}>
					<span>{manifesto.quote[0]}</span>
					<span>{manifesto.quote[1]}</span>
				</blockquote>

				<ol className={styles.editorialList}>
					{principles.map((principle, index) => (
						<li key={principle.id} className={styles.editorialRow}>
							<p className={styles.rowNumber}>{String(index + 1).padStart(2, '0')}</p>
							<h3>{principle.title}</h3>
							<p>{principle.description}</p>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}
