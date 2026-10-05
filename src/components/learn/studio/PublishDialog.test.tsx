import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PublishDialog from './PublishDialog';

describe('PublishDialog', () => {
	it('keeps Xuất bản disabled while a blocker remains, and jumps to the section', () => {
		const onJump = vi.fn();
		const onPublish = vi.fn();
		render(
			<PublishDialog
				title="Khóa demo"
				blockers={[{ id: 'quiz-empty', sectionId: 's1', message: 'Bài kiểm tra chưa có câu' }]}
				warnings={[]}
				busy={false}
				onClose={() => undefined}
				onJump={onJump}
				onPublish={onPublish}
			/>,
		);
		const publish = screen.getByRole('button', { name: 'Xuất bản' });
		expect(publish).toBeDisabled();
		fireEvent.click(publish);
		expect(onPublish).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Đi tới mục' }));
		expect(onJump).toHaveBeenCalledWith('s1');
	});

	it('allows publishing with warnings only', () => {
		const onPublish = vi.fn();
		render(
			<PublishDialog
				title="Khóa demo"
				blockers={[]}
				warnings={[{ id: 'desc', sectionId: null, message: 'Khóa chưa có mô tả' }]}
				busy={false}
				onClose={() => undefined}
				onJump={() => undefined}
				onPublish={onPublish}
			/>,
		);
		fireEvent.click(screen.getByRole('button', { name: 'Vẫn xuất bản' }));
		expect(onPublish).toHaveBeenCalledTimes(1);
	});
});
