import type { ReactNode } from 'react';

const MATERIAL_SYMBOLS_HREF =
	'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..24,400,0,0&display=swap';

export default function PublicClassLayout({ children }: { children: ReactNode }) {
	return (
		<>
			<link rel="stylesheet" href={MATERIAL_SYMBOLS_HREF} />
			{children}
		</>
	);
}
