import { Suspense } from 'react';

import KstripHub from '@/components/kstrip/KstripHub';

export default function HomePage() {
	return (
		<main>
			<Suspense
				fallback={
					<div className="flex min-h-screen items-center justify-center bg-background text-muted">
						Đang tải…
					</div>
				}
			>
				<KstripHub />
			</Suspense>
		</main>
	);
}
