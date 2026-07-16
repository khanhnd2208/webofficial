import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ResourceBadge } from '@/components/marketing/ResourceBadge';
import { SectionHeading } from '@/components/marketing/SectionHeading';
import { TestimonialBlock } from '@/components/marketing/TestimonialBlock';

describe('ResourceBadge', () => {
	it('shows status and access labels', () => {
		render(<ResourceBadge productStatus="beta" access="login" />);
		expect(screen.getByText('Đang hoàn thiện')).toBeInTheDocument();
		expect(screen.getByText('Cần đăng nhập')).toBeInTheDocument();
	});
});

describe('TestimonialBlock', () => {
	it('omits attribution when anonymous', () => {
		render(
			<TestimonialBlock
				quote="Làm rõ được bước tiếp theo."
				personName="Hidden"
				role="Founder"
				anonymous
			/>,
		);
		expect(screen.getByText(/Làm rõ được bước tiếp theo/)).toBeInTheDocument();
		expect(screen.queryByText(/Hidden/)).not.toBeInTheDocument();
		expect(screen.queryByText(/Founder/)).not.toBeInTheDocument();
	});
});

describe('SectionHeading', () => {
	it('supports a semantic heading level, id and compact hierarchy', () => {
		render(
			<SectionHeading
				id="cach-lam-viec"
				level={3}
				variant="compact"
				eyebrow="Cách làm việc"
				title="Một bước tiếp theo"
			/>,
		);

		const heading = screen.getByRole('heading', { level: 3, name: 'Một bước tiếp theo' });
		expect(heading).toHaveAttribute('id', 'cach-lam-viec');
		expect(heading).toHaveClass('font-sans', 'font-semibold');
	});
});
