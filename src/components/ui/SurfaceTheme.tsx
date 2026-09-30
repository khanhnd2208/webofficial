'use client';

import { createContext, useContext, type HTMLAttributes } from 'react';

/** A destination owns its palette; overlays carry the same scope through portals. */
export type SurfaceName = 'teaching';
const SurfaceContext = createContext<SurfaceName | undefined>(undefined);

export function useSurfaceTheme() {
	return useContext(SurfaceContext);
}

export function SurfaceTheme({
	surface,
	children,
	...props
}: HTMLAttributes<HTMLDivElement> & { surface: SurfaceName }) {
	return (
		<SurfaceContext.Provider value={surface}>
			<div {...props} data-surface={surface}>
				{children}
			</div>
		</SurfaceContext.Provider>
	);
}
