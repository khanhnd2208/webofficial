'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

const TiptapEditor = dynamic(() => import('./TiptapEditor'), { ssr: false });

interface DualLanguageEditorProps {
	contentVi: string;
	contentEn: string;
	onChangeVi: (html: string) => void;
	onChangeEn: (html: string) => void;
	onImageUpload?: (file: File) => Promise<string>;
	placeholderVi?: string;
	placeholderEn?: string;
}

export default function DualLanguageEditor({
	contentVi,
	contentEn,
	onChangeVi,
	onChangeEn,
	onImageUpload,
	placeholderVi = 'Nội dung tiếng Việt...',
	placeholderEn = 'English content...',
}: DualLanguageEditorProps) {
	const [activeTab, setActiveTab] = useState<'vi' | 'en'>('vi');

	return (
		<div className="rounded-xl border border-border bg-surface">
			{/* Tab switcher */}
			<div className="flex items-center gap-1 border-b border-border bg-surface-secondary px-2 py-1.5">
				<button
					type="button"
					onClick={() => setActiveTab('vi')}
					className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
						activeTab === 'vi'
							? 'bg-accent text-accent-foreground shadow-sm'
							: 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground'
					}`}
				>
					🇻🇳 Tiếng Việt
				</button>
				<button
					type="button"
					onClick={() => setActiveTab('en')}
					className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
						activeTab === 'en'
							? 'bg-accent text-accent-foreground shadow-sm'
							: 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground'
					}`}
				>
					🇬🇧 English
				</button>
				<div className="ml-auto text-[10px] text-muted">
					{activeTab === 'vi' ? 'Đang chỉnh sửa bản tiếng Việt' : 'Editing English version'}
				</div>
			</div>

			{/* Editors */}
			<div>
				{activeTab === 'vi' ? (
					<TiptapEditor
						content={contentVi}
						onChange={onChangeVi}
						onImageUpload={onImageUpload}
						placeholder={placeholderVi}
					/>
				) : (
					<TiptapEditor
						content={contentEn}
						onChange={onChangeEn}
						onImageUpload={onImageUpload}
						placeholder={placeholderEn}
					/>
				)}
			</div>
		</div>
	);
}
