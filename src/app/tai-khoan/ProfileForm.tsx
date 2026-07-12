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

const fieldClass =
	'w-full min-h-11 rounded-[10px] border border-hairline bg-canvas px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-200 focus:border-ink disabled:text-ink-secondary';

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
		<form onSubmit={onSubmit} className="space-y-6 rounded-[18px] border border-hairline bg-paper p-5 sm:p-8">
			<div className="grid gap-4 sm:grid-cols-2">
				<div>
					<label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
						Họ tên (Google)
					</label>
					<input type="text" value={initialProfile.name} disabled className={fieldClass} />
				</div>
				<div>
					<label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
						Email
					</label>
					<input type="email" value={initialProfile.email} disabled className={fieldClass} />
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				<div>
					<label htmlFor="dob" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
						Ngày sinh
					</label>
					<input
						id="dob"
						type="date"
						value={form.dateOfBirth}
						onChange={(e) => setForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
						className={fieldClass}
					/>
				</div>
				<div>
					<label
						htmlFor="university"
						className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary"
					>
						Trường đại học
					</label>
					<input
						id="university"
						type="text"
						maxLength={120}
						placeholder="Ví dụ: Đại học Bách Khoa Hà Nội"
						value={form.university}
						onChange={(e) => setForm((prev) => ({ ...prev, university: e.target.value }))}
						className={fieldClass}
					/>
				</div>
				<div>
					<label htmlFor="major" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
						Chuyên ngành
					</label>
					<input
						id="major"
						type="text"
						maxLength={120}
						placeholder="Ví dụ: Công nghệ thông tin"
						value={form.major}
						onChange={(e) => setForm((prev) => ({ ...prev, major: e.target.value }))}
						className={fieldClass}
					/>
				</div>
			</div>

			<div>
				<div className="mb-1.5 flex items-center justify-between">
					<label htmlFor="bio" className="block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
						Bio
					</label>
					<span className="font-mono text-[11px] text-ink-secondary">{bioCount}/600</span>
				</div>
				<textarea
					id="bio"
					rows={5}
					maxLength={600}
					placeholder="Giới thiệu ngắn về bạn..."
					value={form.bio}
					onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
					className={`${fieldClass} min-h-[8rem]`}
				/>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-5">
				<div className="text-xs text-ink-secondary">
					{updatedAt
						? `Cập nhật lần cuối: ${new Date(updatedAt).toLocaleString('vi-VN')}`
						: 'Bạn chưa cập nhật hồ sơ lần nào.'}
				</div>
				<button
					type="submit"
					disabled={isSaving}
					className="inline-flex min-h-11 items-center rounded-[10px] bg-ink px-5 text-xs font-semibold uppercase tracking-[0.14em] text-paper transition duration-200 hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isSaving ? 'Đang lưu…' : 'Lưu hồ sơ'}
				</button>
			</div>

			{error ? (
				<p role="alert" className="text-sm text-error">
					{error}
				</p>
			) : null}
			{success ? <p className="text-sm text-success">{success}</p> : null}
		</form>
	);
}
