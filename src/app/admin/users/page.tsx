import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAdminUserList } from '@/services/userManagementService';
import UsersTable from './UsersTable';
import type { UserRole } from '@/types/user';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Quản lý người dùng | Admin' };

interface PageProps {
	searchParams: Promise<{
		page?: string;
		search?: string;
		role?: string;
		sortBy?: string;
		sortDir?: string;
	}>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
	const session = await auth();
	if (session?.user?.role !== 'admin') redirect('/');

	const sp = await searchParams;
	const page = Math.max(1, parseInt(sp.page ?? '1', 10));
	const search = sp.search ?? '';
	const role = (sp.role ?? 'all') as UserRole | 'all';
	const sortBy = (sp.sortBy ?? 'createdAt') as 'createdAt' | 'name' | 'email';
	const sortDir = (sp.sortDir ?? 'desc') as 'asc' | 'desc';

	const result = await getAdminUserList({ page, pageSize: 20, search, role, sortBy, sortDir });

	return (
		<div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between flex-wrap gap-4">
				<div>
					<h1 className="text-2xl font-black tracking-tight text-foreground">Quản lý người dùng</h1>
					<p className="mt-1 text-sm text-muted">
						{result.total} tài khoản trong hệ thống
					</p>
				</div>
				{/* Role badges */}
				<div className="flex gap-2 text-xs flex-wrap">
					{(['all', 'student', 'admin'] as const).map((r) => (
						<a
							key={r}
							href={`/admin/users?role=${r}&search=${search}&sortBy=${sortBy}&sortDir=${sortDir}`}
							className={`px-3 py-1.5 rounded-full border font-semibold transition-colors ${
								role === r
									? 'bg-foreground text-background border-foreground'
									: 'border-border text-muted hover:border-border-hover hover:text-foreground'
							}`}
						>
							{r === 'all' ? 'Tất cả' : r === 'student' ? 'Người dùng' : 'Admin'}
						</a>
					))}
				</div>
			</div>

			<Suspense fallback={null}>
				<UsersTable
					result={result}
					currentSearch={search}
					currentRole={role}
					currentSortBy={sortBy}
					currentSortDir={sortDir}
				/>
			</Suspense>
		</div>
	);
}
