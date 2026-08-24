'use client';

import { useState } from 'react';
import Link from 'next/link';

import {
	StudioButton,
	StudioField,
	StudioInput,
	StudioTextarea,
} from '@/components/myclass/admin/studio';
import { McIcon } from '@/components/myclass/ui';
import { routes } from '@/config/routes';
import type { TeachingPublicPageConfig } from '@/features/teaching/types';

import { teachingApi } from './api';

type LinkDraft = {
	key: string;
	label: string;
	url: string;
	description: string;
};

function normalizeSlug(value: string) {
	return value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 80);
}

export function PublicPageEditor({ initial }: { initial: TeachingPublicPageConfig }) {
	const [form, setForm] = useState({
		publicSlug: initial.class.publicSlug ?? '',
		publicTitle: initial.class.publicTitle || initial.class.courseName,
		publicSummary: initial.class.publicSummary,
		publicDescription: initial.class.publicDescription,
		publicAnnouncement: initial.class.publicAnnouncement,
	});
	const [links, setLinks] = useState<LinkDraft[]>(
		initial.links.map((link) => ({
			key: link.id,
			label: link.label,
			url: link.url,
			description: link.description,
		})),
	);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [copied, setCopied] = useState(false);

	const publicPath = form.publicSlug ? routes.teachingPublicClass(form.publicSlug) : '';
	const isShared = initial.class.attendanceVisible;

	async function save() {
		setBusy(true);
		setMessage('');
		setError('');
		try {
			const updated = await teachingApi<TeachingPublicPageConfig>(
				`/api/admin/teaching/classes/${initial.class.id}/public`,
				{
					method: 'PATCH',
					body: JSON.stringify({
						...form,
						publicSlug: normalizeSlug(form.publicSlug),
						links: links.map(({ label, url, description }) => ({
							label,
							url,
							description,
						})),
					}),
				},
			);
			setForm({
				publicSlug: updated.class.publicSlug ?? '',
				publicTitle: updated.class.publicTitle,
				publicSummary: updated.class.publicSummary,
				publicDescription: updated.class.publicDescription,
				publicAnnouncement: updated.class.publicAnnouncement,
			});
			setLinks(
				updated.links.map((link) => ({
					key: link.id,
					label: link.label,
					url: link.url,
					description: link.description,
				})),
			);
			setMessage(updated.class.attendanceVisible ? 'Đã lưu nội dung trang sinh viên.' : 'Đã lưu nội dung. Lớp hiện chưa được chia sẻ.');
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Không thể lưu trang công khai');
		} finally {
			setBusy(false);
		}
	}

	async function copyPublicUrl() {
		if (!isShared || !publicPath) return;
		try {
			await navigator.clipboard.writeText(`${window.location.origin}${publicPath}`);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1800);
		} catch {
			setError(`Không thể sao chép tự động. Hãy sao chép thủ công: ${window.location.origin}${publicPath}`);
		}
	}

	function patchLink(key: string, patch: Partial<LinkDraft>) {
		setLinks((current) => current.map((link) => (link.key === key ? { ...link, ...patch } : link)));
	}

	return (
		<div className="mt-6 space-y-5">
			<section className="mc-surface flex flex-wrap items-center justify-between gap-4 p-4">
				<div className="flex items-center gap-3">
					<span className="teaching-status" data-tone={isShared ? 'ok' : 'muted'}>
						{isShared ? 'Đang chia sẻ' : 'Chưa chia sẻ'}
					</span>
					<div>
						<p className="text-sm font-semibold text-ink">Nội dung trang sinh viên</p>
						<p className="mc-meta mt-0.5">
							Nội dung giới thiệu và tài nguyên của trang công khai; bảng điểm danh, CP và nội quy được quản lý ở mục Chia sẻ.
						</p>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{isShared && publicPath ? (
						<button
							type="button"
							className="inline-flex min-h-10 items-center gap-2 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 text-sm font-semibold text-ink hover:bg-surface-sunken"
							onClick={copyPublicUrl}
						>
							<McIcon name="content_copy" size={16} />
							{copied ? 'Đã sao chép' : 'Sao chép liên kết'}
						</button>
					) : null}
					{isShared && publicPath ? (
						<Link
							href={publicPath}
							target="_blank"
							className="inline-flex min-h-10 items-center gap-2 rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 text-sm font-semibold text-ink hover:bg-surface-sunken"
						>
							<McIcon name="open_in_new" size={16} />
							Mở trang sinh viên
						</Link>
					) : null}
				</div>
			</section>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
				<form
					className="space-y-6"
					 onSubmit={(event) => {
						event.preventDefault();
						void save();
					}}
				>
					<section className="mc-surface grid gap-4 p-5 md:grid-cols-2">
						<div className="md:col-span-2">
							<p className="mc-eyebrow">Nhận diện trang</p>
							<h2 className="mt-1 text-lg font-semibold text-ink">Nội dung hiển thị</h2>
						</div>
						<StudioField
							label="Đường dẫn trang sinh viên"
							hint={publicPath ? `toiladuykhanh.com${publicPath}` : 'Dùng chữ thường, số và dấu gạch ngang.'}
						>
							<StudioInput
								required
								minLength={3}
								value={form.publicSlug}
								onChange={(event) => setForm({ ...form, publicSlug: event.target.value })}
								onBlur={() => setForm((current) => ({ ...current, publicSlug: normalizeSlug(current.publicSlug) }))}
							/>
						</StudioField>
						<StudioField label="Tiêu đề hiển thị" hint="Mặc định dùng tên học phần.">
							<StudioInput
								value={form.publicTitle}
								onChange={(event) => setForm({ ...form, publicTitle: event.target.value })}
							/>
						</StudioField>
						<StudioField
							label="Tóm tắt ngắn"
							hint={`${form.publicSummary.length}/320 · bắt buộc trước khi chia sẻ`}
							className="md:col-span-2"
						>
							<StudioTextarea
								required
								maxLength={320}
								rows={3}
								value={form.publicSummary}
								onChange={(event) => setForm({ ...form, publicSummary: event.target.value })}
							/>
						</StudioField>
						<StudioField
							label="Mô tả lớp"
							hint="Văn bản thuần túy; xuống dòng được giữ nguyên."
							className="md:col-span-2"
						>
							<StudioTextarea
								maxLength={5000}
								rows={9}
								value={form.publicDescription}
								onChange={(event) => setForm({ ...form, publicDescription: event.target.value })}
							/>
						</StudioField>
						<StudioField
							label="Thông báo"
							hint="Thông báo tùy chọn, hiển thị nổi bật ở đầu trang."
							className="md:col-span-2"
						>
							<StudioTextarea
								maxLength={500}
								rows={3}
								value={form.publicAnnouncement}
								onChange={(event) => setForm({ ...form, publicAnnouncement: event.target.value })}
							/>
						</StudioField>
					</section>

					<section className="mc-surface p-5">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div>
								<p className="mc-eyebrow">Tài nguyên</p>
								<h2 className="mt-1 text-lg font-semibold text-ink">Liên kết quan trọng</h2>
								<p className="mc-meta mt-1">Thêm tối đa 20 liên kết. Chỉ chấp nhận URL http:// và https://.</p>
							</div>
							<StudioButton
								variant="secondary"
								size="sm"
								disabled={links.length >= 20}
								onClick={() =>
									setLinks((current) => [
										...current,
										{ key: `new-${Date.now()}`, label: '', url: '', description: '' },
									])
								}
							>
								<McIcon name="add" size={16} />
								Thêm liên kết
							</StudioButton>
						</div>
						<div className="mt-4 space-y-3">
							{links.length ? (
								links.map((link, index) => (
									<div
										key={link.key}
										className="grid gap-3 rounded-[var(--mc-r-sm)] border border-mc-rule p-4 md:grid-cols-2"
									>
												<StudioField label={`Nhãn liên kết ${index + 1}`}>
											<StudioInput
												required
												value={link.label}
												onChange={(event) => patchLink(link.key, { label: event.target.value })}
											/>
										</StudioField>
										<StudioField label="URL">
											<StudioInput
												required
												type="url"
												placeholder="https://..."
												value={link.url}
												onChange={(event) => patchLink(link.key, { url: event.target.value })}
											/>
										</StudioField>
												<StudioField label="Mô tả" className="md:col-span-2">
											<StudioInput
												value={link.description}
												onChange={(event) => patchLink(link.key, { description: event.target.value })}
											/>
										</StudioField>
										<div className="md:col-span-2 flex justify-end">
											<StudioButton
												variant="quiet"
												size="sm"
												onClick={() => setLinks((current) => current.filter((item) => item.key !== link.key))}
											>
														Xóa
											</StudioButton>
										</div>
									</div>
								))
							) : (
								<p className="rounded-[var(--mc-r-sm)] bg-surface-sunken p-4 text-sm text-ink-secondary">
													Chưa có tài nguyên công khai.
								</p>
							)}
						</div>
					</section>

					<div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-[var(--mc-r-md)] border border-mc-rule bg-paper/95 p-4 shadow-[var(--mc-shadow-2)] backdrop-blur">
						<div>
							{message ? <p className="text-sm font-semibold text-mc-done">{message}</p> : null}
							{error ? <p className="text-sm font-semibold text-error">{error}</p> : null}
						</div>
						<StudioButton type="submit" disabled={busy}>Lưu nội dung</StudioButton>
					</div>
				</form>

				<aside className="xl:sticky xl:top-6 xl:self-start">
					<p className="mc-eyebrow mb-2">Xem trước</p>
					<div className="overflow-hidden rounded-[var(--mc-r-md)] border border-mc-rule bg-paper shadow-[var(--mc-shadow-1)]">
						<div className="border-b border-mc-rule bg-ink p-5 text-paper">
							<p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-65">
								{initial.class.courseCode} · {initial.class.term}
							</p>
							<h2 className="mt-3 text-2xl font-semibold leading-tight">
								{form.publicTitle || initial.class.courseName}
							</h2>
							<p className="mt-3 text-sm leading-6 opacity-80">
								{form.publicSummary || 'Tóm tắt công khai sẽ hiển thị ở đây.'}
							</p>
						</div>
						<div className="space-y-5 p-5">
							{form.publicAnnouncement ? (
								<div className="rounded-[var(--mc-r-sm)] bg-accent-subtle p-3 text-sm text-ink">
									{form.publicAnnouncement}
								</div>
							) : null}
							<div>
								<p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">Lớp học</p>
								<p className="mt-2 text-sm text-ink">
									Lớp {initial.class.groupNo} · {initial.class.lecturerName || 'Giảng viên'}
								</p>
							</div>
							{form.publicDescription ? (
								<p className="line-clamp-6 whitespace-pre-line text-sm leading-6 text-ink-secondary">
									{form.publicDescription}
								</p>
							) : null}
							{links.length ? (
								<div>
									<p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
											Liên kết quan trọng
									</p>
									<ul className="mt-2 space-y-2">
										{links.slice(0, 4).map((link) => (
											<li key={link.key} className="flex items-center gap-2 text-sm font-semibold text-accent">
												<McIcon name="link" size={15} />
														{link.label || 'Liên kết chưa đặt tên'}
											</li>
										))}
									</ul>
								</div>
							) : null}
						</div>
					</div>
					<p className="mc-meta mt-3">
					Bảng điểm danh, CP và nội quy lớp không được chỉnh sửa tại đây; hãy dùng mục Chia sẻ để quản lý phần học viên xem.
					</p>
				</aside>
			</div>
		</div>
	);
}
