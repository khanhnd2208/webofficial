'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition, useCallback } from 'react';
import type { UserListResult, UserListItem } from '@/services/userManagementService';
import type { UserRole } from '@/types/user';
import UserDetailPanel from './UserDetailPanel';
import { formatDistanceToNow } from '@/utils/formatDate';

interface Props {
	result: UserListResult;
	currentSearch: string;
	currentRole: UserRole | 'all';
	currentSortBy: 'createdAt' | 'name' | 'email';
	currentSortDir: 'asc' | 'desc';
}

const ROLE_COLORS: Record<UserRole, string> = {
	admin: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/40',
	teacher: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40',
	student: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900/40',
};

const ROLE_LABELS: Record<UserRole, string> = {
	admin: 'Admin',
	teacher: 'Teacher',
	student: 'Student',
};

export default function UsersTable({
	result,
	currentSearch,
	currentRole,
	currentSortBy,
	currentSortDir,
}: Props) {
	const router = useRouter();
	const pathname = usePathname();
	const [isPending, startTransition] = useTransition();
	const [search, setSearch] = useState(currentSearch);
	const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);

	function buildUrl(params: Record<string, string>) {
		const sp = new URLSearchParams({
			role: currentRole,
			search: currentSearch,
			sortBy: currentSortBy,
			sortDir: currentSortDir,
			page: '1',
			...params,
		});
		return `${pathname}?${sp.toString()}`;
	}

	function navigate(params: Record<string, string>) {
		startTransition(() => router.push(buildUrl(params)));
	}

	function handleSearchSubmit(e: React.FormEvent) {
		e.preventDefault();
		navigate({ search });
	}

	function toggleSort(field: 'createdAt' | 'name' | 'email') {
		const newDir = currentSortBy === field && currentSortDir === 'desc' ? 'asc' : 'desc';
		navigate({ sortBy: field, sortDir: newDir });
	}

	function SortIcon({ field }: { field: string }) {
		if (currentSortBy !== field) return <span className="text-muted opacity-40">↕</span>;
		return <span className="text-foreground">{currentSortDir === 'desc' ? '↓' : '↑'}</span>;
	}

	const handleRoleChange = useCallback(async (userId: string, newRole: UserRole) => {
		await fetch(`/api/admin/users/${userId}/role`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ role: newRole }),
		});
		startTransition(() => router.refresh());
	}, [router]);

	return (
		<div className="space-y-4">
			{/* Search bar */}
			<form onSubmit={handleSearchSubmit} className="flex gap-2">
				<div className="relative flex-1">
					<svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" viewBox="0 0 20 20" fill="none">
						<circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
						<path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
					</svg>
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Tìm tên hoặc email..."
						className="w-full rounded-lg border border-border bg-surface pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
					/>
				</div>
				<button
					type="submit"
					className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-hover transition-colors"
				>
					Tìm
				</button>
				{(currentSearch || currentRole !== 'all') && (
					<a
						href="/admin/users"
						className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
					>
						Xoá lọc
					</a>
				)}
			</form>

			{/* Table */}
			<div className={`rounded-xl border border-border overflow-hidden transition-opacity ${isPending ? 'opacity-60' : ''}`}>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-border bg-surface-hover">
								<th className="px-4 py-3 text-left">
									<button
										onClick={() => toggleSort('name')}
										className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-widest text-muted hover:text-foreground"
									>
										Người dùng <SortIcon field="name" />
									</button>
								</th>
								<th className="px-4 py-3 text-left">
									<span className="font-bold text-xs uppercase tracking-widest text-muted">Role</span>
								</th>
								<th className="px-4 py-3 text-right hidden sm:table-cell">
									<span className="font-bold text-xs uppercase tracking-widest text-muted">Bình luận</span>
								</th>
								<th className="px-4 py-3 text-right hidden sm:table-cell">
									<span className="font-bold text-xs uppercase tracking-widest text-muted">Từ vựng</span>
								</th>
								<th className="px-4 py-3 text-right hidden md:table-cell">
									<span className="font-bold text-xs uppercase tracking-widest text-muted">🔥 Streak</span>
								</th>
								<th className="px-4 py-3 text-right hidden lg:table-cell">
									<button
										onClick={() => toggleSort('createdAt')}
										className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-widest text-muted hover:text-foreground ml-auto"
									>
										Ngày đăng ký <SortIcon field="createdAt" />
									</button>
								</th>
								<th className="px-4 py-3" />
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{result.users.length === 0 ? (
								<tr>
									<td colSpan={7} className="px-4 py-12 text-center text-muted text-sm">
										Không tìm thấy người dùng nào
									</td>
								</tr>
							) : (
								result.users.map((u) => (
									<UserRow
										key={u.id}
										user={u}
										isSelected={selectedUser?.id === u.id}
										onSelect={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}
										onRoleChange={handleRoleChange}
									/>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Pagination */}
			{result.totalPages > 1 && (
				<div className="flex items-center justify-between text-sm text-muted flex-wrap gap-3">
					<span>
						Trang {result.page} / {result.totalPages} — {result.total} người dùng
					</span>
					<div className="flex gap-2">
						{result.page > 1 && (
							<a
								href={buildUrl({ page: String(result.page - 1) })}
								className="px-3 py-1.5 rounded-lg border border-border hover:bg-surface-hover transition-colors"
							>
								← Trước
							</a>
						)}
						{Array.from({ length: Math.min(result.totalPages, 5) }, (_, i) => {
							const pageNum = Math.max(1, result.page - 2) + i;
							if (pageNum > result.totalPages) return null;
							return (
								<a
									key={pageNum}
									href={buildUrl({ page: String(pageNum) })}
									className={`px-3 py-1.5 rounded-lg border transition-colors ${
										pageNum === result.page
											? 'bg-foreground text-background border-foreground'
											: 'border-border hover:bg-surface-hover'
									}`}
								>
									{pageNum}
								</a>
							);
						})}
						{result.page < result.totalPages && (
							<a
								href={buildUrl({ page: String(result.page + 1) })}
								className="px-3 py-1.5 rounded-lg border border-border hover:bg-surface-hover transition-colors"
							>
								Tiếp →
							</a>
						)}
					</div>
				</div>
			)}

			{/* Side panel for selected user */}
			{selectedUser && (
				<UserDetailPanel
					userId={selectedUser.id}
					userSummary={selectedUser}
					onClose={() => setSelectedUser(null)}
					onRoleChange={handleRoleChange}
				/>
			)}
		</div>
	);
}

// ─── Single row ───────────────────────────────────────────────────────────────
function UserRow({
	user,
	isSelected,
	onSelect,
	onRoleChange,
}: {
	user: UserListItem;
	isSelected: boolean;
	onSelect: () => void;
	onRoleChange: (id: string, role: UserRole) => void;
}) {
	const [roleChanging, setRoleChanging] = useState(false);

	async function handleRole(e: React.ChangeEvent<HTMLSelectElement>) {
		e.stopPropagation();
		setRoleChanging(true);
		await onRoleChange(user.id, e.target.value as UserRole);
		setRoleChanging(false);
	}

	return (
		<tr
			onClick={onSelect}
			className={`cursor-pointer transition-colors hover:bg-surface-hover ${
				isSelected ? 'bg-surface-hover' : ''
			}`}
		>
			{/* Avatar + name + email */}
			<td className="px-4 py-3">
				<div className="flex items-center gap-3 min-w-0">
					{user.image ? (
						<img
							src={user.image}
							alt={user.name}
							className="h-8 w-8 rounded-full object-cover shrink-0 border border-border"
						/>
					) : (
						<div className="h-8 w-8 rounded-full bg-surface-hover border border-border flex items-center justify-center shrink-0">
							<span className="text-xs font-bold text-muted">
								{user.name.charAt(0).toUpperCase()}
							</span>
						</div>
					)}
					<div className="min-w-0">
						<p className="font-semibold text-foreground truncate">{user.name}</p>
						<p className="text-xs text-muted truncate">{user.email}</p>
					</div>
				</div>
			</td>
			{/* Role selector */}
			<td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
				<select
					value={user.role}
					onChange={handleRole}
					disabled={roleChanging}
					className={`rounded-full border px-2.5 py-1 text-xs font-semibold cursor-pointer focus:outline-none disabled:opacity-60 ${ROLE_COLORS[user.role]}`}
				>
					{(['student', 'teacher', 'admin'] as UserRole[]).map((r) => (
						<option key={r} value={r}>{ROLE_LABELS[r]}</option>
					))}
				</select>
			</td>
			{/* Comments */}
			<td className="px-4 py-3 text-right hidden sm:table-cell">
				<span className="text-foreground font-medium tabular-nums">{user.commentCount}</span>
			</td>
			{/* Vocab sets */}
			<td className="px-4 py-3 text-right hidden sm:table-cell">
				<span className="text-foreground font-medium tabular-nums">{user.vocabSetCount}</span>
			</td>
			{/* Streak */}
			<td className="px-4 py-3 text-right hidden md:table-cell">
				<span className={`font-medium tabular-nums ${user.currentStreak > 0 ? 'text-orange-500' : 'text-muted'}`}>
					{user.currentStreak > 0 ? `🔥 ${user.currentStreak}` : '—'}
				</span>
			</td>
			{/* Joined */}
			<td className="px-4 py-3 text-right text-xs text-muted hidden lg:table-cell whitespace-nowrap">
				{formatDistanceToNow(user.createdAt)}
			</td>
			{/* Detail arrow */}
			<td className="px-3 py-3 text-right">
				<span className={`text-muted transition-transform inline-block ${isSelected ? 'rotate-180' : ''}`}>
					<svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
						<path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</span>
			</td>
		</tr>
	);
}
