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
		summary.style.position = 'sticky';
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

it('ignores hidden score columns when positioning a mobile week', () => {
	const wrapper = document.createElement('div');
	const identity = document.createElement('div');
	const hidden = document.createElement('div');
	const week = document.createElement('div');
	identity.className = 'mc-grid-public-identity';
	identity.style.position = 'sticky';
	hidden.className = 'mc-grid-summary-start';
	hidden.style.display = 'none';
	week.dataset.week = '2';
	wrapper.append(identity, hidden, week);
	Object.defineProperties(wrapper, {
		clientWidth: { value: 390 },
		scrollWidth: { value: 1500 },
		scrollLeft: { value: 0, writable: true },
	});
	wrapper.getBoundingClientRect = () => rect(0, 390);
	identity.getBoundingClientRect = () => rect(0, 160);
	hidden.getBoundingClientRect = () => rect(0, 0);
	week.getBoundingClientRect = () => rect(260, 360);
	wrapper.scrollTo = vi.fn();
	scrollGridWeekIntoView(wrapper, 2);
	expect(wrapper.scrollTo).not.toHaveBeenCalled();
});
