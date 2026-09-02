import type { ReactNode } from 'react';

import { TeachingPopoverRoot } from '@/components/teaching/TeachingPopover';

export default function TeachingAdminLayout({ children }: { children: ReactNode }) {
	return (
		<div className="mc mc-studio min-h-full">
			<TeachingPopoverRoot>{children}</TeachingPopoverRoot>
		</div>
	);
}
