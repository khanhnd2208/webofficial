import MyClassVocabProvider from '@/components/myclass/vocab/MyClassVocabProvider';
import type { ReactNode } from 'react';

export default async function MyClassVocabLayout({
	children,
	params,
}: {
	children: ReactNode;
	params: Promise<{ courseSlug: string; setId: string }>;
}) {
	const { courseSlug } = await params;
	return <MyClassVocabProvider courseSlug={courseSlug}>{children}</MyClassVocabProvider>;
}
