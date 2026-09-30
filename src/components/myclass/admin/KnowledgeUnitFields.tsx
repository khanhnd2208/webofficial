'use client';

import dynamic from 'next/dynamic';
import { McSegmented } from '@/components/myclass/ui';
import { READING_LEVEL_HINT, READING_LEVEL_LABEL } from '@/features/my-class/domain/readingLevel';
import { uploadMyClassImage } from './uploadImage';

const TiptapEditor = dynamic(() => import('@/components/TiptapEditor'), { ssr: false });

export type KnowledgeUnitLevelTab = 'foundation' | 'academic' | 'expert';

const LEVEL_OPTIONS: Array<{
	id: KnowledgeUnitLevelTab;
	reading: 'readable' | 'academic' | 'deep';
}> = [
	{ id: 'foundation', reading: 'readable' },
	{ id: 'academic', reading: 'academic' },
	{ id: 'expert', reading: 'deep' },
];

export default function KnowledgeUnitFields({
	title,
	slug,
	summary,
	foundationHtml,
	academicHtml,
	expertHtml,
	tab,
	onTitleChange,
	onSlugChange,
	onSummaryChange,
	onFoundationChange,
	onAcademicChange,
	onExpertChange,
	onTabChange,
	onError,
	showSlug = true,
	compact = false,
	productMode = false,
}: {
	title: string;
	slug: string;
	summary: string;
	foundationHtml: string;
	academicHtml: string;
	expertHtml: string;
	tab: KnowledgeUnitLevelTab;
	onTitleChange: (value: string) => void;
	onSlugChange?: (value: string) => void;
	onSummaryChange: (value: string) => void;
	onFoundationChange: (value: string) => void;
	onAcademicChange: (value: string) => void;
	onExpertChange: (value: string) => void;
	onTabChange: (tab: KnowledgeUnitLevelTab) => void;
	onError?: (message: string) => void;
	showSlug?: boolean;
	compact?: boolean;
	productMode?: boolean;
}) {
	const controlClass =
		'mt-1.5 min-h-11 w-full rounded-[var(--mc-r-sm)] border border-mc-rule bg-paper px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20';

	return (
		<div className="space-y-5">
			<div className={compact ? 'space-y-3' : 'grid gap-4 md:grid-cols-2'}>
				<label className="text-sm font-semibold text-ink">
					Tiêu đề
					<input
						value={title}
						onChange={(event) => onTitleChange(event.target.value)}
						className={controlClass}
					/>
				</label>
				{showSlug && onSlugChange ? (
					<label className="text-sm font-semibold text-ink">
						Đường dẫn
						<input
							value={slug}
							onChange={(event) => onSlugChange(event.target.value)}
							className={controlClass}
						/>
					</label>
				) : null}
				<label className={`text-sm font-semibold text-ink ${compact ? '' : 'md:col-span-2'}`}>
					Tóm tắt
					<textarea
						value={summary}
						onChange={(event) => onSummaryChange(event.target.value)}
						rows={compact ? 2 : 3}
						className={controlClass}
					/>
				</label>
			</div>
			<McSegmented
				label={productMode ? 'Cách giải thích' : 'Mức độ đọc'}
				value={LEVEL_OPTIONS.find((item) => item.id === tab)?.reading ?? 'readable'}
				onChange={(value) => {
					const next = LEVEL_OPTIONS.find((item) => item.reading === value);
					if (next) onTabChange(next.id);
				}}
				options={LEVEL_OPTIONS.filter((item) => !productMode || item.id !== 'academic').map(
					(item) => ({
						value: item.reading,
						label: productMode
							? item.id === 'foundation'
								? 'Giải thích ngắn gọn'
								: 'Giải thích sâu'
							: READING_LEVEL_LABEL[item.reading],
						hint: READING_LEVEL_HINT[item.reading],
					}),
				)}
			/>
			<div hidden={tab !== 'foundation'}>
				<TiptapEditor
					content={foundationHtml}
					onChange={onFoundationChange}
					onImageUpload={uploadMyClassImage}
					onImageUploadError={onError}
					placeholder={READING_LEVEL_LABEL.readable}
				/>
			</div>
			<div hidden={productMode || tab !== 'academic'}>
				<TiptapEditor
					content={academicHtml}
					onChange={onAcademicChange}
					onImageUpload={uploadMyClassImage}
					onImageUploadError={onError}
					placeholder={READING_LEVEL_LABEL.academic}
				/>
			</div>
			<div hidden={tab !== 'expert'}>
				<TiptapEditor
					content={expertHtml}
					onChange={onExpertChange}
					onImageUpload={uploadMyClassImage}
					onImageUploadError={onError}
					placeholder={READING_LEVEL_LABEL.deep}
				/>
			</div>
		</div>
	);
}
