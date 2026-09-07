'use client';
import { useState } from 'react';
import type { TeachingAttendanceBoardConfig, TeachingPublicPageConfig } from '@/features/teaching/types';
import { routes } from '@/config/routes';
import { PublicPageEditor } from './PublicPageEditor';
import { AttendanceBoardPanel } from './AttendanceBoardPanel';

export function StudentPageWorkspace({ page, board }: { page?: TeachingPublicPageConfig; board: TeachingAttendanceBoardConfig }) {
	const [savedClass, setSavedClass] = useState(page?.class ?? board.class);
	return <div className="space-y-5">
		{page ? <PublicPageEditor initial={page} savedClass={savedClass} onSaved={updated => setSavedClass(updated.class)} /> : null}
		<AttendanceBoardPanel initial={board} publicPath={savedClass.publicSlug ? routes.teachingPublicClass(savedClass.publicSlug) : null} onSaved={updated => setSavedClass(updated.class)} />
	</div>;
}
