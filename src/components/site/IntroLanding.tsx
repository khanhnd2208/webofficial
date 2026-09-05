import Link from 'next/link';
import IntroParallaxImage from './IntroParallaxImage';
import SiteAuthChip from './SiteAuthChip';
import { routes } from '@/config/routes';
import { introPage } from '@/content/publicMarketing';

export default function IntroLanding() {
	return (
		<div className="personal-book book-cover" data-testid="intro-home">
			<header className="cover-meta">
				<span>
					{introPage.location} · {introPage.year}
				</span>
				<SiteAuthChip variant="intro" />
			</header>
			<main className="cover-composition">
				<div className="cover-copy">
					<p className="book-caption cover-author">Nguyễn Duy Khánh</p>
					<h1 className="cover-title">{introPage.headline}</h1>
					<p className="cover-pos">{introPage.partOfSpeech}</p>
					<div className="cover-narrative">
						{introPage.lines.map((line) => (
							<p key={line}>{line}</p>
						))}
					</div>
					<Link className="book-link cover-cta" href={routes.toc} data-testid="intro-open-toc">
						{introPage.cta}
						<span aria-hidden="true">→</span>
					</Link>
				</div>
				<Link
					className="cover-art"
					href={routes.toc}
					aria-label={introPage.cta}
					data-testid="intro-image-toc"
				>
					<IntroParallaxImage
						src={introPage.desktopImage.src}
						mobileSrc={introPage.mobileImage.src}
						alt=""
						sizes="(min-width: 1024px) 60vw, 280px"
					/>
				</Link>
			</main>
		</div>
	);
}
