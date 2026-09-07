import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TeachingPopoverRoot } from '@/components/teaching/TeachingPopover';

import { TeachingQuickMenu } from './TeachingQuickMenu';

describe('TeachingQuickMenu', () => {
	it('opens with the keyboard and mouse, then closes on Escape', () => {
		const onEdit = vi.fn();
		render(
			<TeachingPopoverRoot>
				<TeachingQuickMenu
					label="Thao tác môn HRM"
					items={[{ id: 'edit', label: 'Sửa', onSelect: onEdit }]}
				/>
			</TeachingPopoverRoot>,
		);
		const trigger = screen.getByRole('button', { name: 'Thao tác môn HRM' });
		fireEvent.click(trigger);
		const item = screen.getByRole('menuitem', { name: 'Sửa' });
		fireEvent.click(item);
		expect(onEdit).toHaveBeenCalledTimes(1);

		fireEvent.click(trigger);
		expect(screen.getByRole('menuitem', { name: 'Sửa' })).toBeInTheDocument();
		fireEvent.keyDown(document, { key: 'Escape' });
		expect(screen.queryByRole('menuitem', { name: 'Sửa' })).not.toBeInTheDocument();
	});
});
