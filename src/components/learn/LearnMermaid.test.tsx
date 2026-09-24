import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import LearnMermaid from './LearnMermaid';

vi.mock('mermaid', () => ({
	default: {
		initialize: vi.fn(),
		render: vi.fn(async (id: string, source: string) => {
			if (source.includes('broken')) throw new Error('bad diagram');
			return { svg: `<svg data-id="${id}"></svg>` };
		}),
	},
}));

describe('LearnMermaid', () => {
	it('renders the svg when mermaid accepts the source', async () => {
		const { container } = render(<LearnMermaid source={'flowchart TD\n  A-->B'} />);
		expect(await screen.findByRole('figure')).toBeInTheDocument();
		expect(container.querySelector('svg')).not.toBeNull();
	});

	it('shows the source when the diagram cannot be drawn', async () => {
		render(<LearnMermaid source="broken" />);
		expect(await screen.findByText('Không vẽ được sơ đồ')).toBeInTheDocument();
		expect(screen.getByText('broken')).toBeInTheDocument();
	});
});
