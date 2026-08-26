'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	DndContext,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
	type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { TeachingClassNoteRecord } from '@/features/teaching/types';
import { teachingApi } from './api';
import { uploadMyClassImage } from '@/components/myclass/admin/uploadImage';

const TiptapEditor = dynamic(() => import('@/components/TiptapEditor'), { ssr: false });

function SortableNote({
	note,
	selected,
	onSelect,
}: {
	note: TeachingClassNoteRecord;
	selected: boolean;
	onSelect: () => void;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id });
	return (
		<button
			ref={setNodeRef}
			type="button"
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={`w-full rounded-[var(--mc-r-sm)] border px-3 py-2 text-left transition ${selected ? 'border-accent bg-accent-subtle' : 'border-transparent hover:border-mc-rule hover:bg-canvas'} ${isDragging ? 'z-10 opacity-70 shadow-lg' : ''}`}
			onClick={onSelect}
			{...attributes}
			{...listeners}
		>
			<span className="block truncate text-sm font-semibold text-ink">{note.draftTitle || 'Chưa đặt tiêu đề'}</span>
			<span className="mt-1 block text-[11px] text-ink-secondary">
				{note.status === 'DRAFT' ? 'Nháp' : note.status === 'MODIFIED' ? 'Có thay đổi' : 'Đã xuất bản'}
			</span>
		</button>
	);
}

