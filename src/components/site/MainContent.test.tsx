import { fireEvent, render, screen } from '@testing-library/react';
import { useEffect, useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import MainContent from './MainContent';

const route = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }));
// Model JourneyTransition's pathname-keyed boundary without React canary APIs.
vi.mock('./JourneyTransition', () => ({
	default: ({ children, page }: { children: ReactNode; page: string }) => (
		<div key={page} data-testid="public-transition">
			{children}
		</div>
	),
}));

describe('persistent internal layouts', () => {
	it.each([
		[
			'/my-space/my-class/course/lesson/unit-1',
			'/my-space/my-class/course/lesson/unit-2',
			'/my-space/my-class/course/lesson/unit-3',
		],
		[
			'/admin/my-class/courses/one/overview',
			'/admin/my-class/courses/one/content',
			'/admin/my-class/courses/one/settings',
		],
		[
			'/my-space/board-game/ma-soi/room/ONE',
			'/my-space/board-game/ma-soi/room/TWO',
			'/my-space/board-game/ma-soi/room/THREE',
		],
	])('keeps state and mounted connections across %s', (first, second, third) => {
		const disconnect = vi.fn();
		function Workspace() {
			const [open, setOpen] = useState(false);
			useEffect(() => disconnect, []);
			return (
				<div data-testid="outline">
					<button aria-expanded={open} onClick={() => setOpen(!open)}>
						Outline
					</button>
				</div>
			);
		}
		route.pathname = first;
		const { rerender } = render(
			<MainContent>
				<Workspace />
			</MainContent>,
		);
		fireEvent.click(screen.getByRole('button', { name: 'Outline' }));
		screen.getByTestId('outline').scrollTop = 310;
		for (const pathname of [second, third]) {
			route.pathname = pathname;
			rerender(
				<MainContent>
					<Workspace />
				</MainContent>,
			);
			expect(screen.getByRole('button', { name: 'Outline' })).toHaveAttribute(
				'aria-expanded',
				'true',
			);
			expect(screen.getByTestId('outline').scrollTop).toBe(310);
			expect(disconnect).not.toHaveBeenCalled();
			expect(screen.queryByTestId('public-transition')).toBeNull();
		}
	});
	it('keeps the transition boundary on public pages', () => {
		route.pathname = '/muc-luc';
		render(<MainContent>Public content</MainContent>);
		expect(screen.getByTestId('public-transition')).toHaveTextContent('Public content');
	});
});
