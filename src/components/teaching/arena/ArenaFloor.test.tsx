import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RecallArenaPlayer } from '@/features/teaching/types';

import { ArenaFloor, floorSizes } from './ArenaFloor';
import { arenaCharacterFor } from './arenaCharacters';

const motion = vi.hoisted(() => ({ reduced: false }));
vi.mock('@/components/motion', () => ({
	useMotionTier: () => ({ reduced: motion.reduced }),
}));

const players = [
	{ enrollmentId: 'a', studentCode: 'SV-a', givenName: 'An' },
	{ enrollmentId: 'b', studentCode: 'SV-b', givenName: 'Bình' },
] as RecallArenaPlayer[];

const heroOf = (player: RecallArenaPlayer) => arenaCharacterFor(player.studentCode);

function floor(hunting = false) {
	return (
		<ArenaFloor
			players={players}
			highlightId={null}
			caughtId={null}
			hunting={hunting}
			results={new Map()}
			names={new Map()}
			suck={null}
			attackCue={null}
			heroOf={heroOf}
		/>
	);
}

describe('ArenaFloor ambient movement', () => {
	beforeEach(() => {
		motion.reduced = false;
		vi.useFakeTimers();
		vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
			left: 0,
			top: 0,
			width: 1200,
			height: 400,
			right: 1200,
			bottom: 400,
			x: 0,
			y: 0,
			toJSON: () => ({}),
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	it('walks freely, then stops walking when the monster hunts', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0.4);
		const view = render(floor());
		const actor = screen.getAllByTestId('arena-player')[0]!;
		const start = Number.parseFloat(actor.style.left);
		act(() => vi.advanceTimersByTime(3000));
		expect(Math.abs(Number.parseFloat(actor.style.left) - start)).toBeGreaterThan(5);
		expect(actor.querySelector('[data-walking="true"]')).not.toBeNull();
		view.rerender(floor(true));
		expect(actor.querySelector('[data-walking="true"]')).toBeNull();
	});

	it('remains still when reduced motion is requested', () => {
		motion.reduced = true;
		render(floor());
		const actor = screen.getAllByTestId('arena-player')[0]!;
		const start = actor.style.left;
		act(() => vi.advanceTimersByTime(5000));
		expect(actor.style.left).toBe(start);
		expect(actor.querySelector('[data-walking="true"]')).toBeNull();
	});
});

describe('Arena floor sizes', () => {
	it('draws names the back row can read on a projector and never larger than the cap', () => {
		expect(floorSizes(32, 9, 4, { width: 1870, height: 570 })).toEqual({ size: 79, nameSize: 20 });
		expect(floorSizes(6, 4, 2, { width: 1870, height: 570 }).nameSize).toBe(21);
	});

	it('shrinks heroes and names together on a crowded or small floor', () => {
		const laptop = floorSizes(50, 11, 5, { width: 1300, height: 400 });
		expect(laptop.size).toBeLessThan(60);
		expect(laptop.nameSize).toBeGreaterThanOrEqual(12);
		expect(laptop.nameSize).toBeLessThan(16);
	});

	it('falls back to full-size heroes before the floor is measured', () => {
		expect(floorSizes(10, 5, 2, { width: 0, height: 0 })).toEqual({ size: 96, nameSize: 16 });
	});
});
