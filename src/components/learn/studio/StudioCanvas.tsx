'use client';

import { LiveRegion } from '@/components/ui/Dialog';
import { LEARN_SECTION_KIND_LABELS, type LearnStudioSection } from '@/features/learn/types';

import LearnDiscussionEditor from './LearnDiscussionEditor';
import LearnRichEditor from './LearnRichEditor';
import type { SectionPatch } from './sectionPatch';
import type { ImportRequest } from './useSectionImport';

/** The section being edited: its title, then the editor that fits its kind. */
export default function StudioCanvas({
	section,
	lessonTitle,
	editorEpoch,
	titleError,
	keptTitle,
	onPatch,
	onRestoreTitle,
	onOpenImport,
	onOpenHelp,
}: {
	section: LearnStudioSection | null;
	lessonTitle: string;
	editorEpoch: number;
	titleError?: string;
	keptTitle: string | null;
	onPatch: (patch: SectionPatch) => void;
	onRestoreTitle: () => void;
	onOpenImport: (request: ImportRequest) => void;
	onOpenHelp: () => void;
}) {
	if (!section) {
		return (
			<main className="ln-studio__canvas">
				<div className="ln-studio__empty">
					<p className="font-display text-2xl">Chọn một mục để soạn</p>
					<p className="mt-2 text-ink-secondary">Hoặc thêm bài mới, nhập bằng AI ở cột mục lục.</p>
				</div>
			</main>
		);
	}

	const target = (count: number) => ({ sectionId: section.id, count });

	return (
		<main className="ln-studio__canvas">
			<div className="ln-studio__page" key={`${section.id}:${editorEpoch}`}>
				<p className="ln-eyebrow">
					{LEARN_SECTION_KIND_LABELS[section.type]} · {lessonTitle}
				</p>
				<textarea
					className="ln-studio__title"
					value={section.title}
					rows={1}
					maxLength={200}
					placeholder="Tên mục"
					aria-label="Tên mục"
					aria-invalid={titleError ? true : undefined}
					aria-describedby={titleError ? 'ln-section-title-error' : undefined}
					onChange={(event) => onPatch({ title: event.target.value.replace(/\n/g, ' ') })}
					onBlur={() => {
						if (!section.title.trim()) onRestoreTitle();
					}}
					style={{ fieldSizing: 'content' } as React.CSSProperties}
				/>
				{titleError ? (
					<p id="ln-section-title-error" className="ln-field-error">
						{titleError}
					</p>
				) : null}
				<LiveRegion message={keptTitle ?? ''} />
				{section.type === 'DISCUSSION' ? (
					<>
						<details className="ln-studio__intro" open={Boolean(section.markdown.trim())}>
							<summary>Lời dẫn: cách dùng bộ câu hỏi</summary>
							<p className="ln-studio__intro-hint">
								Hiện ở đầu trang phản biện, thu gọn được. Để trống nếu không cần.
							</p>
							<LearnRichEditor
								value={section.markdown}
								onChange={(markdown) => onPatch({ markdown })}
								onOpenHelp={onOpenHelp}
							/>
						</details>
						<LearnDiscussionEditor
							discussion={section.discussion ?? { questions: [] }}
							onChange={(discussion) => onPatch({ discussion })}
							onOpenImport={() =>
								onOpenImport({
									kind: 'discussion',
									locked: true,
									target: target(section.discussion?.questions.length ?? 0),
								})
							}
						/>
					</>
				) : (
					<LearnRichEditor
						value={section.markdown}
						onChange={(markdown) => onPatch({ markdown })}
						onOpenHelp={onOpenHelp}
					/>
				)}
			</div>
		</main>
	);
}
