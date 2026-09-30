/** One short burst when a learner finishes a course. Respects reduced motion. */
export async function celebrate() {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	const { default: confetti } = await import('canvas-confetti');
	void confetti({
		particleCount: 140,
		spread: 80,
		origin: { y: 0.7 },
		disableForReducedMotion: true,
	});
}
