'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type PointerEvent as ReactPointerEvent,
} from 'react';

import { routes } from '@/config/routes';
import { trackEvent } from '@/lib/analytics';
import type { Project } from '../data/projects';

function formatIndex(index: number): string {
	return String(index + 1).padStart(2, '0');
}

const DRAG_THRESHOLD_PX = 6;

export default function ProjectList({ projects }: { projects: Project[] }) {
	const scrollerRef = useRef<HTMLUListElement>(null);
	const dragRef = useRef({
		active: false,
		moved: false,
		startX: 0,
		startScroll: 0,
		pointerId: -1,
	});
	const [dragging, setDragging] = useState(false);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);
	const [progress, setProgress] = useState(0);

	const updateScrollState = useCallback(() => {
		const el = scrollerRef.current;
		if (!el) return;
		const max = Math.max(0, el.scrollWidth - el.clientWidth);
		setCanScrollLeft(el.scrollLeft > 2);
		setCanScrollRight(el.scrollLeft < max - 2);
		setProgress(max > 0 ? el.scrollLeft / max : 0);
	}, []);

	useEffect(() => {
		const el = scrollerRef.current;
		if (!el) return;
		updateScrollState();
		el.addEventListener('scroll', updateScrollState, { passive: true });
		const ro = new ResizeObserver(updateScrollState);
		ro.observe(el);
		return () => {
			el.removeEventListener('scroll', updateScrollState);
			ro.disconnect();
		};
	}, [projects.length, updateScrollState]);

	const endDrag = useCallback((el: HTMLUListElement, pointerId: number) => {
		const drag = dragRef.current;
		if (!drag.active || drag.pointerId !== pointerId) return;
		drag.active = false;
		drag.pointerId = -1;
		setDragging(false);
		try {
			el.releasePointerCapture(pointerId);
		} catch {
			/* already released */
		}
		// Keep `moved` briefly so the click that follows a drag is ignored.
		window.setTimeout(() => {
			drag.moved = false;
		}, 0);
	}, []);

	const onPointerDown = (event: ReactPointerEvent<HTMLUListElement>) => {
		if (event.pointerType !== 'mouse' || event.button !== 0) return;
		const el = scrollerRef.current;
		if (!el) return;
		dragRef.current = {
			active: true,
			moved: false,
			startX: event.clientX,
			startScroll: el.scrollLeft,
			pointerId: event.pointerId,
		};
		el.setPointerCapture(event.pointerId);
		setDragging(true);
	};

	const onPointerMove = (event: ReactPointerEvent<HTMLUListElement>) => {
		const drag = dragRef.current;
		const el = scrollerRef.current;
		if (!drag.active || !el || drag.pointerId !== event.pointerId) return;
		const delta = event.clientX - drag.startX;
		if (Math.abs(delta) > DRAG_THRESHOLD_PX) drag.moved = true;
		el.scrollLeft = drag.startScroll - delta;
	};

	const onPointerUp = (event: ReactPointerEvent<HTMLUListElement>) => {
		const el = scrollerRef.current;
		if (!el) return;
		endDrag(el, event.pointerId);
	};

	const scrollByPage = (direction: -1 | 1) => {
		const el = scrollerRef.current;
		if (!el) return;
		const amount = Math.round(el.clientWidth * 0.72) * direction;
		el.scrollBy({ left: amount, behavior: 'smooth' });
	};

	const scrollable = canScrollLeft || canScrollRight;

	return (
		<div className="project-index relative">
			<div className="shell mb-4 flex items-center justify-between gap-4">
				<p className="font-mono text-[0.75rem] tracking-[0.08em] text-ink-secondary">
					{formatIndex(0)} — {formatIndex(projects.length - 1)}
					<span className="mx-2 text-hairline" aria-hidden>
						/
					</span>
					{projects.length} dự án
				</p>
				{scrollable ? (
					<div className="flex items-center gap-3">
						<p className="hidden font-mono text-[0.75rem] tracking-[0.06em] text-ink-secondary sm:block">
							Kéo để xem thêm
						</p>
						<div className="flex gap-1">
							<button
								type="button"
								aria-label="Xem dự án trước"
								disabled={!canScrollLeft}
								onClick={() => scrollByPage(-1)}
								className="inline-flex h-9 w-9 items-center justify-center border border-hairline text-ink transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-30"
							>
								←
							</button>
							<button
								type="button"
								aria-label="Xem dự án tiếp"
								disabled={!canScrollRight}
								onClick={() => scrollByPage(1)}
								className="inline-flex h-9 w-9 items-center justify-center border border-hairline text-ink transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-30"
							>
								→
							</button>
						</div>
					</div>
				) : null}
			</div>

			<div className="relative border-y border-hairline">
				{canScrollLeft ? (
					<div
						aria-hidden
						className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-linear-to-r from-canvas to-transparent md:w-16"
					/>
				) : null}
				{canScrollRight ? (
					<div
						aria-hidden
						className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-canvas to-transparent md:w-16"
					/>
				) : null}

				<ul
					ref={scrollerRef}
					className={`project-index-scroller flex min-h-[min(72vh,44rem)] touch-pan-x ${
						dragging ? 'is-dragging' : ''
					}`}
					onPointerDown={onPointerDown}
					onPointerMove={onPointerMove}
					onPointerUp={onPointerUp}
					onPointerCancel={onPointerUp}
					tabIndex={scrollable ? 0 : undefined}
					aria-label="Danh sách dự án, kéo ngang để xem thêm"
					onKeyDown={(event) => {
						if (event.key === 'ArrowRight') {
							event.preventDefault();
							scrollByPage(1);
						} else if (event.key === 'ArrowLeft') {
							event.preventDefault();
							scrollByPage(-1);
						}
					}}
				>
					{projects.map((project, index) => (
						<li
							key={project.slug}
							className="project-index-col project-col-enter relative shrink-0 border-r border-hairline last:border-r-0"
							style={{ animationDelay: `${0.08 + index * 0.07}s` }}
						>
							<Link
								href={routes.project(project.slug)}
								draggable={false}
								onClick={(event) => {
									if (dragRef.current.moved) {
										event.preventDefault();
										return;
									}
									trackEvent('case_study_view', {
										slug: project.slug,
										sourcePage: routes.projects,
									});
								}}
								className="project-col group flex h-full flex-col justify-between gap-8 p-6 transition-colors duration-[400ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:bg-paper md:p-8"
								data-testid={`project-list-item-${project.slug}`}
							>
								<div>
									<span className="project-number mb-8 block font-display text-[clamp(2rem,3.2vw,3.25rem)] font-medium leading-[1.2] text-ink/18 transition-colors duration-500 group-hover:text-accent md:mb-12">
										{formatIndex(index)}
									</span>
									<h2 className="font-display text-[clamp(1.25rem,1.5vw,1.75rem)] font-medium leading-tight tracking-[-0.02em] text-ink transition-colors duration-300 group-hover:text-accent">
										{project.title}
									</h2>
									<p className="mt-2 text-[0.75rem] font-semibold tracking-[0.04em] text-ink-secondary">
										{project.role}
									</p>
								</div>

								<div className="mt-auto">
									<div className="project-img-wrapper premium-media relative mb-5 aspect-[4/5] w-full overflow-hidden">
										<Image
											src={project.coverImage}
											alt=""
											fill
											sizes="(max-width: 767px) 85vw, 30vw"
											draggable={false}
											className="pointer-events-none object-cover object-center opacity-80 grayscale transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02] group-hover:opacity-100 group-hover:grayscale-0"
										/>
									</div>
									<span className="block font-mono text-[0.8125rem] leading-[1.4] tracking-wide text-ink-secondary">
										{project.year}
									</span>
								</div>
							</Link>
						</li>
					))}
				</ul>
			</div>

			{scrollable ? (
				<div className="shell mt-5" aria-hidden>
					<div className="h-px w-full bg-hairline">
						<div
							className="h-px bg-ink transition-[width] duration-200 ease-out"
							style={{ width: `${Math.max(8, progress * 100)}%` }}
						/>
					</div>
				</div>
			) : null}
		</div>
	);
}
