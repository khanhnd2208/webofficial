/** @vitest-environment-options {"url":"https://toiladuykhanh.com"} */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InAppBrowserNotice from './in-app-browser-notice';

const writeText = vi.fn();
beforeEach(() => {
	vi.clearAllMocks();
	window.history.replaceState({}, '', '/dang-nhap?from=%2Fkhoa-hoc&chon=1');
	Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
	vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 Zalo/123');
});

describe('embedded browser notice', () => {
	it('shows Zalo guidance and copies the complete login URL', async () => {
		writeText.mockResolvedValue(undefined);
		render(<InAppBrowserNotice />);
		expect(screen.getByText(/Bạn đang mở trong Zalo/)).toBeVisible();
		fireEvent.click(screen.getByRole('button', { name: 'Sao chép link' }));
		await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Đã sao chép link.'));
		expect(writeText).toHaveBeenCalledWith(window.location.href);
		expect(screen.queryByRole('link', { name: 'Mở bằng Chrome' })).toBeNull();
	});
	it('offers a selectable URL when clipboard access fails', async () => {
		writeText.mockRejectedValue(new Error('Permission denied'));
		render(<InAppBrowserNotice />);
		fireEvent.click(screen.getByRole('button', { name: 'Sao chép link' }));
		await waitFor(() =>
			expect(screen.getByRole('textbox', { name: 'Link đăng nhập' })).toHaveValue(
				window.location.href,
			),
		);
	});
	it('opens the same login destination in Chrome on HTTPS Android', () => {
		vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Android Zalo/123');
		render(<InAppBrowserNotice />);
		expect(screen.getByRole('link', { name: 'Mở bằng Chrome' })).toHaveAttribute(
			'href',
			'intent://toiladuykhanh.com/dang-nhap?from=%2Fkhoa-hoc&chon=1#Intent;scheme=https;package=com.android.chrome;end',
		);
	});
	it('stays out of ordinary Chrome and Safari', () => {
		vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Chrome/123');
		const { container } = render(<InAppBrowserNotice />);
		expect(container).toBeEmptyDOMElement();
	});
});
