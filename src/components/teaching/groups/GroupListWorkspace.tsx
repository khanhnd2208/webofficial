'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { teachingApi } from '@/components/teaching/admin/api';
import { AdminApiError } from '@/lib/admin/client';
import { TutorialSwitcher } from '@/components/teaching/admin/TutorialSwitcher';
import { Dialog, Toast } from '@/components/ui/Dialog';
import type {
	TeachingGroupBoard,
	TeachingGroupRecord,
	TeachingTutorialRecord,
} from '@/features/teaching/types';

export type GroupListWorkspaceProps = {
	classId?: string;
	slug?: string;
	tutorials: TeachingTutorialRecord[];
	initial?: TeachingGroupBoard;
	admin?: boolean;
};

type PreviewResult = {
	resolved: Array<{
		enrollmentId: string;
		studentCode: string;
		familyName: string;
		givenName: string;
	}>;
	errors: string[];
	remaining: number;
	capacity: number;
	currentCount: number;
};

function fullName(familyName: string, givenName: string) {
	return `${familyName} ${givenName}`.trim();
}

function learningLabel(choice?: 'CHALLENGE' | 'SUPPORT' | null) {
	if (choice === 'CHALLENGE') return { text: 'Thử thách (Challenge)', tone: 'challenge' as const };
	if (choice === 'SUPPORT') return { text: 'Hỗ trợ (Support)', tone: 'support' as const };
	return { text: 'Chưa chọn', tone: 'neutral' as const };
}

function groupTitle(group: TeachingGroupRecord) {
	const count = group.assignments.length;
	return `Nhóm ${group.displayOrder + 1} · ${count}/${group.effectiveMaxSize} sinh viên`;
}

