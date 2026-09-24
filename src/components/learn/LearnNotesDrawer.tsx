'use client';

import { useEffect, useRef, useState } from 'react';

import { adminFetch } from '@/lib/admin/client';

import { LearnIcon } from './LearnIcon';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const SAVE_LABEL: Record<SaveState, string> = {
	idle: '',
	saving: 'Đang lưu…',
	saved: 'Đã lưu',
	error: 'Chưa lưu được, thử gõ lại',
};

/** Right-hand notes drawer. Autosaves, and flushes any pending text when it closes. */
export default function LearnNotesDrawer({ sectionId, initialNote }: { sectionId: string; initialNote: string }) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const noteRef = useRef(initialNote);
	const saved = useRef(initialNote);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [note, setNote] = useState(initialNote);
	const [state, setState] = useState<SaveState>('idle');

	async function persist(value: string) {
		if (value === saved.current) return;
		setState('saving');
		try {
			await adminFetch(`/api/learn/sections/${sectionId}/progress`, {
				method: 'PATCH',
				body: JSON.stringify({ note: value }),
			});
			saved.current = value;
			setState('saved');
		} catch {
			setState('error');
		}
	}

	function flush() {
		if (timer.current) {
			clearTimeout(timer.current);
			timer.current = null;
		}
		void persist(noteRef.current);
	}

	useEffect(() => {
		const timers = timer;
		const notes = noteRef;
		const savedNote = saved;
		return () => {
			if (timers.current) {
				clearTimeout(timers.current);
				timers.current = null;
			}
			const value = notes.current;
			if (value === savedNote.current) return;
			void adminFetch(`/api/learn/sections/${sectionId}/progress`, {
				method: 'PATCH',
				body: JSON.stringify({ note: value }),
			});
		};
	}, [sectionId]);

	function schedule(value: string) {
		noteRef.current = value;
		setNote(value);
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => {
			timer.current = null;
			void persist(value);
		}, 800);
	}

	function open() {
		dialogRef.current?.showModal();
	}

	function close() {
		flush();
		dialogRef.current?.close();
	}

	return (
		<>
			<button
				type="button"
				className="ln-icon-btn ln-notes-btn"
				onClick={open}
				aria-label="Ghi chú"
				title="Ghi chú"
				data-has-note={note.trim() ? 'true' : undefined}
			>
				<LearnIcon name="note" size={18} strokeWidth={1.6} />
			</button>
			<dialog ref={dialogRef} className="ln-notes-dialog" aria-label="Ghi chú của bạn" onClose={flush}>
				<div className="ln-notes-dialog__head">
					<p>Ghi chú của bạn</p>
					<span className="ln-notes-dialog__state">{SAVE_LABEL[state]}</span>
					<button type="button" className="ln-icon-btn" onClick={close} aria-label="Đóng ghi chú">
						<LearnIcon name="close" size={16} />
					</button>
				</div>
				<textarea
					value={note}
					onChange={(event) => schedule(event.target.value)}
					placeholder="Ghi lại ý bạn muốn nhớ, câu hỏi còn thắc mắc…"
					className="ln-notes-dialog__input"
					maxLength={20_000}
				/>
			</dialog>
		</>
	);
}
