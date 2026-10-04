'use client';

import { useState } from 'react';

import Image from '@tiptap/extension-image';
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from '@tiptap/react';

import {
	isExternalImageSrc,
	imageSrcStatus,
	joinImageSrc,
	splitImageSrc,
	type ImageWidth,
} from '@/features/learn/images';

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		learnImage: {
			setLearnImage: (options: {
				src: string;
				alt?: string;
				title?: string;
				width?: ImageWidth | null;
			}) => ReturnType;
		};
	}
}

function widthOf(value: unknown): ImageWidth | null {
	return value === 50 || value === 75 ? value : null;
}

function FigureView({ node, updateAttributes, deleteNode, editor, selected }: ReactNodeViewProps) {
	const src = typeof node.attrs.src === 'string' ? node.attrs.src : '';
	const alt = typeof node.attrs.alt === 'string' ? node.attrs.alt : '';
	const title = typeof node.attrs.title === 'string' ? node.attrs.title : '';
	const width = widthOf(node.attrs.width);
	const external = isExternalImageSrc(src);
	const [failedSrc, setFailedSrc] = useState<string | null>(null);
	const missing = imageSrcStatus(src) === 'missing' || failedSrc === src;

	function uploadReplacement(file: File) {
		const upload = (
			editor.storage as { image?: { upload?: (file: File, apply?: (url: string) => void) => void } }
		).image?.upload;
		if (upload)
			upload(file, (url) => {
				setFailedSrc(null);
				updateAttributes({ src: url });
			});
	}
	function replace() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/*';
		input.onchange = () => {
			const file = input.files?.[0];
			if (file) uploadReplacement(file);
		};
		input.click();
	}

	return (
		<NodeViewWrapper
			as="figure"
			className="ln-figure"
			data-width={width ?? 100}
			data-selected={selected ? 'true' : undefined}
		>
			{missing ? (
				<div
					className="ln-figure__missing"
					contentEditable={false}
					onDragOver={(event) => {
						if (editor.isEditable) {
							event.preventDefault();
							event.stopPropagation();
						}
					}}
					onDrop={(event) => {
						if (!editor.isEditable) return;
						event.preventDefault();
						event.stopPropagation();
						const file = [...event.dataTransfer.files].find((item) =>
							item.type.startsWith('image/'),
						);
						if (file) uploadReplacement(file);
					}}
				>
					<p>Chưa có ảnh: {src || '(chưa có tên)'}</p>
					{editor.isEditable ? (
						<button type="button" className="ln-link-btn" onClick={replace}>
							Tải ảnh lên
						</button>
					) : null}
				</div>
			) : (
				<img src={src} alt={alt} draggable={false} onError={() => setFailedSrc(src)} />
			)}
			{external ? (
				<p className="ln-figure__warn" contentEditable={false}>
					Ảnh ngoài có thể không hiển thị trên trang học viên.{' '}
					<button type="button" className="ln-link-btn" onClick={replace}>
						Tải ảnh lên thay thế
					</button>
				</p>
			) : null}
			<figcaption contentEditable={false}>
				<input
					className="ln-figure__caption"
					value={title}
					placeholder="Chú thích ảnh"
					onChange={(event) => updateAttributes({ title: event.target.value })}
				/>
				{editor.isEditable ? (
					<span className="ln-figure__tools">
						<input
							className="ln-figure__alt"
							value={alt}
							placeholder="Mô tả"
							aria-label="Mô tả ảnh"
							onChange={(event) => updateAttributes({ alt: event.target.value })}
						/>
						{([50, 75, 100] as const).map((option) => (
							<button
								key={option}
								type="button"
								aria-pressed={(width ?? 100) === option}
								onClick={() => updateAttributes({ width: option === 100 ? null : option })}
							>
								{option}%
							</button>
						))}
						<button type="button" onClick={replace}>
							Thay ảnh
						</button>
						<button type="button" onClick={deleteNode}>
							Xóa
						</button>
					</span>
				) : null}
			</figcaption>
		</NodeViewWrapper>
	);
}

/**
 * Block figure. Width is a `#w=50` / `#w=75` fragment on the URL so exported markdown
 * stays ordinary markdown an AI can write back.
 */
export const LearnImage = Image.extend({
	name: 'image',
	draggable: true,
	atom: true,

	addStorage() {
		return { upload: null as ((file: File) => void) | null };
	},

	addAttributes() {
		return {
			...this.parent?.(),
			width: {
				default: null,
				parseHTML: (element) => widthOf(Number((element as HTMLElement).dataset.width)),
				renderHTML: (attributes) =>
					widthOf(attributes.width) ? { 'data-width': attributes.width } : {},
			},
		};
	},

	addNodeView() {
		return ReactNodeViewRenderer(FigureView);
	},

	addCommands() {
		return {
			...this.parent?.(),
			setLearnImage:
				(options) =>
				({ commands }) =>
					commands.insertContent({
						type: this.name,
						attrs: {
							src: options.src,
							alt: options.alt ?? '',
							title: options.title ?? '',
							width: widthOf(options.width),
						},
					}),
		};
	},

	parseMarkdown: (token, helpers) => {
		const href = typeof token.href === 'string' ? token.href : '';
		const { url, width } = splitImageSrc(href);
		return helpers.createNode('image', {
			src: url,
			title: token.title ?? '',
			alt: token.text ?? '',
			width,
		});
	},

	renderMarkdown: (node) => {
		const raw = String(node.attrs?.src ?? '');
		const src = joinImageSrc(/^(data:|blob:)/i.test(raw) ? '' : raw, widthOf(node.attrs?.width));
		const alt = String(node.attrs?.alt ?? '');
		const title = String(node.attrs?.title ?? '').trim();
		const escaped = title.replace(/"/g, '\\"');
		return title ? `![${alt}](${src} "${escaped}")` : `![${alt}](${src})`;
	},
});
