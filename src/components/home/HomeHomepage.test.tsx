import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomeHero from './HomeHero';
import HomeWriting from './HomeWriting';

describe('Learning as Becoming homepage components', () => {
	it('renders one H1, accessible art and both hero paths without client hydration', () => {
		render(<HomeHero articleHref="/bai-viet/loi-ngo" />);

		expect(
			screen.getByRole('heading', {
				level: 1,
				name: 'Không chỉ học để biết. Học để trở thành.',
			}),
		).toBeInTheDocument();
		expect(screen.getByRole('img', { name: /hành trình học để trở thành/i })).toBeInTheDocument();
		expect(
			screen.getByRole('link', { name: /Khám phá cách tôi nhìn về giáo dục/i }),
		).toHaveAttribute('href', '#manifesto');
		expect(screen.getByRole('link', { name: /Bắt đầu từ một bài viết/i })).toHaveAttribute(
			'href',
			'/bai-viet/loi-ngo',
		);
	});

	it('keeps the personal interlude while the editorial listing is removed', () => {
		const { container } = render(<HomeWriting podcast={null} />);

		expect(container.querySelectorAll('article')).toHaveLength(0);
		expect(
			screen.getByText(
				'Emotion leads us to bad decisions, great lessons—and always, somehow, back to love.',
			),
		).toBeInTheDocument();
		expect(screen.queryByText('LỜI NGỎ')).not.toBeInTheDocument();
		expect(screen.queryByText(/^Podcast$/i)).not.toBeInTheDocument();
	});
});
