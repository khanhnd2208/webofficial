'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/Dialog';
import ThumbnailUpload from '@/components/forms/ThumbnailUpload';
import { routes } from '@/config/routes';
import { myClassApi } from './api';
import {
	StudioActionBar,
	StudioButton,
	StudioField,
	StudioInput,
	StudioInspector,
	StudioSelect,
	StudioStatus,
	StudioTextarea,
} from './studio';

type CourseSettings = {
	id: string;
	title: string;
	slug: string;
	summary: string;
	description: string;
	thumbnailUrl: string | null;
	level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null;
	tags: string[];
	status: string;
	updatedAt: string | Date;
};

export default function CourseSettingsForm({ course }: { course: CourseSettings }) {
	const router = useRouter();
	const [title, setTitle] = useState(course.title);
	const [slug, setSlug] = useState(course.slug);
	const [summary, setSummary] = useState(course.summary);
	const [description, setDescription] = useState(course.description);
	const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnailUrl ?? '');
	const [level, setLevel] = useState(course.level ?? '');
	const [tagsText, setTagsText] = useState(course.tags.join(', '));
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);
	const [confirm, setConfirm] = useState<'archive' | null>(null);
	const tags = tagsText
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean)
		.slice(0, 10);
	const dirty =
		title !== course.title ||
		slug !== course.slug ||
		summary !== course.summary ||
		description !== course.description ||
		thumbnailUrl !== (course.thumbnailUrl ?? '') ||
		level !== (course.level ?? '') ||
		tags.join('|') !== course.tags.join('|');

	useEffect(() => {
		if (!dirty) return;
		const onBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = '';
		};
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	}, [dirty]);

	async function save() {
		setBusy(true);
		setError(null);
		setSaved(false);
		try {
			await myClassApi(`/api/admin/my-class/courses/${course.id}`, {
				method: 'PATCH',
				body: JSON.stringify({
					title,
					slug,
					summary,
					description,
					thumbnailUrl: thumbnailUrl || null,
					level: level || null,
					tags,
					expectedUpdatedAt: new Date(course.updatedAt).toISOString(),
				}),
			});
			setSaved(true);
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không lưu được');
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="space-y-6">
			<StudioActionBar
				status={
					busy
						? 'Đang lưu…'
						: dirty
							? 'Có thay đổi chưa lưu'
							: saved
								? 'Đã lưu thay đổi'
								: 'Đã đồng bộ'
				}
				actions={
					<>
						<StudioButton
							variant="secondary"
							disabled={!dirty || busy}
							onClick={() => router.refresh()}
						>
							Hủy thay đổi
						</StudioButton>
						<StudioButton disabled={!dirty || busy} onClick={() => void save()}>
							{busy ? 'Đang lưu…' : 'Lưu thay đổi'}
						</StudioButton>
					</>
				}
			/>
			{error ? (
				<p
					className="rounded-[var(--mc-r-sm)] border border-error/30 bg-error-subtle p-3 text-sm text-error"
					role="alert"
				>
					{error}
				</p>
			) : null}
			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
				<div className="space-y-6">
					<section className="mc-surface space-y-5 p-5 sm:p-6">
						<div>
							<h2 className="text-base font-bold text-ink">Thông tin cơ bản</h2>
							<p className="mc-meta mt-1">
								Thông tin học viên nhìn thấy trong catalog và trang khóa học.
							</p>
						</div>
						<StudioField label="Tên khóa học">
							<StudioInput value={title} onChange={(event) => setTitle(event.target.value)} />
						</StudioField>
						<StudioField
							label="Đường dẫn"
							hint={`Trang học viên: /my-space/my-class/${slug || 'duong-dan'}`}
						>
							<StudioInput value={slug} onChange={(event) => setSlug(event.target.value)} />
						</StudioField>
						<StudioField label="Tóm tắt" hint={`${summary.length}/500 ký tự`}>
							<StudioTextarea
								value={summary}
								onChange={(event) => setSummary(event.target.value)}
								rows={3}
								maxLength={500}
							/>
						</StudioField>
						<StudioField label="Mô tả chi tiết">
							<StudioTextarea
								value={description}
								onChange={(event) => setDescription(event.target.value)}
								rows={7}
								maxLength={10000}
							/>
						</StudioField>
						<div className="grid gap-5 sm:grid-cols-2">
							<StudioField label="Cấp độ">
								<StudioSelect value={level} onChange={(event) => setLevel(event.target.value)}>
									<option value="">Chưa xác định</option>
									<option value="BEGINNER">Cơ bản</option>
									<option value="INTERMEDIATE">Trung cấp</option>
									<option value="ADVANCED">Nâng cao</option>
								</StudioSelect>
							</StudioField>
							<StudioField label="Chủ đề" hint="Tối đa 10 chủ đề, phân tách bằng dấu phẩy">
								<StudioInput
									value={tagsText}
									onChange={(event) => setTagsText(event.target.value)}
									placeholder="Nhân sự, Quản trị"
								/>
							</StudioField>
						</div>
					</section>
					<section className="mc-surface p-5 sm:p-6">
						<ThumbnailUpload value={thumbnailUrl} onChange={setThumbnailUrl} variant="product" />
					</section>
				</div>
				<div className="space-y-5 xl:sticky xl:top-4 xl:self-start">
					<StudioInspector title="Trạng thái khóa học">
						<div className="flex items-center justify-between gap-3">
							<span className="text-sm text-ink-secondary">Xuất bản</span>
							<StudioStatus status={course.status} />
						</div>
						<Link
							href={routes.admin.myClassCourseOverview(course.id)}
							className="inline-flex min-h-10 items-center text-sm font-semibold text-accent hover:underline"
						>
							Xem kiểm tra xuất bản →
						</Link>
					</StudioInspector>
					<StudioInspector title="Xem trước">
						{thumbnailUrl ? (
							<img
								src={thumbnailUrl}
								alt=""
								className="aspect-video w-full rounded-[var(--mc-r-sm)] object-cover"
							/>
						) : (
							<div className="flex aspect-video items-center justify-center rounded-[var(--mc-r-sm)] bg-surface-sunken">
								<span className="mc-num text-2xl text-ink-tertiary">
									{title.slice(0, 1).toUpperCase()}
								</span>
							</div>
						)}
						<p className="line-clamp-2 text-sm font-bold text-ink">{title || 'Tên khóa học'}</p>
						<Link
							href={routes.myClassCourse(course.slug)}
							target="_blank"
							rel="noreferrer"
							className="inline-flex min-h-10 items-center text-sm font-semibold text-ink"
						>
							Xem như học viên ↗
						</Link>
					</StudioInspector>
					<StudioInspector title="Vùng nguy hiểm" className="border-error/30">
						<p className="text-sm leading-6 text-ink-secondary">
							Lưu trữ sẽ ẩn khóa học khỏi học viên nhưng giữ dữ liệu lịch sử.
						</p>
						<StudioButton variant="danger" onClick={() => setConfirm('archive')}>
							Lưu trữ khóa học
						</StudioButton>
					</StudioInspector>
				</div>
			</div>
			<Dialog
				open={confirm === 'archive'}
				onClose={() => setConfirm(null)}
				title="Lưu trữ khóa học?"
			>
				<p className="text-sm">
					Gõ đúng tên khóa để xác nhận: <strong>{course.title}</strong>
				</p>
				<form
					className="mt-4 space-y-3"
					onSubmit={(event) => {
						event.preventDefault();
						const value = String(new FormData(event.currentTarget).get('name') ?? '');
						if (value !== course.title) return;
						void myClassApi(`/api/admin/my-class/courses/${course.id}`, { method: 'DELETE' }).then(
							() => router.push(routes.admin.myClass),
						);
					}}
				>
					<StudioInput name="name" autoComplete="off" />
					<div className="flex justify-end gap-2">
						<StudioButton variant="quiet" onClick={() => setConfirm(null)}>
							Hủy
						</StudioButton>
						<StudioButton variant="danger" type="submit">
							Lưu trữ
						</StudioButton>
					</div>
				</form>
			</Dialog>
		</div>
	);
}
