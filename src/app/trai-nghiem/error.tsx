'use client';

import Link from 'next/link';
import { routes } from '@/config/routes';

export default function ExperienceError({ reset }: { reset: () => void }) {
	return (
		<main className="personal-book">
			<div className="experience-article">
				<h1 className="book-page-title">Chưa mở được câu chuyện.</h1>
				<p>Bạn có thể thử lại sau một chút.</p>
				<button type="button" onClick={reset} className="about-text-link">
					Thử lại →
				</button>
				<Link href={routes.experiences} className="about-text-link">
					← Về Trải nghiệm
				</Link>
			</div>
		</main>
	);
}
