import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LearnKeyboardNav } from './LearnPlayerChrome';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push }),
}));

describe('LearnKeyboardNav', () => {
	beforeEach(() => {
		push.mockReset();
	});

	it('does not change section while a quiz answer has focus', () => {
		render(
			<>
				<LearnKeyboardNav previousHref="/prev" nextHref="/next" overviewHref="/overview" />
				<div role="radiogroup">
					<button type="button" role="radio" aria-checked="true">
						Đáp án A
					</button>
				</div>
			</>,
		);

		const radio = document.querySelector('[role="radio"]') as HTMLButtonElement;
		radio.focus();
		radio.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

		expect(push).not.toHaveBeenCalled();
	});
});
