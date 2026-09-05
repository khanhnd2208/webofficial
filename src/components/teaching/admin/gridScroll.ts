export type GridScrollMode = 'contained' | 'page';

const GRID_SCROLL_GAP = 8;

function prefersReducedMotion() {
	return (
		typeof window !== 'undefined' &&
		typeof window.matchMedia === 'function' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

/**
 * Scroll only the horizontal grid viewport. `scrollIntoView` can move the
 * document vertically and can centre a week underneath a sticky identity or
 * summary column, so the available corridor is calculated from the live
 * sticky column bounds instead.
 */
export function scrollGridWeekIntoView(
	wrapper: HTMLElement | null,
	weekNumber: number,
	behavior: ScrollBehavior = 'smooth',
): void {
	if (!wrapper) return;
	const target = wrapper.querySelector<HTMLElement>(`[data-week="${weekNumber}"]`);
	if (!target) return;

	const wrapperRect = wrapper.getBoundingClientRect();
	const stickyRects = (selector: string) =>
		[...wrapper.querySelectorAll<HTMLElement>(selector)]
			.filter((el) => getComputedStyle(el).position === 'sticky')
			.map((el) => el.getBoundingClientRect())
			.filter((rect) => rect.width > 0);
	const leftEdge = Math.max(
		wrapperRect.left,
		...stickyRects('.mc-grid-public-identity, .mc-grid-freeze-left').map((rect) => rect.right),
	);
	const rightEdge = Math.min(
		wrapperRect.right,
		...stickyRects('.mc-grid-freeze-right, .mc-grid-summary-start').map((rect) => rect.left),
	);
	const targetRect = target.getBoundingClientRect();
	let delta = 0;

	if (targetRect.left < leftEdge + GRID_SCROLL_GAP) {
		delta = targetRect.left - leftEdge - GRID_SCROLL_GAP;
	} else if (targetRect.right > rightEdge - GRID_SCROLL_GAP) {
		delta = targetRect.right - rightEdge + GRID_SCROLL_GAP;
	}

	if (!delta) return;
	const nextLeft = Math.max(
		0,
		Math.min(wrapper.scrollWidth - wrapper.clientWidth, wrapper.scrollLeft + delta),
	);
	if (typeof wrapper.scrollTo === 'function') {
		wrapper.scrollTo({ left: nextLeft, behavior: prefersReducedMotion() ? 'auto' : behavior });
	} else {
		wrapper.scrollLeft = nextLeft;
	}
}

export function syncGridScrollState(wrapper: HTMLElement | null): void {
	if (!wrapper) return;
	wrapper.dataset.scrollLeft = wrapper.scrollLeft > 2 ? 'true' : 'false';
	wrapper.dataset.scrollRight =
		wrapper.scrollLeft + wrapper.clientWidth < wrapper.scrollWidth - 2 ? 'true' : 'false';
}
