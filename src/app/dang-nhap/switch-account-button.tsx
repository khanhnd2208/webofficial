'use client';

import { useSession } from 'next-auth/react';

import { signOutTo } from '@/lib/auth/signOutTo';

/** Sign out, then come back to this login page (same destination) to pick another Google account. */
export default function SwitchAccountButton({ loginHref }: { loginHref: string }) {
	const { status } = useSession();
	return (
		<button
			type="button"
			disabled={status === 'loading'}
			onClick={() => void signOutTo(`${loginHref}${loginHref.includes('?') ? '&' : '?'}chon=1`)}
			className="inline-flex w-full min-h-11 items-center justify-center rounded-sm border border-hairline px-5 py-3 text-subhead font-medium text-ink transition-colors duration-(--dur-1) ease-(--ease-out) hover:border-ink/40 hover:bg-paper"
		>
			Đăng xuất để dùng tài khoản khác
		</button>
	);
}
