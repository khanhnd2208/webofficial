'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAdminConfirm } from '@/components/admin/useAdminConfirm';
import {
	StudioButton,
	StudioField,
	StudioInput,
	StudioSelect,
} from '@/components/myclass/admin/studio';
import { teachingApi } from '@/components/teaching/admin/api';
import { formatDob } from '@/components/teaching/admin/attendanceLabels';
import { LearningExperienceMark } from '@/components/teaching/public/LearningExperienceMark';
import { Sheet } from '@/components/ui/Dialog';
import type { TeachingRosterStudent, TeachingTutorialRecord } from '@/features/teaching/types';

type StudentEditDraft = {
	enrollmentId: string;
	orderNo: string;
	familyName: string;
	givenName: string;
	homeClassCode: string;
	majorName: string;
	dateOfBirth: string;
};

export function RosterWorkspace({
	classId,
	tutorials,
	students,
}: {
	classId: string;
	tutorials: TeachingTutorialRecord[];
	students: TeachingRosterStudent[];
}) {
	const router = useRouter();
	const { confirm, dialog } = useAdminConfirm();
	const importRef = useRef<HTMLInputElement>(null);
	const [error, setError] = useState<string | null>(null);
	const [importMessage, setImportMessage] = useState('');
	const [importing, setImporting] = useState(false);
	const [editing, setEditing] = useState<StudentEditDraft | null>(null);
	const [addOpen, setAddOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'WITHDRAWN'>('ACTIVE');
	const [tutorialFilter, setTutorialFilter] = useState('all');
	const [form, setForm] = useState({
		studentCode: '',
		familyName: '',
		givenName: '',
		homeClassCode: '',
		majorName: '',
		dateOfBirth: '',
		tutorialClassId: tutorials[0]?.id ?? '',
	});
	const filteredStudents = useMemo(() => {
		const normalized = query.trim().toLowerCase();
		return students.filter((student) => {
			const matchesQuery =
				!normalized ||
				`${student.studentCode} ${student.familyName} ${student.givenName} ${student.homeClassCode} ${student.majorName}`
					.toLowerCase()
					.includes(normalized);
			const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
			const matchesTutorial =
				tutorialFilter === 'all' || student.tutorialClassId === tutorialFilter;
			return matchesQuery && matchesStatus && matchesTutorial;
		});
	}, [students, query, statusFilter, tutorialFilter]);

	async function addStudent(event: React.FormEvent) {
		event.preventDefault();
		setError(null);
		try {
			await teachingApi(`/api/admin/teaching/classes/${classId}/enrollments`, {
				method: 'POST',
				body: JSON.stringify({
					...form,
					dateOfBirth: form.dateOfBirth || null,
					tutorialClassId: form.tutorialClassId || null,
				}),
			});
			setForm((current) => ({
				...current,
				studentCode: '',
				familyName: '',
				givenName: '',
				homeClassCode: '',
				majorName: '',
				dateOfBirth: '',
			}));
			setAddOpen(false);
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not add student');
		}
	}

	async function assignTutorial(enrollmentId: string, tutorialClassId: string) {
		setError(null);
		try {
			await teachingApi(`/api/admin/teaching/enrollments/${enrollmentId}`, {
				method: 'PATCH',
				body: JSON.stringify({ tutorialClassId: tutorialClassId || null }),
			});
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không thể phân tutorial');
		}
	}

	async function updateLearningExperience(
		enrollmentId: string,
		learningExperienceAction: 'unlock' | 'clear',
	) {
		setError(null);
		try {
			await teachingApi(`/api/admin/teaching/enrollments/${enrollmentId}`, {
				method: 'PATCH',
				body: JSON.stringify({ learningExperienceAction }),
			});
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không thể cập nhật Learning Experience');
		}
	}

	function learningActions(student: TeachingRosterStudent) {
		if (!student.learningExperience) return <span className="text-ink-tertiary">Chưa chọn</span>;
		const usedChange = (student.learningExperienceChangeCount ?? 0) >= 1;
		return (
			<div className="flex flex-col items-start gap-1.5">
				<span className="inline-flex items-center gap-1.5">
					<LearningExperienceMark
						choice={student.learningExperience}
						size="sm"
						index={student.orderNo}
					/>
					<small className="text-[11px] text-ink-secondary">
						{usedChange ? 'đã đổi 1/1' : 'còn 1 lần đổi'}
					</small>
				</span>
				<div className="flex flex-wrap gap-1">
					{usedChange ? (
						<button
							type="button"
							className="mc-button mc-button-ghost min-h-8 px-2 text-[11px]"
							onClick={() => void updateLearningExperience(student.enrollmentId, 'unlock')}
						>
							Mở khóa
						</button>
					) : null}
					<button
						type="button"
						className="mc-button mc-button-ghost min-h-8 px-2 text-[11px]"
						onClick={async () => {
							const ok = await confirm({
								title: 'Xóa lựa chọn',
								description: `Xóa lựa chọn Learning Experience của ${student.studentCode}?`,
								confirmLabel: 'Xóa',
							});
							if (ok) void updateLearningExperience(student.enrollmentId, 'clear');
						}}
					>
						Xóa lựa chọn
					</button>
				</div>
			</div>
		);
	}

	async function withdraw(enrollmentId: string) {
		setError(null);
		try {
			await teachingApi(`/api/admin/teaching/enrollments/${enrollmentId}`, { method: 'DELETE' });
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không thể xoá học viên khỏi lớp');
		}
	}

	function beginEdit(student: TeachingRosterStudent) {
		setEditing({
			enrollmentId: student.enrollmentId,
			orderNo: String(student.orderNo),
			familyName: student.familyName,
			givenName: student.givenName,
			homeClassCode: student.homeClassCode,
			majorName: student.majorName,
			dateOfBirth: student.dateOfBirth ?? '',
		});
	}

	async function saveEdit() {
		if (!editing) return;
		setError(null);
		try {
			await teachingApi(`/api/admin/teaching/enrollments/${editing.enrollmentId}`, {
				method: 'PATCH',
				body: JSON.stringify({
					orderNo: Number(editing.orderNo),
					familyName: editing.familyName,
					givenName: editing.givenName,
					homeClassCode: editing.homeClassCode,
					majorName: editing.majorName,
					dateOfBirth: editing.dateOfBirth || null,
				}),
			});
			setEditing(null);
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không thể lưu thông tin học viên');
		}
	}

	async function importRoster(file: File | null) {
		if (!file) return;
		setImporting(true);
		setError(null);
		setImportMessage('');
		try {
			const body = new FormData();
			body.append('file', file);
			const result = await teachingApi<{
				addedCount: number;
				updatedCount: number;
				skippedCount: number;
			}>(`/api/admin/teaching/classes/${classId}/roster-import`, { method: 'POST', body });
			setImportMessage(
				`Đã thêm ${result.addedCount}, bổ sung dữ liệu còn thiếu cho ${result.updatedCount} học viên; không đổi ${result.skippedCount} mã đã có.`,
			);
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không thể import danh sách');
		} finally {
			setImporting(false);
		}
	}

	return (
		<>
		<div className="mt-6 space-y-6">
			<div className="mc-surface flex flex-wrap items-center justify-between gap-3 p-5">
				<div>
					<h2 className="font-semibold text-ink">Danh sách học viên</h2>
					<p className="mc-meta mt-1">
						Thêm thủ công hoặc import bổ sung; mã đã có chỉ được điền các trường còn thiếu.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<StudioButton onClick={() => setAddOpen(true)}>Thêm học viên</StudioButton>
					<input
						ref={importRef}
						type="file"
						accept=".xlsx"
						className="sr-only"
						onChange={(event) => void importRoster(event.target.files?.[0] ?? null)}
					/>
					<StudioButton
						variant="secondary"
						disabled={importing}
						onClick={() => importRef.current?.click()}
					>
						{importing ? 'Đang import…' : 'Import danh sách'}
					</StudioButton>
				</div>
			</div>
			<Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Thêm học viên">
				<form className="grid gap-3 md:grid-cols-2" onSubmit={addStudent}>
					<StudioField label="Mã SV">
						<StudioInput
							required
							value={form.studentCode}
							onChange={(event) =>
								setForm((current) => ({ ...current, studentCode: event.target.value }))
							}
						/>
					</StudioField>
					<StudioField label="Họ lót">
						<StudioInput
							required
							value={form.familyName}
							onChange={(event) =>
								setForm((current) => ({ ...current, familyName: event.target.value }))
							}
						/>
					</StudioField>
					<StudioField label="Tên">
						<StudioInput
							required
							value={form.givenName}
							onChange={(event) =>
								setForm((current) => ({ ...current, givenName: event.target.value }))
							}
						/>
					</StudioField>
					<StudioField label="Mã lớp">
						<StudioInput
							value={form.homeClassCode}
							onChange={(event) =>
								setForm((current) => ({ ...current, homeClassCode: event.target.value }))
							}
						/>
					</StudioField>
					<StudioField label="Ngành">
						<StudioInput
							value={form.majorName}
							onChange={(event) =>
								setForm((current) => ({ ...current, majorName: event.target.value }))
							}
						/>
					</StudioField>
					<StudioField label="Ngày sinh">
						<StudioInput
							type="date"
							value={form.dateOfBirth}
							onChange={(event) =>
								setForm((current) => ({ ...current, dateOfBirth: event.target.value }))
							}
						/>
					</StudioField>
					<StudioField label="Lớp tutorial">
						<StudioSelect
							required
							value={form.tutorialClassId}
							onChange={(event) =>
								setForm((current) => ({ ...current, tutorialClassId: event.target.value }))
							}
						>
							<option value="" disabled>
								Chọn tutorial
							</option>
							{tutorials.map((tutorial) => (
								<option key={tutorial.id} value={tutorial.id}>
									{tutorial.code} · {tutorial.name}
								</option>
							))}
						</StudioSelect>
					</StudioField>
					<div className="flex items-end">
						<StudioButton type="submit">Thêm học viên</StudioButton>
					</div>
					{error ? <p className="md:col-span-2 text-sm text-error">{error}</p> : null}
				</form>
			</Sheet>
			{importMessage ? (
				<p className="mc-banner" data-tone="ok">
					{importMessage}
				</p>
			) : null}
			<div className="teaching-roster-toolbar mc-surface flex flex-wrap gap-2 p-3">
				<label className="min-w-52 flex-1">
					<span className="sr-only">Tìm học viên</span>
					<input
						className="mc-input w-full"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Tìm tên, MSV, mã lớp hoặc ngành"
					/>
				</label>
				<label>
					<span className="sr-only">Lọc trạng thái</span>
					<select
						className="mc-input"
						value={statusFilter}
						onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
					>
						<option value="ACTIVE">Đang học</option>
						<option value="WITHDRAWN">Đã rút</option>
						<option value="all">Tất cả trạng thái</option>
					</select>
				</label>
				<label>
					<span className="sr-only">Lọc tutorial</span>
					<select
						className="mc-input"
						value={tutorialFilter}
						onChange={(event) => setTutorialFilter(event.target.value)}
					>
						<option value="all">Tất cả tutorial</option>
						{tutorials.map((tutorial) => (
							<option key={tutorial.id} value={tutorial.id}>
								{tutorial.code}
							</option>
						))}
					</select>
				</label>
				<span className="mc-meta self-center">
					{filteredStudents.length}/{students.length} học viên
				</span>
			</div>

			<div className="teaching-roster-table mc-surface overflow-auto">
				<table className="mc-data-table w-full text-sm">
					<thead>
						<tr>
							<th>STT</th>
							<th>Mã SV</th>
							<th>Họ lót</th>
							<th>Tên</th>
							<th>Mã lớp</th>
							<th>Tên ngành</th>
							<th>Ngày sinh</th>
							<th>Học từ tuần</th>
							<th>Tutorial</th>
							<th>Learning</th>
							<th>Trạng thái</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{filteredStudents.map((student) => {
							const isEditing = editing?.enrollmentId === student.enrollmentId;
							const field = (key: Exclude<keyof StudentEditDraft, 'enrollmentId'>) =>
								isEditing ? editing[key] : '';
							const patchEdit = (
								key: Exclude<keyof StudentEditDraft, 'enrollmentId'>,
								value: string,
							) => setEditing((current) => (current ? { ...current, [key]: value } : current));
							return (
								<tr key={student.enrollmentId}>
									<td className="mc-num">
										{isEditing ? (
											<input
												aria-label={`STT ${student.studentCode}`}
												type="number"
												min={1}
												value={field('orderNo')}
												onChange={(event) => patchEdit('orderNo', event.target.value)}
												className="min-h-9 w-14 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-2 text-sm"
											/>
										) : (
											student.orderNo
										)}
									</td>
									<td className="mc-num">{student.studentCode}</td>
									<td>
										{isEditing ? (
											<input
												aria-label={`Họ lót ${student.studentCode}`}
												value={field('familyName')}
												onChange={(event) => patchEdit('familyName', event.target.value)}
												className="min-h-9 min-w-28 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-2 text-sm"
											/>
										) : (
											student.familyName
										)}
									</td>
									<td className="font-semibold">
										{isEditing ? (
											<input
												aria-label={`Tên ${student.studentCode}`}
												value={field('givenName')}
												onChange={(event) => patchEdit('givenName', event.target.value)}
												className="min-h-9 min-w-24 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-2 text-sm font-semibold"
											/>
										) : (
											student.givenName
										)}
									</td>
									<td>
										{isEditing ? (
											<input
												aria-label={`Mã lớp ${student.studentCode}`}
												value={field('homeClassCode')}
												onChange={(event) => patchEdit('homeClassCode', event.target.value)}
												className="min-h-9 min-w-24 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-2 text-sm"
											/>
										) : (
											student.homeClassCode
										)}
									</td>
									<td>
										{isEditing ? (
											<input
												aria-label={`Ngành ${student.studentCode}`}
												value={field('majorName')}
												onChange={(event) => patchEdit('majorName', event.target.value)}
												className="min-h-9 min-w-32 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-2 text-sm"
											/>
										) : (
											student.majorName
										)}
									</td>
									<td className="mc-num">
										{isEditing ? (
											<input
												aria-label={`Ngày sinh ${student.studentCode}`}
												type="date"
												value={field('dateOfBirth')}
												onChange={(event) => patchEdit('dateOfBirth', event.target.value)}
												className="min-h-9 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-2 text-sm"
											/>
										) : (
											formatDob(student.dateOfBirth)
										)}
									</td>
									<td>
										<input
											type="number"
											min={1}
											max={40}
											aria-label={`Enrolled from week for ${student.studentCode}`}
											className="min-h-9 w-16 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-2 text-sm"
											defaultValue={student.enrolledFromWeek}
											onBlur={(event) => {
												const next = Number(event.target.value);
												if (!Number.isInteger(next) || next === student.enrolledFromWeek) return;
												setError(null);
												void teachingApi(
													`/api/admin/teaching/enrollments/${student.enrollmentId}`,
													{
														method: 'PATCH',
														body: JSON.stringify({ enrolledFromWeek: next }),
													},
												)
													.then(() => router.refresh())
													.catch((err: unknown) => {
														setError(
															err instanceof Error
																? err.message
																: 'Không thể cập nhật tuần bắt đầu học',
														);
													});
											}}
										/>
									</td>
									<td>
										<select
											className="min-h-9 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-2 text-sm"
											value={student.tutorialClassId ?? ''}
											onChange={(event) => assignTutorial(student.enrollmentId, event.target.value)}
										>
											<option value="">Chưa phân tutorial</option>
											{tutorials.map((tutorial) => (
												<option key={tutorial.id} value={tutorial.id}>
													{tutorial.code}
												</option>
											))}
										</select>
									</td>
									<td>{learningActions(student)}</td>
									<td>{student.status === 'ACTIVE' ? 'Đang học' : 'Đã xoá khỏi lớp'}</td>
									<td>
										{student.status === 'ACTIVE' ? (
											isEditing ? (
												<div className="flex gap-2">
													<StudioButton size="sm" onClick={() => void saveEdit()}>
														Lưu
													</StudioButton>
													<StudioButton variant="quiet" size="sm" onClick={() => setEditing(null)}>
														Huỷ
													</StudioButton>
												</div>
											) : (
												<div className="flex gap-2">
													<StudioButton
														variant="secondary"
														size="sm"
														onClick={() => beginEdit(student)}
													>
														Sửa
													</StudioButton>
													<StudioButton
														variant="danger"
														size="sm"
														onClick={() => void withdraw(student.enrollmentId)}
													>
														Xoá khỏi lớp
													</StudioButton>
												</div>
											)
										) : null}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
			<div className="teaching-roster-cards">
				{filteredStudents.map((student) => (
					<article key={student.enrollmentId} className="teaching-roster-card mc-surface">
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<p className="mc-num text-xs font-semibold text-accent">{student.studentCode}</p>
								<h3 className="mt-1 truncate text-base font-semibold text-ink">
									{student.familyName} {student.givenName}
								</h3>
								<p className="mt-1 text-xs text-ink-secondary">
									{student.homeClassCode || 'Chưa có mã lớp'} ·{' '}
									{student.majorName || 'Chưa có ngành'}
								</p>
							</div>
							<span
								className="teaching-status"
								data-tone={student.status === 'ACTIVE' ? 'ok' : 'muted'}
							>
								{student.status === 'ACTIVE' ? 'Đang học' : 'Đã rút'}
							</span>
						</div>
						<div className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink-secondary">
							<span>
								Tutorial{' '}
								<strong className="block text-ink">
									{tutorials.find((tutorial) => tutorial.id === student.tutorialClassId)?.code ??
										'Chưa phân'}
								</strong>
							</span>
							<span>
								Học từ tuần <strong className="block text-ink">{student.enrolledFromWeek}</strong>
							</span>
						</div>
						<div className="mt-3">{learningActions(student)}</div>
						<div className="mt-3 flex justify-end gap-2">
							{student.status === 'ACTIVE' ? (
								<>
									<StudioButton variant="secondary" size="sm" onClick={() => beginEdit(student)}>
										Sửa
									</StudioButton>
									<StudioButton
										variant="danger"
										size="sm"
										onClick={() => void withdraw(student.enrollmentId)}
									>
										Xóa khỏi lớp
									</StudioButton>
								</>
							) : null}
						</div>
					</article>
				))}
				{filteredStudents.length === 0 ? (
					<p className="mc-surface p-6 text-center text-sm text-ink-secondary">
						Không tìm thấy học viên phù hợp.
					</p>
				) : null}
			</div>
			<Sheet
				open={Boolean(editing)}
				onClose={() => setEditing(null)}
				title="Sửa thông tin học viên"
			>
				{editing ? (
					<form
						className="grid gap-3 md:grid-cols-2"
						onSubmit={(event) => {
							event.preventDefault();
							void saveEdit();
						}}
					>
						<label className="text-xs font-semibold">
							STT
							<input
								className="mc-input mt-1 w-full"
								type="number"
								min={1}
								value={editing.orderNo}
								onChange={(event) => setEditing({ ...editing, orderNo: event.target.value })}
							/>
						</label>
						<label className="text-xs font-semibold">
							Họ lót
							<input
								className="mc-input mt-1 w-full"
								value={editing.familyName}
								onChange={(event) => setEditing({ ...editing, familyName: event.target.value })}
							/>
						</label>
						<label className="text-xs font-semibold">
							Tên
							<input
								className="mc-input mt-1 w-full"
								value={editing.givenName}
								onChange={(event) => setEditing({ ...editing, givenName: event.target.value })}
							/>
						</label>
						<label className="text-xs font-semibold">
							Mã lớp
							<input
								className="mc-input mt-1 w-full"
								value={editing.homeClassCode}
								onChange={(event) => setEditing({ ...editing, homeClassCode: event.target.value })}
							/>
						</label>
						<label className="text-xs font-semibold">
							Ngành
							<input
								className="mc-input mt-1 w-full"
								value={editing.majorName}
								onChange={(event) => setEditing({ ...editing, majorName: event.target.value })}
							/>
						</label>
						<label className="text-xs font-semibold">
							Ngày sinh
							<input
								className="mc-input mt-1 w-full"
								type="date"
								value={editing.dateOfBirth}
								onChange={(event) => setEditing({ ...editing, dateOfBirth: event.target.value })}
							/>
						</label>
						<div className="flex justify-end gap-2 md:col-span-2">
							<StudioButton variant="quiet" type="button" onClick={() => setEditing(null)}>
								Hủy
							</StudioButton>
							<StudioButton type="submit">Lưu</StudioButton>
						</div>
					</form>
				) : null}
			</Sheet>
		</div>
		{dialog}
		</>
	);
}
