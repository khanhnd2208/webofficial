import Image from 'next/image';

import type { ProjectArtefact, ProjectMedia } from '@/features/portfolio/data/projects';
import { isVerifiedMedia } from '@/features/portfolio/data/projects';

type ArtifactGalleryProps = {
	artefacts: ProjectArtefact[];
	gallery?: ProjectMedia[];
};

export function ArtifactGallery({ artefacts, gallery = [] }: ArtifactGalleryProps) {
	const verifiedArtefacts = artefacts.filter(
		(artefact) => !artefact.media || isVerifiedMedia(artefact.media),
	);
	const verifiedGallery = gallery.filter(isVerifiedMedia);
	const hasMedia = verifiedGallery.length > 0 || verifiedArtefacts.some((a) => a.media);

	if (verifiedArtefacts.length === 0 && verifiedGallery.length === 0) {
		return null;
	}

	return (
		<section className="editorial-section border-b border-hairline">
			<div className="shell">
				<header className="max-w-2xl">
					<p className="editorial-label">Những artefact thật</p>
					<h2 className="editorial-heading mt-4">
						{hasMedia
							? 'Những gì được tạo ra để giải quyết một câu hỏi cụ thể.'
							: 'Những artefact đang được xây dựng cho dự án này.'}
					</h2>
				</header>

				<ul className="mt-10 grid border-t border-hairline sm:grid-cols-2">
					{verifiedArtefacts.map((artefact, index) => (
						<li
							key={artefact.title}
							className="border-b border-hairline py-7 sm:px-6 sm:odd:border-r"
						>
							<span className="font-mono text-xs text-accent">
								{String(index + 1).padStart(2, '0')}
							</span>
							<h3 className="type-h3 mt-4">{artefact.title}</h3>
							<p className="mt-3 text-base leading-[1.7] text-ink-secondary">
								{artefact.purpose}
							</p>
						</li>
					))}
				</ul>

				{verifiedGallery.length > 0 ? (
					<div className="mt-14 grid gap-8 md:grid-cols-2">
						{verifiedGallery.map((image) => (
							<figure key={image.src}>
								<div className="premium-media relative aspect-[16/10]">
									<Image
										src={image.src}
										alt={image.alt}
										fill
										sizes="(max-width: 767px) calc(100vw - 48px), 44vw"
										className="object-cover"
									/>
								</div>
								<figcaption className="mt-4 text-sm leading-[1.65] text-ink-secondary">
									{image.caption}
								</figcaption>
							</figure>
						))}
					</div>
				) : null}
			</div>
		</section>
	);
}
