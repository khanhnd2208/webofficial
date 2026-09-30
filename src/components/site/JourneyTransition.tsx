/// <reference types="react/canary" />
'use client';

import { ViewTransition, type ReactNode } from 'react';
import './journey-transition.css';

/** The intro and index share a quiet crossfade during Next.js navigation. */
export default function JourneyTransition({
	children,
	page,
}: {
	children: ReactNode;
	page: string;
}) {
	return (
		<ViewTransition key={page} name="personal-journey" share="journey-crossfade" default="none">
			<div>{children}</div>
		</ViewTransition>
	);
}
