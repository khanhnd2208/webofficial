'use client';

import { useMemo, useState } from 'react';

import type { UserProfileDTO } from '@/types/userProfile';

interface ProfileFormProps {
	initialProfile: UserProfileDTO;
}

interface ProfileFormState {
	dateOfBirth: string;
	university: string;
	major: string;
	bio: string;
}

function toDateInputValue(iso: string | null): string {
	if (!iso) return '';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '';
	return date.toISOString().slice(0, 10);
}

export default function ProfileForm({ initialProfile }: ProfileFormProps) {
	const [form, setForm] = useState<ProfileFormState>({
		dateOfBirth: toDateInputValue(initialProfile.dateOfBirth),
		university: initialProfile.university,
		major: initialProfile.major,
		bio: initialProfile.bio,
	});
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [updatedAt, setUpdatedAt] = useState<string | null>(initialProfile.updatedAt);

	const bioCount = useMemo(() => form.bio.length, [form.bio]);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setSuccess(null);
		setIsSaving(true);

		try {
			const response = await fetch('/api/profile', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					dateOfBirth: form.dateOfBirth || null,
					university: form.university,
					major: form.major,
					bio: form.bio,
				}),
			});

			const json = (await response.json()) as {
				ok?: boolean;
				error?: string;
				data?: UserProfileDTO;
			};

			if (!response.ok || !json.ok || !json.data) {
				throw new Error(json.error || 'Không thể lưu hồ sơ.');
			}

			setForm({
				dateOfBirth: toDateInputValue(json.data.dateOfBirth),
				university: json.data.university,
				major: json.data.major,
				bio: json.data.bio,
			});
			setUpdatedAt(json.data.updatedAt);
			setSuccess('Đã lưu hồ sơ thành công.');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không thể lưu hồ sơ.');
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<form onSubmit={onSubmit} className="space-y-6 border border-border bg-surface p-5 sm:p-6">
			<div className="grid gap-4 sm:grid-cols-2">
				<div>
					<label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Họ tên (Google)</label>
					<input
						type="text"
						value={initialProfile.name}
						disabled
						className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground-secondary"
					/>
				</div>
				<div>
					<label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Email</label>
					<input
						type="email"
						value={initialProfile.email}
						disabled
						className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground-secondary"
					/>
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				<div>
					<label htmlFor="dob" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Ngày sinh</label>
					<input
						id="dob"
						type="date"
						value={form.dateOfBirth}
						onChange={(e) => setForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
						className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground"
					/>
				</div>

				<div>
					<label htmlFor="university" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Trường đại học</label>
					<input
						id="university"
						type="text"
						maxLength={120}
						placeholder="Ví dụ: Đại học Bách Khoa Hà Nội"
						value={form.university}
						onChange={(e) => setForm((prev) => ({ ...prev, university: e.target.value }))}
						className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground"
					/>
				</div>

				<div>
					<label htmlFor="major" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Chuyên ngành</label>
					<input
						id="major"
						type="text"
						maxLength={120}
						placeholder="Ví dụ: Công nghệ thông tin"
						value={form.major}
						onChange={(e) => setForm((prev) => ({ ...prev, major: e.target.value }))}
						className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground"
					/>
				</div>
			</div>

			<div>
				<div className="mb-1.5 flex items-center justify-between">
					<label htmlFor="bio" className="block text-xs font-bold uppercase tracking-wider text-muted">Bio</label>
					<span className="text-[11px] text-muted">{bioCount}/600</span>
				</div>
				<textarea
					id="bio"
					rows={5}
					maxLength={600}
					placeholder="Giới thiệu ngắn về bạn..."
					value={form.bio}
					onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
					className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground"
				/>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
				<div className="text-xs text-muted">
					{updatedAt ? `Cập nhật lần cuối: ${new Date(updatedAt).toLocaleString('vi-VN')}` : 'Bạn chưa cập nhật hồ sơ lần nào.'}
				</div>
				<button
					type="submit"
					disabled={isSaving}
					className="inline-flex items-center gap-2 bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isSaving ? 'Đang lưu...' : 'Lưu hồ sơ'}
				</button>
			</div>

			{error && <p className="text-sm text-error">{error}</p>}
			{success && <p className="text-sm text-success">{success}</p>}
		</form>
	);
}