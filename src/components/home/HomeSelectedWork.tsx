import Link from 'next/link';

import { homePageContent, type HomeSelectedWork as SelectedWork } from '@/content/home';

import HomeSectionHeading from './HomeSectionHeading';
import styles from './home.module.css';

function ProjectMark({ type }: { type: SelectedWork['resource']['type'] }) {
	if (type === 'boardgame') {
		return (
			<svg viewBox="0 0 140 92" fill="none" aria-hidden="true">
				<path d="M12 69C31 59 45 44 62 46C83 49 85 26 108 24C120 23 127 29 132 38" />
				<circle cx="27" cy="62" r="8" />
				<circle cx="69" cy="44" r="8" />
				<circle cx="114" cy="25" r="8" />
				<path d="m24 62 3 3 5-7M66 44l3 3 5-7M111 25l3 3 5-7" />
			</svg>
		);
	}

	return (
		<svg viewBox="0 0 140 92" fill="none" aria-hidden="true">
			<path d="M22 13h83l13 13v54H22z" />
			<path d="M105 13v14h13M37 35h49M37 50h66M37 65h40" />
			<circle cx="101" cy="65" r="10" />
			<path d="m96 65 4 4 7-9" />
		</svg>
	);
}

export default function HomeSelectedWork({ works }: { works: SelectedWork[] }) {
	if (works.length === 0) return null;
	const { selectedWork } = homePageContent;

	return (
		<section
			className={`${styles.section} ${styles.selectedWork}`}
			aria-labelledby="selected-work-title"
		>
			<div className="shell">
				<HomeSectionHeading
					eyebrow={selectedWork.eyebrow}
					title={selectedWork.title}
					description={selectedWork.introduction}
					id="selected-work-title"
				/>

				<ol className={styles.projectList}>
					{works.map((work, index) => (
						<li key={work.resource.slug}>
							<Link
								href={work.href}
								className={styles.projectRow}
								data-umami-event="home_project_click"
								data-umami-event-slug={work.resource.slug}
								data-umami-event-source-page="/"
							>
								<p className={styles.projectNumber}>{String(index + 1).padStart(2, '0')}</p>
								<div className={styles.projectContent}>
									<h3>{work.resource.title}</h3>
									<p>{work.description}</p>
									<ul aria-label="Chủ đề dự án">
										{work.labels.map((label) => (
											<li key={label}>{label}</li>
										))}
									</ul>
								</div>
								<div className={styles.projectMark}>
									<ProjectMark type={work.resource.type} />
								</div>
								<span className={styles.projectArrow} aria-hidden>
									→
								</span>
							</Link>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}
