/// <reference types="react/canary" />
'use client';

import { ViewTransition, type ReactNode } from 'react';

/** The same illustration keeps its identity between a tile and its destination. */
export default function SharedArtwork({
	name,
	children,
	className,
}: {
	name: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<ViewTransition name={`artwork-${name}`} share="artwork-morph" default="none">
			<span className={className}>{children}</span>
		</ViewTransition>
	);
}
