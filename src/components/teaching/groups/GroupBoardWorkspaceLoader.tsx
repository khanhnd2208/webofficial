'use client';

import dynamic from 'next/dynamic';

import type { GroupListWorkspaceProps } from './GroupListWorkspace';

const GroupListWorkspace = dynamic(
	() => import('./GroupListWorkspace').then((module) => module.GroupListWorkspace),
	{ ssr: false },
);

export function GroupBoardWorkspaceLoader(props: GroupListWorkspaceProps) {
	return <GroupListWorkspace {...props} />;
}
