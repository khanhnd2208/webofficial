import type { ReactNode } from 'react';

import '../../learn.css';

/**
 * Course homes are public, like a course page on Coursera: a guest can see what a course holds
 * before signing in. Sections, progress and notes need an account (checked in the page), and
 * editing stays admin-only per page.
 */
export default function LearnCoursesLayout({ children }: { children: ReactNode }) {
	return <div className="ln min-h-svh bg-canvas text-ink">{children}</div>;
}
