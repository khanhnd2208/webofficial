import type { ReactNode } from 'react';
import AdminMyClassShell from '@/components/myclass/admin/AdminMyClassShell';

const MATERIAL_SYMBOLS_HREF =
	'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap';

export default function MyClassAdminLayout({ children }: { children: ReactNode }) {
	return (
		<>
			<link rel="stylesheet" href={MATERIAL_SYMBOLS_HREF} />
			<div className="mc mc-studio min-h-full">
				<AdminMyClassShell>{children}</AdminMyClassShell>
			</div>
		</>
	);
}
