import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { McIcon, MC_ICON_NAMES } from './McIcon';

describe('McIcon', () => {
	it('renders dedicated glyphs for the teaching board icons that used to fall back to help', () => {
		for (const name of ['verified', 'lock_open', 'check_circle', 'calendar_month'] as const) {
			const { container } = render(<McIcon name={name} />);
			const svg = container.querySelector('svg');
			expect(svg).toHaveAttribute('data-icon', name);
			expect(container.querySelector('path, circle')).toBeTruthy();
		}
	});

	it('draws overflow menus as filled dots instead of hairline specks', () => {
		const { container } = render(<McIcon name="more_horiz" size={12} />);
		expect(container.querySelectorAll('circle')).toHaveLength(3);
	});

	it('keeps every catalogued name renderable', () => {
		for (const name of MC_ICON_NAMES) {
			const { container } = render(<McIcon name={name} />);
			expect(container.querySelector('svg')).toHaveAttribute('data-icon', name);
		}
	});
});
