import { describe, expect, it, vi } from 'vitest';

import { scrollGridWeekIntoView } from './gridScroll';

function rect(left: number, right: number): DOMRect {
	return { left, right, top: 0, bottom: 40, width: right - left, height: 40 } as DOMRect;
}

describe('gridScroll', () => {
	it('keeps a selected week inside the corridor between sticky columns', () => {
		const wrapper = document.createElement('div');
		const summary = document.createElement('div');
		const week = document.createElement('div');
		summary.className = 'mc-grid-summary-start';
		week.dataset.week = '10';
		wrapper.append(summary, week);
		Object.defineProperties(wrapper, {
			clientWidth: { value: 300 },
			scrollWidth: { value: 1000 },
			scrollLeft: { value: 0, writable: true },
		});
		wrapper.getBoundingClientRect = () => rect(0, 300);
		summary.getBoundingClientRect = () => rect(240, 300);
		week.getBoundingClientRect = () => rect(280, 340);
		const scrollTo = vi.fn();
		wrapper.scrollTo = scrollTo;

		scrollGridWeekIntoView(wrapper, 10);

		expect(scrollTo).toHaveBeenCalledWith({ left: 108, behavior: 'smooth' });
	});

	it('does not scroll when the week is already visible', () => {
		const wrapper = document.createElement('div');
		const week = document.createElement('div');
		week.dataset.week = '1';
		wrapper.append(week);
		Object.defineProperties(wrapper, {
			clientWidth: { value: 300 },
			scrollWidth: { value: 300 },
			scrollLeft: { value: 0, writable: true },
		});
		wrapper.getBoundingClientRect = () => rect(0, 300);
		week.getBoundingClientRect = () => rect(80, 130);
		const scrollTo = vi.fn();
		wrapper.scrollTo = scrollTo;

		scrollGridWeekIntoView(wrapper, 1);

		expect(scrollTo).not.toHaveBeenCalled();
	});
});
