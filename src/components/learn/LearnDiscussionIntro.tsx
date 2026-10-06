'use client';

import { useEffect, useRef, type ReactNode } from 'react';

function seenKey(sectionId: string) {
	return `ln:discussion-intro:${sectionId}`;
}

/**
 * "Cách dùng bộ câu hỏi" above the critical questions: open on the first visit, folded after
 * that so returning learners land on the questions.
 */
export default function LearnDiscussionIntro({
	sectionId,
	children,
}: {
	sectionId: string;
	children: ReactNode;
}) {
	const ref = useRef<HTMLDetailsElement>(null);

	useEffect(() => {
		try {
			if (window.localStorage.getItem(seenKey(sectionId)) && ref.current) {
				ref.current.open = false;
			}
			window.localStorage.setItem(seenKey(sectionId), '1');
		} catch {
			/* storage unavailable: stay open */
		}
	}, [sectionId]);

	return (
		<details ref={ref} className="ln-disc-intro" open>
			<summary>Cách dùng bộ câu hỏi</summary>
			<div className="ln-disc-intro__body">{children}</div>
		</details>
	);
}
