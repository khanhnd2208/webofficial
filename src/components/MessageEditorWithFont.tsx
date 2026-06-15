'use client';

import TiptapEditor from '@/components/TiptapEditor';
import { MESSAGE_DISPLAY_FONTS } from '@/constants/message';

interface MessageEditorWithFontProps {
	content: string;
	onChange: (html: string) => void;
	onImageUpload?: (file: File) => Promise<string>;
	displayFont: string;
	onFontChange: (fontId: string) => void;
	placeholder?: string;
}

export default function MessageEditorWithFont({
	content,
	onChange,
	onImageUpload,
	displayFont,
	onFontChange,
	placeholder,
}: MessageEditorWithFontProps) {
	const activeFontDef = MESSAGE_DISPLAY_FONTS.find((f) => f.id === displayFont) ?? MESSAGE_DISPLAY_FONTS[0];
	const fontFamily = activeFontDef.fontStack;

	return (
		<div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
			{/* Font picker strip */}
			<div className="flex items-center border-b border-border bg-surface-secondary/60 px-3 py-2">
				<span className="mr-3 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted">
					Font
				</span>
				<div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
					{MESSAGE_DISPLAY_FONTS.map((font) => {
						const isActive = displayFont === font.id;
						return (
							<button
								key={font.id}
								type="button"
								onMouseDown={(e) => {
									e.preventDefault();
									onFontChange(font.id);
								}}
								title={font.label}
								aria-pressed={isActive}
								className={`relative shrink-0 rounded-lg border px-3 py-1.5 text-[13px] transition-all ${
									isActive
										? 'border-accent bg-accent text-white shadow-sm'
										: 'border-border bg-surface text-foreground hover:border-accent/40 hover:bg-surface-hover'
								}`}
								style={{ fontFamily: font.fontStack }}
							>
								{font.previewText}
								<span
									className={`ml-1.5 text-[10px] opacity-60 ${isActive ? 'text-white' : 'text-muted'}`}
									style={{ fontFamily: 'inherit' }}
								>
									— {font.label}
								</span>
							</button>
						);
					})}
				</div>
			</div>

			{/* Editor — borderless inside our wrapper */}
			<div className="[&>div]:rounded-none [&>div]:border-0 [&>div]:shadow-none">
				<TiptapEditor
					content={content}
					onChange={onChange}
					onImageUpload={onImageUpload}
					fontFamily={fontFamily}
					placeholder={placeholder ?? 'Viết lời nhắn tại đây...'}
				/>
			</div>
		</div>
	);
}