export function GroupListWorkspace({
	classId,
	slug,
	tutorials,
	initial,
	admin = false,
}: GroupListWorkspaceProps) {
	const [tutorialId, setTutorialId] = useState(
		initial?.tutorialClassId ?? (tutorials.length === 1 ? (tutorials[0]?.id ?? '') : ''),
	);
	const initialSeed = useRef(initial);
	const [board, setBoard] = useState<TeachingGroupBoard | undefined>(initial);
	const [query, setQuery] = useState('');
	const [loading, setLoading] = useState(false);
	const [toast, setToast] = useState<string | null>(null);
	const [configOpen, setConfigOpen] = useState(false);
	const [groupCountDraft, setGroupCountDraft] = useState(
		String(initial?.groupCount || Math.max(1, Math.ceil((initial?.activeStudentCount ?? 0) / 5))),
	);
	const [defaultSizeDraft, setDefaultSizeDraft] = useState(String(initial?.defaultGroupSize ?? 5));
	const [addGroupId, setAddGroupId] = useState<string | null>(null);
	const [codesDraft, setCodesDraft] = useState('');
	const [preview, setPreview] = useState<PreviewResult | null>(null);
	const [previewLoading, setPreviewLoading] = useState(false);
	const [moveEnrollmentId, setMoveEnrollmentId] = useState<string | null>(null);
	const [capacityGroupId, setCapacityGroupId] = useState<string | null>(null);
	const [capacityDraft, setCapacityDraft] = useState('');

	const apiBase = admin
		? `/api/admin/teaching/classes/${classId}/groups`
		: `/api/teaching/classes/${slug}/groups`;

	const [reload, setReload] = useState(0);
	const [loadError, setLoadError] = useState('');
	const [saving, setSaving] = useState(false);
	const savingRef = useRef(false);
	const previewRequest = useRef(0);

	useEffect(() => {
		if (!tutorialId) return;
		if (reload === 0 && initialSeed.current?.tutorialClassId === tutorialId) {
			setBoard(initialSeed.current);
			return;
		}
		const controller = new AbortController();
		setLoading(true);
		setLoadError('');
		void teachingApi<TeachingGroupBoard>(
			`${apiBase}?tutorialClassId=${encodeURIComponent(tutorialId)}`,
			{ signal: controller.signal },
		)
			.then((next) => {
				if (!controller.signal.aborted) setBoard(next);
			})
			.catch((error: unknown) => {
				if (!controller.signal.aborted)
					setLoadError(error instanceof Error ? error.message : 'Không tải được danh sách nhóm.');
			})
			.finally(() => {
				if (!controller.signal.aborted) setLoading(false);
			});
		return () => controller.abort();
	}, [apiBase, tutorialId, initial, reload]);

	function changeTutorial(id: string) {
		if (savingRef.current) return;
		previewRequest.current += 1;
		initialSeed.current = undefined;
		setBoard(undefined);
		setLoadError('');
		setConfigOpen(false);
		setAddGroupId(null);
		setCapacityGroupId(null);
		setMoveEnrollmentId(null);
		setPreview(null);
		setPreviewLoading(false);
		setTutorialId(id);
	}

	function beginSave() {
		if (savingRef.current || !board || board.tutorialClassId !== tutorialId) return false;
		savingRef.current = true;
		setSaving(true);
		return true;
	}
	function finishSave() {
		savingRef.current = false;
		setSaving(false);
	}
	function showSaveError(error: unknown, fallback: string) {
		setToast(error instanceof Error ? error.message : fallback);
		if (error instanceof AdminApiError && error.code === 'STALE_BOARD')
			setReload((value) => value + 1);
	}

	const filteredGroups = useMemo(() => {
		if (!board) return [];
		const q = query.trim().toLowerCase();
		if (!q) return board.groups;
		return board.groups
			.map((group) => ({
				...group,
				assignments: group.assignments.filter((member) =>
					`${member.studentCode} ${member.familyName} ${member.givenName}`
						.toLowerCase()
						.includes(q),
				),
			}))
			.filter((group) => group.assignments.length > 0);
	}, [board, query]);

	const serialByEnrollment = useMemo(() => {
		const map = new Map<string, number>();
		let index = 0;
		for (const group of filteredGroups) {
			for (const member of group.assignments) {
				index += 1;
				map.set(member.enrollmentId, index);
			}
		}
		return map;
	}, [filteredGroups]);

	const filteredUnassigned = useMemo(() => {
		if (!board) return [];
		const q = query.trim().toLowerCase();
		return board.unassigned.filter(
			(student) =>
				!q ||
				`${student.studentCode} ${student.familyName} ${student.givenName}`
					.toLowerCase()
					.includes(q),
		);
	}, [board, query]);

	async function saveConfig() {
		if (!classId || !tutorialId || !board || !beginSave()) return;
		const groupCount = Number(groupCountDraft);
		const defaultGroupSize = Number(defaultSizeDraft);
		try {
			const next = await teachingApi<TeachingGroupBoard>(apiBase, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tutorialClassId: tutorialId,
					groupCount,
					defaultGroupSize,
					expectedVersion: board.version,
				}),
			});
			setBoard(next);
			setConfigOpen(false);
			setToast('Đã cập nhật cấu trúc nhóm.');
		} catch (error) {
			showSaveError(error, 'Không lưu được cấu trúc nhóm.');
		} finally {
			finishSave();
		}
	}

	async function runPreview(groupId: string) {
		if (!classId || !tutorialId) return;
		const studentCodes = codesDraft
			.split(/[\s,;\n\r\t]+/)
			.map((code) => code.trim())
			.filter(Boolean);
		if (!studentCodes.length) {
			setPreview(null);
			return;
		}
		const requestId = ++previewRequest.current;
		setPreviewLoading(true);
		try {
			const result = await teachingApi<PreviewResult>(
				`/api/admin/teaching/classes/${classId}/groups/members`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						preview: true,
						tutorialClassId: tutorialId,
						groupId,
						studentCodes,
					}),
				},
			);
			if (requestId === previewRequest.current) setPreview(result);
		} catch (error) {
			if (requestId !== previewRequest.current) return;
			setPreview(null);
			setToast(error instanceof Error ? error.message : 'Không kiểm tra được mã sinh viên.');
		} finally {
			if (requestId === previewRequest.current) setPreviewLoading(false);
		}
	}

	async function saveMembers(groupId: string) {
		if (!classId || !tutorialId || !board || !beginSave()) return;
		const studentCodes = codesDraft
			.split(/[\s,;\n\r\t]+/)
			.map((code) => code.trim())
			.filter(Boolean);
		try {
			const next = await teachingApi<TeachingGroupBoard>(
				`/api/admin/teaching/classes/${classId}/groups/members`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						tutorialClassId: tutorialId,
						groupId,
						studentCodes,
						expectedVersion: board.version,
					}),
				},
			);
			setBoard(next);
			setAddGroupId(null);
			setCodesDraft('');
			setPreview(null);
			setToast('Đã thêm sinh viên vào nhóm.');
		} catch (error) {
			showSaveError(error, 'Không thêm được sinh viên.');
		} finally {
			finishSave();
		}
	}

	async function moveMember(enrollmentId: string, targetGroupId: string | null) {
		if (!classId || !tutorialId || !board || !beginSave()) return;
		try {
			const next = await teachingApi<TeachingGroupBoard>(
				`/api/admin/teaching/classes/${classId}/groups/assignments`,
				{
					method: targetGroupId ? 'PUT' : 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						tutorialClassId: tutorialId,
						enrollmentId,
						...(targetGroupId ? { targetGroupId } : {}),
						expectedVersion: board.version,
					}),
				},
			);
			setBoard(next);
			setMoveEnrollmentId(null);
			setToast(targetGroupId ? 'Đã chuyển nhóm.' : 'Đã bỏ khỏi nhóm.');
		} catch (error) {
			showSaveError(error, 'Không cập nhật được nhóm.');
		} finally {
			finishSave();
		}
	}

	async function saveCapacity(groupId: string) {
		if (!classId || !tutorialId || !board || !beginSave()) return;
		const trimmed = capacityDraft.trim();
		const maxSize = trimmed ? Number(trimmed) : null;
		try {
			const next = await teachingApi<TeachingGroupBoard>(
				`/api/admin/teaching/classes/${classId}/groups/${groupId}/capacity`,
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						tutorialClassId: tutorialId,
						maxSize,
						expectedVersion: board.version,
					}),
				},
			);
			setBoard(next);
			setCapacityGroupId(null);
			setToast('Đã cập nhật sức chứa nhóm.');
		} catch (error) {
			showSaveError(error, 'Không cập nhật được sức chứa.');
		} finally {
			finishSave();
		}
	}

	if (!tutorials.length) {
		return (
			<div className="group-list-empty mc-surface p-6 text-sm text-ink-secondary">
				Lớp chưa có tutorial. Hãy tạo tutorial trước khi xếp nhóm.
			</div>
		);
	}

	return (
		<div className="group-list-workspace" aria-busy={loading || saving}>
			<header className="group-list-header mc-card-head flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-lg font-semibold text-brand">
						DANH SÁCH PHÂN CHIA NHÓM
						{board ? ` — TUTORIAL ${board.tutorialCode}` : ''}
					</h2>
					{board ? (
						<p className="mt-1 text-sm text-ink-secondary">
							Đã xếp {board.assignedCount}/{board.activeStudentCount} · Chưa xếp{' '}
							{board.unassigned.length}
						</p>
					) : null}
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<fieldset disabled={saving}>
						<TutorialSwitcher tutorials={tutorials} value={tutorialId} onChange={changeTutorial} />
					</fieldset>
					{admin ? (
						<button
							type="button"
							className="mc-button mc-button-secondary min-h-11"
							onClick={() => {
								if (!board) return;
								setGroupCountDraft(
									String(board.groupCount || Math.max(1, Math.ceil(board.activeStudentCount / 5))),
								);
								setDefaultSizeDraft(String(board.defaultGroupSize));
								setConfigOpen(true);
							}}
							disabled={!board || saving || loading}
						>
							Thiết lập nhóm
						</button>
					) : null}
				</div>
			</header>

			<div className="group-list-toolbar mt-4 flex flex-wrap items-center gap-3">
				<input
					type="search"
					className="mc-input min-h-11 min-w-[14rem] flex-1"
					placeholder="Tìm theo mã hoặc tên sinh viên…"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					aria-label="Tìm sinh viên"
				/>
				{loading ? <span className="text-xs text-ink-secondary">Đang tải…</span> : null}
			</div>

			{loadError ? (
				<div role="alert" className="mt-4 text-danger">
					{loadError}{' '}
					<button type="button" onClick={() => setReload((value) => value + 1)}>
						Thử lại
					</button>
				</div>
			) : null}

			{loading || loadError ? null : !tutorialId ? (
				<p className="mt-6 text-sm text-ink-secondary">Chọn tutorial để xem danh sách nhóm.</p>
			) : !board?.configured || board.tutorialClassId !== tutorialId ? (
				<div className="group-list-empty mc-surface mt-4 p-6 text-sm text-ink-secondary">
					{admin
						? 'Chưa thiết lập nhóm cho tutorial này. Bấm “Thiết lập nhóm” để bắt đầu.'
						: 'Giảng viên chưa thiết lập nhóm cho tutorial này.'}
				</div>
			) : (
				<div className="group-list-sections mt-4 space-y-6">
					{filteredGroups.map((group) => (
						<section key={group.id} className="group-list-section mc-surface overflow-hidden">
							<div className="group-list-section-head flex flex-wrap items-center justify-between gap-2 border-b border-mc-rule bg-surface-sunken px-4 py-3">
								<h3 className="text-sm font-semibold uppercase tracking-wide text-ink">
									{groupTitle(board.groups.find((item) => item.id === group.id) ?? group)}
								</h3>
								{admin ? (
									<div className="flex flex-wrap gap-2">
										<button
											type="button"
											disabled={saving}
											className="mc-button mc-button-secondary text-xs"
											onClick={() => {
												setCapacityGroupId(group.id);
												setCapacityDraft(group.maxSize != null ? String(group.maxSize) : '');
											}}
										>
											Sức chứa
										</button>
										<button
											type="button"
											disabled={saving}
											className="mc-button mc-button-primary text-xs"
											onClick={() => {
												setAddGroupId(group.id);
												setCodesDraft('');
												setPreview(null);
											}}
										>
											Thêm sinh viên
										</button>
									</div>
								) : null}
							</div>

							{group.assignments.length ? (
								<div className="group-list-table-wrap overflow-x-auto">
									<table className="group-list-table w-full text-sm">
										<thead>
											<tr>
												<th>STT</th>
												<th>Mã sinh viên</th>
												<th>Họ và tên</th>
												<th>Trải nghiệm học tập</th>
												{admin ? <th aria-label="Thao tác" /> : null}
											</tr>
										</thead>
										<tbody>
											{group.assignments.map((member) => {
												const lx = learningLabel(member.learningExperience);
												return (
													<tr key={member.enrollmentId}>
														<td>{serialByEnrollment.get(member.enrollmentId) ?? '—'}</td>
														<td>{member.studentCode}</td>
														<td>{fullName(member.familyName, member.givenName)}</td>
														<td>
															<span className={`group-list-lx group-list-lx-${lx.tone}`}>
																{lx.text}
															</span>
														</td>
														{admin ? (
															<td className="group-list-actions">
																<button
																	type="button"
																	className="mc-button mc-button-ghost text-xs"
																	onClick={() => setMoveEnrollmentId(member.enrollmentId)}
																>
																	Chuyển nhóm
																</button>
																<button
																	type="button"
																	className="mc-button mc-button-ghost text-xs text-danger"
																	onClick={() => void moveMember(member.enrollmentId, null)}
																>
																	Bỏ khỏi nhóm
																</button>
															</td>
														) : null}
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							) : (
								<p className="px-4 py-6 text-sm text-ink-secondary">
									Chưa có sinh viên trong nhóm.
								</p>
							)}
						</section>
					))}

					<section className="group-list-section group-list-unassigned mc-surface overflow-hidden">
						<div className="group-list-section-head border-b border-mc-rule bg-surface-sunken px-4 py-3">
							<h3 className="text-sm font-semibold uppercase tracking-wide text-ink">
								Chưa xếp nhóm · {filteredUnassigned.length} sinh viên
							</h3>
						</div>
						{filteredUnassigned.length ? (
							<ul className="divide-y divide-mc-rule">
								{filteredUnassigned.map((student) => {
									const lx = learningLabel(student.learningExperience);
									return (
										<li
											key={student.enrollmentId}
											className="group-list-mobile-row flex flex-wrap items-center justify-between gap-2 px-4 py-3"
										>
											<div>
												<p className="font-medium text-ink">
													{fullName(student.familyName, student.givenName)}
												</p>
												<p className="text-xs text-ink-secondary">{student.studentCode}</p>
											</div>
											<span className={`group-list-lx group-list-lx-${lx.tone}`}>{lx.text}</span>
										</li>
									);
								})}
							</ul>
						) : (
							<p className="px-4 py-6 text-sm text-ink-secondary">
								{query.trim()
									? 'Không có sinh viên phù hợp với tìm kiếm.'
									: 'Tất cả sinh viên đã được xếp nhóm.'}
							</p>
						)}
					</section>
				</div>
			)}

			{admin && configOpen && board ? (
				<Dialog
					open
					title="Thiết lập nhóm"
					onClose={() => {
						if (!savingRef.current) setConfigOpen(false);
					}}
				>
					<div className="space-y-4">
						<label className="block text-sm">
							<span className="mb-1 block font-medium">Số nhóm</span>
							<input
								type="number"
								min={1}
								max={50}
								className="mc-input w-full"
								value={groupCountDraft}
								onChange={(event) => setGroupCountDraft(event.target.value)}
							/>
						</label>
						<label className="block text-sm">
							<span className="mb-1 block font-medium">Sức chứa mặc định mỗi nhóm</span>
							<input
								type="number"
								min={1}
								max={50}
								className="mc-input w-full"
								value={defaultSizeDraft}
								onChange={(event) => setDefaultSizeDraft(event.target.value)}
							/>
						</label>
						<p className="text-xs text-ink-secondary">
							Giảm số nhóm chỉ khi các nhóm cuối đã trống. Sức chứa mặc định không ghi đè nhóm đã
							chỉnh riêng.
						</p>
						<div className="flex justify-end gap-2">
							<button
								type="button"
								className="mc-button mc-button-secondary"
								onClick={() => setConfigOpen(false)}
							>
								Hủy
							</button>
							<button
								type="button"
								disabled={saving}
								className="mc-button mc-button-primary"
								onClick={() => void saveConfig()}
							>
								Lưu
							</button>
						</div>
					</div>
				</Dialog>
			) : null}

			{admin && addGroupId ? (
				<Dialog
					open
					title="Thêm sinh viên"
					onClose={() => {
						if (savingRef.current) return;
						previewRequest.current += 1;
						setAddGroupId(null);
						setPreview(null);
						setCodesDraft('');
					}}
				>
					<div className="space-y-4">
						<label className="block text-sm">
							<span className="mb-1 block font-medium">Mã sinh viên (một hoặc nhiều dòng)</span>
							<textarea
								disabled={saving}
								className="mc-input min-h-32 w-full font-mono text-sm"
								value={codesDraft}
								onChange={(event) => {
									previewRequest.current += 1;
									setPreviewLoading(false);
									setCodesDraft(event.target.value);
									setPreview(null);
								}}
								placeholder="Dán từ Excel hoặc nhập từng mã…"
							/>
						</label>
						{previewLoading ? <p className="text-xs text-ink-secondary">Đang kiểm tra…</p> : null}
						{preview?.resolved.length ? (
							<div className="rounded-[var(--mc-r-sm)] border border-mc-rule bg-surface-sunken p-3 text-sm">
								<p className="font-medium text-ink">
									{preview.resolved.length} mã hợp lệ · còn {preview.remaining} chỗ
								</p>
								<ul className="mt-2 space-y-1 text-ink-secondary">
									{preview.resolved.map((item) => (
										<li key={item.enrollmentId}>
											{item.studentCode} — {fullName(item.familyName, item.givenName)}
										</li>
									))}
								</ul>
							</div>
						) : null}
						{preview && preview.resolved.length > preview.remaining ? (
							<p role="alert" className="text-sm text-danger">
								Số sinh viên vượt {preview.remaining} chỗ còn lại. Hãy bớt mã hoặc tăng sức chứa
								nhóm.
							</p>
						) : null}
						{preview?.errors.length ? (
							<div className="rounded-[var(--mc-r-sm)] border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
								{preview.errors.map((error) => (
									<p key={error}>{error}</p>
								))}
							</div>
						) : null}
						<div className="flex justify-end gap-2">
							<button
								type="button"
								className="mc-button mc-button-secondary"
								onClick={() => void runPreview(addGroupId)}
								disabled={previewLoading}
							>
								Kiểm tra mã
							</button>
							<button
								type="button"
								className="mc-button mc-button-primary"
								onClick={() => void saveMembers(addGroupId)}
								disabled={
									saving ||
									previewLoading ||
									!preview?.resolved.length ||
									!!preview.errors.length ||
									preview.resolved.length > preview.remaining
								}
							>
								Lưu
							</button>
						</div>
					</div>
				</Dialog>
			) : null}

			{admin && moveEnrollmentId && board ? (
				<Dialog
					open
					title="Chuyển nhóm"
					onClose={() => {
						if (!savingRef.current) setMoveEnrollmentId(null);
					}}
				>
					<div className="space-y-2">
						{board.groups.map((group) => (
							<button
								key={group.id}
								type="button"
								className="mc-button mc-button-secondary w-full justify-start"
								onClick={() => void moveMember(moveEnrollmentId, group.id)}
							>
								{groupTitle(board.groups.find((item) => item.id === group.id) ?? group)}
							</button>
						))}
						<div className="flex justify-end pt-2">
							<button
								type="button"
								className="mc-button mc-button-secondary"
								onClick={() => setMoveEnrollmentId(null)}
							>
								Đóng
							</button>
						</div>
					</div>
				</Dialog>
			) : null}

			{admin && capacityGroupId && board ? (
				<Dialog
					open
					title="Sức chứa nhóm"
					onClose={() => {
						if (!savingRef.current) setCapacityGroupId(null);
					}}
				>
					<div className="space-y-4">
						<label className="block text-sm">
							<span className="mb-1 block font-medium">
								Sức chứa riêng (để trống = dùng mặc định {board.defaultGroupSize})
							</span>
							<input
								type="number"
								min={1}
								max={50}
								className="mc-input w-full"
								value={capacityDraft}
								onChange={(event) => setCapacityDraft(event.target.value)}
							/>
						</label>
						<div className="flex justify-end gap-2">
							<button
								type="button"
								className="mc-button mc-button-secondary"
								onClick={() => setCapacityGroupId(null)}
							>
								Hủy
							</button>
							<button
								type="button"
								disabled={saving}
								className="mc-button mc-button-primary"
								onClick={() => void saveCapacity(capacityGroupId)}
							>
								Lưu
							</button>
						</div>
					</div>
				</Dialog>
			) : null}

			{toast ? <Toast message={toast} visible onDismiss={() => setToast(null)} /> : null}
		</div>
	);
}
