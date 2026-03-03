'use client';

import { useEffect, useState } from 'react';
import type { UserDetail } from '@/services/userManagementService';
import type { UserListItem } from '@/services/userManagementService';
import type { UserRole } from '@/types/user';
import { formatDate, formatDateTime, formatDistanceToNow } from '@/utils/formatDate';

const ROLE_COLORS: Record<UserRole, string> = {
	admin: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/40',
	teacher: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40',
	student: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900/40',
};
const STATUS_COLORS: Record<string, string> = {
	approved: 'text-green-600 dark:text-green-400',
	pending: 'text-yellow-600 dark:text-yellow-400',
	hidden: 'text-muted',
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
		setLoading(true);
		setDetail(null);
		fetch(`/api/admin/users/${userId}`)
			.then((r) => r.json())
			.then((d) => { setDetail(d); setLoading(false); })
			.catch(() => setLoading(false));
	}, [userId]);

	async function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
		const newRole = e.target.value as UserRole;
		setRoleChanging(true);
		await onRoleChange(userId, newRole);
		setCurrentRole(newRole);
		setRoleChanging(false);
	}

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Slide-in panel */}
			<div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-background border-l border-border shadow-2xl overflow-y-auto flex flex-col">
				{/* Panel header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
					<h2 className="text-base font-black text-foreground">Chi tiết người dùng</h2>
					<button
						onClick={onClose}
						className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
					>
						<svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
							<path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
						</svg>
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
									{userSummary.createdAt ? `Đăng ký ${formatDistanceToNow(userSummary.createdAt)}` : 'Người dùng cũ'}
								</span>
							</div>
						</div>
					</div>

					{loading ? (
						<div className="space-y-3">
							{[1,2,3,4].map(i => (
								<div key={i} className="h-16 rounded-xl bg-surface-hover animate-pulse" />
							))}
						</div>
					) : detail ? (
						<>
							{/* Stats grid */}
							<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
								<StatCard label="Bình luận" value={detail.commentCount} icon="💬" />
								<StatCard label="Bộ từ vựng" value={detail.vocabSetCount} icon="📚" />
								<StatCard
									label="Streak hiện tại"
									value={detail.currentStreak > 0 ? `🔥 ${detail.currentStreak}` : '—'}
									icon=""
									accent={detail.currentStreak > 0}
								/>
								<StatCard label="Đăng nhập/30 ngày" value={detail.loginDaysLast30} icon="📅" />
							</div>

							{/* Key dates */}
							<div className="rounded-xl border border-border bg-surface p-4 space-y-2">
								<p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Thông tin tài khoản</p>
							<Row label="Ngày đăng ký" value={detail.createdAt ? formatDateTime(detail.createdAt) : '—'} />
							<Row label="Cập nhật lần cuối" value={detail.updatedAt ? formatDateTime(detail.updatedAt) : '—'} />
								<Row
									label="Lần đăng nhập cuối"
									value={detail.lastLoginDate ? formatDate(detail.lastLoginDate) : '—'}
								/>
								<Row label="Streak dài nhất" value={detail.longestStreak > 0 ? `${detail.longestStreak} ngày` : '—'} />
							</div>

							{/* Recent comments */}
							{detail.recentComments.length > 0 && (
								<Section title="Bình luận gần đây">
									{detail.recentComments.map((c) => (
										<div key={c.id} className="rounded-lg border border-border bg-surface p-3 space-y-1">
											<div className="flex items-center justify-between gap-2">
												<a
													href={`/blog/${c.postSlug}`}
													target="_blank"
													rel="noreferrer"
													className="text-xs font-semibold text-foreground hover:underline truncate"
												>
													📝 {c.postTitle}
												</a>
												<span className={`text-[10px] font-bold shrink-0 ${STATUS_COLORS[c.status] ?? 'text-muted'}`}>
													{c.status}
												</span>
											</div>
											<p className="text-sm text-muted line-clamp-2">{c.content}</p>
											<p className="text-[10px] text-muted/60">{formatDistanceToNow(c.createdAt)}</p>
										</div>
									))}
								</Section>
							)}

							{/* Recent vocab sets */}
							{detail.recentVocabSets.length > 0 && (
								<Section title="Bộ từ vựng gần đây">
									{detail.recentVocabSets.map((v) => (
										<div key={v.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5">
											<div className="min-w-0">
												<p className="text-sm font-semibold text-foreground truncate">{v.title}</p>
												<p className="text-xs text-muted">{v.termCount} từ · {formatDistanceToNow(v.createdAt)}</p>
											</div>
											<span className={`shrink-0 ml-3 text-[10px] font-bold rounded-full px-2 py-0.5 border ${
												v.isPublic
													? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900/40'
													: 'bg-surface-hover text-muted border-border'
											}`}>
												{v.isPublic ? 'Công khai' : 'Riêng tư'}
											</span>
										</div>
									))}
								</Section>
							)}

							{/* Empty state */}
							{detail.commentCount === 0 && detail.vocabSetCount === 0 && (
								<div className="rounded-xl border border-dashed border-border p-8 text-center text-muted text-sm">
									Người dùng chưa có hoạt động nào
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

function StatCard({ label, value, icon, accent }: { label: string; value: string | number; icon: string; accent?: boolean }) {
	return (
		<div className="rounded-xl border border-border bg-surface p-3 text-center">
			{icon && <p className="text-lg">{icon}</p>}
			<p className={`text-xl font-black mt-0.5 tabular-nums ${accent ? 'text-orange-500' : 'text-foreground'}`}>
				{value}
			</p>
			<p className="text-[10px] text-muted mt-0.5 font-semibold">{label}</p>
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
