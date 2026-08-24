'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
	StudioButton,
	StudioField,
	StudioInput,
	StudioSelect,
} from '@/components/myclass/admin/studio';
import { teachingApi } from '@/components/teaching/admin/api';
import { ABSENCE_DEDUCTION_POINTS, ATTENDANCE_MAX_POINTS, CP_MAX_POINTS } from '@/features/teaching/domain/cp';
import type { TeachingClassRecord } from '@/features/teaching/types';

export function SettingsForm({ teachingClass }: { teachingClass: TeachingClassRecord }) {
	const router = useRouter();
	const [form, setForm] = useState(teachingClass);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const isDirty = JSON.stringify(form) !== JSON.stringify(teachingClass);

	async function save(event: React.FormEvent) {
		event.preventDefault();
		setError(null);
		try {
			await teachingApi(`/api/admin/teaching/classes/${teachingClass.id}`, {
				method: 'PATCH',
				body: JSON.stringify({
					courseCode: form.courseCode,
					courseName: form.courseName,
					groupNo: form.groupNo,
					term: form.term,
					credits: form.credits,
					lecturerName: form.lecturerName,
					lecturerCode: form.lecturerCode,
				totalWeeks: form.totalWeeks,
				absenceThresholdPercent: form.absenceThresholdPercent,
					lateGraceMinutes: form.lateGraceMinutes,
					status: form.status,
				}),
			});
			setMessage('Đã lưu thiết lập');
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không thể lưu thiết lập');
		}
	}

	return (
		<div className="mt-6">
			<form className="mc-surface grid gap-4 p-5 md:grid-cols-2" onSubmit={save}>
				<StudioField label="Mã học phần">
					<StudioInput
						value={form.courseCode}
						onChange={(event) => setForm({ ...form, courseCode: event.target.value })}
					/>
				</StudioField>
				<StudioField label="Tên học phần">
					<StudioInput
						value={form.courseName}
						onChange={(event) => setForm({ ...form, courseName: event.target.value })}
					/>
				</StudioField>
				<StudioField label="Mã lớp">
					<StudioInput
						value={form.groupNo}
						onChange={(event) => setForm({ ...form, groupNo: event.target.value })}
					/>
				</StudioField>
				<StudioField label="Học kỳ">
					<StudioInput
						value={form.term}
						onChange={(event) => setForm({ ...form, term: event.target.value })}
					/>
				</StudioField>
				<StudioField label="Giảng viên">
					<StudioInput
						value={form.lecturerName}
						onChange={(event) => setForm({ ...form, lecturerName: event.target.value })}
					/>
				</StudioField>
				<StudioField label="Mã giảng viên">
					<StudioInput
						value={form.lecturerCode}
						onChange={(event) => setForm({ ...form, lecturerCode: event.target.value })}
					/>
				</StudioField>
				<StudioField label="Tổng số tuần">
					<StudioInput
						type="number"
						min={1}
						max={20}
						value={form.totalWeeks}
						onChange={(event) => setForm({ ...form, totalWeeks: Number(event.target.value) })}
					/>
				</StudioField>
				<StudioField label="Số phút cho phép đi muộn">
					<StudioInput
						type="number"
						min={0}
						value={form.lateGraceMinutes}
						onChange={(event) => setForm({ ...form, lateGraceMinutes: Number(event.target.value) })}
					/>
				</StudioField>
				<div className="rounded-[var(--mc-r-sm)] border border-mc-rule bg-surface-sunken p-3 text-sm text-ink-secondary md:col-span-2">
					<strong className="text-ink">Quy định điểm cố định:</strong> Attendance tối đa {ATTENDANCE_MAX_POINTS} điểm; CP
					tối đa {CP_MAX_POINTS} điểm; mỗi buổi vắng không phép, đi muộn hoặc không có trạng thái khi buổi đã bắt đầu
					trừ {ABSENCE_DEDUCTION_POINTS.toString().replace('.', ',')} điểm Attendance.
				</div>
				<StudioField label="Ngưỡng cấm thi (%)">
					<StudioInput
						type="number"
						value={form.absenceThresholdPercent}
						onChange={(event) =>
							setForm({ ...form, absenceThresholdPercent: Number(event.target.value) })
						}
					/>
				</StudioField>
				<StudioField label="Trạng thái">
					<StudioSelect
						value={form.status}
						onChange={(event) =>
							setForm({ ...form, status: event.target.value as 'ACTIVE' | 'ARCHIVED' })
						}
					>
						<option value="ACTIVE">Đang hoạt động</option>
						<option value="ARCHIVED">Đã lưu trữ</option>
					</StudioSelect>
				</StudioField>
				<div className="teaching-save-bar md:col-span-2 flex items-center justify-between gap-3">
					<div>
						{message ? <p className="text-sm text-ink-secondary">{message}</p> : null}
						{error ? <p className="text-sm text-error">{error}</p> : null}
						{isDirty ? <p className="text-xs text-ink-secondary">Có thay đổi chưa lưu</p> : null}
					</div>
					<StudioButton type="submit" disabled={!isDirty}>
						Lưu thiết lập
					</StudioButton>
				</div>
			</form>
		</div>
	);
}
