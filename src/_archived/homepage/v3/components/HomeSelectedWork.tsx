import Link from 'next/link';

import { homePageContent, type HomeSelectedWork as SelectedWork } from '@/content/home';
import styles from './home.module.css';

export default function HomeSelectedWork({ works }: { works: SelectedWork[] }) {
	if (works.length === 0) return null;
	const { selectedWork } = homePageContent;
	const cards = works.slice(0, 2).map((work, index) => ({
		...work,
		image: ['/brand/hero-landscape.jpg', '/brand/hero-journey.jpg'][index],
	}));
	cards.push({
		resource: { slug: 'writing', title: 'Những ghi chép đang mở', type: 'guide' } as SelectedWork['resource'],
		href: '/bai-viet',
		description: 'Những câu hỏi từ lớp học, công việc và đời sống được viết lại cho rõ hơn.',
		labels: ['Bài viết', 'Nghiên cứu', 'Quan sát'],
		image: '/brand/hero-figure.jpg',
	});

	return (
		<section
			className={`${styles.section} ${styles.selectedWork}`}
			id="selected-work"
			aria-labelledby="selected-work-title"
		>
			<div className="shell">
				<div className={styles.sectionIntro}>
					<p className={styles.eyebrow}>{selectedWork.eyebrow}</p>
					<h2 id="selected-work-title">{selectedWork.title}</h2>
					<p>{selectedWork.introduction}</p>
				</div>

				<div className={styles.projectGrid}>
					{cards.map((work, index) => (
							<Link
								key={work.resource.slug}
								href={work.href}
								className={`${styles.projectCard} ${index === 1 ? styles.projectCardOffset : ''}`}
								data-umami-event="home_project_click"
								data-umami-event-slug={work.resource.slug}
								data-umami-event-source-page="/"
							>
								<div className={styles.projectImage}><img src={work.image} alt="" /></div>
								<p className={styles.projectNumber}>{String(index + 1).padStart(2, '0')}</p>
								<h3>{work.resource.title}</h3>
								<p className={styles.projectMeta}>{work.labels.join(' · ')}</p>
							</Link>
					))}
				</div>
				<Link href="/goc-cua-khanh" className={styles.exploreLink}>Xem toàn bộ dự án <span aria-hidden>→</span></Link>
			</div>
		</section>
	);
}
