'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { routes } from '@/config/routes';
import { Dialog } from '@/components/ui/Dialog';
import ContactForm from './ContactForm';
import {
	campaignParamsFromSearchParams,
	contactContextFromSearchParams,
	mergeContactContext,
	type ContactContext,
	type ContactContextInput,
} from './ContactContext';

export type ContactFormAvailability = {
	enabled: boolean;
	disabledReason?: string;
};

type ContactDialogController = {
	openContact: (context?: ContactContextInput, fallbackHref?: string) => void;
};

const ContactDialogContext = createContext<ContactDialogController | null>(null);

export function useContactDialog(): ContactDialogController | null {
	return useContext(ContactDialogContext);
}

function resolveOpenContext(
	context?: ContactContextInput,
	fallbackHref: string = routes.contact,
): ContactContext {
	const currentUrl = new URL(window.location.href);
	const fallbackUrl = new URL(fallbackHref, currentUrl.origin);
	const fromHref = contactContextFromSearchParams(fallbackUrl.searchParams, currentUrl.pathname);
	const currentCampaign = campaignParamsFromSearchParams(currentUrl.searchParams);

	return mergeContactContext(
		{
			...fromHref,
			campaignParams: {
				...(currentCampaign ?? {}),
				...(fromHref.campaignParams ?? {}),
			},
		},
		context,
	);
}

type ContactDialogProviderProps = {
	children: ReactNode;
	availability: ContactFormAvailability;
};

export function ContactDialogProvider({ children, availability }: ContactDialogProviderProps) {
	const [open, setOpen] = useState(false);
	const [activeContext, setActiveContext] = useState<ContactContext | null>(null);
	const [dirty, setDirty] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [resetKey, setResetKey] = useState(0);
	const handleDirtyChange = useCallback((nextDirty: boolean) => {
		setDirty(nextDirty);
	}, []);

	const openContact = useCallback(
		(context?: ContactContextInput, fallbackHref?: string) => {
			// A written draft belongs to the source where it started. Reopening keeps both.
			if (!dirty || !activeContext) {
				setActiveContext(resolveOpenContext(context, fallbackHref));
			}
			setOpen(true);
		},
		[activeContext, dirty],
	);

	const closeContact = useCallback(() => {
		setOpen(false);
		if (submitted) {
			setSubmitted(false);
			setDirty(false);
			setActiveContext(null);
			setResetKey((current) => current + 1);
		}
	}, [submitted]);

	const controller = useMemo(() => ({ openContact }), [openContact]);

	return (
		<ContactDialogContext.Provider value={controller}>
			{children}
			<Dialog
				open={open}
				onClose={closeContact}
				title="Gửi tôi một lời nhắn"
				description="Hãy để lại vài dòng. Tôi sẽ đọc và phản hồi qua email."
				className="!w-[min(calc(100%_-_1.5rem),45rem)] max-h-[min(92dvh,52rem)]"
			>
				{activeContext ? (
					<ContactForm
						formEnabled={availability.enabled}
						disabledReason={availability.disabledReason}
						contactContext={activeContext}
						resetKey={resetKey}
						onDirtyChange={handleDirtyChange}
						onSuccess={() => setSubmitted(true)}
						showHomeLink={false}
					/>
				) : null}
			</Dialog>
		</ContactDialogContext.Provider>
	);
}
