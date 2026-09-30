'use client';

import { mergeAttributes, Node } from '@tiptap/core';
import {
	NodeViewContent,
	NodeViewWrapper,
	ReactNodeViewRenderer,
	type ReactNodeViewProps,
} from '@tiptap/react';

import {
	CALLOUT_KINDS,
	CALLOUT_LABELS,
	calloutTag,
	isCalloutKind,
	resolveCalloutKind,
	type CalloutKind,
} from '@/features/learn/callouts';

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		learnCallout: {
			setCallout: (kind: CalloutKind) => ReturnType;
			unsetCallout: () => ReturnType;
		};
	}
}

const QUOTE_BLOCK_RE = /^(?: {0,3}>[^\n]*(?:\n|$))+/;
const HEAD_RE = /^\s*\[!([^\]\n]{1,24})\][ \t]*(.*)$/;

function CalloutView({ node, updateAttributes, editor, getPos }: ReactNodeViewProps) {
	const kind: CalloutKind = isCalloutKind(node.attrs.kind) ? node.attrs.kind : 'note';
	const title = typeof node.attrs.title === 'string' ? node.attrs.title : '';

	function unwrap() {
		const pos = typeof getPos === 'function' ? getPos() : undefined;
		if (typeof pos !== 'number') return;
		editor
			.chain()
			.focus()
			.setTextSelection(pos + 2)
			.lift('callout')
			.run();
	}

	return (
		<NodeViewWrapper as="aside" className="ln-callout ln-callout--editing" data-kind={kind}>
			<div className="ln-callout__head" contentEditable={false}>
				<select
					className="ln-callout__kind"
					value={kind}
					onChange={(event) => updateAttributes({ kind: event.target.value })}
					aria-label="Loại khối"
				>
					{CALLOUT_KINDS.map((option) => (
						<option key={option} value={option}>
							{CALLOUT_LABELS[option]}
						</option>
					))}
				</select>
				<input
					className="ln-callout__title-input"
					value={title}
					placeholder={kind === 'quote' ? 'Tiêu đề (tùy chọn)' : 'Tiêu đề khối'}
					onChange={(event) => updateAttributes({ title: event.target.value })}
					onKeyDown={(event) => {
						if (event.key === 'Enter') {
							event.preventDefault();
							const pos = typeof getPos === 'function' ? getPos() : undefined;
							if (typeof pos === 'number')
								editor
									.chain()
									.focus()
									.setTextSelection(pos + 2)
									.run();
						}
					}}
				/>
				<button
					type="button"
					className="ln-callout__remove"
					onClick={unwrap}
					title="Bỏ khối, giữ nội dung"
				>
					Bỏ khối
				</button>
			</div>
			<NodeViewContent className="ln-callout__body" />
		</NodeViewWrapper>
	);
}

/**
 * `> [!KIND] Title` block. Parsed from markdown before the regular blockquote tokenizer,
 * written back with the canonical English tag so the reader and AI prompts agree.
 */
export const Callout = Node.create({
	name: 'callout',
	group: 'block',
	content: 'block+',
	defining: true,

	addAttributes() {
		return {
			kind: { default: 'note' },
			title: { default: '' },
		};
	},

	parseHTML() {
		return [
			{
				tag: 'aside[data-callout]',
				getAttrs: (element) => ({
					kind: (element as HTMLElement).dataset.callout ?? 'note',
					title: (element as HTMLElement).dataset.title ?? '',
				}),
			},
		];
	},

	renderHTML({ node, HTMLAttributes }) {
		return [
			'aside',
			mergeAttributes(HTMLAttributes, {
				'data-callout': node.attrs.kind,
				'data-title': node.attrs.title,
			}),
			0,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(CalloutView);
	},

	addCommands() {
		return {
			setCallout:
				(kind) =>
				({ commands }) =>
					commands.wrapIn(this.name, { kind, title: '' }),
			unsetCallout:
				() =>
				({ commands }) =>
					commands.lift(this.name),
		};
	},

	markdownTokenizer: {
		name: 'callout',
		level: 'block',
		start(src) {
			const match = src.match(/^ {0,3}>\s?\[!/m);
			return match?.index ?? -1;
		},
		tokenize(src, _tokens, lexer) {
			const block = src.match(QUOTE_BLOCK_RE)?.[0];
			if (!block) return undefined;
			const lines = block
				.replace(/\n$/, '')
				.split('\n')
				.map((line) => line.replace(/^ {0,3}> ?/, ''));
			const head = lines[0].match(HEAD_RE);
			const kind = head ? resolveCalloutKind(head[1]) : null;
			if (!head || !kind) return undefined;
			return {
				type: 'callout',
				raw: block,
				kind,
				title: head[2].trim(),
				tokens: lexer.blockTokens(lines.slice(1).join('\n')),
			};
		},
	},

	parseMarkdown(token, helpers) {
		const children = helpers.parseChildren(token.tokens ?? []);
		return helpers.createNode(
			'callout',
			{ kind: token.kind, title: token.title ?? '' },
			children.length ? children : [helpers.createNode('paragraph')],
		);
	},

	renderMarkdown(node, helpers) {
		const kind: CalloutKind = isCalloutKind(node.attrs?.kind) ? node.attrs.kind : 'note';
		const title = String(node.attrs?.title ?? '').trim();
		const head = `> [!${calloutTag(kind)}]${title ? ` ${title}` : ''}`;
		const blocks: string[] = [];
		(node.content ?? []).forEach((child: unknown) => {
			blocks.push(helpers.renderChildren([child as never]));
		});
		// An empty callout body serializes its placeholder paragraph as "&nbsp;"; drop those
		// lines so an untouched callout round-trips back to just its header.
		const bodyLines = blocks
			.join('\n\n')
			.split('\n')
			.filter((line) => line.trim() !== '&nbsp;');
		if (!bodyLines.length) return head;
		const body = bodyLines.map((line) => (line.trim() ? `> ${line}` : '>'));
		return [head, ...body].join('\n');
	},
});
