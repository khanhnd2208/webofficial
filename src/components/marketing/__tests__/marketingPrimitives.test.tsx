import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ResourceBadge } from '@/components/marketing/ResourceBadge';
import { TestimonialBlock } from '@/components/marketing/TestimonialBlock';

describe('ResourceBadge', () => {
	it('shows status and access labels', () => {
		render(<ResourceBadge productStatus="beta" access="login" />);
		expect(screen.getByText('Beta')).toBeInTheDocument();
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
