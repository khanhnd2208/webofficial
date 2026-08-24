import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TestBuilder from './TestBuilder';

vi.mock('next/navigation', () => ({
	useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock('./api', () => ({
	myClassApi: vi.fn(async () => ({ items: [] })),
}));

describe('TestBuilder', () => {
	it('updates knowledge coverage when adding a question from the bank', () => {
		render(
			<TestBuilder
				initial={{
					id: 'test-1',
					title: 'Progress Test',
					slug: 'progress-test',
					description: '',
					status: 'DRAFT',
					questions: [],
					placements: [],
				}}
				bank={[
					{
						id: 'question-1',
						stem: 'Câu hỏi mới về tuyển dụng',
						status: 'ACTIVE',
						knowledgeUnits: [
							{
								knowledgeUnit: {
									id: 'unit-1',
									slug: 'tuyen-dung',
									currentPublishedRevision: { title: 'Tuyển dụng hiệu quả' },
								},
							},
						],
					},
				]}
			/>,
		);

		expect(screen.getByText('Chưa có dữ liệu độ phủ.')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Câu hỏi mới về tuyển dụng' }));

		const coverage = screen.getByRole('heading', { name: 'Độ phủ nội dung' }).closest('section');
		expect(coverage).not.toBeNull();
		expect(within(coverage!).getByText('Tuyển dụng hiệu quả')).toBeInTheDocument();
		expect(within(coverage!).getByText('1')).toBeInTheDocument();
	});

	it('opens an attach form from the placements tab', () => {
		render(
			<TestBuilder
				initial={{
					id: 'test-1',
					title: 'Progress Test',
					slug: 'progress-test',
					description: '',
					status: 'DRAFT',
					questions: [],
					placements: [],
				}}
				bank={[]}
			/>,
		);
		fireEvent.click(screen.getByRole('button', { name: 'Đã gắn' }));
		expect(screen.getByText('Chưa gắn vào khóa nào.')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Gắn vào vị trí này' })).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Gắn vào khóa học' }));
		expect(screen.getByRole('button', { name: 'Gắn vào vị trí này' })).toBeInTheDocument();
	});
});
