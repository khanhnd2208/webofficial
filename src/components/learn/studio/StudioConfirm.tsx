'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import StudioDialog from './StudioDialog';

export type StudioConfirmRequest = {
	title: string;
	body: string;
	confirmLabel: string;
	cancelLabel?: string;
	danger?: boolean;
};

type OpenRequest = StudioConfirmRequest & { resolve: (accepted: boolean) => void };

/** Promise-based confirm. Focus stays on the safe (cancel) button. */
export function useStudioConfirm() {
	const [request, setRequest] = useState<OpenRequest | null>(null);
	const requestRef = useRef<OpenRequest | null>(null);
	const cancelRef = useRef<HTMLButtonElement>(null);

	const confirm = useCallback((next: StudioConfirmRequest) => {
		return new Promise<boolean>((resolve) => {
			const open = { ...next, resolve };
			requestRef.current = open;
			setRequest(open);
		});
	}, []);

	const settle = useCallback((accepted: boolean) => {
		const current = requestRef.current;
		requestRef.current = null;
		setRequest(null);
		current?.resolve(accepted);
	}, []);

	useEffect(() => {
		if (!request) return;
		const frame = requestAnimationFrame(() => cancelRef.current?.focus());
		return () => cancelAnimationFrame(frame);
	}, [request]);

	const dialog = request ? (
		<StudioDialog
			title={request.title}
			size="narrow"
			onClose={() => settle(false)}
			footer={
				<div className="ln-confirm">
					<button ref={cancelRef} type="button" className="ln-btn" onClick={() => settle(false)}>
						{request.cancelLabel ?? 'Hủy'}
					</button>
					<button
						type="button"
						className={`ln-btn ${request.danger ? 'ln-btn--danger' : 'ln-btn--primary'}`}
						onClick={() => settle(true)}
					>
						{request.confirmLabel}
					</button>
				</div>
			}
		>
			<p>{request.body}</p>
		</StudioDialog>
	) : null;

	return { confirm, confirmDialog: dialog };
}
