'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
	createContext,
	useCallback,
	useContext,
	useRef,
	useState,
	useTransition,
	type MouseEvent,
	type ReactNode,
} from 'react';

import { routes } from '@/config/routes';

import type { TeachingWorkspaceTab } from './teachingWorkspaceTab';

const CORE_TABS = [
	['attendance', 'Điểm danh'],
	['cp', 'Điểm CP'],
	['groups', 'Xếp nhóm'],
	['notes', 'Class Notes'],
] as const;

type PendingContextValue = {
	isPending: boolean;
	navigate: (href: string) => void;
	holdUntil: (task: Promise<unknown>) => void;
	week?: number;
	setWeek: (week: number) => void;
};

const TeachingWorkspacePendingContext = createContext<PendingContextValue | null>(null);

export function useTeachingWorkspacePending() {
	return useContext(TeachingWorkspacePendingContext);
}

export function TeachingWorkspacePending({
	children,
	initialWeek,
}: {
	children: ReactNode;
	initialWeek?: number | null;
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [week, setWeek] = useState<number | undefined>(initialWeek ?? undefined);
	const holds = useRef<Promise<unknown>[]>([]);
	const holdUntil = useCallback((task: Promise<unknown>) => {
		holds.current.push(task);
	}, []);
	const navigate = useCallback(
		(href: string) => {
			const run = async () => {
				const pendingHolds = holds.current.splice(0, holds.current.length);
				if (pendingHolds.length > 0) {
					const results = await Promise.allSettled(pendingHolds);
					const failed = results.some((result) => result.status === 'rejected');
					if (failed && /tab=(cp|attendance)/.test(href)) return;
				}
				startTransition(() => {
					router.push(href);
				});
			};
			void run();
		},
		[router],
	);

	return (
		<TeachingWorkspacePendingContext.Provider value={{ isPending, navigate, holdUntil, week, setWeek }}>
			{children}
		</TeachingWorkspacePendingContext.Provider>
	);
}

function handleSoftNav(
	event: MouseEvent<HTMLAnchorElement>,
	href: string,
	navigate: (href: string) => void,
) {
	if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
		return;
	}
	event.preventDefault();
	navigate(href);
}

export function TeachingCoreTabs({
	classId,
	activeTab,
	groupBoardEnabled,
}: {
	classId: string;
	activeTab: TeachingWorkspaceTab;
	groupBoardEnabled: boolean;
}) {
	const pending = useTeachingWorkspacePending();
	const searchParams = useSearchParams();
	const week = pending?.week ?? (Number(searchParams.get('week') || '') || undefined);
	const tabLink = (value: TeachingWorkspaceTab) =>
		routes.mySpaceTeachingClassTab(classId, value, value === 'attendance' || value === 'cp' ? week : undefined);

	return (
		<div className="teaching-core-tabs-wrap">
			<nav aria-label="Khu vực lớp học" className="mc-tabbar teaching-core-tabs overflow-x-auto">
				{CORE_TABS.filter(([value]) => value !== 'groups' || groupBoardEnabled).map(([value, label]) => {
					const href = tabLink(value);
					return (
						<Link
							key={value}
							href={href}
							aria-current={activeTab === value ? 'page' : undefined}
							data-active={activeTab === value}
							onClick={pending ? (event) => handleSoftNav(event, href, pending.navigate) : undefined}
						>
							{label}
						</Link>
					);
				})}
			</nav>
			<span
				className="teaching-tab-progress"
				data-active={pending?.isPending ? 'true' : undefined}
				aria-hidden
			/>
		</div>
	);
}

export function TeachingPendingBody({
	children,
	className = '',
}: {
	children: ReactNode;
	className?: string;
}) {
	const pending = useTeachingWorkspacePending();
	return (
		<div
			className={`teaching-workspace-pending ${className}`.trim()}
			data-pending={pending?.isPending ? 'true' : undefined}
			aria-busy={pending?.isPending || undefined}
		>
			{children}
		</div>
	);
}

export function teachingSoftNavProps(href: string, navigate?: (href: string) => void) {
	if (!navigate) return {};
	return {
		onClick: (event: MouseEvent<HTMLAnchorElement>) => handleSoftNav(event, href, navigate),
	};
}
