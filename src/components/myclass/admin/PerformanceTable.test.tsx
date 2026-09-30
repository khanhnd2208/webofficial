import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PerformanceTable from './PerformanceTable';

describe('PerformanceTable', () => {
	it('sorts by accuracy then evidence then title', () => {
		render(
			<PerformanceTable
				rows={[
					{ title: 'B', accuracy: 50, evidence: 2 },
					{ title: 'A', accuracy: 50, evidence: 2 },
					{ title: 'C', accuracy: 80, evidence: 1 },
				]}
			/>,
		);
		const titles = screen
			.getAllByRole('row')
			.slice(1)
			.map((row) => row.textContent);
		expect(titles[0]).toContain('C');
		expect(titles[1]).toContain('A');
		expect(titles[2]).toContain('B');
		expect(screen.queryByText(/mastery|yếu|vững/i)).not.toBeInTheDocument();
	});
});
