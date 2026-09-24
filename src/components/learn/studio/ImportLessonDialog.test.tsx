import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ImportLessonDialog from './ImportLessonDialog';

describe('ImportLessonDialog fidelity gate', () => {
	it('shows one difference and keeps import locked until the admin confirms', () => {
		render(
			<ImportLessonDialog
				lessons={[]}
				selectedLessonId={null}
				onClose={vi.fn()}
				onImport={vi.fn()}
			/>,
		);

		fireEvent.change(screen.getByRole('textbox', { name: 'Kết quả AI' }), {
			target: { value: '# Bài\n\n=== SECTION: A ===\nXin chào em.' },
		});
		fireEvent.click(screen.getByRole('tab', { name: 'Bản gốc' }));
		fireEvent.change(screen.getByRole('textbox', { name: 'Bản gốc' }), {
			target: { value: 'Bài\n\nA\nXin chào bạn.' },
		});

		expect(screen.getByText('Khác 1 chỗ')).toBeInTheDocument();
		const submit = screen.getByRole('button', { name: 'Nhập 1 mục' });
		expect(submit).toBeDisabled();
		fireEvent.click(screen.getByRole('checkbox', { name: /Tôi đã xem 1 chỗ khác/ }));
		expect(submit).toBeEnabled();
	});
});
