import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import BankWorkspace from './BankWorkspace';

vi.mock('next/navigation', () => ({
	useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock('./api', () => ({
	myClassApi: vi.fn(),
}));

describe('BankWorkspace', () => {
	it('selects a row and shows it in the inspector', () => {
		render(
			<BankWorkspace
				data={{
					items: [
						{
							id: 'q1',
							stem: 'HRM là gì?',
							type: 'MCQ_SINGLE',
							difficulty: 2,
							status: 'ACTIVE',
							tags: ['hrm'],
							subjectName: 'Quản trị',
							topicPath: 'nhan-su',
							testCount: 1,
							updatedAt: '2026-08-16T00:00:00.000Z',
						},
					],
					total: 1,
					page: 1,
					pageSize: 20,
					totalPages: 1,
				}}
				current={{}}
				subjects={[{ id: 's1', name: 'Quản trị' }]}
				topics={[{ id: 't1', path: 'nhan-su' }]}
			/>,
		);
		fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn: HRM là gì?' }));
		expect(screen.getByText('1 đã chọn')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Lưu trữ' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Khôi phục' })).toBeInTheDocument();
		expect(screen.getByTestId('bank-inspector')).toHaveTextContent('HRM là gì?');
	});
});
