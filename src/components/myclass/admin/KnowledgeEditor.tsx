'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import KnowledgeUnitFields, {
	type KnowledgeUnitLevelTab,
} from '@/components/myclass/admin/KnowledgeUnitFields';
import { Dialog } from '@/components/ui/Dialog';
import { routes } from '@/config/routes';
import { myClassApi, myClassList } from './api';

type Unit = {
	id: string;
	slug: string;
	updatedAt: string | Date;
	status: string;
	revisions: Array<{
		id: string;
		version: number;
		status: string;
		title: string;
		summary: string;
		foundationHtml: string;
		academicHtml: string;
		expertHtml: string;
	}>;
	related: Array<{ id: string; slug: string; title: string }>;
	whereUsed: Array<{
		courseTitle: string;
		lessonTitle: string;
		sectionTitle: string;
		href: string;
	}>;
};

export default function KnowledgeEditor({ initial }: { initial: Unit }) {
	const router = useRouter();
	const draft = initial.revisions.find((item) => item.status === 'DRAFT') ?? initial.revisions[0];
	const [title, setTitle] = useState(draft?.title ?? '');
	const [summary, setSummary] = useState(draft?.summary ?? '');
	const [foundationHtml, setFoundationHtml] = useState(draft?.foundationHtml ?? '');
	const [academicHtml, setAcademicHtml] = useState(draft?.academicHtml ?? '');
	const [expertHtml, setExpertHtml] = useState(draft?.expertHtml || draft?.academicHtml || '');
	const [tab, setTab] = useState<KnowledgeUnitLevelTab>('foundation');
	const [relatedQ, setRelatedQ] = useState('');
	const [relatedHits, setRelatedHits] = useState<Array<{ id: string; title: string }>>([]);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [confirmArchive, setConfirmArchive] = useState(false);
	const dirty =
		title !== (draft?.title ?? '') ||
		summary !== (draft?.summary ?? '') ||
		foundationHtml !== (draft?.foundationHtml ?? '') ||
		academicHtml !== (draft?.academicHtml ?? '') ||
		expertHtml !== (draft?.expertHtml ?? '');

	useEffect(() => {
		function onBeforeUnload(event: BeforeUnloadEvent) {
			if (!dirty) return;
			event.preventDefault();
			event.returnValue = '';
		}
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	}, [dirty]);

	async function save() {
		setBusy(true);
		setError(null);
		try {
			const saved = await myClassApi<Unit>(`/api/admin/my-class/knowledge/${initial.id}`, {
				method: 'PATCH',
				body: JSON.stringify({ title, summary, foundationHtml, academicHtml: '', expertHtml }),
			});
			router.refresh();
			return saved;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không lưu được');
			throw err;
		} finally {
			setBusy(false);
		}
	}

	async function publish() {
		setBusy(true);
		try {
			const saved = await save();
			await myClassApi(`/api/admin/my-class/knowledge/${initial.id}/publish`, {
				method: 'POST',
				body: JSON.stringify({
					expectedUpdatedAt: new Date(saved.updatedAt).toISOString(),
					requireBoth: true,
				}),
			});
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không publish được');
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="space-y-6">
			{error ? <p className="text-sm text-error">{error}</p> : null}
			<KnowledgeUnitFields
				title={title}
				slug={initial.slug}
				summary={summary}
				foundationHtml={foundationHtml}
				academicHtml={academicHtml}
				expertHtml={expertHtml}
				tab={tab}
				onTitleChange={setTitle}
				onSummaryChange={setSummary}
				onFoundationChange={setFoundationHtml}
				onAcademicChange={setAcademicHtml}
				onExpertChange={setExpertHtml}
				onTabChange={setTab}
				productMode
				onError={setError}
				showSlug={false}
			/>
			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					disabled={busy}
					onClick={() => void save()}
					className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-sm font-semibold text-paper"
				>
					Lưu nháp
				</button>
				<button
					type="button"
					disabled={busy}
					onClick={() => void publish()}
					className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] border border-mc-rule px-4 text-sm font-semibold"
				>
					Xuất bản
				</button>
				<button
					type="button"
					onClick={() => setConfirmArchive(true)}
					className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] border border-mc-rule px-4 text-sm font-semibold"
				>
					Lưu trữ
				</button>
			</div>
			<section>
				<h2 className="font-bold">Nội dung liên quan</h2>
				<ul className="mt-2 space-y-1 text-sm">
					{initial.related.map((item) => (
						<li key={item.id} className="flex justify-between">
							<Link href={routes.admin.myClassKnowledgeEdit(item.id)}>{item.title}</Link>
							<button
								type="button"
								onClick={() =>
									void myClassApi(
										`/api/admin/my-class/knowledge/${initial.id}/related?toId=${item.id}`,
										{ method: 'DELETE' },
									).then(() => router.refresh())
								}
							>
								Gỡ
							</button>
						</li>
					))}
				</ul>
				<div className="mt-3 flex gap-2">
					<input
						value={relatedQ}
						onChange={(e) => setRelatedQ(e.target.value)}
						placeholder="Tìm nội dung"
						className="min-h-11 flex-1 rounded-[var(--mc-r-sm)] border border-mc-rule px-3"
					/>
					<button
						type="button"
						onClick={() =>
							void myClassList<{ id: string; title: string }>(
								`/api/admin/my-class/knowledge?q=${encodeURIComponent(relatedQ)}`,
							).then(setRelatedHits)
						}
					>
						Tìm
					</button>
				</div>
				<ul className="mt-2 space-y-1 text-sm">
					{relatedHits.map((item) => (
						<li key={item.id}>
							<button
								type="button"
								className="underline"
								onClick={() =>
									void myClassApi(`/api/admin/my-class/knowledge/${initial.id}/related`, {
										method: 'POST',
										body: JSON.stringify({ toId: item.id }),
									}).then(() => router.refresh())
								}
							>
								{item.title}
							</button>
						</li>
					))}
				</ul>
			</section>
			<section>
				<h2 className="font-bold">Where used</h2>
				<ul className="mt-2 space-y-1 text-sm">
					{initial.whereUsed.map((item) => (
						<li key={item.href}>
							<Link href={item.href}>
								{item.courseTitle} · {item.lessonTitle} · {item.sectionTitle}
							</Link>
						</li>
					))}
					{initial.whereUsed.length === 0 ? (
						<li className="text-muted">Chưa gắn vào Section nào.</li>
					) : null}
				</ul>
			</section>
			<section>
				<h2 className="font-bold">Lịch sử version</h2>
				<ul className="mt-2 space-y-1 text-sm">
					{initial.revisions.map((item) => (
						<li key={item.id}>
							v{item.version} · {item.status} · {item.title}
						</li>
					))}
				</ul>
			</section>
			<Dialog
				open={confirmArchive}
				onClose={() => setConfirmArchive(false)}
				title="Lưu trữ đơn vị kiến thức?"
			>
				<p className="text-sm">
					Bản sửa và liên kết được giữ lại. Đơn vị kiến thức sẽ không còn hiện với học viên.
				</p>
				<div className="mt-4 flex justify-end gap-2">
					<button type="button" onClick={() => setConfirmArchive(false)}>
						Hủy
					</button>
					<button
						type="button"
						onClick={() =>
							void myClassApi(`/api/admin/my-class/knowledge/${initial.id}`, {
								method: 'DELETE',
							}).then(() => router.push(routes.admin.myClassKnowledge))
						}
					>
						Lưu trữ
					</button>
				</div>
			</Dialog>
		</div>
	);
}
