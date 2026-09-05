import type { ReactNode } from 'react';

export default function MyClassLayout({ children }: { children: ReactNode }) {
	return <div className="mc mc-app min-h-svh">{children}</div>;
}
