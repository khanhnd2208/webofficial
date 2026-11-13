import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RecallArenaPlayer } from '@/features/teaching/types';

import { ArenaFloor } from './ArenaFloor';
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