export function ClassNotesAdminWorkspace({ classId, initial }: { classId: string; initial: TeachingClassNoteRecord[] }) {
	const [notes, setNotes] = useState(initial);
	const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null);
	const [title, setTitle] = useState(initial[0]?.draftTitle ?? '');
	const [html, setHtml] = useState(initial[0]?.draftHtml ?? '');
	const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
	const [busy, setBusy] = useState(false);
	const skipAutosaveForId = useRef<string | null>(initial[0]?.id ?? null);
	const autosaveTimer = useRef<number | null>(null);
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
	const selected = useMemo(() => notes.find((note) => note.id === selectedId) ?? null, [notes, selectedId]);

	const clearPendingAutosave = useCallback(() => {
		if (autosaveTimer.current !== null) {
			window.clearTimeout(autosaveTimer.current);
			autosaveTimer.current = null;
		}
	}, []);

	const persist = useCallback(async (noteId: string, nextTitle: string, nextHtml: string) => {
		setSaveState('saving');
		try {
			const updated = await teachingApi<TeachingClassNoteRecord>(`/api/admin/teaching/classes/${classId}/notes/${noteId}`, {
				method: 'PATCH',
				body: JSON.stringify({ title: nextTitle, html: nextHtml }),
			});
			setNotes((current) => current.map((note) => (note.id === updated.id ? updated : note)));
			setSaveState('saved');
			return updated;
		} catch {
			setSaveState('error');
			throw new Error('Không lưu được note');
		}
	}, [classId]);

	useEffect(() => {
		if (!selectedId) return;
		if (skipAutosaveForId.current === selectedId) {
			skipAutosaveForId.current = null;
			return;
		}
		autosaveTimer.current = window.setTimeout(() => {
			autosaveTimer.current = null;
			void persist(selectedId, title, html).catch(() => undefined);
		}, 700);
		return clearPendingAutosave;
	}, [clearPendingAutosave, html, persist, selectedId, title]);

	function selectNote(note: TeachingClassNoteRecord) {
		if (note.id === selectedId) return;
		clearPendingAutosave();
		skipAutosaveForId.current = note.id;
		setSelectedId(note.id);
		setTitle(note.draftTitle);
		setHtml(note.draftHtml);
		setSaveState('idle');
	}

	async function addNote() {
		setBusy(true);
		try {
			const created = await teachingApi<TeachingClassNoteRecord>(`/api/admin/teaching/classes/${classId}/notes`, {
				method: 'POST',
				body: JSON.stringify({ title: 'Mục mới', html: '' }),
			});
			setNotes((current) => [...current, created]);
			selectNote(created);
		} catch {
			setSaveState('error');
		} finally {
			setBusy(false);
		}
	}

	async function deleteNote() {
		if (!selected || !window.confirm(`Xóa “${selected.draftTitle}”?`)) return;
		setBusy(true);
		try {
			await teachingApi<{ id: string }>(`/api/admin/teaching/classes/${classId}/notes/${selected.id}`, { method: 'DELETE' });
			const remaining = notes.filter((note) => note.id !== selected.id);
			setNotes(remaining);
			const next = remaining[0];
			if (next) selectNote(next);
			else { setSelectedId(null); setTitle(''); setHtml(''); }
		} catch {
			setSaveState('error');
		} finally {
			setBusy(false);
		}
	}

	async function publish() {
		if (!selected) return;
		setBusy(true);
		try {
			clearPendingAutosave();
			await persist(selected.id, title, html);
			const updated = await teachingApi<TeachingClassNoteRecord>(`/api/admin/teaching/classes/${classId}/notes/${selected.id}/publish`, { method: 'POST' });
			setNotes((current) => current.map((note) => (note.id === updated.id ? updated : note)));
		} catch {
			setSaveState('error');
		} finally {
			setBusy(false);
		}
	}

	async function unpublish() {
		if (!selected || !window.confirm('Gỡ mục này khỏi trang học viên?')) return;
		setBusy(true);
		try {
			const updated = await teachingApi<TeachingClassNoteRecord>(`/api/admin/teaching/classes/${classId}/notes/${selected.id}/unpublish`, { method: 'POST' });
			setNotes((current) => current.map((note) => (note.id === updated.id ? updated : note)));
			setSaveState('saved');
		} catch {
			setSaveState('error');
		} finally {
			setBusy(false);
		}
	}

	async function reorder(event: DragEndEvent) {
		if (!event.over || event.active.id === event.over.id) return;
		const oldIndex = notes.findIndex((note) => note.id === event.active.id);
		const newIndex = notes.findIndex((note) => note.id === event.over?.id);
		const next = arrayMove(notes, oldIndex, newIndex);
		setNotes(next.map((note, index) => ({ ...note, displayOrder: index })));
		try {
			await teachingApi(`/api/admin/teaching/classes/${classId}/notes`, { method: 'PUT', body: JSON.stringify({ ids: next.map((note) => note.id) }) });
		} catch {
			setNotes(notes);
			setSaveState('error');
		}
	}

	return (
		<section className="mc-surface overflow-hidden" aria-label="Class Notes admin">
			<div className="grid min-h-[min(70vh,720px)] md:grid-cols-[260px_minmax(0,1fr)]">
				<aside className="border-b border-mc-rule bg-canvas/50 p-3 md:border-b-0 md:border-r">
					<div className="mb-3 flex items-center justify-between gap-2">
						<div><p className="mc-eyebrow">Notebook</p><h2 className="text-sm font-semibold text-ink">Class Notes</h2></div>
						<button type="button" className="mc-button mc-button-primary px-3 py-2 text-xs" onClick={() => void addNote()} disabled={busy}>+ Thêm</button>
					</div>
					{notes.length ? (
						<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void reorder(event)}>
							<SortableContext items={notes.map((note) => note.id)} strategy={verticalListSortingStrategy}>
								<div className="space-y-1">{notes.map((note) => <SortableNote key={note.id} note={note} selected={note.id === selectedId} onSelect={() => selectNote(note)} />)}</div>
							</SortableContext>
						</DndContext>
					) : <p className="px-2 py-6 text-xs leading-5 text-ink-secondary">Tạo mục đầu tiên để bắt đầu notebook.</p>}
				</aside>
				<div className="min-w-0 bg-paper p-4 sm:p-6">
					{selected ? (
						<div className="flex h-full min-h-[520px] flex-col">
							<div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-mc-rule pb-3">
								<div className="flex items-center gap-2 text-xs text-ink-secondary"><span>{saveState === 'saving' ? 'Đang lưu…' : saveState === 'error' ? 'Lưu lỗi' : 'Đã lưu'}</span>{selected.status === 'MODIFIED' ? <span className="mc-chip">Có thay đổi chưa xuất bản</span> : null}</div>
								<div className="flex flex-wrap gap-2">
									{selected.publishedAt ? <button type="button" className="mc-button mc-button-secondary px-3 py-2 text-xs" onClick={() => void unpublish()} disabled={busy}>Gỡ xuất bản</button> : null}
									<button type="button" className="mc-button mc-button-primary px-3 py-2 text-xs" onClick={() => void publish()} disabled={busy || !title.trim() || !html.trim()}>Xuất bản</button>
									<button type="button" className="mc-button px-3 py-2 text-xs text-error" onClick={() => void deleteNote()} disabled={busy}>Xóa</button>
								</div>
							</div>
							<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="Tiêu đề tuần / topic / phần" className="mb-3 w-full border-0 bg-transparent px-1 text-2xl font-semibold tracking-tight text-ink outline-none placeholder:text-ink-secondary/50" />
							<div className="min-h-0 flex-1 overflow-hidden rounded-[var(--mc-r-sm)] border border-mc-rule"><TiptapEditor content={html} onChange={setHtml} onImageUpload={uploadMyClassImage} onImageUploadError={() => setSaveState('error')} placeholder="Bắt đầu viết nội dung note…" /></div>
						</div>
					) : <div className="flex min-h-[520px] items-center justify-center text-center text-sm text-ink-secondary"><p>Chọn hoặc thêm một mục trong notebook.</p></div>}
				</div>
			</div>
		</section>
	);
}
