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

/** Private per-section note; autosaves shortly after typing stops. */
export default function LearnNotes({ sectionId, initialNote }: { sectionId: string; initialNote: string }) {
	const [open, setOpen] = useState(Boolean(initialNote));
	const [note, setNote] = useState(initialNote);
	const [state, setState] = useState<SaveState>('idle');
	const saved = useRef(initialNote);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => () => {
		if (timer.current) clearTimeout(timer.current);
	}, []);

	function schedule(value: string) {
		setNote(value);
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(async () => {
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
		}, 800);
	}

	return (
		<section className="ln-notes" aria-label="Ghi chú của bạn">
			<button type="button" className="ln-notes__toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
				<span>
					<LearnIcon name="note" size={16} /> Ghi chú của bạn
				</span>
				<span className="ln-notes__state">{open ? SAVE_LABEL[state] : note ? 'Có ghi chú' : 'Chỉ bạn thấy'}</span>
			</button>
			{open ? (
				<textarea
					value={note}
					onChange={(event) => schedule(event.target.value)}
					placeholder="Ghi lại ý bạn muốn nhớ, câu hỏi còn thắc mắc…"
					rows={4}
					className="ln-notes__input"
					maxLength={20_000}
				/>
			) : null}
		</section>
	);
}
