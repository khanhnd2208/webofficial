import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SaveToLibraryButton from './SaveToLibraryButton';

describe('SaveToLibraryButton', () => {
	it('asks guests to sign in', () => {
		render(
			<SaveToLibraryButton courseSlug="hrm" setId="set-1" initialSaved={false} signedIn={false} />,
		);
		expect(screen.getByRole('link', { name: 'Đăng nhập để lưu vào từ vựng của tôi' })).toHaveAttribute(
			'href',
			expect.stringContaining('/dang-nhap?callbackUrl='),
		);
	});

	it('saves a linked set for a signed-in learner', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			json: async () => ({ ok: true, data: { saved: true } }),
		});
		vi.stubGlobal('fetch', fetchMock);
		render(<SaveToLibraryButton courseSlug="hrm" setId="set-1" initialSaved={false} signedIn />);
		fireEvent.click(screen.getByRole('button', { name: 'Thêm vào từ vựng của tôi' }));
		await waitFor(() => expect(screen.getByTestId('vocab-saved')).toBeVisible());
		expect(fetchMock).toHaveBeenCalledWith('/api/my-class/courses/hrm/vocab/set-1/library', {
			method: 'POST',
		});
		vi.unstubAllGlobals();
	});
});
