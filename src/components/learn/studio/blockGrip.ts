'use client';

import { Extension } from '@tiptap/core';
import { NodeSelection, Plugin } from '@tiptap/pm/state';

/** Left-hand grip: drag a block, or open a small menu to duplicate and delete it. */
export const BlockGrip = Extension.create({
	name: 'blockGrip',

	addProseMirrorPlugins() {
		const editor = this.editor;
		return [
			new Plugin({
				view(view) {
					const grip = document.createElement('button');
					grip.type = 'button';
					grip.className = 'ln-blockgrip';
					grip.textContent = '⋮⋮';
					grip.title = 'Kéo để di chuyển';
					grip.draggable = true;
					let blockPos: number | null = null;

					const place = (event: MouseEvent) => {
						if (!view.editable) {
							grip.hidden = true;
							return;
						}
						const found = view.posAtCoords({ left: event.clientX, top: event.clientY });
						if (!found) return;
						const $pos = view.state.doc.resolve(found.pos);
						if ($pos.depth < 1) return;
						blockPos = $pos.before(1);
						const coords = view.coordsAtPos(blockPos);
						const host = view.dom.getBoundingClientRect();
						grip.hidden = false;
						grip.style.top = `${coords.top - host.top}px`;
					};

					grip.addEventListener('dragstart', (event) => {
						if (blockPos === null) return;
						const node = view.state.doc.nodeAt(blockPos);
						if (!node) return;
						const selection = NodeSelection.create(view.state.doc, blockPos);
						view.dispatch(view.state.tr.setSelection(selection));
						const slice = selection.content();
						view.dragging = { slice, move: true };
						event.dataTransfer?.setData('text/html', node.textContent);
					});

					grip.addEventListener('click', () => {
						if (blockPos === null) return;
						const node = view.state.doc.nodeAt(blockPos);
						if (!node) return;
						const menu = document.createElement('div');
						menu.className = 'ln-blockmenu';
						const actions: Array<[string, () => void]> = [
							['Nhân bản', () => view.dispatch(view.state.tr.insert(blockPos! + node.nodeSize, node.copy(node.content)))],
							['Xóa', () => view.dispatch(view.state.tr.delete(blockPos!, blockPos! + node.nodeSize))],
							['Đổi thành tiêu đề', () => editor.chain().setNodeSelection(blockPos!).setHeading({ level: 2 }).run()],
							['Đổi thành định nghĩa', () => editor.chain().setNodeSelection(blockPos!).setCallout('definition').run()],
						];
						for (const [label, run] of actions) {
							const item = document.createElement('button');
							item.type = 'button';
							item.textContent = label;
							item.addEventListener('click', (click) => {
								click.stopPropagation();
								run();
								menu.remove();
							});
							menu.appendChild(item);
						}
						grip.parentElement?.querySelector('.ln-blockmenu')?.remove();
						grip.insertAdjacentElement('afterend', menu);
					});

					view.dom.parentElement?.classList.add('ln-editor__surface');
					view.dom.parentElement?.appendChild(grip);
					view.dom.addEventListener('mousemove', place);
					return {
						destroy() {
							view.dom.removeEventListener('mousemove', place);
							grip.remove();
						},
					};
				},
			}),
		];
	},
});
