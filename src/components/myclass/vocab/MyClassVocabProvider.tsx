'use client';

import { VocabApiProvider } from '@/components/vocab/practice/VocabApiProvider';
import { routes } from '@/config/routes';
import type { ReactNode } from 'react';

export default function MyClassVocabProvider({
	courseSlug,
	children,
}: {
	courseSlug: string;
	children: ReactNode;
}) {
	return (
		<VocabApiProvider
			endpointFor={(id) => `/api/my-class/courses/${courseSlug}/vocab/${id}`}
			scoreEndpointFor={(id) => `/api/my-class/courses/${courseSlug}/vocab/${id}/score`}
			chrome={{
				embedded: true,
				backHref: routes.myClassVocabIndex(courseSlug),
				backLabel: '← Từ vựng',
				setHref: (id) => routes.myClassVocab(courseSlug, id),
				modeHref: (id, mode) =>
					mode
						? `${routes.myClassVocab(courseSlug, id)}/${mode}`
						: routes.myClassVocab(courseSlug, id),
			}}
		>
			{children}
		</VocabApiProvider>
	);
}
