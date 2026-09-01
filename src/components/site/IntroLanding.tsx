import Image from 'next/image';
import Link from 'next/link';

import IntroParallaxImage from '@/components/site/IntroParallaxImage';
import SiteAuthChip from '@/components/site/SiteAuthChip';
import { routes } from '@/config/routes';
import { introPage } from '@/content/publicMarketing';

function LocationPin({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10Z" />
			<circle cx="12" cy="11" r="2.25" />
		</svg>
	);
}

function ArrowForward({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M5 12h14" />
			<path d="m13 6 6 6-6 6" />
		</svg>
	);
}

/**
 * Entry cover before the mục lục gate.
 * Mobile: centered portrait + type cluster + bottom CTA.
 * Desktop: editorial split — wordmark left, journey image right.
 * Choreography is CSS-first so SSR / no-JS still reads cleanly.
 */
export default function IntroLanding() {
	const narrative = introPage.lines.join(' ');
	const [firstLine, ...restLines] = introPage.lines;

	return (
		<div
			className="relative flex min-h-svh flex-col overflow-hidden bg-paper text-ink selection:bg-ink selection:text-paper"
			data-testid="intro-home"
		>
			{/* ─── Mobile composition ───────────────────────────────────────── */}
			<div className="flex flex-1 flex-col lg:hidden">
				<header className="relative z-20 flex items-center justify-between px-6 pt-[max(2rem,env(safe-area-inset-top))]">
					<div className="intro-reveal-meta flex items-center gap-1.5 text-ink-secondary">
						<LocationPin className="opacity-70" />
						<span className="font-mono text-[0.8125rem] tracking-[0.18em] uppercase">
							{introPage.locationLatin}, {introPage.year}
						</span>
					</div>
					<SiteAuthChip variant="introMobile" className="intro-reveal-meta" />
				</header>

				<main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-8 pb-28">
					<Link
						href={routes.toc}
						aria-label={introPage.cta}
						data-testid="intro-image-toc"
						className="intro-image-fade relative mb-10 aspect-[4/5] w-full max-w-[280px] border border-hairline bg-canvas/50 p-2 transition-opacity hover:opacity-90 focus-visible:opacity-90 focus-visible:outline-none"
					>
						<Image
							src={introPage.mobileImage.src}
							alt=""
							fill
							priority
							sizes="280px"
							className="intro-image-portrait object-cover object-[center_20%]"
						/>
						<span
							className="pointer-events-none absolute top-0 left-0 -mt-1 -ml-1 h-2 w-2 border-t border-l border-ink/30"
							aria-hidden="true"
						/>
						<span
							className="pointer-events-none absolute top-0 right-0 -mt-1 -mr-1 h-2 w-2 border-t border-r border-ink/30"
							aria-hidden="true"
						/>
						<span
							className="pointer-events-none absolute bottom-0 left-0 -mb-1 -ml-1 h-2 w-2 border-b border-l border-ink/30"
							aria-hidden="true"
						/>
						<span
							className="pointer-events-none absolute right-0 bottom-0 -mr-1 -mb-1 h-2 w-2 border-r border-b border-ink/30"
							aria-hidden="true"
						/>
					</Link>

					<div className="flex max-w-[20rem] flex-col items-center space-y-6 text-center">
						<h1 className="font-display text-[2.5rem] leading-none font-medium tracking-tight text-ink">
							<span className="intro-mask">
								<span className="intro-mask-inner">
									{introPage.headline}.
								</span>
							</span>
						</h1>
						<div className="intro-reveal-up intro-reveal-delay-1 flex flex-col items-center space-y-4">
							<span className="pb-1 font-mono text-[0.8125rem] tracking-[0.18em] text-sunlight uppercase">
								{introPage.partOfSpeech}
								<span className="intro-pos-underline mt-1 text-sunlight" aria-hidden />
							</span>
							<p className="text-[1.125rem] leading-relaxed text-ink-secondary">
								{narrative}
								<span className="intro-ink-cursor" aria-hidden />
							</p>
						</div>
					</div>
				</main>

				<footer className="intro-reveal-up intro-reveal-delay-3 pointer-events-none fixed inset-x-0 bottom-0 z-20 flex items-center justify-between bg-linear-to-t from-paper via-paper/90 to-transparent px-6 pt-10 pb-[max(2rem,env(safe-area-inset-bottom))]">
					<span className="font-mono text-[0.8125rem] tracking-[0.18em] text-ink-secondary/50">
						{introPage.year}
					</span>
					<Link
						href={routes.toc}
						className="pointer-events-auto group inline-flex min-h-11 items-center gap-3 border border-ink px-6 py-3 transition-[colors,gap] duration-300 hover:gap-4 hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper focus-visible:outline-none"
						data-testid="intro-open-toc"
					>
						<span className="font-mono text-[0.75rem] font-semibold tracking-[0.16em] uppercase">
							{introPage.cta}
						</span>
						<ArrowForward className="transition-transform duration-300 group-hover:translate-x-1.5" />
					</Link>
				</footer>
			</div>

			{/* ─── Desktop composition ──────────────────────────────────────── */}
			<div className="relative hidden min-h-svh flex-col lg:flex">
				<span className="intro-reveal-meta absolute top-8 left-8 z-30 font-display text-sm tracking-[0.2em] text-ink/70 uppercase">
					{introPage.location}
				</span>
				<div className="intro-reveal-meta absolute top-8 right-8 z-30 flex items-center gap-8">
					<SiteAuthChip variant="intro" />
					<span className="font-display text-sm tracking-[0.2em] text-ink/70">{introPage.year}</span>
				</div>

				<main className="relative flex flex-1 items-center justify-center p-8 lg:p-16">
					<div className="relative z-20 grid w-full max-w-5xl grid-cols-12 items-center gap-8">
						<div className="relative z-30 col-span-5">
							<h1 className="font-display relative mb-2 text-[clamp(4.5rem,9vw,8rem)] leading-none font-bold tracking-tight text-ink">
								<span className="intro-mask">
									<span className="intro-mask-inner">{introPage.headline}</span>
								</span>
							</h1>
							<p className="intro-reveal-up intro-reveal-delay-1 mb-8 pl-2 font-display text-xl italic text-ink/80 lg:text-2xl">
								{introPage.partOfSpeech}
								<span className="intro-pos-underline mt-2 max-w-[6rem] text-ink/40" aria-hidden />
							</p>
							<div className="intro-reveal-up intro-reveal-delay-2 max-w-sm space-y-1 pl-2 font-display text-xl leading-relaxed text-ink lg:text-2xl">
								<p>
									{firstLine}
									<span className="intro-ink-cursor" aria-hidden />
								</p>
								{restLines.map((line) => (
									<p key={line}>{line}</p>
								))}
							</div>
						</div>

						<Link
							href={routes.toc}
							aria-label={introPage.cta}
							data-testid="intro-image-toc"
							className="intro-image-fade relative z-10 col-span-7 -ml-24 h-[min(80vh,52rem)] cursor-pointer overflow-hidden shadow-[0_25px_50px_-12px_rgb(23_23_23/0.25)] transition-opacity hover:opacity-95 focus-visible:opacity-95 focus-visible:outline-none"
						>
							<IntroParallaxImage
								src={introPage.desktopImage.src}
								alt=""
								sizes="(min-width: 1024px) 55vw, 100vw"
							/>
						</Link>
					</div>
				</main>

				<footer className="intro-reveal-up intro-reveal-delay-3 absolute right-8 bottom-8 z-30">
					<Link
						href={routes.toc}
						className="group inline-flex items-center gap-2 font-display text-lg font-medium text-ink transition-opacity hover:opacity-70 focus-visible:opacity-70 focus-visible:outline-none lg:text-xl"
						data-testid="intro-open-toc"
					>
						<span className="border-b border-ink pb-0.5">{introPage.cta}</span>
						<span
							className="inline-block transition-transform duration-300 group-hover:translate-x-1.5"
							aria-hidden="true"
						>
							→
						</span>
					</Link>
				</footer>
			</div>
		</div>
	);
}
