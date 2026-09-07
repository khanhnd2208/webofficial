'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { useAdminConfirm } from '@/components/admin/useAdminConfirm';
import {
	StudioButton,
	StudioField,
	StudioInput,
	StudioSelect,
} from '@/components/myclass/admin/studio';
import { teachingApi, AdminApiError } from '@/components/teaching/admin/api';
import { TeachingAppHeader } from '@/components/teaching/admin/TeachingAppHeader';
import { TeachingClassCards } from '@/components/teaching/admin/TeachingClassCards';
import { TeachingQuickMenu } from '@/components/teaching/admin/TeachingQuickMenu';
import { Dialog } from '@/components/ui/Dialog';
import { routes } from '@/config/routes';
import type { ActiveRecallDeckListItem, ActiveRecallStatus } from '@/features/active-recall';
import { collectTermSuggestions, formatDependencySummary } from '@/features/teaching/domain/adminLifecycle';
import type { TeachingCourseListItem } from '@/features/teaching/types';

function statusLabel(status: ActiveRecallDeckListItem['status']) {
	if (status === 'PUBLISHED') return 'Công khai';
	if (status === 'ARCHIVED') return 'Lưu trữ';
	return 'Bản nháp';
}

function mutationError(reason: unknown, fallback: string) {
	if (reason instanceof AdminApiError) {
		const summary = reason.details
			? formatDependencySummary(reason.details as Record<string, number>)
			: '';
		return summary ? `${reason.message}: ${summary}` : reason.message;
	}
	return reason instanceof Error ? reason.message : fallback;
}

