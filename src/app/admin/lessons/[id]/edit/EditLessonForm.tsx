'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import type { LessonDTO } from '@/types/lesson';
import type { UnitDTO } from '@/types/unit';

type SaveState =
	| { status: 'idle' }
	| { status: 'saving' }
	| { status: 'saved' }
	| { status: 'error'; message: string };

type Props = {
	lesson: LessonDTO;
};

export default function EditLessonForm({ lesson }: Props) {
	const router = useRouter();
	const [unitId, setUnitId] = useState(lesson.unitId ?? '');
	const [unitsState, setUnitsState] = useState<
		| { status: 'loading' }
		| { status: 'loaded'; items: UnitDTO[] }
		| { status: 'error'; message: string }
	>({ status: 'loading' });
	const [title, setTitle] = useState(lesson.title);
	const [content, setContent] = useState(lesson.content);
	const [state, setState] = useState<SaveState>({ status: 'idle' });

	const units = useMemo(() => (unitsState.status === 'loaded' ? unitsState.items : []), [unitsState]);

	useEffect(() => {
		let cancelled = false;
		setUnitsState({ status: 'loading' });
		fetch('/api/admin/units')
			.then(async (res) => {
				const json = (await res.json()) as unknown;
				const ok = typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true;
				if (!res.ok || !ok) {
					const message =
						typeof json === 'object' && json !== null && typeof (json as { error?: unknown }).error === 'string'
							? String((json as { error?: unknown }).error)
							: `HTTP ${res.status}`;
					throw new Error(message);
				}
				const data = (json as { data?: unknown }).data;
				const items = Array.isArray(data) ? (data as UnitDTO[]) : [];
				if (!cancelled) {
					setUnitsState({ status: 'loaded', items });
					setUnitId((prev) => {
						if (prev && items.some((u) => u.id === prev)) return prev;
						return items[0]?.id ?? prev;
					});
				}
			})
			.catch((e) => {
				if (!cancelled) setUnitsState({ status: 'error', message: e instanceof Error ? e.message : 'Unknown error' });
			});
		return () => {
			cancelled = true;
		};
	}, []);

	async function onSave() {
		if (!unitId.trim()) {
			setState({ status: 'error', message: 'Missing unitId' });
			return;
		}
		setState({ status: 'saving' });
		try {
			const res = await fetch(`/api/admin/lessons/${encodeURIComponent(lesson.id)}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ unitId: unitId.trim(), title, content }),
			});
			const json = (await res.json()) as unknown;
			const ok = typeof json === 'object' && json !== null && (json as { ok?: unknown }).ok === true;
			if (!res.ok || !ok) {
				const message =
					typeof json === 'object' && json !== null && typeof (json as { error?: unknown }).error === 'string'
						? String((json as { error?: unknown }).error)
					: `HTTP ${res.status}`;
			throw new Error(message);
		}
		setState({ status: 'saved' });
		router.refresh();
	} catch (e) {
		setState({ status: 'error', message: e instanceof Error ? e.message : 'Unknown error' });
	}
}	return (
		<main className="mx-auto max-w-3xl px-6 py-10">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Edit Lesson</h1>
				</div>
				<nav className="flex flex-wrap items-center gap-3">
					<Link className="text-sm underline underline-offset-4" href="/admin/learning">
						← Learning
					</Link>
					<Link className="text-sm underline underline-offset-4" href={`/admin/lessons/${lesson.id}/vocabulary`}>
						Vocabulary
					</Link>
					<button
						type="button"
						onClick={() => void onSave()}
						disabled={state.status === 'saving'}
						className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
					>
						{state.status === 'saving' ? 'Đang lưu…' : 'Save'}
					</button>
				</nav>
			</header>

			{state.status === 'error' ? <p className="mt-4 text-sm text-red-600">Lỗi: {state.message}</p> : null}
			{state.status === 'saved' ? <p className="mt-4 text-sm text-foreground/70">Đã lưu.</p> : null}

			<section className="mt-8 space-y-4">
				<label className="block">
					<div className="text-sm font-medium">Unit</div>
					{unitsState.status === 'loading' ? <p className="mt-2 text-sm text-foreground/70">Đang tải units…</p> : null}
					{unitsState.status === 'error' ? <p className="mt-2 text-sm text-red-600">Lỗi: {unitsState.message}</p> : null}
					{unitsState.status === 'loaded' ? (
						<select
							value={unitId}
							onChange={(e) => setUnitId(e.target.value)}
							className="mt-2 w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm"
						>
							{units.map((u) => (
								<option key={u.id} value={u.id}>
									{u.name}
								</option>
							))}
						</select>
					) : null}
				</label>

				<label className="block">
					<div className="text-sm font-medium">Title</div>
					<input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="mt-2 w-full rounded-md border border-foreground/15 px-3 py-2 text-sm"
					/>
				</label>

				<label className="block">
					<div className="text-sm font-medium">Content (Markdown)</div>
					<textarea
						value={content}
						onChange={(e) => setContent(e.target.value)}
						rows={14}
						className="mt-2 w-full rounded-md border border-foreground/15 px-3 py-2 font-mono text-sm"
					/>
				</label>
			</section>
		</main>
	);
}
