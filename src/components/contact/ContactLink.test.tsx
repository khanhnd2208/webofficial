import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ContactLink from './ContactLink';

vi.mock('next/navigation', () => ({
	usePathname: () => '/gioi-thieu',
}));

describe('ContactLink', () => {
	it('renders a real link to the contact page with attribution', () => {
		render(
			<ContactLink contactContext={{ inquiryType: 'training', sourcePage: '/gioi-thieu' }}>
				Gửi lời nhắn
			</ContactLink>,
		);

		const link = screen.getByRole('link', { name: 'Gửi lời nhắn' });
		expect(link.getAttribute('href')).toContain('/lien-he');
		expect(link.getAttribute('href')).toContain('type=training');
		expect(link.getAttribute('href')).toContain('sourcePage=%2Fgioi-thieu');
	});
});
