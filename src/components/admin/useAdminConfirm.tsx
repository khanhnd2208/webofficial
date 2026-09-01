'use client';

import { useCallback, useState, type ReactNode } from 'react';

import { AdminConfirmDialog } from './AdminConfirmDialog';

type ConfirmOptions = {
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	tone?: 'danger' | 'default';
};

type ConfirmState = ConfirmOptions & {
	open: boolean;
	resolve?: (value: boolean) => void;
};

const INITIAL: ConfirmState = {
	open: false,
	title: '',
	description: '',
};

export function useAdminConfirm(): {
	confirm: (options: ConfirmOptions) => Promise<boolean>;
	dialog: ReactNode;
} {
	const [state, setState] = useState<ConfirmState>(INITIAL);

	const close = useCallback((value: boolean) => {
		setState((current) => {
			current.resolve?.(value);
			return { ...INITIAL };
		});
	}, []);

	const confirm = useCallback((options: ConfirmOptions) => {
		return new Promise<boolean>((resolve) => {
			setState({ ...options, open: true, resolve });
		});
	}, []);

	const dialog = state.open ? (
		<AdminConfirmDialog
			open
			title={state.title}
			description={state.description}
			confirmLabel={state.confirmLabel}
			cancelLabel={state.cancelLabel}
			tone={state.tone}
			onConfirm={() => close(true)}
			onClose={() => close(false)}
		/>
	) : null;

	return { confirm, dialog };
}
