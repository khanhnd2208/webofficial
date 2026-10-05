import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import CardDeckSelector from './CardDeckSelector';
import RoleCard from './RoleCard';
import { VAN_SON_DECK_LABEL } from '@/features/werewolf/config/cardDecks';

describe('card editions', () => {
	it('shows the requested event label and blocks changes while saving', () => {
		const onChange = vi.fn();
		const { rerender } = render(
			<LocaleProvider>
				<CardDeckSelector value="classic" disabled={false} onChange={onChange} />
			</LocaleProvider>,
		);
		fireEvent.click(screen.getByRole('button', { name: VAN_SON_DECK_LABEL }));
		expect(onChange).toHaveBeenCalledWith('van-son-2026');
		rerender(
			<LocaleProvider>
				<CardDeckSelector value="van-son-2026" disabled onChange={onChange} />
			</LocaleProvider>,
		);
		expect(screen.getByRole('button', { name: VAN_SON_DECK_LABEL })).toHaveAttribute(
			'aria-pressed',
			'true',
		);
		expect(screen.getByRole('button', { name: VAN_SON_DECK_LABEL })).toBeDisabled();
	});

	it('reveals the whole event card only while held, without covering its printed rules', () => {
		const onViewed = vi.fn();
		const { container } = render(
			<LocaleProvider>
				<RoleCard roleId="cupid" cardDeck="van-son-2026" onViewed={onViewed} />
			</LocaleProvider>,
		);
		const card = screen.getByRole('button');
		const face = container.querySelector('img[src$="/van-son-2026/cupid.webp"]');
		expect(face).toHaveClass('invisible', 'object-contain');
		expect(screen.queryByRole('heading')).not.toBeInTheDocument();
		fireEvent.pointerDown(card);
		expect(face).not.toHaveClass('invisible');
		expect(screen.getByRole('heading').parentElement).toHaveClass('sr-only');
		expect(onViewed).toHaveBeenCalledTimes(1);
		fireEvent.pointerUp(card);
		expect(face).toHaveClass('invisible');
		expect(screen.queryByRole('heading')).not.toBeInTheDocument();
		fireEvent.keyDown(card, { key: ' ' });
		expect(face).not.toHaveClass('invisible');
		fireEvent.keyUp(card, { key: ' ' });
		expect(face).toHaveClass('invisible');
		expect(onViewed).toHaveBeenCalledTimes(1);
	});

	it('keeps the classic card and translated description', () => {
		const { container } = render(
			<LocaleProvider>
				<RoleCard roleId="seer" onViewed={vi.fn()} />
			</LocaleProvider>,
		);
		fireEvent.pointerDown(screen.getByRole('button'));
		expect(container.querySelector('img[src$="/02.webp"]')).not.toHaveClass('invisible');
		expect(screen.getByRole('heading').parentElement).not.toHaveClass('sr-only');
	});
});
