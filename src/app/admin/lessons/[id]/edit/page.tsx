import { notFound } from 'next/navigation';

import { getLessonById } from '@/services/lessonService';

import EditLessonForm from './EditLessonForm';

export const dynamic = 'force-dynamic';

export default async function AdminEditLessonPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const lesson = await getLessonById(id);
	if (!lesson) notFound();

	return <EditLessonForm lesson={lesson} />;
}
