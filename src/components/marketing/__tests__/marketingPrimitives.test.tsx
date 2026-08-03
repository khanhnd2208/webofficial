import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { ResourceBadge } from '@/components/marketing/ResourceBadge';
import { SectionHeading } from '@/components/marketing/SectionHeading';
import { TestimonialBlock } from '@/components/marketing/TestimonialBlock';
import { TrustStrip } from '@/components/marketing/PremiumPrimitives';
import { ServiceDisclosure } from '@/components/marketing/ServiceDisclosure';
import { SocialProofSection } from '@/components/marketing/SocialProofSection';

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

describe('editorial premium primitives', () => {
	it('hides the social proof section when no approved evidence exists', () => {
		const { container } = render(<SocialProofSection testimonials={[]} organizations={[]} />);
		expect(container).toBeEmptyDOMElement();
	});

	it('renders a testimonial supplied by the approved proof layer', () => {
		render(
			<SocialProofSection
				testimonials={[
					{
						id: 'approved-1',
						quote: 'Tôi nhìn rõ hơn bước tiếp theo.',
						anonymous: true,
						approval: 'approved',
						verification: 'verified',
					},
				]}
				organizations={[]}
			/>,
		);
		expect(screen.getByText(/Tôi nhìn rõ hơn bước tiếp theo/)).toBeVisible();
	});

	it('renders verified trust items as one labelled region', () => {
		render(<TrustStrip items={[{ label: 'Vai trò', value: 'Giảng viên quản trị' }]} />);
		expect(screen.getByLabelText('Thông tin chuyên môn đã xác minh')).toBeInTheDocument();
		expect(screen.getByText('Giảng viên quản trị')).toBeVisible();
	});

	it('keeps service details progressively available without a custom button', () => {
		render(
			<ServiceDisclosure serviceId="applied-ai" title="Đào tạo AI">
				<p>Chi tiết dịch vụ</p>
			</ServiceDisclosure>,
		);
		const summary = screen.getByText('Hình thức, đầu ra và cách làm — Đào tạo AI');
		const details = summary.closest('details');
		expect(details).not.toHaveAttribute('open');
		fireEvent.click(summary);
		expect(details).toHaveAttribute('open');
		expect(screen.getByText('Chi tiết dịch vụ')).toBeInTheDocument();
	});
});
