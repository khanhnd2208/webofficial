'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/** Idempotent guest→account merge after sign-in while guest cookie may still exist. */
export default function ClaimProgressOnLogin({ enabled }: { enabled: boolean }) {
	const ran = useRef(false);
	const router = useRouter();
	const [state, setState] = useState<'syncing' | 'success' | 'error'>('syncing');

	const claim = useCallback(async () => {
		setState('syncing');
		try {
			const res = await fetch('/api/myspace-tests/claim-progress', { method: 'POST' });
			const json = (await res.json()) as { ok?: boolean };
			if (!res.ok || !json.ok) throw new Error('claim failed');
			setState('success');
			router.refresh();
		} catch {
			setState('error');
		}
	}, [router]);

	useEffect(() => {
		if (!enabled || ran.current) return;
		ran.current = true;
		void claim();
	}, [claim, enabled]);

	if (!enabled) return null;
	if (state === 'syncing') {
		return <p className="text-sm text-ink-secondary" role="status" data-testid="myspace-tests-sync-status">Đang đồng bộ tiến độ…</p>;
	}
	if (state === 'error') {
		return (
			<div className="flex items-center gap-3 text-sm text-ink-secondary" role="status">
				<span>Chưa đồng bộ được tiến độ.</span>
				<button type="button" onClick={() => void claim()} className="underline underline-offset-4 hover:text-ink">Thử lại</button>
			</div>
		);
	}
	return <p className="text-sm text-ink-secondary" role="status" data-testid="myspace-tests-sync-status">Đã đồng bộ với tài khoản</p>;
}