export function TeachingCourseWorkspace({
	course,
	decks,
	tab,
}: {
	course: TeachingCourseListItem;
	decks: ActiveRecallDeckListItem[];
	tab: 'classes' | 'recall';
}) {
	const router = useRouter();
	const { confirm, dialog } = useAdminConfirm();
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [editDeck, setEditDeck] = useState<ActiveRecallDeckListItem | null>(null);
	const [draft, setDraft] = useState({
		title: '',
		lessonLabel: '',
		status: 'DRAFT' as ActiveRecallStatus,
	});
	const archived = course.status === 'ARCHIVED';
	const termSuggestions = useMemo(
		() => collectTermSuggestions(course.classes.map((item) => item.term)),
		[course.classes],
	);

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

	function openEdit(deck: ActiveRecallDeckListItem) {
		setEditDeck(deck);
		setDraft({ title: deck.title, lessonLabel: deck.lessonLabel, status: deck.status });
	}

	async function saveDeck() {
		if (!editDeck) return;
		await run(async () => {
			await teachingApi(`/api/admin/teaching/courses/${course.id}/recall/${editDeck.id}`, {
				method: 'PATCH',
				body: JSON.stringify({ ...draft, expectedUpdatedAt: editDeck.updatedAt }),
			});
			setEditDeck(null);
		});
	}

	async function setDeckStatus(deck: ActiveRecallDeckListItem, status: ActiveRecallStatus) {
		const ok = await confirm({
			title: status === 'ARCHIVED' ? 'Lưu trữ bộ thẻ' : 'Khôi phục bộ thẻ',
			description:
				status === 'ARCHIVED'
					? 'Học viên sẽ không còn thấy bộ thẻ này.'
					: 'Khôi phục bộ thẻ về bản nháp để tiếp tục sửa.',
			confirmLabel: status === 'ARCHIVED' ? 'Lưu trữ' : 'Khôi phục',
			tone: status === 'ARCHIVED' ? 'danger' : 'default',
		});
		if (!ok) return;
		await run(async () => {
			await teachingApi(`/api/admin/teaching/courses/${course.id}/recall/${deck.id}`, {
				method: 'PATCH',
				body: JSON.stringify({ status, expectedUpdatedAt: deck.updatedAt }),
			});
		});
	}

	async function deleteDeck(deck: ActiveRecallDeckListItem) {
		if (!deck.canDelete) {
			setError('Chỉ xóa được bộ thẻ trống và chưa gắn với lớp.');
			return;
		}
		const ok = await confirm({
			title: 'Xóa bộ thẻ',
			description: `Xóa vĩnh viễn “${deck.title}”?`,
			confirmLabel: 'Xóa vĩnh viễn',
			tone: 'danger',
		});
		if (!ok) return;
		await run(async () => {
			await teachingApi(`/api/admin/teaching/courses/${course.id}/recall/${deck.id}`, {
				method: 'DELETE',
			});
		});
	}

	return (
		<div className="py-6 sm:py-8">
			<TeachingAppHeader
				backHref={routes.mySpaceTeaching}
				backLabel="Các môn"
				eyebrow={`Teaching · ${course.courseCode}`}
				title={course.courseName}
				description={`${course.activeClassCount} lớp · ${course.deckCount} bộ Active Recall`}
				actions={
					archived ? null : tab === 'recall' ? (
						<Link
							href={routes.mySpaceTeachingRecallNew(course.id)}
							className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-xs font-semibold text-paper"
						>
							Tạo bộ thẻ
						</Link>
					) : (
						<Link
							href={routes.mySpaceTeachingCourseNewClass(course.id)}
							className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-xs font-semibold text-paper"
						>
							Tạo lớp
						</Link>
					)
				}
				tabs={
					<nav aria-label="Khu vực môn học" className="mc-tabbar teaching-core-tabs overflow-x-auto">
						<Link
							href={routes.mySpaceTeachingCourseTab(course.id, 'classes')}
							aria-current={tab === 'classes' ? 'page' : undefined}
							data-active={tab === 'classes'}
						>
							Lớp theo kỳ
						</Link>
						<Link
							href={routes.mySpaceTeachingCourseTab(course.id, 'recall')}
							aria-current={tab === 'recall' ? 'page' : undefined}
							data-active={tab === 'recall'}
						>
							Active Recall
						</Link>
					</nav>
				}
			/>

			<div className="mt-6">
				{error ? (
					<p role="alert" className="mb-4 text-sm font-semibold text-error">
						{error}
					</p>
				) : null}
				{tab === 'classes' ? (
					<TeachingClassCards
						classes={course.classes}
						newClassHref={routes.mySpaceTeachingCourseNewClass(course.id)}
						termSuggestions={termSuggestions}
					/>
				) : null}
				{tab === 'recall' ? (
					<div className="overflow-hidden border border-border bg-surface">
						{decks.length ? (
							decks.map((deck) => (
								<div key={deck.id} className="flex items-center gap-2 border-b border-border last:border-b-0">
									<Link
										href={routes.mySpaceTeachingRecallEdit(course.id, deck.id)}
										className="min-w-0 flex-1 px-5 py-4 hover:bg-background"
									>
										<p className="font-bold text-foreground">{deck.title}</p>
										<p className="mt-1 text-sm text-muted">
											{deck.cardCount} thẻ · {statusLabel(deck.status)}
										</p>
									</Link>
									<div className="pr-2">
										<TeachingQuickMenu
											label={`Thao tác bộ thẻ ${deck.title}`}
											disabled={busy}
											items={[
												{ id: 'edit', label: 'Sửa nhanh', onSelect: () => openEdit(deck) },
												deck.status === 'ARCHIVED'
													? {
															id: 'restore',
															label: 'Khôi phục',
															onSelect: () => void setDeckStatus(deck, 'DRAFT'),
														}
													: {
															id: 'archive',
															label: 'Lưu trữ',
															onSelect: () => void setDeckStatus(deck, 'ARCHIVED'),
														},
												{
													id: 'delete',
													label: 'Xóa vĩnh viễn',
													tone: 'danger',
													disabled: !deck.canDelete,
													onSelect: () => void deleteDeck(deck),
												},
											]}
										/>
									</div>
								</div>
							))
						) : (
							<div className="p-6 text-sm text-ink-secondary">
								Chưa có bộ thẻ. Tạo bộ Active Recall đầu tiên cho môn này.
							</div>
						)}
					</div>
				) : null}
			</div>

			<Dialog
				open={Boolean(editDeck)}
				onClose={() => {
					if (!busy) setEditDeck(null);
				}}
				title="Sửa bộ thẻ"
				>
				<form
					className="grid gap-4"
					onSubmit={(event) => {
						event.preventDefault();
						void saveDeck();
					}}
				>
					{error ? <p role="alert" tabIndex={-1} ref={(node) => { node?.focus(); }} className="rounded-[var(--mc-r-sm)] bg-error/10 px-3 py-2 text-sm font-semibold text-error">{error}</p> : null}
					<StudioField label="Tên bộ">
						<StudioInput
							required
							value={draft.title}
							onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
						/>
					</StudioField>
					<StudioField label="Nhãn bài">
						<StudioInput
							value={draft.lessonLabel}
							onChange={(event) =>
								setDraft((current) => ({ ...current, lessonLabel: event.target.value }))
							}
						/>
					</StudioField>
					<StudioField label="Trạng thái">
						<StudioSelect
							value={draft.status}
							onChange={(event) =>
								setDraft((current) => ({
									...current,
									status: event.target.value as ActiveRecallStatus,
								}))
							}
						>
							<option value="DRAFT">Bản nháp</option>
							<option value="PUBLISHED">Công khai</option>
							<option value="ARCHIVED">Lưu trữ</option>
						</StudioSelect>
					</StudioField>
					<div className="flex justify-end gap-2">
						<StudioButton variant="quiet" onClick={() => setEditDeck(null)} disabled={busy}>
							Huỷ
						</StudioButton>
						<StudioButton type="submit" disabled={busy || !draft.title.trim()}>
							{busy ? 'Đang lưu…' : 'Lưu'}
						</StudioButton>
					</div>
				</form>
			</Dialog>
			{dialog}
		</div>
	);
}
