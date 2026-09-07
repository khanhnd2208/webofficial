'use client';

import { useMemo, useRef, useState } from 'react';

import { StudioButton, StudioField, StudioInput, StudioSelect } from '@/components/myclass/admin/studio';
import { teachingApi, AdminApiError } from '@/components/teaching/admin/api';
import {
	ROSTER_PROFILE_FIELDS,
	rosterPreviewCanCommit,
	type RosterConflictResolution,
	type RosterFieldDecision,
	type RosterImportCommitResult,
	type RosterImportPreview,
	type RosterImportPreviewRow,
	type RosterProfileField,
	type RosterRowStatus,
} from '@/features/teaching/domain/rosterImport';
import { rosterPasteSample } from '@/features/teaching/imports/rosterCsvTemplate';
import type { TeachingTutorialRecord } from '@/features/teaching/types';

type IntakeMode = 'manual' | 'paste' | 'csv' | 'xlsx';
type StatusFilter = 'all' | RosterRowStatus | 'open';

const STATUS_LABEL: Record<RosterRowStatus, string> = {
	new: 'Mới',
	exact: 'Trùng hoàn toàn',
	fill_blank: 'Bổ sung trường trống',
	conflict: 'Có xung đột',
	invalid: 'Không hợp lệ',
};

const FIELD_LABEL: Record<RosterProfileField, string> = {
	familyName: 'Họ lót',
	givenName: 'Tên',
	dateOfBirth: 'Ngày sinh',
	homeClassCode: 'Mã lớp',
	majorName: 'Ngành',
	phone: 'Điện thoại',
	email: 'Email',
};

const emptyManual = {
	studentCode: '',
	familyName: '',
	givenName: '',
	homeClassCode: '',
	majorName: '',
	dateOfBirth: '',
	phone: '',
	email: '',
	tutorialClassId: '',
	tutorialCode: '',
	enrolledFromWeek: '1',
	orderNo: '',
};

function accessLabel(row: RosterImportPreviewRow) {
	return row.accessMode === 'DOB_PASSWORD'
		? 'Có ngày sinh — dùng mật khẩu ddmmyyyy'
		: 'Chưa có ngày sinh — vào trực tiếp';
}

