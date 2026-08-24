import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const MATERIAL_SYMBOLS_HREF =
	'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..24,400,0,0&display=swap';

export default async function MySpaceTeachingLayout({ children }: { children: ReactNode }) {
	const session = await auth();
	if (!session?.user)
		redirect(`${routes.login}?from=${encodeURIComponent(routes.mySpaceTeaching)}`);
	if (session.user.role !== 'admin') redirect(routes.mySpace);

	return (
		<>
			<link rel="stylesheet" href={MATERIAL_SYMBOLS_HREF} precedence="icons" />
			<div className="mc mc-studio min-h-svh bg-canvas text-ink">
				<main className="mx-auto w-full max-w-[92rem] px-4 sm:px-6">{children}</main>
			</div>
		</>
	);
}
