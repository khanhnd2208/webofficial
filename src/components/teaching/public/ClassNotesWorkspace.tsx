'use client';

import { useMemo, useState } from 'react';

import type { PublicClassNote } from '@/features/teaching/types';

export function ClassNotesWorkspace({ notes }: { notes: PublicClassNote[] }) {
	const [selectedId, setSelectedId] = useState(notes[0]?.id ?? null);
	const selected = useMemo(() => notes.find((note) => note.id === selectedId) ?? notes[0] ?? null, [notes, selectedId]);

	if (!notes.length) {
		return <div className="mc-surface flex min-h-64 items-center justify-center px-6 py-12 text-center text-sm text-ink-secondary">Chưa có Class Notes được xuất bản.</div>;
	}

	return (
		<section className="mc-surface overflow-hidden" aria-label="Class Notes">
			<div className="grid min-h-[min(70vh,720px)] md:grid-cols-[260px_minmax(0,1fr)]">
				<aside className="border-b border-mc-rule bg-canvas/50 p-3 md:border-b-0 md:border-r">
					<p className="mc-eyebrow px-2 pb-2">Class Notes</p>
					<label className="sr-only" htmlFor="class-notes-select">Chọn nội dung</label>
					<select id="class-notes-select" value={selected?.id ?? ''} onChange={(event) => setSelectedId(event.target.value)} className="mb-3 min-h-10 w-full rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 text-sm text-ink md:hidden">
						{notes.map((note) => <option key={note.id} value={note.id}>{note.title}</option>)}
					</select>
					<nav className="hidden space-y-1 md:block" aria-label="Danh sách Class Notes">
						{notes.map((note) => (
							<button key={note.id} type="button" onClick={() => setSelectedId(note.id)} aria-current={selected?.id === note.id ? 'page' : undefined} className={`w-full rounded-[var(--mc-r-sm)] px-3 py-2 text-left text-sm font-semibold transition ${selected?.id === note.id ? 'bg-accent-subtle text-ink' : 'text-ink-secondary hover:bg-paper hover:text-ink'}`}>
								{note.title}
							</button>
						))}
					</nav>
				</aside>
				<article className="min-w-0 bg-paper px-5 py-6 sm:px-8 sm:py-8">
					{selected ? <><p className="mc-eyebrow">Class Notes</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{selected.title}</h2><div className="mc-prose mt-6 max-w-none overflow-x-auto" dangerouslySetInnerHTML={{ __html: selected.html }} /></> : null}
				</article>
			</div>
		</section>
	);
}