export function StudentIntakeWorkspace({
	classId,
	tutorials = [],
	onCommitted,
	onExternalCommit,
	commitLabel = 'Lưu danh sách',
}: {
	classId?: string;
	tutorials?: TeachingTutorialRecord[];
	onCommitted?: (result: RosterImportCommitResult) => void;
	onExternalCommit?: (preview: RosterImportPreview, resolutions: Record<string, RosterConflictResolution>) => Promise<void>;
	commitLabel?: string;
}) {
	const fileRef = useRef<HTMLInputElement>(null);
	const [mode, setMode] = useState<IntakeMode>('manual');
	const [manual, setManual] = useState(emptyManual);
	const [pasteText, setPasteText] = useState('');
	const [preview, setPreview] = useState<RosterImportPreview | null>(null);
	const [resolutions, setResolutions] = useState<Record<string, RosterConflictResolution>>({});
	const [filter, setFilter] = useState<StatusFilter>('all');
	const [error, setError] = useState('');
	const [message, setMessage] = useState('');
	const [busy, setBusy] = useState(false);

	const previewUrl = classId
		? `/api/admin/teaching/classes/${classId}/roster-import?mode=preview`
		: '/api/admin/teaching/import?mode=preview';
	const commitUrl = classId
		? `/api/admin/teaching/classes/${classId}/roster-import?mode=commit`
		: '';

	const visibleRows = useMemo(() => {
		if (!preview) return [];
		return preview.rows.filter((row) => {
			if (filter === 'all') return true;
			if (filter === 'open') return row.accessMode === 'OPEN';
			return row.status === filter;
		});
	}, [filter, preview]);

	const canCommit =
		preview != null &&
		rosterPreviewCanCommit(
			preview.rows.map((row) => ({
				...row,
				status:
					row.status === 'conflict' &&
					row.conflicts.every((conflict) => resolutions[row.key]?.[conflict.field])
						? 'fill_blank'
						: row.status,
			})),
		);

	async function runPreview(body: BodyInit) {
		setBusy(true);
		setError('');
		setMessage('');
		try {
			const data = await teachingApi<RosterImportPreview>(previewUrl, { method: 'POST', body });
			setPreview(data);
			setResolutions(
				Object.fromEntries(data.rows.map((row) => [row.key, { ...row.resolution }])),
			);
			if (data.summary.invalidCount > 0) {
				setFilter('invalid');
			} else if (data.summary.conflictCount > 0) {
				setFilter('conflict');
			} else {
				setFilter('all');
			}
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Không đọc được danh sách');
		} finally {
			setBusy(false);
		}
	}

	async function previewManual(event: React.FormEvent) {
		event.preventDefault();
		await runPreview(
			JSON.stringify({
				source: 'manual',
				students: [
					{
						...manual,
						dateOfBirth: manual.dateOfBirth || null,
						phone: manual.phone || null,
						email: manual.email || null,
						tutorialClassId: manual.tutorialClassId || null,
						orderNo: manual.orderNo ? Number(manual.orderNo) : null,
						enrolledFromWeek: manual.enrolledFromWeek ? Number(manual.enrolledFromWeek) : 1,
					},
				],
			}),
		);
	}

	async function previewPaste() {
		await runPreview(JSON.stringify({ source: 'paste', text: pasteText }));
	}

	async function previewFile(file: File | null) {
		if (!file) return;
		const body = new FormData();
		body.append('file', file);
		await runPreview(body);
	}

	function setDecision(rowKey: string, field: RosterProfileField, decision: RosterFieldDecision) {
		setResolutions((current) => ({
			...current,
			[rowKey]: { ...current[rowKey], [field]: decision },
		}));
	}

	function keepAllCurrent() {
		if (!preview) return;
		setResolutions((current) => {
			const next = { ...current };
			for (const row of preview.rows) {
				if (row.status !== 'conflict') continue;
				next[row.key] = Object.fromEntries(row.conflicts.map((conflict) => [conflict.field, 'keep']));
			}
			return next;
		});
	}

	async function commit() {
		if (!preview || !canCommit) return;
		setBusy(true);
		setError('');
		try {
			if (onExternalCommit) {
				await onExternalCommit(preview, resolutions);
				return;
			}
			if (!commitUrl) {
				setError('Hãy tạo lớp trước, hoặc dùng luồng tạo lớp mới để lưu danh sách này.');
				return;
			}
			const result = await teachingApi<RosterImportCommitResult>(commitUrl, {
				method: 'POST',
				body: JSON.stringify({
					rows: preview.rows.map((row) => ({
						key: row.key,
						input: row.input,
						expectedUpdatedAt: row.existing?.updatedAt ?? null,
						resolution: resolutions[row.key] ?? row.resolution,
					})),
				}),
			});
			setMessage(
				`Đã thêm ${result.addedCount}, tái kích hoạt ${result.reactivatedCount}, bổ sung ${result.filledCount}, cập nhật ${result.updatedCount}, bỏ qua ${result.skippedCount}.`,
			);
			onCommitted?.(result);
			setPreview(null);
			setManual(emptyManual);
			setPasteText('');
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Không lưu được danh sách');
			if (reason instanceof AdminApiError && reason.code === 'STALE_PREVIEW') {
				setError('Dữ liệu đã thay đổi, hãy đối chiếu lại');
			}
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="space-y-4">
			<div className="mc-surface p-4">
				<div className="flex flex-wrap gap-2" role="tablist" aria-label="Cách bổ sung sinh viên">
					{(
						[
							['manual', 'Nhập thủ công'],
							['paste', 'Dán dữ liệu'],
							['csv', 'CSV chuẩn'],
							['xlsx', 'Excel HANU'],
						] as const
					).map(([value, label]) => (
						<button
							key={value}
							type="button"
							role="tab"
							aria-selected={mode === value}
							className="mc-button mc-button-ghost min-h-11"
							data-active={mode === value || undefined}
							onClick={() => setMode(value)}
						>
							{label}
						</button>
					))}
				</div>

				{mode === 'manual' ? (
					<form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={(event) => void previewManual(event)}>
						<StudioField label="Mã SV">
							<StudioInput required value={manual.studentCode} onChange={(event) => setManual({ ...manual, studentCode: event.target.value })} />
						</StudioField>
						<StudioField label="Họ lót">
							<StudioInput required value={manual.familyName} onChange={(event) => setManual({ ...manual, familyName: event.target.value })} />
						</StudioField>
						<StudioField label="Tên">
							<StudioInput required value={manual.givenName} onChange={(event) => setManual({ ...manual, givenName: event.target.value })} />
						</StudioField>
						<StudioField label="Tutorial">
							{tutorials.length > 0 ? (
								<StudioSelect value={manual.tutorialClassId} onChange={(event) => setManual({ ...manual, tutorialClassId: event.target.value })}>
									<option value="">Chưa phân tutorial</option>
									{tutorials.map((tutorial) => (
										<option key={tutorial.id} value={tutorial.id}>
											{tutorial.code} · {tutorial.name}
										</option>
									))}
								</StudioSelect>
							) : (
								<StudioInput value={manual.tutorialCode} onChange={(event) => setManual({ ...manual, tutorialCode: event.target.value })} placeholder="Không bắt buộc" />
							)}
						</StudioField>
						<StudioField label="Học từ tuần">
							<StudioInput type="number" min={1} value={manual.enrolledFromWeek} onChange={(event) => setManual({ ...manual, enrolledFromWeek: event.target.value })} />
						</StudioField>
<details className="md:col-span-3"><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">Thông tin bổ sung</summary><div className="grid gap-3 md:grid-cols-3">
						<StudioField label="STT">
							<StudioInput type="number" min={1} value={manual.orderNo} onChange={(event) => setManual({ ...manual, orderNo: event.target.value })} />
						</StudioField>
						<StudioField label="Mã lớp">
							<StudioInput value={manual.homeClassCode} onChange={(event) => setManual({ ...manual, homeClassCode: event.target.value })} />
						</StudioField>
						<StudioField label="Ngành">
							<StudioInput value={manual.majorName} onChange={(event) => setManual({ ...manual, majorName: event.target.value })} />
						</StudioField>
						<StudioField label="Ngày sinh">
							<StudioInput type="date" value={manual.dateOfBirth} onChange={(event) => setManual({ ...manual, dateOfBirth: event.target.value })} />
						</StudioField>
						<StudioField label="Điện thoại">
							<StudioInput value={manual.phone} onChange={(event) => setManual({ ...manual, phone: event.target.value })} />
						</StudioField>
						<StudioField label="Email">
							<StudioInput type="email" value={manual.email} onChange={(event) => setManual({ ...manual, email: event.target.value })} />
						</StudioField>
</div></details>
						<div className="flex items-end">
							<StudioButton type="submit" disabled={busy}>
								Xem trước
							</StudioButton>
						</div>
					</form>
				) : null}

				{mode === 'paste' ? (
					<div className="mt-4 space-y-3">
						<p className="mc-meta">
							Dán vùng ô từ Excel/Google Sheets, gồm hàng tiêu đề. Mã SV và điện thoại luôn được đọc như chữ để giữ số 0 đầu.
						</p>
						<pre className="overflow-auto rounded-[var(--mc-r-sm)] bg-surface-sunken p-3 text-xs">{rosterPasteSample()}</pre>
						<div className="flex flex-wrap gap-2">
							<StudioButton variant="secondary" onClick={() => setPasteText(rosterPasteSample())}>
								Dán dữ liệu mẫu
							</StudioButton>
						</div>
						<textarea
							className="mc-input min-h-40 w-full font-mono text-xs"
							value={pasteText}
							onChange={(event) => setPasteText(event.target.value)}
							placeholder="STT	Mã SV	Họ lót	Tên	..."
						/>
						<StudioButton disabled={busy || !pasteText.trim()} onClick={() => void previewPaste()}>
							Xem trước dữ liệu dán
						</StudioButton>
					</div>
				) : null}

				{mode === 'csv' || mode === 'xlsx' ? (
					<div className="mt-4 space-y-3">
						<p className="mc-meta">
							{mode === 'csv'
								? 'CSV UTF-8 (có BOM) với header chuẩn. Tải file mẫu để mở đúng tiếng Việt trong Excel.'
								: 'Giữ nguyên file danh sách HANU .xlsx; cùng pipeline đối chiếu với CSV và dán dữ liệu.'}
						</p>
						<div className="flex flex-wrap gap-2">
							{mode === 'csv' ? (
								<a className="mc-button mc-button-secondary min-h-11" href="/api/admin/teaching/roster-template">
									Tải CSV mẫu
								</a>
							) : null}
							<input
								ref={fileRef}
								type="file"
								accept={mode === 'csv' ? '.csv,text/csv' : '.xlsx'}
								className="sr-only"
								onChange={(event) => void previewFile(event.target.files?.[0] ?? null)}
							/>
							<StudioButton variant="secondary" disabled={busy} onClick={() => fileRef.current?.click()}>
								Chọn file
							</StudioButton>
						</div>
					</div>
				) : null}
			</div>

			{preview ? (
				<section className="mc-surface overflow-hidden">
					<div className="mc-card-head flex-wrap gap-2">
						<div>
							<h2 className="text-base font-semibold text-ink">Đối chiếu trước khi lưu</h2>
							<p className="mc-meta mt-1">
								Hồ sơ sinh viên dùng chung giữa các lớp. Đổi họ tên, ngày sinh hoặc email sẽ ảnh hưởng mọi lớp có sinh viên đó.
							</p>
						</div>
						<div className="flex flex-wrap gap-2">
							<select className="mc-input" value={filter} onChange={(event) => setFilter(event.target.value as StatusFilter)}>
								<option value="all">Tất cả ({preview.summary.total})</option>
								<option value="new">Mới ({preview.summary.newCount})</option>
								<option value="exact">Trùng hoàn toàn ({preview.summary.exactCount})</option>
								<option value="fill_blank">Bổ sung trống ({preview.summary.fillBlankCount})</option>
								<option value="conflict">Xung đột ({preview.summary.conflictCount})</option>
								<option value="invalid">Không hợp lệ ({preview.summary.invalidCount})</option>
								<option value="open">Chưa có ngày sinh ({preview.summary.openAccessCount})</option>
							</select>
							{preview.summary.conflictCount > 0 ? (
								<StudioButton variant="quiet" onClick={keepAllCurrent}>
									Giữ toàn bộ dữ liệu hiện tại
								</StudioButton>
							) : null}
							<StudioButton variant="secondary" disabled={busy} onClick={() => setPreview(null)}>Quay lại</StudioButton>
<StudioButton disabled={busy || !canCommit} onClick={() => void commit()}>
								{busy ? 'Đang lưu…' : commitLabel}
							</StudioButton>
						</div>
					</div>
					{!canCommit ? (
						<p className="mc-banner m-4" data-tone="error">
							Không thể lưu khi còn dòng lỗi hoặc xung đột chưa chọn giữ cũ / dùng mới.
						</p>
					) : (
						<p className="mc-banner m-4" data-tone="ok">
							Đã sẵn sàng lưu. Dòng trùng hoàn toàn sẽ được bỏ qua.
						</p>
					)}
					<div className="max-h-[32rem] overflow-auto">
						<table className="mc-data-table w-full text-sm">
							<thead>
								<tr>
									<th>STT</th>
									<th>Mã SV</th>
									<th>Họ tên</th>
									<th>Trạng thái</th>
									<th>Learning Experience</th>
									<th>Chi tiết</th>
								</tr>
							</thead>
							<tbody>
								{visibleRows.map((row) => (
									<tr key={row.key} data-invalid={row.status === 'invalid' || undefined}>
										<td className="mc-num">{row.input.orderNo ?? ''}</td>
										<td className="mc-num">{row.input.studentCode}</td>
										<td>
											{row.input.familyName} {row.input.givenName}
										</td>
										<td>
											<span className="mc-chip" data-tone={row.status === 'invalid' || row.status === 'conflict' ? 'error' : 'ok'}>
												{STATUS_LABEL[row.status]}
											</span>
										</td>
										<td>
											<small>{accessLabel(row)}</small>
										</td>
										<td>
											{row.status === 'invalid' ? (
												<ul className="text-xs text-error">
													{Object.entries(row.input.fieldErrors).map(([field, message]) => (
														<li key={field}>{message}</li>
													))}
												</ul>
											) : null}
											{row.status === 'conflict' && row.existing ? (
												<div className="grid gap-2">
													{row.conflicts.map((conflict) => (
														<label key={conflict.field} className="grid gap-1 text-xs">
															<span className="font-semibold">{FIELD_LABEL[conflict.field]}</span>
															<select
																className="mc-input"
																value={resolutions[row.key]?.[conflict.field] ?? 'keep'}
																onChange={(event) =>
																	setDecision(row.key, conflict.field, event.target.value as RosterFieldDecision)
																}
															>
																<option value="keep">Giữ đang lưu: {conflict.current || '—'}</option>
																<option value="use_new">Dùng dữ liệu mới: {conflict.incoming || '—'}</option>
															</select>
														</label>
													))}
												</div>
											) : null}
											{row.status === 'fill_blank' ? (
												<small className="text-ink-secondary">
													Sẽ bổ sung: {row.fillBlankFields.map((field) => FIELD_LABEL[field]).join(', ')}
												</small>
											) : null}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>
			) : null}
			{message ? (
				<p className="mc-banner" data-tone="ok">
					{message}
				</p>
			) : null}
			{error ? <p className="text-sm font-semibold text-error">{error}</p> : null}
		</div>
	);
}

export const ROSTER_COMPARE_FIELDS = ROSTER_PROFILE_FIELDS;
