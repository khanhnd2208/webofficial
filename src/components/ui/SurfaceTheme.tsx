'use client';

import { createContext, useContext, type HTMLAttributes } from 'react';

/** A destination owns its palette; overlays carry the same scope through portals. */
export type SurfaceName = 'teaching';
const SurfaceContext = createContext<SurfaceName | undefined>(undefined);

/** `student` keeps the surface's components but wears the site's editorial palette. */
export type SurfaceAudience = 'student';
const AudienceContext = createContext<SurfaceAudience | undefined>(undefined);

export function useSurfaceTheme() {
	return useContext(SurfaceContext);
}

/** Overlays that re-declare `data-surface` must repeat this too, or they fall back to the default palette. */
export function useSurfaceAudience() {
	return useContext(AudienceContext);
}

export function SurfaceTheme({
	surface,
	audience,
	children,
	...props
}: HTMLAttributes<HTMLDivElement> & { surface: SurfaceName; audience?: SurfaceAudience }) {
	return (
		<SurfaceContext.Provider value={surface}>
			<AudienceContext.Provider value={audience}>
				<div {...props} data-surface={surface} data-audience={audience}>
					{children}
				</div>
			</AudienceContext.Provider>
		</SurfaceContext.Provider>
	);
}
