'use client';

import { useEffect, useRef, type PointerEvent, type RefObject } from 'react';

interface Grip {
	id: number;
	x: number;
	y: number;
	base: number;
	startSize: number;
	limit: number;
}

function clearFold(frame: HTMLDivElement | null) {
	if (!frame) return;
	delete frame.dataset.peeling;
	frame.style.removeProperty('--corner');
	frame.style.removeProperty('--curl-scale');
}

/** Pointer enhancement inside the existing atmosphere button. A small pull peeks,
 * a deliberate pull turns the page, and an ordinary click or Enter still toggles. */
export default function CoverPageCorner({
	frameRef,
	onTurn,
}: {
	frameRef: RefObject<HTMLDivElement | null>;
	onTurn: (x: number, y: number) => void;
}) {
	const grip = useRef<Grip | null>(null);
	const suppressClick = useRef(false);

	function release() {
		grip.current = null;
		clearFold(frameRef.current);
	}

	useEffect(() => {
		const frame = frameRef.current;
		return () => clearFold(frame);
	}, [frameRef]);

	function start(event: PointerEvent<HTMLSpanElement>) {
		const frame = frameRef.current;
		if (!frame || !event.isPrimary || event.button !== 0) return;
		const button = event.currentTarget.parentElement;
		if (!button) return;
		const fold = getComputedStyle(button, '::after');
		const base = parseFloat(fold.width);
		if (!base) return;
		const scale = new DOMMatrixReadOnly(fold.transform).a;
		grip.current = {
			id: event.pointerId,
			x: event.clientX,
			y: event.clientY,
			base,
			startSize: base * scale,
			limit: Math.min(frame.clientWidth, frame.clientHeight) * 0.88,
		};
		suppressClick.current = false;
		event.currentTarget.setPointerCapture(event.pointerId);
	}

	function distance(event: PointerEvent<HTMLSpanElement>, drag: Grip) {
		return (drag.x - event.clientX + event.clientY - drag.y) / 2;
	}

	function move(event: PointerEvent<HTMLSpanElement>) {
		const drag = grip.current;
		const frame = frameRef.current;
		if (!drag || drag.id !== event.pointerId || !frame) return;
		const pull = distance(event, drag);
		if (Math.abs(pull) < 4 && !frame.dataset.peeling) return;
		const size = Math.min(drag.limit, Math.max(6, drag.startSize + pull));
		frame.dataset.peeling = 'true';
		frame.style.setProperty('--corner', size + 'px');
		frame.style.setProperty('--curl-scale', String(size / drag.base));
	}

	function finish(event: PointerEvent<HTMLSpanElement>) {
		const drag = grip.current;
		if (!drag || drag.id !== event.pointerId) return;
		const wasPeeling = Boolean(frameRef.current?.dataset.peeling);
		suppressClick.current = wasPeeling;
		const shouldTurn = wasPeeling && distance(event, drag) >= drag.limit * 0.22;
		release();
		if (shouldTurn) {
			onTurn(event.clientX, event.clientY);
		}
	}

	return (
		<span
			aria-hidden="true"
			className="cover-corner-grip"
			title="Kéo góc giấy để xem mặt sau"
			onPointerDown={start}
			onPointerMove={move}
			onPointerUp={finish}
			onPointerCancel={release}
			onLostPointerCapture={release}
			onClick={(event) => {
				if (suppressClick.current) event.stopPropagation();
				suppressClick.current = false;
			}}
		/>
	);
}
