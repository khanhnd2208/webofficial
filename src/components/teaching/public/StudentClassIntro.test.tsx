import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StudentClassIntro } from './StudentClassIntro';

describe('StudentClassIntro', () => {
	it('keeps announcements visible and all 20 resources available behind disclosure', () => {
		render(<StudentClassIntro summary="Tóm tắt" description={'Giới thiệu dài. '.repeat(100)} announcement="Thông báo quan trọng" links={Array.from({ length: 20 }, (_, index) => ({ id: String(index), label: `Tài liệu ${index + 1}`, url: `https://example.com/${index}`, description: 'Mô tả đầy đủ' }))} />);
		expect(screen.getByText('Thông báo quan trọng')).toBeVisible();
		const summary = screen.getByText('Tài nguyên lớp (20)');
		expect(summary.closest('details')).not.toHaveAttribute('open');
		fireEvent.click(summary);
		expect(summary.closest('details')).toHaveAttribute('open');
		expect(screen.getAllByRole('link')).toHaveLength(20);
		expect(screen.getByRole('link', { name: /Tài liệu 20/ })).toHaveAttribute('href', 'https://example.com/19');
	});
});
