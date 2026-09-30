'use client';

import { useState } from 'react';

import { LEARN_LEVEL_LABELS, type LearnCourseMeta, type LearnLevel } from '@/features/learn/types';

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
		<StudioDialog
			title="Thông tin khóa học"
			size="narrow"
			onClose={onClose}
			footer={
				<>
					{error ? <p className="mr-auto text-sm text-error">{error}</p> : null}
					<button type="button" className="ln-btn" onClick={onClose}>
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
				<label>
					<span>Tên khóa học</span>
					<input
						className="ln-input"
						value={draft.title}
						maxLength={200}
						onChange={(event) => set('title', event.target.value)}
					/>
				</label>
				<label>
					<span>Dòng giới thiệu ngắn</span>
					<input
						className="ln-input"
						value={draft.subtitle}
						maxLength={500}
						onChange={(event) => set('subtitle', event.target.value)}
					/>
				</label>
				<label>
					<span>Mô tả (hiện ở đầu mục đầu tiên)</span>
					<textarea
						className="ln-input"
						rows={4}
						value={draft.description}
						maxLength={4000}
						onChange={(event) => set('description', event.target.value)}
					/>
				</label>
				<div className="grid gap-4 sm:grid-cols-2">
					<label>
						<span>Chủ đề</span>
						<input
							className="ln-input"
							value={draft.category}
							maxLength={100}
							placeholder="VD: Quản trị học"
							onChange={(event) => set('category', event.target.value)}
						/>
					</label>
					<label>
						<span>Cấp độ</span>
						<select
							className="ln-input"
							value={draft.level}
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
				<label>
					<span>Đường dẫn</span>
					<span className="ln-affix ln-affix--wide">
						/my-space/courses/
						<input
							value={draft.slug}
							maxLength={180}
							onChange={(event) => set('slug', event.target.value)}
						/>
					</span>
				</label>

				<div className="ln-danger">
					<p className="font-medium">Xóa khóa học</p>
					<p className="text-sm text-ink-secondary">
						Xóa toàn bộ bài, mục và tiến độ của người học. Gõ tên khóa học để xác nhận.
					</p>
					<div className="mt-2 flex gap-2">
						<input
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
	);
}
