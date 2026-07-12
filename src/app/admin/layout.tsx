import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import AdminSidebar from './AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const session = await auth();
	if (!session?.user) {
		redirect('/dang-nhap?from=/admin');
	}
	if (session.user.role !== 'admin') {
		redirect('/');
	}

	return (
		<div className="flex min-h-screen flex-col bg-background md:flex-row">
			<AdminSidebar />
			<div className="min-w-0 flex-1 overflow-auto">{children}</div>
		</div>
	);
}
