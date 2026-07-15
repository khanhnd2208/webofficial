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

				<ul className={styles.editorialList}>
					{principles.map((principle) => (
						<li key={principle.id} className={styles.editorialRow}>
							<h3>{principle.title}</h3>
							<p>{principle.description}</p>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
