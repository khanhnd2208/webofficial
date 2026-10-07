import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LocaleProvider } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import type { RoomStateDTO } from '@/features/cheese-thief/types';
import SecretPhase from './SecretPhase';

const state: RoomStateDTO = {
	code: 'TEST',
	name: 'Table',
	phase: 'secret',
	version: 1,
	serverNow: '2026-10-07T00:00:00Z',
	isHost: true,
	isPublic: false,
	maxPlayers: 4,
	playerCount: 4,
	scapegoatEnabled: false,
	hourSeconds: 10,
	followers: {
		count: 0,
		knowledge: 'all',
		defaultCount: 0,
		defaultKnowledge: 'all',
		max: 0,
		customized: false,
	},
	players: ['Me', 'An', 'Bình', 'Chi'].map((name, index) => ({
		id: String(index),
		name,
		avatarSeed: name,
		connected: true,
		isHost: index === 0,
	})),
	self: {
		id: '0',
		token: 'test-only',
		name: 'Me',
		avatarSeed: 'Me',
		isHost: true,
		hasMemorizedRole: true,
		hasSeenSecret: false,
		hasChosenSecret: false,
	},
	choiceCount: 2,
};

function mount(onDraft: (picks: string[]) => Promise<unknown>, onSubmit = vi.fn()) {
	render(
		<LocaleProvider>
			<SecretPhase state={state} busy={false} onDraft={onDraft} onSubmit={onSubmit} />
		</LocaleProvider>,
	);
	return onSubmit;
}
function choose(name: string) {
	fireEvent.click(screen.getByRole('button', { name }));
}

function deferred() {
	let resolve!: () => void;
	const promise = new Promise<void>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}

describe('SecretPhase choices', () => {
	it('waits for older drafts and the latest selection before confirming Done', async () => {
		const older = deferred();
		const latest = deferred();
		const draft = vi.fn().mockReturnValueOnce(older.promise).mockReturnValueOnce(latest.promise);
		const submit = mount(draft);
		choose('An');
		choose('Bình');
		fireEvent.click(screen.getByRole('button', { name: 'Xong' }));
		expect(submit).not.toHaveBeenCalled();
		expect(screen.getByRole('button', { name: 'An' })).toBeDisabled();
		await act(async () => older.resolve());
		expect(draft.mock.calls).toEqual([[['1']], [['1', '2']]]);
		expect(submit).not.toHaveBeenCalled();
		await act(async () => latest.resolve());
		await waitFor(() => expect(submit).toHaveBeenCalledExactlyOnceWith(['1', '2']));
	});

	it('does not silently replace the first slot when the player taps a third name', async () => {
		const submit = mount(vi.fn().mockResolvedValue(undefined));
		choose('An');
		choose('Bình');
		choose('Chi');
		expect(screen.getByRole('button', { name: 'An' })).toHaveAttribute('aria-pressed', 'true');
		expect(screen.getByRole('button', { name: 'Bình' })).toHaveAttribute('aria-pressed', 'true');
		expect(screen.getByRole('button', { name: 'Chi' })).toHaveAttribute('aria-pressed', 'false');
		fireEvent.click(screen.getByRole('button', { name: 'Xong' }));
		await waitFor(() => expect(submit).toHaveBeenCalledExactlyOnceWith(['1', '2']));
	});

	it('can confirm corrected slot order after a best-effort draft fails', async () => {
		const draft = vi.fn().mockRejectedValueOnce(new Error('Offline')).mockResolvedValue(undefined);
		const submit = mount(draft);
		choose('An');
		choose('Bình');
		choose('An');
		choose('Chi');
		fireEvent.click(screen.getByRole('button', { name: 'Xong' }));
		await waitFor(() => expect(submit).toHaveBeenCalledExactlyOnceWith(['2', '3']));
		expect(draft).toHaveBeenLastCalledWith(['2', '3']);
	});
});
