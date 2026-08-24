'use client';

import { useState } from 'react';
import { routes } from '@/config/routes';

export default function SaveToLibraryButton({
	courseSlug,
	setId,
	initialSaved,
	signedIn,
}: {
	courseSlug: string;
	setId: string;
	initialSaved: boolean;
	signedIn: boolean;
}) {
	const [saved, setSaved] = useState(initialSaved);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (!signedIn) {
		const next = `${routes.myClassVocab(courseSlug, setId)}`;
		return (
			<a
				href={`${routes.login}?callbackUrl=${encodeURIComponent(next)}`}
				className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] border border-mc-rule px-4 text-sm font-semibold text-ink hover:bg-surface-sunken"
			>
				Đăng nhập để lưu vào từ vựng của tôi
			</a>
		);
	}

	if (saved) {
		return (
			<p className="inline-flex min-h-11 items-center text-sm font-semibold text-ink-secondary" data-testid="vocab-saved">
				Đã lưu vào từ vựng của tôi
			</p>
		);
	}

	return (
		<div>
			<button
				type="button"
				disabled={busy}
				onClick={() => {
					setBusy(true);
					setError(null);
					void fetch(`/api/my-class/courses/${courseSlug}/vocab/${setId}/library`, { method: 'POST' })
						.then(async (res) => {
							const json = (await res.json()) as { ok: boolean; error?: string };
							if (!json.ok) throw new Error(json.error ?? 'Không lưu được');
							setSaved(true);
						})
						.catch((err) => setError(err instanceof Error ? err.message : 'Không lưu được'))
						.finally(() => setBusy(false));
				}}
				className="inline-flex min-h-11 items-center rounded-[var(--mc-r-sm)] bg-ink px-4 text-sm font-semibold text-paper disabled:opacity-40"
			>
				{busy ? 'Đang lưu…' : 'Thêm vào từ vựng của tôi'}
			</button>
			{error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
		</div>
	);
}
