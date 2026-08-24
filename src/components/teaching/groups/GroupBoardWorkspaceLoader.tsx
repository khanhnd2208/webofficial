'use client';

import dynamic from 'next/dynamic';

import type { GroupBoardWorkspaceProps } from './GroupBoardWorkspace';

const GroupBoardWorkspace = dynamic(
	() => import('./GroupBoardWorkspace').then((module) => module.GroupBoardWorkspace),
	{ ssr: false },
);

export function GroupBoardWorkspaceLoader(props: GroupBoardWorkspaceProps) {
	return <GroupBoardWorkspace {...props} />;
}
