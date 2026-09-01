import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { StudentClassBoard } from '@/components/teaching/public/StudentClassBoard';
import { getClassIdBySlug, getPublicClassBoard } from '@/features/teaching';
import { isTeachingGroupBoardEnabled } from '@/features/teaching/groupBoardAvailability';
import { auth } from '@/lib/auth';
import { routes } from '@/config/routes';
import { redirect } from 'next/navigation';

type PublicClassPageProps = {
	params: Promise<{ slug: string }>;
	searchParams?: Promise<{ tab?: string }>;
};

const getBoard = cache(getPublicClassBoard);

export async function generateMetadata({ params }: PublicClassPageProps): Promise<Metadata> {
	const { slug } = await params;
	const board = await getBoard(slug);
	return {
		title: board ? `${board.title} · ${board.courseCode}` : 'Lớp học',
		description: board?.summary || 'Trang thông tin lớp học và bảng điểm danh',
		robots: { index: false, follow: false, nocache: true },
	};
}

export const dynamic = 'force-dynamic';

export default async function PublicClassPage({ params, searchParams }: PublicClassPageProps) {
	const { slug } = await params;
	const tab = (await searchParams)?.tab;
	const groupBoardEnabled = isTeachingGroupBoardEnabled();
	if (tab === 'groups' && !groupBoardEnabled) redirect(routes.teachingPublicClass(slug));
	const session = await auth();
	const canEdit = session?.user?.role === 'admin';

	const board = await getBoard(slug);
	if (!board) notFound();

	let classId: string | null = null;

	if (canEdit) {
		classId = await getClassIdBySlug(slug);
	}

	return (
		<div className="mc mc-studio min-h-screen bg-canvas text-ink">
			<main className="mx-auto w-[min(100%-2rem,74rem)] py-8 sm:w-[min(100%-3rem,74rem)] sm:py-10">
				<StudentClassBoard
					board={board}
					groupBoardEnabled={groupBoardEnabled}
					manageHref={classId ? routes.admin.teachingClass(classId) : undefined}
					initialTab={tab}
				/>
			</main>
		</div>
	);
}
