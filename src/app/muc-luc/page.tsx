import type { Metadata } from 'next';

import { COVER_ATMOSPHERE_BOOTSTRAP_SCRIPT } from '@/components/site/cover/coverAtmosphere';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';

import TocDoors from './TocDoors';
import TocShell from './TocShell';

export const metadata: Metadata = {
	title: 'Mục lục',
	description: 'Một chút về Duy Khánh, và những điều để học.',
	alternates: { canonical: absoluteUrl(routes.toc) },
};

export default function TocPage() {
	return (
		<>
			<script dangerouslySetInnerHTML={{ __html: COVER_ATMOSPHERE_BOOTSTRAP_SCRIPT }} />
			<TocShell>
				<TocDoors />
			</TocShell>
		</>
	);
}
