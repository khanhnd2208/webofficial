import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AdminShell from './AdminShell';
import { ArchiveBanner } from './ArchiveBanner';

const navigation = vi.hoisted(() => ({ pathname: '/admin' }));

vi.mock('next/navigation', () => ({
	usePathname: () => navigation.pathname,
}));

vi.mock('next-auth/react', () => ({
	useSession: () => ({ data: { user: { name: 'Admin', role: 'admin' } }, status: 'authenticated' }),
	signOut: vi.fn(),
}));

describe('ArchiveBanner', () => {
	it('warns that the module is archived and links back to main admin', () => {
		render(<ArchiveBanner />);
		expect(screen.getByTestId('archive-banner')).toHaveTextContent('Đã lưu trữ');
		expect(screen.getByTestId('archive-back-to-admin')).toHaveAttribute('href', '/admin');
	});
});

describe('AdminShell', () => {
	it('uses the main shell for Website and Active Recall', () => {
		navigation.pathname = '/admin/website';
		render(
			<AdminShell>
				<p>Website workspace</p>
			</AdminShell>,
		);

		expect(screen.getByTestId('admin-shell')).toHaveAttribute('data-variant', 'main');
		expect(screen.queryByTestId('archive-banner')).not.toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Website' })).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Teaching' })).not.toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Active Recall' })).toHaveAttribute(
			'href',
			'/admin/tools/active-recall',
		);
		expect(screen.getByTestId('admin-archive-link')).toHaveAttribute('href', '/admin/archive');
		expect(screen.queryByRole('link', { name: 'My Class' })).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Bài viết' })).not.toBeInTheDocument();
	});

	it('uses the archive shell with a warning when opening a paused module', () => {
		navigation.pathname = '/admin/posts';
		render(
			<AdminShell>
				<p>Posts workspace</p>
			</AdminShell>,
		);

		expect(screen.getByTestId('admin-shell')).toHaveAttribute('data-variant', 'archive');
		expect(screen.getByTestId('archive-banner')).toBeInTheDocument();
		expect(screen.getByTestId('archive-back-to-admin')).toHaveAttribute('href', '/admin');
		expect(screen.getByTestId('archive-sidebar-back')).toHaveAttribute('href', '/admin');
		expect(screen.getByRole('link', { name: 'Bài viết / Ghi chép' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'My Class' })).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Teaching' })).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Active Recall' })).not.toBeInTheDocument();
	});

	it('keeps My Class local navigation inside the archive shell', () => {
		navigation.pathname = '/admin/my-class/courses';
		render(
			<AdminShell>
				<p>My Class studio</p>
			</AdminShell>,
		);

		expect(screen.getByTestId('admin-shell')).toHaveAttribute('data-variant', 'archive');
		expect(screen.getByRole('navigation', { name: 'Điều hướng mục' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Khóa học' })).toHaveAttribute(
			'aria-current',
			'page',
		);
	});

	it('marks Active Recall as the current main-nav item', () => {
		navigation.pathname = '/admin/tools/active-recall/new';
		render(
			<AdminShell>
				<p>New deck</p>
			</AdminShell>,
		);

		expect(screen.getByTestId('admin-shell')).toHaveAttribute('data-variant', 'main');
		const activeRecall = screen.getByRole('link', { name: 'Active Recall' });
		expect(activeRecall.className).toMatch(/bg-foreground/);
		expect(screen.getByRole('link', { name: 'Website' }).className).not.toMatch(/bg-foreground/);
	});
});
