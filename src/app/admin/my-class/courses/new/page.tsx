'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ThumbnailUpload from '@/components/forms/ThumbnailUpload';
import { routes } from '@/config/routes';
import { adminFetch } from '@/lib/admin/client';
import {
	StudioButton,
	StudioField,
	StudioInput,
	StudioPageHeader,
	StudioSelect,
	StudioTextarea,
} from '@/components/myclass/admin/studio';

export default function NewMyClassCoursePage() {
	const router = useRouter();
	const [title, setTitle] = useState('');
	const [slug, setSlug] = useState('');
	const [summary, setSummary] = useState('');
	const [description, setDescription] = useState('');
	const [thumbnailUrl, setThumbnailUrl] = useState('');
	const [level, setLevel] = useState('');
	const [tagsText, setTagsText] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function submit(event: React.FormEvent) {
		event.preventDefault();
		setBusy(true);
		setError(null);
		try {
			const created = await adminFetch<{ id: string }>('/api/admin/my-class/courses', {
				method: 'POST',
				body: JSON.stringify({
					title,
					slug: slug || undefined,
					summary,
					description,
					thumbnailUrl: thumbnailUrl || null,
					level: level || null,
					tags: tagsText
						.split(',')
						.map((item) => item.trim())
						.filter(Boolean)
						.slice(0, 10),
				}),
			});
			router.push(routes.admin.myClassCourseOverview(created.id));
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không thể tạo khóa học');
			setBusy(false);
		}
	}

	return (
		<div className="mc-studio-container px-0 py-8">
			<StudioPageHeader
				eyebrow="Khóa học"
				title="Tạo khóa học"
				description="Tạo thông tin nền trước, sau đó xây lộ trình và nội dung trong studio."
			/>
			<form onSubmit={submit} className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
				<section className="mc-surface space-y-5 p-5 sm:p-6">
					{error ? (
						<p
							className="rounded-[var(--mc-r-sm)] border border-error/30 bg-error-subtle p-3 text-sm text-error"
							role="alert"
						>
							{error}
						</p>
					) : null}
					<StudioField label="Tên khóa học">
						<StudioInput
							required
							value={title}
							onChange={(event) => setTitle(event.target.value)}
							autoFocus
						/>
					</StudioField>
					<StudioField label="Đường dẫn" hint="Để trống để tự tạo từ tên khóa học">
						<StudioInput
							value={slug}
							onChange={(event) => setSlug(event.target.value)}
							placeholder="tu-dong-tu-ten-khoa-hoc"
						/>
					</StudioField>
					<StudioField label="Tóm tắt">
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
							rows={6}
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
						<StudioField label="Chủ đề" hint="Phân tách bằng dấu phẩy">
							<StudioInput
								value={tagsText}
								onChange={(event) => setTagsText(event.target.value)}
								placeholder="Nhân sự, Quản trị"
							/>
						</StudioField>
					</div>
					<div className="flex flex-wrap gap-2 pt-2">
						<StudioButton type="submit" disabled={busy || !title.trim()}>
							{busy ? 'Đang tạo…' : 'Tạo và mở studio'}
						</StudioButton>
						<StudioButton variant="secondary" onClick={() => router.push(routes.admin.myClass)}>
							Hủy
						</StudioButton>
					</div>
				</section>
				<section className="mc-surface h-fit p-5 sm:p-6">
					<ThumbnailUpload value={thumbnailUrl} onChange={setThumbnailUrl} variant="product" />
				</section>
			</form>
		</div>
	);
}
