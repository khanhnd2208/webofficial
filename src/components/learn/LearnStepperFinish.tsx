'use client';

import LearnLinkPending from './LearnLinkPending';

import Link from 'next/link';

import LearnCompleteButton from './LearnCompleteButton';

/** Last step of the discussion stepper: a link once the section is done, otherwise the complete button. */
export default function LearnStepperFinish({
	sectionId,
	completed,
	nextHref,
	nextTitle,
	finishesCourse = false,
	overviewHref,
}: {
	sectionId: string;
	completed: boolean;
	nextHref: string | null;
	nextTitle?: string | null;
	finishesCourse?: boolean;
	overviewHref?: string;
}) {
	if (!completed) {
		return (
			<LearnCompleteButton
				sectionId={sectionId}
				completed={false}
				nextHref={nextHref}
				nextTitle={nextTitle}
				finishesCourse={finishesCourse}
				overviewHref={overviewHref}
			/>
		);
	}
	if (finishesCourse && overviewHref) {
		return (
			<Link href={overviewHref} className="ln-btn ln-btn--primary" data-ln-primary="">
				Hoàn thành khóa học
				<LearnLinkPending />
			</Link>
		);
	}
	if (nextHref) {
		return (
			<Link href={nextHref} className="ln-btn ln-btn--primary" data-ln-primary="">
				Sang mục tiếp →
				<LearnLinkPending />
			</Link>
		);
	}
	if (overviewHref) {
		return (
			<Link href={overviewHref} className="ln-btn ln-btn--primary" data-ln-primary="">
				Về trang khóa học
				<LearnLinkPending />
			</Link>
		);
	}
	return null;
}
