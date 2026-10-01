'use client';

import { signOutTo } from '@/lib/auth/signOutTo';

/** Sign out, then come back to this login page (same destination) to pick another Google account. */
export default function SwitchAccountButton({ loginHref }: { loginHref: string }) {
	return (
		<button
			type="button"
			onClick={() => void signOutTo(loginHref)}
			className="inline-flex w-full min-h-11 items-center justify-center rounded-[10px] border border-hairline px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-ink/40 hover:bg-paper"
		>
			Đăng xuất để dùng tài khoản khác
		</button>
	);
}
