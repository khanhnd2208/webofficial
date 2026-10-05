import { act, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { useRecallStudy } from './useRecallStudy';
const methods = vi.hoisted(() => ({ study: vi.fn(), stop: vi.fn(), create: vi.fn() }));
vi.mock('./recallTracker', () => ({ createRecallTracker: methods.create }));
afterEach(() => {
	vi.useRealTimers();
	vi.clearAllMocks();
});
function Player() {
	const study = useRecallStudy('deck', 'class');
	return <button onClick={() => study(true)}>Study</button>;
}
it('discards StrictMode rehearsal before creating a guest identity and cleans up', async () => {
	vi.useFakeTimers();
	methods.create.mockReturnValue({ study: methods.study, stop: methods.stop });
	const ui = render(
		<StrictMode>
			<Player />
		</StrictMode>,
	);
	await act(async () => {
		await vi.advanceTimersByTimeAsync(0);
	});
	expect(methods.create).toHaveBeenCalledTimes(1);
	fireEvent.click(screen.getByRole('button', { name: 'Study' }));
	expect(methods.study).toHaveBeenCalledWith(true);
	ui.unmount();
	expect(methods.stop).toHaveBeenCalledTimes(1);
});

it('retains a study action made before the deferred tracker is ready', async () => {
	vi.useFakeTimers();
	methods.create.mockReturnValue({ study: methods.study, stop: methods.stop });
	render(<Player />);
	fireEvent.click(screen.getByRole('button', { name: 'Study' }));
	expect(methods.study).not.toHaveBeenCalled();
	await act(async () => {
		await vi.advanceTimersByTimeAsync(0);
	});
	expect(methods.study).toHaveBeenCalledWith(true);
});
