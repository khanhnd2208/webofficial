'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { routes } from '@/config/routes';
import { adminFetch } from '@/lib/admin/client';
import type {
	CourseDetail,
	CourseVisibility,
	LessonDTO,
	PublishStatus,
} from '@/features/courses/types';

async function api<T>(url: string, init?: RequestInit): Promise<T> {
	return adminFetch<T>(url, init);
}

function lessonReady(lesson: LessonDTO): 'empty' | 'partial' | 'ready' {
	const hasTitle = lesson.title.trim().length > 0;
	const hasBody = lesson.contentHtml.trim().length > 0 || Boolean(lesson.videoUrl?.trim());
	if (hasTitle && hasBody) return 'ready';
	if (hasTitle || hasBody) return 'partial';
	return 'empty';
}

const READY_LABEL = { empty: 'Trống', partial: 'Thiếu nội dung', ready: 'Đủ điều kiện' } as const;

export default function CourseEditor({ initial }: { initial: CourseDetail }) {
	const router = useRouter();
	const [course, setCourse] = useState(initial);
	const [title, setTitle] = useState(initial.title);
	const [slug, setSlug] = useState(initial.slug);
	const [summary, setSummary] = useState(initial.summary);
	const [description, setDescription] = useState(initial.description);
	const [thumbnailUrl, setThumbnailUrl] = useState(initial.thumbnailUrl ?? '');
	const [status, setStatus] = useState<PublishStatus>(initial.status);
	const [visibility, setVisibility] = useState<CourseVisibility>(initial.visibility);
	const [audience, setAudience] = useState(initial.audience);
	const [learningOutcomes, setLearningOutcomes] = useState(initial.learningOutcomes);
	const [format, setFormat] = useState(initial.format);
	const [durationText, setDurationText] = useState(initial.durationText);
	const [prerequisites, setPrerequisites] = useState(initial.prerequisites);
	const [moduleTitle, setModuleTitle] = useState('');
	const [lessonTitles, setLessonTitles] = useState<Record<string, string>>({});
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [rowBusy, setRowBusy] = useState<string | null>(null);
	const [confirm, setConfirm] = useState<
		| null
		| { type: 'module'; id: string; title: string }
		| { type: 'lesson'; moduleId: string; lessonId: string; title: string }
	>(null);

	async function refresh() {
		const refreshed = await api<CourseDetail>(`/api/admin/courses/${course.id}`);
		setCourse(refreshed);
		router.refresh();
	}

	async function saveCourse() {
		setBusy(true);
		setError(null);
		try {
			const updated = await api<CourseDetail>(`/api/admin/courses/${course.id}`, {
				method: 'PATCH',
				body: JSON.stringify({
					title,
					slug,
					summary,
					description,
					thumbnailUrl: thumbnailUrl.trim() || null,
					status,
					visibility,
					audience,
					learningOutcomes,
					format,
					durationText,
					prerequisites,
				}),
			});
			setCourse(updated);
			setSlug(updated.slug);
			setMessage('Đã lưu khóa học');
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Lỗi');
		} finally {
			setBusy(false);
		}
	}

	async function addModule() {
		if (!moduleTitle.trim()) return;
		setBusy(true);
		setError(null);
		try {
			await api(`/api/admin/courses/${course.id}/modules`, {
				method: 'POST',
				body: JSON.stringify({ title: moduleTitle.trim() }),
			});
			setModuleTitle('');
			await refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Lỗi');
		} finally {
			setBusy(false);
		}
	}

	async function addLesson(moduleId: string) {
		const titleValue = (lessonTitles[moduleId] ?? '').trim();
		if (!titleValue) return;
		setBusy(true);
		setError(null);
		try {
			await api(`/api/admin/courses/${course.id}/modules/${moduleId}/lessons`, {
				method: 'POST',
				body: JSON.stringify({ title: titleValue }),
			});
			setLessonTitles((prev) => ({ ...prev, [moduleId]: '' }));
			await refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Lỗi');
		} finally {
			setBusy(false);
		}
	}

	async function moveModule(moduleId: string, dir: -1 | 1) {
		const ids = course.modules.map((m) => m.id);
		const idx = ids.indexOf(moduleId);
		const next = idx + dir;
		if (idx < 0 || next < 0 || next >= ids.length) return;
		const ordered = [...ids];
		[ordered[idx], ordered[next]] = [ordered[next], ordered[idx]];
		setRowBusy(moduleId);
		try {
			await api(`/api/admin/courses/${course.id}/modules`, {
				method: 'PUT',
				body: JSON.stringify({ orderedIds: ordered }),
			});
			await refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Lỗi');
		} finally {
			setRowBusy(null);
		}
	}

	async function moveLesson(moduleId: string, lessonId: string, dir: -1 | 1) {
		const mod = course.modules.find((m) => m.id === moduleId);
		if (!mod) return;
		const ids = mod.lessons.map((l) => l.id);
		const idx = ids.indexOf(lessonId);
		const next = idx + dir;
		if (idx < 0 || next < 0 || next >= ids.length) return;
		const ordered = [...ids];
		[ordered[idx], ordered[next]] = [ordered[next], ordered[idx]];
		setRowBusy(lessonId);
		try {
			await api(`/api/admin/courses/${course.id}/modules/${moduleId}/lessons`, {
				method: 'PUT',
				body: JSON.stringify({ orderedIds: ordered }),
			});
			await refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Lỗi');
		} finally {
			setRowBusy(null);
		}
	}

	async function setLessonStatus(moduleId: string, lessonId: string, next: PublishStatus) {
		setRowBusy(lessonId);
		setError(null);
		try {
			await api(`/api/admin/courses/${course.id}/modules/${moduleId}/lessons/${lessonId}`, {
				method: 'PATCH',
				body: JSON.stringify({ status: next }),
			});
			await refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Lỗi');
		} finally {
			setRowBusy(null);
		}
	}

	async function runConfirm() {
		if (!confirm) return;
		setRowBusy(confirm.type === 'module' ? confirm.id : confirm.lessonId);
		try {
			if (confirm.type === 'module') {
				await api(`/api/admin/courses/${course.id}/modules/${confirm.id}`, { method: 'DELETE' });
			} else {
				await api(
					`/api/admin/courses/${course.id}/modules/${confirm.moduleId}/lessons/${confirm.lessonId}`,
					{ method: 'DELETE' },
				);
			}
			setConfirm(null);
			await refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Lỗi');
		} finally {
			setRowBusy(null);
		}
	}

	return (
		<div className="mt-8 space-y-8">
			{error ? (
				<p
					className="rounded-lg border border-error/40 bg-error-subtle px-3 py-2 text-sm text-error"
					role="alert"
				>
					{error}
				</p>
			) : null}
			{message ? <p className="text-sm text-success">{message}</p> : null}

			<section className="space-y-4 border border-border p-5">
				<h2 className="text-xs font-bold uppercase tracking-widest text-muted">Thông tin khóa</h2>
				<label className="block">
					<span className="text-xs text-muted">Tiêu đề</span>
					<input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="mt-1 min-h-11 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm"
					/>
				</label>
				<label className="block">
					<span className="text-xs text-muted">Slug</span>
					<input
						value={slug}
						onChange={(e) => setSlug(e.target.value)}
						className="mt-1 min-h-11 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm"
					/>
				</label>
				<label className="block">
					<span className="text-xs text-muted">Tóm tắt</span>
					<textarea
						value={summary}
						onChange={(e) => setSummary(e.target.value)}
						rows={2}
						className="mt-1 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm"
					/>
				</label>
				<label className="block">
					<span className="text-xs text-muted">Mô tả</span>
					<textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						rows={4}
						className="mt-1 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm"
					/>
				</label>
				<label className="block">
					<span className="text-xs text-muted">Ảnh thumbnail (URL)</span>
					<input
						value={thumbnailUrl}
						onChange={(e) => setThumbnailUrl(e.target.value)}
						className="mt-1 min-h-11 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm"
						placeholder="https://"
					/>
				</label>
				<label className="block max-w-xs">
					<span className="text-xs text-muted">Trạng thái</span>
					<select
						value={status}
						onChange={(e) => setStatus(e.target.value as PublishStatus)}
						className="mt-1 min-h-11 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm"
					>
						<option value="DRAFT">Nháp</option>
						<option value="PUBLISHED">Đã xuất bản</option>
						<option value="ARCHIVED">Lưu trữ</option>
					</select>
				</label>
				<label className="block max-w-xs">
					<span className="text-xs text-muted">Hiển thị công khai</span>
					<select
						value={visibility}
						onChange={(e) => setVisibility(e.target.value as CourseVisibility)}
						className="mt-1 min-h-11 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm"
					>
						<option value="PRIVATE">Riêng tư (chỉ học viên ghi danh)</option>
						<option value="CATALOG">Danh mục (hiện trên trang công khai)</option>
					</select>
					<p className="mt-1 text-xs text-muted">
						Chỉ khóa PUBLISHED + CATALOG mới xuất hiện trong danh mục công khai.
					</p>
				</label>
				<label className="block">
					<span className="text-xs text-muted">Đối tượng</span>
					<input
						value={audience}
						onChange={(e) => setAudience(e.target.value)}
						className="mt-1 min-h-11 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm"
						placeholder="Ví dụ: Sinh viên năm 3–4, PM junior…"
					/>
				</label>
				<label className="block">
					<span className="text-xs text-muted">Kết quả học tập</span>
					<textarea
						value={learningOutcomes}
						onChange={(e) => setLearningOutcomes(e.target.value)}
						rows={4}
						className="mt-1 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm"
						placeholder="Mỗi dòng một kết quả mong đợi"
					/>
				</label>
				<label className="block">
					<span className="text-xs text-muted">Hình thức</span>
					<input
						value={format}
						onChange={(e) => setFormat(e.target.value)}
						className="mt-1 min-h-11 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm"
						placeholder="Ví dụ: Video + bài đọc + bài tập"
					/>
				</label>
				<label className="block max-w-xs">
					<span className="text-xs text-muted">Thời lượng (mô tả)</span>
					<input
						value={durationText}
						onChange={(e) => setDurationText(e.target.value)}
						className="mt-1 min-h-11 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm"
						placeholder="Ví dụ: ~6 tuần, 2–3 giờ/tuần"
					/>
				</label>
				<label className="block">
					<span className="text-xs text-muted">Điều kiện tiên quyết</span>
					<textarea
						value={prerequisites}
						onChange={(e) => setPrerequisites(e.target.value)}
						rows={3}
						className="mt-1 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm"
					/>
				</label>
				<Button type="button" disabled={busy} onClick={() => void saveCourse()}>
					Lưu khóa học
				</Button>
			</section>

			<section className="space-y-4">
				<div className="flex flex-wrap items-end justify-between gap-3">
					<h2 className="text-xs font-bold uppercase tracking-widest text-muted">
						Chương & bài học
					</h2>
					<div className="flex flex-wrap gap-2">
						<input
							value={moduleTitle}
							onChange={(e) => setModuleTitle(e.target.value)}
							placeholder="Tên chương mới"
							className="min-h-11 rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm"
						/>
						<button
							type="button"
							disabled={busy}
							onClick={() => void addModule()}
							className="min-h-11 rounded-full border border-border-strong px-3 py-2 text-xs font-bold uppercase tracking-wider hover:border-foreground disabled:opacity-50"
						>
							Thêm chương
						</button>
					</div>
				</div>

				{course.modules.length === 0 ? (
					<p className="text-sm text-muted">Chưa có chương nào.</p>
				) : (
					<div className="space-y-4">
						{course.modules.map((mod, modIdx) => (
							<div key={mod.id} className="border border-border p-4">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<h3 className="text-sm font-bold text-foreground">
										{mod.position + 1}. {mod.title}
									</h3>
									<div className="flex flex-wrap gap-2">
										<button
											type="button"
											aria-label="Đưa chương lên"
											disabled={modIdx === 0 || rowBusy === mod.id}
											onClick={() => void moveModule(mod.id, -1)}
											className="min-h-10 min-w-10 rounded-md border border-border px-2 text-xs disabled:opacity-40"
										>
											↑
										</button>
										<button
											type="button"
											aria-label="Đưa chương xuống"
											disabled={modIdx === course.modules.length - 1 || rowBusy === mod.id}
											onClick={() => void moveModule(mod.id, 1)}
											className="min-h-10 min-w-10 rounded-md border border-border px-2 text-xs disabled:opacity-40"
										>
											↓
										</button>
										<button
											type="button"
											onClick={() => setConfirm({ type: 'module', id: mod.id, title: mod.title })}
											className="min-h-10 text-xs text-error hover:underline"
										>
											Xóa chương
										</button>
									</div>
								</div>
								<ul className="mt-3 space-y-2">
									{mod.lessons.map((lesson, lessonIdx) => {
										const ready = lessonReady(lesson);
										return (
											<li
												key={lesson.id}
												className="flex flex-col gap-2 rounded-lg bg-surface-hover/40 px-3 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
											>
												<div className="min-w-0">
													<p className="font-medium text-foreground">
														{lesson.position + 1}. {lesson.title}
													</p>
													<p className="mt-0.5 text-xs uppercase tracking-wider text-muted">
														/{lesson.slug} · {lesson.status} · {READY_LABEL[ready]}
													</p>
												</div>
												<span className="flex flex-wrap gap-2">
													<button
														type="button"
														aria-label="Đưa bài lên"
														disabled={lessonIdx === 0 || rowBusy === lesson.id}
														onClick={() => void moveLesson(mod.id, lesson.id, -1)}
														className="min-h-10 min-w-10 rounded-md border border-border px-2 text-xs disabled:opacity-40"
													>
														↑
													</button>
													<button
														type="button"
														aria-label="Đưa bài xuống"
														disabled={lessonIdx === mod.lessons.length - 1 || rowBusy === lesson.id}
														onClick={() => void moveLesson(mod.id, lesson.id, 1)}
														className="min-h-10 min-w-10 rounded-md border border-border px-2 text-xs disabled:opacity-40"
													>
														↓
													</button>
													<Link
														href={routes.admin.lessonEdit(course.id, lesson.id)}
														className="inline-flex min-h-10 items-center text-xs font-semibold text-accent hover:underline"
													>
														Biên soạn
													</Link>
													{lesson.status !== 'PUBLISHED' ? (
														<button
															type="button"
															disabled={rowBusy === lesson.id}
															className="min-h-10 text-xs text-accent hover:underline disabled:opacity-50"
															onClick={() => void setLessonStatus(mod.id, lesson.id, 'PUBLISHED')}
														>
															Xuất bản
														</button>
													) : (
														<button
															type="button"
															disabled={rowBusy === lesson.id}
															className="min-h-10 text-xs text-muted hover:underline disabled:opacity-50"
															onClick={() => void setLessonStatus(mod.id, lesson.id, 'DRAFT')}
														>
															Về nháp
														</button>
													)}
													<button
														type="button"
														className="min-h-10 text-xs text-error hover:underline"
														onClick={() =>
															setConfirm({
																type: 'lesson',
																moduleId: mod.id,
																lessonId: lesson.id,
																title: lesson.title,
															})
														}
													>
														Xóa
													</button>
												</span>
											</li>
										);
									})}
								</ul>
								<div className="mt-3 flex flex-wrap gap-2">
									<input
										value={lessonTitles[mod.id] ?? ''}
										onChange={(e) =>
											setLessonTitles((prev) => ({ ...prev, [mod.id]: e.target.value }))
										}
										placeholder="Tên bài học mới"
										className="min-h-11 flex-1 rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm"
									/>
									<button
										type="button"
										disabled={busy}
										onClick={() => void addLesson(mod.id)}
										className="min-h-11 rounded-full border border-border-strong px-3 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
									>
										Thêm bài
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</section>

			<Dialog
				open={!!confirm}
				onClose={() => setConfirm(null)}
				title={confirm?.type === 'module' ? 'Xóa chương?' : 'Xóa bài học?'}
				description={
					confirm
						? confirm.type === 'module'
							? `Xóa “${confirm.title}” và toàn bộ bài học bên trong. Không hoàn tác.`
							: `Xóa “${confirm.title}”. Không hoàn tác.`
						: undefined
				}
			>
				<div className="flex flex-wrap justify-end gap-2">
					<Button type="button" variant="secondary" onClick={() => setConfirm(null)}>
						Hủy
					</Button>
					<Button
						type="button"
						variant="danger"
						disabled={!!rowBusy}
						onClick={() => void runConfirm()}
					>
						Xóa
					</Button>
				</div>
			</Dialog>
		</div>
	);
}
