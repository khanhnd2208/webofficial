import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LearnMarkdown from './LearnMarkdown';

describe('markdown image rendering', () => {
	it('keeps block figures outside paragraphs for valid server markup', () => {
		const { container } = render(<LearnMarkdown markdown='![x](/uploads/image.webp "caption")' />);
		expect(container.querySelector('figure')).toBeInTheDocument();
		expect(container.querySelector('p figure')).toBeNull();
		expect(screen.getByRole('button', { name: 'Phóng to ảnh: x' })).toBeInTheDocument();
	});
	it('shows placeholders only when explicitly requested by Studio', () => {
		const { rerender } = render(<LearnMarkdown markdown="![x](hinh-1.png)" />);
		expect(screen.queryByText(/Chưa có ảnh/)).not.toBeInTheDocument();
		rerender(<LearnMarkdown markdown="![x](hinh-1.png)" showMissingImages />);
		expect(screen.getByText('Chưa có ảnh: hinh-1.png')).toBeInTheDocument();
	});
});
