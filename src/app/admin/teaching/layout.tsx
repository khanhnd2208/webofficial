import type { ReactNode } from 'react';

export default function TeachingAdminLayout({ children }: { children: ReactNode }) {
	return <div className="mc mc-studio min-h-full">{children}</div>;
}
