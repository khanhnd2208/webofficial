'use client';

import { useSyncExternalStore, useState } from 'react';

import { chromeIntentHref, inAppBrowserName } from '@/lib/auth/inAppBrowser';

const subscribe = () => () => {};
const browserSnapshot = () => navigator.userAgent;
const serverSnapshot = () => '';

/** No server/client UA mismatch; the notice appears after hydration. */
export default function InAppBrowserNotice() {
	const userAgent = useSyncExternalStore(subscribe, browserSnapshot, serverSnapshot);
	const browser = inAppBrowserName(userAgent);
	const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
	if (!browser) return null;
	// Copy this login page, including its destination and account-switch choice.
	const url = window.location.href;
	const intent = chromeIntentHref(url, userAgent);

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(url);
			setCopyStatus('copied');
		} catch {
			setCopyStatus('failed');
		}
	}

	return (
		<aside
			aria-label="Mở bằng trình duyệt"
			className="mt-5 rounded-lg border border-hairline bg-paper p-4 text-sm text-ink"
		>
			<p>
				Bạn đang mở trong {browser}. Google có thể chặn đăng nhập ở đây — hãy mở bằng Chrome/Safari.
			</p>
			<div className="mt-2 flex flex-wrap gap-x-4">
				<button
					type="button"
					onClick={() => void copyLink()}
					className="min-h-11 font-medium underline underline-offset-4"
				>
					Sao chép link
				</button>
				{intent ? (
					<a
						href={intent}
						className="inline-flex min-h-11 items-center font-medium underline underline-offset-4"
					>
						Mở bằng Chrome
					</a>
				) : null}
			</div>
			<p role="status" className="text-xs text-ink-secondary">
				{copyStatus === 'copied'
					? 'Đã sao chép link.'
					: copyStatus === 'failed'
						? 'Không sao chép được. Chọn và sao chép link bên dưới.'
						: ''}
			</p>
			{copyStatus === 'failed' ? (
				<input
					aria-label="Link đăng nhập"
					value={url}
					readOnly
					onFocus={(event) => event.target.select()}
					className="mt-2 w-full rounded border border-hairline bg-canvas p-2 text-xs"
				/>
			) : null}
		</aside>
	);
}
