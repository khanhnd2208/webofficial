'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { routes } from '@/config/routes';
import { setStorageScope } from '@/features/my-class/client/progressStore';
import { McBadge, McIcon } from '@/components/myclass/ui';

const MODES = [
	{ suffix: '', label: 'Danh sách từ' },
	{ suffix: '/flashcards', label: 'Flashcards' },
	{ suffix: '/mcq', label: 'Trắc nghiệm' },
	{ suffix: '/fill-blank', label: 'Điền từ' },
	{ suffix: '/matching', label: 'Ghép cặp' },
	{ suffix: '/guess-who', label: 'Guess Who' },
] as const;

export default function VocabPracticeShell({
	courseSlug,
	courseTitle,
	children,
}: {
	courseSlug: string;
	courseTitle: string;
	children: ReactNode;
}) {
	const pathname = usePathname();
	const setMatch = pathname.match(/\/vocab\/([^/]+)/);
	const setId = setMatch?.[1];
	const base = setId ? routes.myClassVocab(courseSlug, setId) : null;
	const activeMode = MODES.find((mode) => base && pathname === `${base}${mode.suffix}`) ?? MODES[0];

	useEffect(() => {
		void fetch('/api/my-class/actor/bootstrap', { method: 'POST' })
			.then((response) => response.json())
			.then((json: { data?: { storageScope?: string } }) => {
				if (json.data?.storageScope) setStorageScope(json.data.storageScope);
			})
			.catch(() => undefined);
	}, [courseSlug]);

	return (
		<div className="min-h-svh bg-canvas pt-20 pb-24">
			<div className="mc-shell max-w-3xl">
				<div className="flex flex-wrap items-center gap-3 text-sm text-ink-secondary">
					<Link
						href={routes.myClassCourse(courseSlug)}
						className="inline-flex min-h-11 items-center gap-1 font-medium hover:text-ink"
					>
						<McIcon name="arrow_back" size={18} />
						Về khóa học
					</Link>
					<span aria-hidden>·</span>
					<Link
						href={routes.myClassVocabIndex(courseSlug)}
						className="inline-flex min-h-11 items-center font-medium hover:text-ink"
					>
						Từ vựng
					</Link>
				</div>
				<div className="mt-4 flex flex-wrap items-center gap-3 border-b border-mc-rule pb-4">
					<McBadge variant="vocab">Từ vựng</McBadge>
					<p className="font-semibold text-ink">{courseTitle}</p>
				</div>
				{base ? (
					<nav aria-label="Chế độ luyện từ" className="mt-5 overflow-x-auto pb-1">
						<div className="flex flex-wrap gap-1.5">
							{MODES.map((mode) => {
								const href = `${base}${mode.suffix}`;
								const active = pathname === href;
								return (
									<Link
										key={href}
										href={href}
										aria-current={active ? 'page' : undefined}
										className={`inline-flex min-h-9 shrink-0 items-center rounded-[var(--mc-r-sm)] px-3 text-sm font-semibold ${
											active
												? 'bg-ink text-paper'
												: 'border border-mc-rule text-ink-secondary hover:bg-surface-sunken hover:text-ink'
										}`}
									>
										{mode.label}
									</Link>
								);
							})}
						</div>
						{/* Keep McSegmented import meaningful for typecheck when used elsewhere; label for a11y */}
						<span className="sr-only">Chế độ: {activeMode.label}</span>
					</nav>
				) : null}
				<div className="mt-6">{children}</div>
			</div>
		</div>
	);
}
