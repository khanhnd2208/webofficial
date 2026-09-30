'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { TeachingIcon } from '../ui/TeachingIcon';
import { TeachingSectionHeading, TeachingEmpty } from '../ui/TeachingElements';
import { useAdminConfirm } from '@/components/admin/useAdminConfirm';
import { StudioButton, StudioField, StudioInput } from '@/components/myclass/admin/studio';
import { teachingApi, AdminApiError } from '@/components/teaching/admin/api';
import { TeachingQuickMenu } from '@/components/teaching/admin/TeachingQuickMenu';
import { Dialog } from '@/components/ui/Dialog';
import { routes } from '@/config/routes';
import { formatDependencySummary } from '@/features/teaching/domain/adminLifecycle';
import type { TeachingCourseListItem, TeachingCourseRecord } from '@/features/teaching/types';

type StatusFilter = 'active' | 'archived' | 'all';

function mutationError(reason: unknown, fallback: string) {
	if (reason instanceof AdminApiError) {
		const summary = reason.details
			? formatDependencySummary(reason.details as Record<string, number>)
			: '';
		return summary ? `${reason.message}: ${summary}` : reason.message;
	}
	return reason instanceof Error ? reason.message : fallback;
}

export function TeachingCourseCards({ courses }: { courses: TeachingCourseListItem[] }) {
	const router = useRouter();
	const { confirm, dialog } = useAdminConfirm();
	const [query, setQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [createOpen, setCreateOpen] = useState(false);
	const [editCourse, setEditCourse] = useState<TeachingCourseListItem | null>(null);
	const [draft, setDraft] = useState({ courseCode: '', courseName: '' });

	const filtered = useMemo(() => {
		const value = query
			.trim()
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/đ/g, 'd');
		return courses.filter((course) => {
			const matchesQuery =
				!value ||
				`${course.courseCode} ${course.courseName} ${course.classes.map((item) => `${item.term} ${item.classCode ?? item.groupNo}`).join(' ')}`
					.toLowerCase()
					.normalize('NFD')
					.replace(/[\u0300-\u036f]/g, '')
					.replace(/đ/g, 'd')
					.includes(value);
			const matchesStatus =
				statusFilter === 'all' ||
				(statusFilter === 'active' ? course.status === 'ACTIVE' : course.status === 'ARCHIVED');
			return matchesQuery && matchesStatus;
		});
	}, [courses, query, statusFilter]);

	function openCreate() {
		setError('');
		setDraft({ courseCode: '', courseName: '' });
		setCreateOpen(true);
	}

	function openEdit(course: TeachingCourseListItem) {
		setError('');
		setEditCourse(course);
		setDraft({ courseCode: course.courseCode, courseName: course.courseName });
	}

	async function run(action: () => Promise<void>) {
		setBusy(true);
		setError('');
		try {
			await action();
			router.refresh();
		} catch (reason) {
			setError(mutationError(reason, 'Không thực hiện được thao tác'));
		} finally {
			setBusy(false);
		}
	}

	async function saveCourse() {
		await run(async () => {
			if (editCourse) {
				await teachingApi<TeachingCourseRecord>(`/api/admin/teaching/courses/${editCourse.id}`, {
					method: 'PATCH',
					body: JSON.stringify(draft),
				});
				setEditCourse(null);
			} else {
				await teachingApi<TeachingCourseRecord>('/api/admin/teaching/courses', {
					method: 'POST',
					body: JSON.stringify(draft),
				});
				setCreateOpen(false);
			}
		});
	}

	async function archiveCourse(course: TeachingCourseListItem, next: 'ACTIVE' | 'ARCHIVED') {
		if (next === 'ARCHIVED' && !course.canArchive) {
			setError(
				`Không thể lưu trữ môn này khi còn ${formatDependencySummary(course.archiveBlockers) || 'lớp hoặc bộ thẻ đang hoạt động'}`,
			);
			return;
		}
		const ok = await confirm({
			title: next === 'ARCHIVED' ? 'Lưu trữ môn học' : 'Khôi phục môn học',
			description:
				next === 'ARCHIVED'
					? 'Môn đã lưu trữ sẽ ẩn khỏi danh sách mặc định và không tạo thêm lớp hay bộ thẻ được.'
					: 'Khôi phục môn này để tiếp tục tạo lớp và bộ thẻ.',
			confirmLabel: next === 'ARCHIVED' ? 'Lưu trữ' : 'Khôi phục',
			tone: next === 'ARCHIVED' ? 'danger' : 'default',
		});
		if (!ok) return;
		await run(async () => {
			await teachingApi(`/api/admin/teaching/courses/${course.id}`, {
				method: 'PATCH',
				body: JSON.stringify({ status: next }),
			});
		});
	}

	async function deleteCourse(course: TeachingCourseListItem) {
		if (!course.canDelete) {
			setError(
				`Chỉ xóa được môn trống. Hiện còn ${formatDependencySummary(course.deleteBlockers)}`,
			);
			return;
		}
		const ok = await confirm({
			title: 'Xóa môn học',
			description: `Xóa vĩnh viễn ${course.courseCode}? Thao tác này không hoàn tác được.`,
			confirmLabel: 'Xóa vĩnh viễn',
			tone: 'danger',
		});
		if (!ok) return;
		await run(async () => {
			await teachingApi(`/api/admin/teaching/courses/${course.id}`, { method: 'DELETE' });
		});
	}

	const formOpen = createOpen || Boolean(editCourse);

	return (
		<section className="space-y-6" aria-label="Danh sách môn học">
			<div className="teaching-filter-bar">
				<TeachingSectionHeading
					icon="course"
					title="Các môn đang dạy"
					description="Nội dung và các lớp theo từng môn học."
					count={filtered.length}
				/>
				<div className="flex flex-wrap items-center gap-2 sm:shrink-0">
					<label className="min-w-0 flex-1 sm:w-56 sm:flex-none">
						<span className="sr-only">Tìm môn</span>
						<input
							type="search"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Tìm môn, lớp hoặc học kỳ…"
							className="mc-input min-h-11 w-full text-xs"
							data-testid="teaching-search-input"
						/>
					</label>
					<label>
						<span className="sr-only">Lọc môn</span>
						<select
							value={statusFilter}
							onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
							className="mc-input min-h-11 text-xs font-medium"
							data-testid="teaching-course-status-filter"
						>
							<option value="active">Đang dạy</option>
							<option value="archived">Đã lưu trữ</option>
							<option value="all">Tất cả môn</option>
						</select>
					</label>
					<StudioButton variant="secondary" onClick={openCreate} disabled={busy}>
						Thêm môn
					</StudioButton>
				</div>
			</div>

			{error ? (
				<p role="alert" className="text-sm font-semibold text-error">
					{error}
				</p>
			) : null}

			{courses.length === 0 ? (
				<TeachingEmpty
					icon="course"
					title="Chưa có môn học"
					description="Thêm môn trước, rồi tạo lớp rỗng và nhập học viên sau."
					data-testid="teaching-empty-all"
				>
					<StudioButton onClick={openCreate}>Thêm môn đầu tiên</StudioButton>
				</TeachingEmpty>
			) : filtered.length === 0 ? (
				<TeachingEmpty
					icon="course"
					title="Không có kết quả phù hợp"
					description="Thử từ khóa khác hoặc thay đổi bộ lọc môn học."
				/>
			) : (
				<div
					className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
					data-testid="teaching-course-cards-grid"
				>
					{filtered.map((course) => (
						<article
							key={course.id}
							className={`teaching-course-card relative flex h-full flex-col border bg-surface ${
								course.status === 'ARCHIVED' ? 'border-border/60 opacity-80' : 'border-border/80'
							}`}
						>
							<Link
								href={routes.mySpaceTeachingCourse(course.id)}
								className="flex flex-1 flex-col p-5 pr-14 transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
								data-testid={`teaching-course-card-${course.id}`}
							>
								<span className="teaching-course-card-icon">
									<TeachingIcon name="course" size={28} />
								</span>
								<p className="font-mono text-xs font-bold uppercase tracking-wider text-accent">
									{course.courseCode}
								</p>
								<h3 className="mt-2 text-base font-semibold leading-snug text-ink">
									{course.courseName}
								</h3>
								<div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-border/60 pt-3 text-xs text-ink-secondary">
									<div>
										<span className="font-semibold text-ink">{course.activeClassCount}</span> lớp
									</div>
									<div>
										<span className="font-semibold text-ink">{course.deckCount}</span> bộ thẻ
									</div>
									{course.status === 'ARCHIVED' ? (
										<span className="teaching-status text-[0.625rem]" data-tone="muted">
											Đã lưu trữ
										</span>
									) : null}
								</div>
							</Link>
							<div className="absolute right-2 top-2">
								<TeachingQuickMenu
									label={`Thao tác môn ${course.courseCode}`}
									disabled={busy}
									items={[
										{ id: 'edit', label: 'Sửa', onSelect: () => openEdit(course) },
										course.status === 'ARCHIVED'
											? {
													id: 'restore',
													label: 'Khôi phục',
													onSelect: () => void archiveCourse(course, 'ACTIVE'),
												}
											: {
													id: 'archive',
													label: 'Lưu trữ',
													disabled: !course.canArchive,
													onSelect: () => void archiveCourse(course, 'ARCHIVED'),
												},
										{
											id: 'delete',
											label: 'Xóa vĩnh viễn',
											tone: 'danger',
											disabled: !course.canDelete,
											onSelect: () => void deleteCourse(course),
										},
									]}
								/>
							</div>
						</article>
					))}
				</div>
			)}

			<Dialog
				open={formOpen}
				onClose={() => {
					if (busy) return;
					setCreateOpen(false);
					setEditCourse(null);
				}}
				title={editCourse ? 'Sửa môn học' : 'Thêm môn'}
				description="Chỉ cần mã môn và tên môn."
			>
				<form
					className="grid gap-4"
					onSubmit={(event) => {
						event.preventDefault();
						void saveCourse();
					}}
				>
					{error ? (
						<p
							role="alert"
							tabIndex={-1}
							ref={(node) => {
								node?.focus();
							}}
							className="rounded-[var(--mc-r-sm)] bg-error/10 px-3 py-2 text-sm font-semibold text-error"
						>
							{error}
						</p>
					) : null}
					<StudioField label="Mã môn" error={!draft.courseCode.trim() ? 'Bắt buộc' : null}>
						<StudioInput
							required
							value={draft.courseCode}
							onChange={(event) =>
								setDraft((current) => ({ ...current, courseCode: event.target.value }))
							}
							autoFocus
						/>
					</StudioField>
					<StudioField label="Tên môn" error={!draft.courseName.trim() ? 'Bắt buộc' : null}>
						<StudioInput
							required
							value={draft.courseName}
							onChange={(event) =>
								setDraft((current) => ({ ...current, courseName: event.target.value }))
							}
						/>
					</StudioField>
					<div className="flex justify-end gap-2">
						<StudioButton
							variant="quiet"
							onClick={() => {
								setCreateOpen(false);
								setEditCourse(null);
							}}
							disabled={busy}
						>
							Huỷ
						</StudioButton>
						<StudioButton
							type="submit"
							disabled={busy || !draft.courseCode.trim() || !draft.courseName.trim()}
						>
							{busy ? 'Đang lưu…' : 'Lưu'}
						</StudioButton>
					</div>
				</form>
			</Dialog>
			{dialog}
		</section>
	);
}
