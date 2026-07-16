import Link from 'next/link';
import { preload } from 'react-dom';

import { routes } from '@/config/routes';
import { homePageContent } from '@/content/home';

import styles from './home.module.css';

const heroImageAlt = 'Minh họa Duy Khánh trên hành trình học hỏi và giảng dạy';

export default function HomeHero() {
	const { hero } = homePageContent;
	preload('/brand/learning-as-becoming-mobile-480.webp', {
		as: 'image',
		type: 'image/webp',
		media: '(max-width: 479px)',
		fetchPriority: 'high',
	});
	preload('/brand/learning-as-becoming-mobile.avif', {
		as: 'image',
		type: 'image/avif',
		media: '(min-width: 480px) and (max-width: 767px)',
		fetchPriority: 'high',
	});
	preload('/brand/learning-as-becoming-tablet.avif', {
		as: 'image',
		type: 'image/avif',
		media: '(min-width: 768px) and (max-width: 1023px)',
		fetchPriority: 'high',
	});
	preload('/brand/learning-as-becoming-desktop.avif', {
		as: 'image',
		type: 'image/avif',
		media: '(min-width: 1024px)',
		fetchPriority: 'high',
	});

	return (
		<section className={styles.hero} aria-labelledby="home-hero-title">
			<div className={`shell ${styles.heroInner}`}>
				<div className={styles.heroCopy}>
					<div className={styles.heroHeadingPanel}>
						<p className={`${styles.eyebrow} ${styles.heroEyebrow}`}>{hero.eyebrow}</p>
						<h1 id="home-hero-title" className={styles.heroTitle}>
							<span>{hero.headline[0]}</span> <span>{hero.headline[1]}</span>
						</h1>
					</div>
					<div className={styles.heroBodyPanel}>
						<p className={styles.heroDescription}>{hero.description}</p>
						<div className={styles.heroActions}>
							<Link
								href={hero.primaryCta.href}
								className={styles.primaryButton}
								data-umami-event="home_about_click"
								data-umami-event-source-page="/"
							>
								<span>{hero.primaryCta.label}</span>
								<span className={styles.arrow} aria-hidden>
									→
								</span>
							</Link>
							<Link
								href={routes.posts}
								className={styles.textLink}
								data-umami-event="home_hero_writing_click"
								data-umami-event-source-page="/hero"
							>
								<span>{hero.articleCtaLabel}</span>
								<span className={styles.arrow} aria-hidden>
									→
								</span>
							</Link>
						</div>
					</div>
				</div>

				<div className={styles.heroArtwork}>
					<picture>
						<source
							media="(min-width: 1024px)"
							type="image/avif"
							srcSet="/brand/learning-as-becoming-desktop.avif"
						/>
						<source
							media="(min-width: 1024px)"
							type="image/webp"
							srcSet="/brand/learning-as-becoming-desktop.webp"
						/>
						<source
							media="(min-width: 1024px)"
							type="image/jpeg"
							srcSet="/brand/learning-as-becoming-desktop.jpg"
						/>
						<source
							media="(min-width: 768px) and (max-width: 1023px)"
							type="image/avif"
							srcSet="/brand/learning-as-becoming-tablet.avif"
						/>
						<source
							media="(min-width: 768px) and (max-width: 1023px)"
							type="image/webp"
							srcSet="/brand/learning-as-becoming-tablet.webp"
						/>
						<source
							media="(min-width: 768px) and (max-width: 1023px)"
							type="image/jpeg"
							srcSet="/brand/learning-as-becoming-tablet.jpg"
						/>
						<source
							media="(min-width: 480px) and (max-width: 767px)"
							type="image/avif"
							srcSet="/brand/learning-as-becoming-mobile.avif"
						/>
						<source
							media="(min-width: 480px) and (max-width: 767px)"
							type="image/webp"
							srcSet="/brand/learning-as-becoming-mobile.webp"
						/>
						<source
							media="(min-width: 480px) and (max-width: 767px)"
							type="image/jpeg"
							srcSet="/brand/learning-as-becoming-mobile.jpg"
						/>
						<source
							media="(max-width: 479px)"
							type="image/webp"
							srcSet="/brand/learning-as-becoming-mobile-480.webp"
						/>
						<source
							media="(max-width: 479px)"
							type="image/avif"
							srcSet="/brand/learning-as-becoming-mobile-480.avif"
						/>
						<img
							src="/brand/learning-as-becoming-mobile-480.jpg"
							alt={heroImageAlt}
							width={480}
							height={600}
							loading="eager"
							fetchPriority="high"
							decoding="sync"
						/>
					</picture>
				</div>

				<p className={styles.mobileCycle}>{hero.learningCycle}</p>
			</div>
		</section>
	);
}
