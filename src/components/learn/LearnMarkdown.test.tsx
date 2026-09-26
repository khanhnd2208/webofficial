import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LearnMarkdown from './LearnMarkdown';

describe('LearnMarkdown', () => {
	it('never nests an image figure inside a paragraph, which would break hydration', () => {
		const { container } = render(
			<LearnMarkdown markdown={'Mở đầu.\n\n![Sơ đồ](/learn/demo.webp "Chú thích")\n\nKết thúc.'} />,
		);

		const figure = container.querySelector('figure.ln-figure');
		expect(figure).not.toBeNull();
		expect(figure?.closest('p')).toBeNull();
		expect(container.querySelectorAll('p')).toHaveLength(2);
	});

	it('keeps text that shares a line with an image, without a paragraph around the figure', () => {
		const { container } = render(<LearnMarkdown markdown={'Xem hình ![Sơ đồ](/learn/demo.webp) bên dưới.'} />);

		expect(container.querySelector('figure')?.closest('p')).toBeNull();
		expect(container.textContent).toContain('Xem hình');
		expect(container.textContent).toContain('bên dưới.');
	});
});
