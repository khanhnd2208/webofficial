'use client';

import { Icon } from '@/components/ui/Icon';
import { useEffect, useState } from 'react';
import type { UserDetail } from '@/services/userManagementService';
import type { UserListItem } from '@/services/userManagementService';
import type { UserRole } from '@/types/user';
import { formatDateTime, formatDistanceToNow } from '@/utils/formatDate';
import { adminFetch } from '@/lib/admin/client';

const ROLE_COLORS: Record<UserRole, string> = {
	admin:
		'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/40',
	student:
		'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900/40',
};

interface Props {
	userId: string;
	userSummary: UserListItem;
	onClose: () => void;
	onRoleChange: (id: string, role: UserRole) => void;
}

export default function UserDetailPanel({ userId, userSummary, onClose, onRoleChange }: Props) {
	const [detail, setDetail] = useState<UserDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [roleChanging, setRoleChanging] = useState(false);
	const [currentRole, setCurrentRole] = useState<UserRole>(userSummary.role);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setLoading(true);
		setDetail(null);
		void adminFetch<UserDetail>(`/api/admin/users/${userId}`)
			.then((data) => {
				setDetail(data);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, [userId]);

	async function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
		const newRole = e.target.value as UserRole;
		setRoleChanging(true);
		await onRoleChange(userId, newRole);
		setCurrentRole(newRole);
		setRoleChanging(false);
	}

	const activeEnrollments = detail?.enrollments.filter((e) => e.status === 'ACTIVE') ?? [];
	const revokedEnrollments = detail?.enrollments.filter((e) => e.status !== 'ACTIVE') ?? [];

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

			{/* Slide-in panel */}
			<div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-background border-l border-border shadow-2xl overflow-y-auto flex flex-col">
				{/* Panel header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
					<h2 className="text-base font-black text-foreground">Chi tiết người dùng</h2>
					<button
						onClick={onClose}
						className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
					>
						<Icon name="close" className="h-4 w-4" />
					</button>
				</div>

				<div className="flex-1 px-6 py-5 space-y-6">
					{/* User identity card */}
					<div className="flex items-start gap-4">
						{userSummary.image ? (
							<img
								src={userSummary.image}
								alt={userSummary.name}
								className="h-14 w-14 rounded-full object-cover border-2 border-border shrink-0"
							/>
						) : (
							<div className="h-14 w-14 rounded-full bg-surface-hover border-2 border-border flex items-center justify-center shrink-0">
								<span className="text-xl font-black text-muted">
									{userSummary.name.charAt(0).toUpperCase()}
								</span>
							</div>
						)}
						<div className="flex-1 min-w-0">
							<h3 className="text-lg font-black text-foreground">{userSummary.name}</h3>
							<p className="text-sm text-muted break-all">{userSummary.email}</p>
							<div className="mt-2 flex items-center gap-2">
								<select
									value={currentRole}
									onChange={handleRoleChange}
									disabled={roleChanging}
									className={`rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer focus:outline-none disabled:opacity-60 ${ROLE_COLORS[currentRole]}`}
								>
									{(['student', 'admin'] as UserRole[]).map((r) => (
										<option key={r} value={r}>
											{r === 'admin' ? 'Admin' : 'Người dùng'}
										</option>
									))}
								</select>
								<span className="text-xs text-muted">
									{userSummary.createdAt
										? `Đăng ký ${formatDistanceToNow(userSummary.createdAt)}`
										: 'Người dùng cũ'}
								</span>
							</div>
						</div>
					</div>

					{loading ? (
						<div className="space-y-3">
							{[1, 2, 3, 4].map((i) => (
								<div key={i} className="h-16 rounded-xl bg-surface-hover animate-pulse" />
							))}
						</div>
					) : detail ? (
						<>
							{/* Account info */}
							<div className="rounded-xl border border-border bg-surface p-4 space-y-2">
								<p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">
									Thông tin tài khoản
								</p>
								<Row
									label="Ngày đăng ký"
									value={detail.createdAt ? formatDateTime(detail.createdAt) : '—'}
								/>
								<Row
									label="Cập nhật lần cuối"
									value={detail.updatedAt ? formatDateTime(detail.updatedAt) : '—'}
								/>
								<Row
									label="Lần đăng nhập cuối"
									value={detail.lastLoginDate ? formatDateTime(detail.lastLoginDate) : '—'}
								/>
							</div>

							{/* Enrollment stats bar */}
							<div className="grid grid-cols-3 gap-3">
								<StatCard
									label="Đang học"
									value={activeEnrollments.length}
									accent={activeEnrollments.length > 0}
								/>
								<StatCard label="Tổng khóa" value={detail.enrollments.length} />
								<StatCard label="Đã hủy" value={revokedEnrollments.length} />
							</div>

							{/* Active enrollments */}
							{activeEnrollments.length > 0 && (
								<Section title="Khóa học đang ghi danh">
									{activeEnrollments.map((e) => {
										const pct =
											e.totalLessons > 0
												? Math.round((e.completedLessons / e.totalLessons) * 100)
												: 0;
										return (
											<div
												key={e.id}
												className="rounded-lg border border-border bg-surface p-3 space-y-2"
											>
												<div className="flex items-start justify-between gap-2">
													<p className="text-sm font-semibold text-foreground truncate">
														{e.courseTitle}
													</p>
													<span className="shrink-0 text-xs font-bold rounded-full px-2 py-0.5 border bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900/40">
														Active
													</span>
												</div>
												<div>
													<div className="flex items-baseline justify-between text-xs text-muted mb-1">
														<span>
															{e.completedLessons}/{e.totalLessons} bài
														</span>
														<span className="font-mono">{pct}%</span>
													</div>
													<div className="h-1 overflow-hidden rounded-full bg-surface-hover">
														<div
															className="h-full bg-accent transition-[width] duration-400"
															style={{ width: `${pct}%` }}
														/>
													</div>
												</div>
												<p className="text-xs text-muted">
													Ghi danh {formatDistanceToNow(e.enrolledAt)}
												</p>
											</div>
										);
									})}
								</Section>
							)}

							{/* Revoked enrollments */}
							{revokedEnrollments.length > 0 && (
								<Section title="Ghi danh đã hủy">
									{revokedEnrollments.map((e) => (
										<div
											key={e.id}
											className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5"
										>
											<p className="text-sm text-foreground truncate">{e.courseTitle}</p>
											<span className="shrink-0 ml-3 text-xs font-bold rounded-full px-2 py-0.5 border bg-surface-hover text-muted border-border">
												Đã hủy
											</span>
										</div>
									))}
								</Section>
							)}

							{/* Empty state */}
							{detail.enrollments.length === 0 && (
								<div className="rounded-xl border border-dashed border-border p-8 text-center text-muted text-sm">
									Người dùng chưa được ghi danh khóa học nào
								</div>
							)}
						</>
					) : (
						<div className="rounded-xl border border-dashed border-border p-8 text-center text-muted text-sm">
							Không thể tải thông tin người dùng
						</div>
					)}
				</div>
			</div>
		</>
	);
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
	return (
		<div className="rounded-xl border border-border bg-surface p-3 text-center">
			<p
				className={`text-xl font-black tabular-nums ${accent ? 'text-accent' : 'text-foreground'}`}
			>
				{value}
			</p>
			<p className="text-xs text-muted mt-0.5 font-semibold">{label}</p>
		</div>
	);
}

function Row({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="flex items-center justify-between text-sm">
			<span className="text-muted">{label}</span>
			<span className="font-semibold text-foreground">{value}</span>
		</div>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="space-y-2">
			<p className="text-xs font-bold uppercase tracking-widest text-muted">{title}</p>
			<div className="space-y-2">{children}</div>
		</div>
	);
}
