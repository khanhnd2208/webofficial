'use client';

import { useLinkStatus } from 'next/link';

/**
 * Put inside a course `<Link>`. Course pages render on the server for every section, so on a
 * slow network the click would otherwise show nothing until the response arrives. CSS dims the
 * clicked link and shows the player's top progress bar while this marker is pending.
 */
export default function LearnLinkPending() {
	const { pending } = useLinkStatus();
	return <LearnPendingMark pending={pending} />;
}

/** The same marker for navigations started from code (keyboard shortcuts, buttons). */
export function LearnPendingMark({ pending }: { pending: boolean }) {
	return (
		<span
			className="ln-pending-mark"
			data-pending={pending ? 'true' : undefined}
			aria-hidden="true"
		/>
	);
}
