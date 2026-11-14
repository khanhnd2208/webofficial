import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ArenaCountdown } from './ArenaCountdown';
import { playArenaSound } from './arenaSound';

vi.mock('./arenaSound', () => ({ playArenaSound: vi.fn() }));

describe('ArenaCountdown', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
	});
	afterEach(() => vi.useRealTimers());

	it('counts down to zero, ticks through the last five seconds, then says time is up', () => {
		render(<ArenaCountdown seconds={30} />);
		const timer = screen.getByRole('timer');
		expect(timer.getAttribute('aria-label')).toBe('Còn 30 giây suy nghĩ');

		act(() => void vi.advanceTimersByTime(24_000));
		expect(timer.getAttribute('aria-label')).toBe('Còn 6 giây suy nghĩ');
		expect(playArenaSound).not.toHaveBeenCalled();

		act(() => void vi.advanceTimersByTime(1_000));
		expect(timer.getAttribute('data-low')).toBe('true');
		expect(playArenaSound).toHaveBeenCalledWith('tick', 0);

		act(() => void vi.advanceTimersByTime(10_000));
		expect(timer.getAttribute('aria-label')).toBe('Hết giờ suy nghĩ');
		expect(timer.textContent).toContain('Hết giờ!');
		expect(playArenaSound).toHaveBeenLastCalledWith('lock');
	});
});
