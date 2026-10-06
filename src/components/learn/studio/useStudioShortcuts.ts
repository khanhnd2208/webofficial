'use client';

import { useEffect, useRef } from 'react';

function typingTarget(target: EventTarget | null) {
	if (!(target instanceof HTMLElement)) return false;
	const tag = target.tagName;
	return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

export function useStudioShortcuts(actions: {
	save: () => void;
	jump: () => void;
	preview: () => void;
	help: () => void;
}) {
	const actionsRef = useRef(actions);
	useEffect(() => {
		actionsRef.current = actions;
	});

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			const meta = event.metaKey || event.ctrlKey;
			const key = event.key.toLowerCase();
			const current = actionsRef.current;
			if (meta && key === 's') {
				event.preventDefault();
				current.save();
				return;
			}
			if (meta && key === 'k') {
				event.preventDefault();
				current.jump();
				return;
			}
			if (meta && event.shiftKey && key === 'p') {
				event.preventDefault();
				current.preview();
				return;
			}
			if (event.key === '?' && !meta && !typingTarget(event.target)) {
				event.preventDefault();
				current.help();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, []);
}
