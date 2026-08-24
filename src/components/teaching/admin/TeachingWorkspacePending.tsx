'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
	createContext,
	useCallback,
	useContext,
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
] as const;

type PendingContextValue = {
	isPending: boolean;
	navigate: (href: string) => void;
};

const TeachingWorkspacePendingContext = createContext<PendingContextValue | null>(null);

export function useTeachingWorkspacePending() {
	return useContext(TeachingWorkspacePendingContext);
}

export function TeachingWorkspacePending({ children }: { children: ReactNode }) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const navigate = useCallback(
		(href: string) => {
			startTransition(() => {
				router.push(href);
			});
		},
		[router],
	);

	return (
		<TeachingWorkspacePendingContext.Provider value={{ isPending, navigate }}>
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
	const tabLink = (value: TeachingWorkspaceTab) => routes.mySpaceTeachingClassTab(classId, value);

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
