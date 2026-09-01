'use client';

import type { ReactNode } from 'react';

export default function AdminMyClassShell({ children }: { children: ReactNode }) {
	return <div className="mc mc-studio min-h-full">{children}</div>;
}
