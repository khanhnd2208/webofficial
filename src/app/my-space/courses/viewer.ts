import type { Session } from 'next-auth';

import type { LearnViewer } from '@/features/learn/service';

export function learnViewerFrom(session: Session | null): LearnViewer {
	return {
		userId: (session?.user as { id?: string } | undefined)?.id ?? '',
		isAdmin: session?.user?.role === 'admin',
	};
}
