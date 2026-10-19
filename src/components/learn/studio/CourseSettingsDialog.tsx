'use client';

import { useState } from 'react';

import { LEARN_LEVEL_LABELS, type LearnCourseMeta, type LearnLevel } from '@/features/learn/types';

import { useStudioConfirm } from './StudioConfirm';
import StudioDialog from './StudioDialog';

export type CourseSettingsPatch = Pick<
	LearnCourseMeta,
	'title' | 'subtitle' | 'description' | 'category' | 'level' | 'slug'
>;

export default function CourseSettingsDialog({
	course,
	onClose,
	onSave,
	onDelete,
}: {
	course: LearnCourseMeta;
	onClose: () => void;
	onSave: (patch: CourseSettingsPatch) => Promise<void>;
	onDelete: () => Promise<void>;
}) {
	const [draft, setDraft] = useState<CourseSettingsPatch>({
		title: course.title,
		subtitle: course.subtitle,
		description: course.description,
		category: course.category,
		level: course.level,
		slug: course.slug,
	});
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [confirmDelete, setConfirmDelete] = useState('');
	const { confirm, confirmDialog } = useStudioConfirm();
	const dirty = (Object.keys(draft) as Array<keyof CourseSettingsPatch>).some(
		(key) => draft[key] !== course[key],
	);

	async function requestClose() {
		if (busy) return;
		if (dirty) {
			const accepted = await confirm({
				title: 'Bỏ thay đổi?',
				body: 'Những sửa ở hộp này chưa được lưu.',
				confirmLabel: 'Bỏ',
				cancelLabel: 'Ở lại',
				danger: true,
			});
			if (!accepted) return;
		}
		onClose();
	}

	const set = <K extends keyof CourseSettingsPatch>(key: K, value: CourseSettingsPatch[K]) =>
		setDraft((current) => ({ ...current, [key]: value }));

	async function run(action: () => Promise<void>) {
		setBusy(true);
		setError(null);
		try {
			await action();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không lưu được');
			setBusy(false);
		}
	}

	return (
		<>
			<StudioDialog
				title="Thông tin khóa học"
				size="narrow"
				busy={busy}
				onClose={() => void requestClose()}
				footer={
					<>
						<button
							type="button"
							className="ln-btn"
							disabled={busy}
							onClick={() => void requestClose()}
						>
							Hủy
						</button>
						<button
							type="button"
							className="ln-btn ln-btn--primary"
							disabled={busy || !draft.title.trim()}
							onClick={() => run(() => onSave(draft))}
						>
							Lưu
						</button>
					</>
				}
			>
				<div className="ln-form">
					{error ? (
						<p className="ln-field-error ln-field-error--block" role="alert">
							{error}
						</p>
					) : null}
					<label>
						<span>Tên khóa học</span>
						<input
							className="ln-input"
							value={draft.title}
							maxLength={200}
							onChange={(event) => set('title', event.target.value)}
						/>
					</label>
					<fieldset className="ln-fieldset">
						<legend>Trang tổng quan</legend>
						<p className="ln-field-hint">
							Học viên thấy các mục này trên trang tổng quan, trước khi mở một bài.
						</p>
						<label>
							<span>Dòng giới thiệu ngắn</span>
							<input
								className="ln-input"
								value={draft.subtitle}
								maxLength={500}
								aria-describedby="ln-course-subtitle-hint"
								onChange={(event) => set('subtitle', event.target.value)}
							/>
							<span id="ln-course-subtitle-hint" className="ln-field-hint">
								Hiện ngay dưới tên khóa.
							</span>
						</label>
						<label>
							<span>Mô tả</span>
							<textarea
								className="ln-input"
								rows={4}
								value={draft.description}
								maxLength={4000}
								aria-describedby="ln-course-description-hint"
								onChange={(event) => set('description', event.target.value)}
							/>
							<span id="ln-course-description-hint" className="ln-field-hint">
								Hiện ở phần Giới thiệu, phía trên mục lục bài.
							</span>
						</label>
						<div className="grid gap-4 sm:grid-cols-2">
							<label>
								<span>Chủ đề</span>
								<input
									className="ln-input"
									value={draft.category}
									maxLength={100}
									placeholder="VD: Quản trị học"
									aria-describedby="ln-course-category-hint"
									onChange={(event) => set('category', event.target.value)}
								/>
								<span id="ln-course-category-hint" className="ln-field-hint">
									Hiện cùng cấp độ, phía trên tên khóa.
								</span>
							</label>
							<label>
								<span>Cấp độ</span>
								<select
									className="ln-input"
									value={draft.level}
									aria-describedby="ln-course-category-hint"
									onChange={(event) => set('level', event.target.value as LearnLevel)}
								>
									{Object.entries(LEARN_LEVEL_LABELS).map(([value, label]) => (
										<option key={value} value={value}>
											{label}
										</option>
									))}
								</select>
							</label>
						</div>
					</fieldset>
					<label>
						<span>Đường dẫn</span>
						<span className="ln-affix ln-affix--wide">
							/khoa-hoc/
							<input
								value={draft.slug}
								maxLength={180}
								aria-label="Đường dẫn khóa học"
								aria-describedby="ln-course-slug-hint"
								onChange={(event) => set('slug', event.target.value)}
							/>
						</span>
						<span id="ln-course-slug-hint" className="ln-field-hint">
							Địa chỉ trang tổng quan và các bài của khóa.
						</span>
					</label>

					<div className="ln-danger">
						<p className="font-medium">Xóa khóa học</p>
						<p className="text-sm text-ink-secondary">
							Xóa toàn bộ bài, mục và tiến độ của người học. Gõ tên khóa học để xác nhận.
						</p>
						<div className="mt-2 flex gap-2">
							<label className="sr-only" htmlFor="ln-delete-course">
								Gõ tên khóa học để xác nhận xóa
							</label>
							<input
								id="ln-delete-course"
								className="ln-input min-w-0 flex-1"
								value={confirmDelete}
								onChange={(event) => setConfirmDelete(event.target.value)}
								placeholder={course.title}
							/>
							<button
								type="button"
								className="ln-btn ln-btn--danger"
								disabled={busy || confirmDelete.trim() !== course.title.trim()}
								onClick={() => run(onDelete)}
							>
								Xóa
							</button>
						</div>
					</div>
				</div>
			</StudioDialog>
			{confirmDialog}
		</>
	);
}
