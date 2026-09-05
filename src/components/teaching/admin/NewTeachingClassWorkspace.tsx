'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { StudioButton, StudioField, StudioInput } from '@/components/myclass/admin/studio';
import { teachingApi } from '@/components/teaching/admin/api';
import { StudentIntakeWorkspace } from '@/components/teaching/admin/StudentIntakeWorkspace';
import { TeachingAppHeader } from '@/components/teaching/admin/TeachingAppHeader';
import { routes } from '@/config/routes';
import type { RosterConflictResolution, RosterImportPreview } from '@/features/teaching/domain/rosterImport';
import type { TeachingClassSetupResult } from '@/features/teaching/types';

export function NewTeachingClassWorkspace() {
	const router = useRouter();
	const [step, setStep] = useState(1);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [preview, setPreview] = useState<RosterImportPreview | null>(null);
	const [resolutions, setResolutions] = useState<Record<string, RosterConflictResolution>>({});
	const [form, setForm] = useState({
		courseCode: '',
		courseName: '',
		groupNo: '',
		term: '',
		credits: '',
		lecturerName: '',
		lecturerCode: '',
		totalWeeks: '10',
	});

	function patchForm(key: keyof typeof form, value: string) {
		setForm((current) => ({ ...current, [key]: value }));
	}

	function applyMetadata(next: RosterImportPreview) {
		if (!next.metadata) return;
		setForm((current) => ({
			...current,
			courseCode: current.courseCode || next.metadata?.courseCode || '',
			courseName: current.courseName || next.metadata?.courseName || '',
			groupNo: current.groupNo || next.metadata?.groupNo || '',
			term: current.term || next.metadata?.term || '',
			credits: current.credits || (next.metadata?.credits == null ? '' : String(next.metadata.credits)),
			lecturerName: current.lecturerName || next.metadata?.lecturerName || '',
			lecturerCode: current.lecturerCode || next.metadata?.lecturerCode || '',
		}));
	}

	async function createClass() {
		setError('');
		if (!form.courseCode || !form.courseName || !form.groupNo || !form.term) {
			setError('Hãy điền đủ mã học phần, tên học phần, nhóm và học kỳ.');
			setStep(1);
			return;
		}
		if (!preview?.rows.length) {
			setError('Hãy import hoặc thêm ít nhất một học viên.');
			setStep(2);
			return;
		}
		if (preview.existingClassId) {
			setError('Lớp này đã tồn tại. Hãy mở lớp hiện có để thêm danh sách.');
			return;
		}
		setBusy(true);
		try {
			const result = await teachingApi<TeachingClassSetupResult>('/api/admin/teaching/classes/setup', {
				method: 'POST',
				body: JSON.stringify({
					class: {
						...form,
						credits: form.credits ? Number(form.credits) : null,
						totalWeeks: Number(form.totalWeeks),
					},
					rows: preview.rows.map((row) => ({
						key: row.key,
						input: row.input,
						expectedUpdatedAt: row.existing?.updatedAt ?? null,
						resolution: resolutions[row.key] ?? row.resolution,
					})),
				}),
			});
			router.push(routes.mySpaceTeachingClassTab(result.gradebook.class.id, 'attendance'));
		} catch (reason) {
			const typed = reason as Error & { fields?: Record<string, string> };
			setError(
				typed.fields?.existingClassId
					? 'Lớp đã tồn tại. Hãy mở lớp hiện có từ bước xem lại.'
					: typed.message,
			);
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="mc-studio-container max-w-5xl px-0 py-8">
			<TeachingAppHeader
				backHref={routes.mySpaceTeaching}
				backLabel="Các lớp"
				eyebrow="Teaching"
				title="Tạo lớp mới"
				description="Tạo thông tin lớp và danh sách học viên trong một luồng."
				actions={
					<StudioButton variant="quiet" onClick={() => router.push(routes.mySpaceTeaching)}>
						Huỷ
					</StudioButton>
				}
			/>

			<ol className="mc-stepper mt-6">
				{['Thông tin lớp', 'Danh sách học viên', 'Xem lại & tạo'].map((label, index) => (
					<li
						key={label}
						data-state={step === index + 1 ? 'current' : step > index + 1 ? 'done' : undefined}
					>
						{index + 1}. {label}
					</li>
				))}
			</ol>

			{step === 1 ? (
				<section className="mc-surface mt-5 grid gap-4 p-5 md:grid-cols-2">
					<StudioField label="Mã học phần">
						<StudioInput required value={form.courseCode} onChange={(event) => patchForm('courseCode', event.target.value)} />
					</StudioField>
					<StudioField label="Tên học phần">
						<StudioInput required value={form.courseName} onChange={(event) => patchForm('courseName', event.target.value)} />
					</StudioField>
					<StudioField label="Mã lớp">
						<StudioInput required value={form.groupNo} onChange={(event) => patchForm('groupNo', event.target.value)} />
					</StudioField>
					<StudioField label="Học kỳ">
						<StudioInput required value={form.term} onChange={(event) => patchForm('term', event.target.value)} />
					</StudioField>
					<StudioField label="Số tuần">
						<StudioInput type="number" min={1} max={20} value={form.totalWeeks} onChange={(event) => patchForm('totalWeeks', event.target.value)} />
					</StudioField>
					<StudioField label="Số tín chỉ">
						<StudioInput type="number" min={1} max={20} value={form.credits} onChange={(event) => patchForm('credits', event.target.value)} />
					</StudioField>
					<StudioField label="Giảng viên">
						<StudioInput value={form.lecturerName} onChange={(event) => patchForm('lecturerName', event.target.value)} />
					</StudioField>
					<StudioField label="Mã giảng viên">
						<StudioInput value={form.lecturerCode} onChange={(event) => patchForm('lecturerCode', event.target.value)} />
					</StudioField>
					<div className="md:col-span-2 flex justify-end">
						<StudioButton
							onClick={() => {
								setError('');
								setStep(2);
							}}
						>
							Tiếp tục
						</StudioButton>
					</div>
				</section>
			) : null}

			{step === 2 ? (
				<div className="mt-5 space-y-4">
					<StudentIntakeWorkspace
						commitLabel="Dùng danh sách này"
						onExternalCommit={async (next, nextResolutions) => {
							applyMetadata(next);
							setPreview(next);
							setResolutions(nextResolutions);
							if (next.existingClassId) {
								setError('Lớp này đã tồn tại. Không ghi đè dữ liệu.');
								return;
							}
							setError('');
							setStep(3);
						}}
					/>
					{preview?.existingClassId ? (
						<div className="mc-banner" data-tone="error">
							<p>Lớp này đã tồn tại. Không ghi đè dữ liệu.</p>
							<Link
								className="mt-2 inline-flex font-semibold underline"
								href={routes.mySpaceTeachingClassTab(preview.existingClassId, 'students')}
							>
								Mở lớp hiện có
							</Link>
						</div>
					) : null}
					<div className="flex justify-between">
						<StudioButton variant="quiet" onClick={() => setStep(1)}>
							Quay lại
						</StudioButton>
					</div>
				</div>
			) : null}

			{step === 3 ? (
				<section className="mc-surface mt-5 space-y-5 p-5">
					<div>
						<p className="mc-eyebrow">Xác nhận</p>
						<h2 className="mt-1 text-lg font-semibold text-ink">Sẵn sàng tạo lớp</h2>
						<p className="mt-1 text-sm text-ink-secondary">
							{form.courseCode} · {form.courseName} · Lớp {form.groupNo} · {preview?.rows.length ?? 0} học viên
						</p>
					</div>
					<div className="flex flex-wrap justify-between gap-2">
						<StudioButton variant="quiet" onClick={() => setStep(2)}>
							Quay lại
						</StudioButton>
						<StudioButton disabled={busy} onClick={() => void createClass()}>
							{busy ? 'Đang tạo…' : 'Tạo lớp và mở workspace'}
						</StudioButton>
					</div>
				</section>
			) : null}
			{error ? <p className="mt-4 text-sm font-semibold text-error">{error}</p> : null}
		</div>
	);
}
