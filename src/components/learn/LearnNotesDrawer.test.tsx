import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LearnNotesDrawer from './LearnNotesDrawer';

const { adminFetch } = vi.hoisted(() => ({ adminFetch: vi.fn() }));

vi.mock('@/lib/admin/client', () => ({
	adminFetch,
}));

describe('LearnNotesDrawer', () => {
	beforeEach(() => {
		adminFetch.mockReset();
		adminFetch.mockResolvedValue(undefined);
	});

	it('saves the pending note as soon as the drawer closes', () => {
		render(<LearnNotesDrawer sectionId="s1" initialNote="" />);

		fireEvent.click(screen.getByRole('button', { name: 'Ghi chú' }));
		fireEvent.change(screen.getByPlaceholderText(/Ghi lại ý/), { target: { value: 'Nhớ ý này' } });
		fireEvent.click(screen.getByRole('button', { name: 'Đóng ghi chú' }));

		expect(adminFetch).toHaveBeenCalledWith(
			'/api/learn/sections/s1/progress',
			expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ note: 'Nhớ ý này' }) }),
		);
	});
});
