'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { StudioButton } from '@/components/myclass/admin/studio';
import { McIcon } from '@/components/myclass/ui';
import { teachingApi } from '@/components/teaching/admin/api';
import { routes } from '@/config/routes';
import type { StudentListPreview } from '@/features/teaching/services/importService';
import type { TeachingClassSetupResult } from '@/features/teaching/types';

function formatBytes(size: number) {
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
	return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImportWorkspace() {
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);
	const [file, setFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<StudentListPreview | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [dragOver, setDragOver] = useState(false);

	const invalidCount = preview?.students.filter((row) => !row.ok).length ?? 0;
	const step = preview ? (invalidCount > 0 ? 2 : 3) : 1;

	function chooseFile(next: File | null) {
		setFile(next);
		setPreview(null);
		setError(null);
	}

	async function run(mode: 'preview' | 'commit') {
		if (!file) {
			setError('Hãy chọn file Excel danh sách sinh viên trước.');
			return;
		}
		setBusy(true);
		setError(null);
		try {
			const body = new FormData();
			body.append('file', file);
			if (mode === 'preview') {
				const data = await teachingApi<StudentListPreview>(`/api/admin/teaching/import?mode=preview`, {
					method: 'POST',
					body,
				});
				setPreview(data);
			} else {
					const data = await teachingApi<TeachingClassSetupResult>(`/api/admin/teaching/import?mode=commit`, {
					method: 'POST',
					body,
				});
						router.push(routes.mySpaceTeachingClassTab(data.gradebook.class.id, 'attendance'));
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không thể import danh sách');
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="mt-7 space-y-5">
			<ol className="mc-stepper">
				<li data-state={step > 1 ? 'done' : 'current'}>1. Chọn file</li>
				<li data-state={step === 2 ? 'current' : step > 2 ? 'done' : undefined}>2. Xem trước</li>
				<li data-state={step === 3 ? 'current' : undefined}>3. Hoàn tất</li>
			</ol>

			<div className="mc-surface p-5">
				<input
					ref={inputRef}
					type="file"
					accept=".xlsx"
					className="sr-only"
					onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
				/>
				<button
					type="button"
					className="mc-dropzone w-full"
					data-active={dragOver}
					onClick={() => inputRef.current?.click()}
					onDragOver={(event) => {
						event.preventDefault();
						setDragOver(true);
					}}
					onDragLeave={() => setDragOver(false)}
					onDrop={(event) => {
						event.preventDefault();
						setDragOver(false);
						chooseFile(event.dataTransfer.files?.[0] ?? null);
					}}
				>
					<McIcon name="upload" size={28} className="text-accent" />
					<p className="text-sm font-semibold text-ink">Thả file Excel danh sách sinh viên vào đây</p>
				<p className="text-sm text-ink-secondary">hoặc bấm để chọn file .xlsx</p>
				</button>
				{file ? (
					<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
						<span className="mc-chip">
							{file.name}
							<span className="font-normal text-ink-secondary">· {formatBytes(file.size)}</span>
						</span>
						<StudioButton variant="quiet" size="sm" onClick={() => chooseFile(null)}>
							Bỏ file
						</StudioButton>
					</div>
				) : null}
				<div className="mt-4 flex flex-wrap gap-2">
					<StudioButton variant="secondary" disabled={busy} onClick={() => run('preview')}>
						Xem trước
					</StudioButton>
					<StudioButton disabled={busy || !preview || invalidCount > 0} onClick={() => run('commit')}>
						Hoàn tất import
					</StudioButton>
				</div>
				{error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
			</div>

			{preview ? (
				<div className="space-y-4">
					<dl className="mc-stat-tiles">
						<div className="mc-stat-tile">
							<dt>Học phần</dt>
							<dd>
								{preview.metadata.courseCode} · {preview.metadata.courseName}
							</dd>
						</div>
						<div className="mc-stat-tile">
							<dt>Lớp / học kỳ</dt>
							<dd>
								{preview.metadata.groupNo} · {preview.metadata.term}
							</dd>
						</div>
						<div className="mc-stat-tile">
							<dt>Giảng viên</dt>
							<dd>
								{preview.metadata.lecturerName} {preview.metadata.lecturerCode}
							</dd>
						</div>
						<div className="mc-stat-tile">
							<dt>Học viên</dt>
							<dd>
								{preview.students.length} dòng
								{preview.existingClassId ? ' · lớp hiện có sẽ được cập nhật' : ''}
							</dd>
						</div>
					</dl>

					{invalidCount > 0 ? (
						<p className="mc-banner" data-tone="error">
							Hãy kiểm tra lại {invalidCount} dòng lỗi trước khi hoàn tất.
						</p>
					) : (
						<p className="mc-banner" data-tone="ok">
							Tất cả dòng đều hợp lệ. Có thể hoàn tất để tạo hoặc cập nhật lớp.
						</p>
					)}

					<section className="mc-surface overflow-hidden">
						<div className="mc-card-head">
							<h2 className="text-base font-semibold text-ink">Xem trước danh sách</h2>
							<span className="mc-chip">{preview.students.length} dòng</span>
						</div>
						<div className="max-h-[32rem] overflow-auto">
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
										<th>Trạng thái</th>
									</tr>
								</thead>
								<tbody>
									{preview.students.map((row) => (
										<tr key={`${row.orderNo}-${row.studentCode}`} data-invalid={!row.ok || undefined}>
											<td className="mc-num">{row.orderNo}</td>
											<td className="mc-num">{row.studentCode}</td>
											<td>{row.familyName}</td>
											<td>{row.givenName}</td>
											<td>{row.homeClassCode}</td>
											<td>{row.majorName}</td>
											<td className="mc-num">{row.dateOfBirth ?? ''}</td>
											<td>
												{row.ok ? (
													<span className="mc-chip" data-tone="ok">
														<McIcon name="check" size={12} />
																					Hợp lệ
													</span>
												) : (
													<span className="mc-chip" data-tone="error">
														<McIcon name="error" size={12} />
														{row.errors.join('; ')}
													</span>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<div className="mc-card-foot">
							<span className="text-sm text-ink-secondary">
							Hiển thị {preview.students.length}/{preview.students.length} học viên
							</span>
							<StudioButton disabled={busy || invalidCount > 0} onClick={() => run('commit')}>
								Hoàn tất import
							</StudioButton>
						</div>
					</section>
				</div>
			) : null}
		</div>
	);
}
