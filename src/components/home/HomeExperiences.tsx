import Link from 'next/link';

import { homePageContent } from '@/content/home';

import HomeSectionHeading from './HomeSectionHeading';
import styles from './home.module.css';

export default function HomeExperiences() {
	const { experiences } = homePageContent;

	return (
		<section
			id="learning-experiences"
			className={`${styles.section} ${styles.experiences}`}
			aria-labelledby="experiences-title"
		>
			<div className="shell">
				<HomeSectionHeading
					eyebrow={experiences.eyebrow}
					title={experiences.title}
					description={experiences.introduction}
					id="experiences-title"
				/>

				<ol className={styles.editorialList}>
					{experiences.items.map((experience, index) => (
						<li key={experience.id} className={styles.experienceRow}>
							<p className={styles.rowNumber}>{String(index + 1).padStart(2, '0')}</p>
							<div className={styles.experienceTitle}>
								<h3>{experience.title}</h3>
							</div>
							<div className={styles.experienceBody}>
								<p>{experience.description}</p>
								<Link
									href={experience.href}
									className={styles.textLink}
									data-umami-event="home_learning_experience_click"
									data-umami-event-slug={experience.id}
									data-umami-event-source-page="/"
								>
									<span>{experience.cta}</span>
									<span className={styles.arrow} aria-hidden>
										→
									</span>
								</Link>
							</div>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}
