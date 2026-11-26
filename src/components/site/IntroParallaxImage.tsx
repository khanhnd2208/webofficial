'use client';

import { getImageProps } from 'next/image';
import { useEffect, useRef } from 'react';
import { useMotionTier } from '@/components/motion/MotionProvider';
import { createCoverScene } from './coverInkScene';

type Props = { src: string; mobileSrc: string; alt: string; sizes: string };

export default function IntroParallaxImage({ src, mobileSrc, alt, sizes }: Props) {
	const { tier } = useMotionTier();
	const image = useRef<HTMLImageElement>(null);
	const surface = useRef<HTMLCanvasElement>(null);
	const control = useRef<HTMLButtonElement>(null);
	const introduced = useRef(false);

	useEffect(() => {
		const img = image.current!,
			canvas = surface.current!,
			button = control.current!;
		if (tier === 'reduced') return;
		let scene: ReturnType<typeof createCoverScene>;
		let frame = 0,
			start = -Infinity,
			previous = 0,
			active = false;
		let x = 0,
			y = 0,
			goalX = 0,
			goalY = 0;
		function render(now: number) {
			frame = 0;
			if (!scene || !active || document.hidden) return;
			const ease = 1 - Math.exp(-Math.min(80, now - previous) / 72);
			previous = now;
			x += (goalX - x) * ease;
			y += (goalY - y) * ease;
			const age = (now - start) / 1000;
			scene.draw(Math.min(age, 10), x, y);
			if (age < 5 || Math.abs(goalX - x) + Math.abs(goalY - y) > 0.002) schedule();
		}
		function schedule() {
			if (!frame && active && !document.hidden) frame = requestAnimationFrame(render);
		}
		function intro() {
			if (!scene || !active || tier !== 'full' || introduced.current || document.hidden) return;
			introduced.current = true;
			scene.drop(0.63, 0.52);
			start = performance.now() + 920;
		}
		function clear() {
			cancelAnimationFrame(frame);
			frame = 0;
			scene?.dispose();
			scene = undefined;
			canvas.hidden = true;
			button.hidden = true;
		}
		function load() {
			clear();
			if (!img.naturalWidth || !img.complete) return;
			scene = createCoverScene(canvas, img);
			if (!scene) return;
			canvas.hidden = false;
			button.hidden = false;
			scene.resize();
			scene.draw(10, 0, 0);
			intro();
			schedule();
		}
		function move(e: PointerEvent) {
			if (tier !== 'full' || e.pointerType === 'touch') return;
			const r = button.getBoundingClientRect();
			goalX = ((e.clientX - r.left) / r.width) * 2 - 1;
			goalY = ((e.clientY - r.top) / r.height) * 2 - 1;
			schedule();
		}
		function leave() {
			goalX = 0;
			goalY = 0;
			schedule();
		}
		function drop(e: MouseEvent) {
			const r = button.getBoundingClientRect();
			scene?.drop(
				e.detail ? (e.clientX - r.left) / r.width : 0.5,
				e.detail ? (e.clientY - r.top) / r.height : 0.56,
			);
			introduced.current = true;
			start = performance.now();
			schedule();
		}
		function visible() {
			intro();
			schedule();
		}
		function lost(e: Event) {
			e.preventDefault();
			clear();
		}
		const resize = new ResizeObserver(() => {
			if (scene) {
				scene.resize();
				schedule();
			}
		});
		const visibility = new IntersectionObserver(([entry]) => {
			active = entry.isIntersecting;
			visible();
		});
		visibility.observe(img);
		resize.observe(img);
		img.addEventListener('load', load);
		button.addEventListener('click', drop);
		button.addEventListener('pointermove', move);
		button.addEventListener('pointerleave', leave);
		canvas.addEventListener('webglcontextlost', lost);
		canvas.addEventListener('webglcontextrestored', load);
		document.addEventListener('visibilitychange', visible);
		load();
		return () => {
			resize.disconnect();
			visibility.disconnect();
			clear();
			img.removeEventListener('load', load);
			button.removeEventListener('click', drop);
			button.removeEventListener('pointermove', move);
			button.removeEventListener('pointerleave', leave);
			canvas.removeEventListener('webglcontextlost', lost);
			canvas.removeEventListener('webglcontextrestored', load);
			document.removeEventListener('visibilitychange', visible);
		};
	}, [tier]);

	const { props: desktop } = getImageProps({ src, alt, fill: true, sizes, loading: 'eager' });
	const { props: mobile } = getImageProps({
		src: mobileSrc,
		alt,
		fill: true,
		sizes: '(min-width: 640px) 360px, 280px',
		loading: 'eager',
	});
	return (
		<div className="relative h-full w-full overflow-hidden">
			<picture>
				<source media="(min-width: 1024px)" srcSet={desktop.srcSet} sizes={sizes} />
				<img
					{...mobile}
					ref={image}
					alt={alt}
					className="book-responsive-art intro-image-treatment"
				/>
			</picture>
			<canvas
				ref={surface}
				hidden
				aria-hidden="true"
				className="cover-ink-canvas intro-image-treatment"
			/>
			<div className="intro-noise-overlay" aria-hidden="true" />
			<button
				ref={control}
				hidden
				type="button"
				className="cover-ink-control"
				aria-label="Thả giọt nước lên tranh để thắp sáng con đường"
			/>
		</div>
	);
}
