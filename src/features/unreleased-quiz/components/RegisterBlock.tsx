'use client';

import type { ReactNode } from 'react';

import { trackEvent } from '@/lib/analytics';

import { EVENT } from '../content/results';
import { noteRegisterClick } from './responseClient';
import styles from './unreleased.module.css';

type RegisterBlockProps = {
	/** Analytics label: where the click came from (intro, result group, closing). */
	source: string;
	note?: string;
};

function onRegister(source: string) {
	trackEvent('unreleased_register_click', { sourcePage: 'unreleased', label: source });
	noteRegisterClick();
}

export function RegisterButton({ source, label }: { source: string; label?: string }) {
	return (
		<a
			href={EVENT.registerUrl}
			target="_blank"
			rel="noopener noreferrer"
			onClick={() => onRegister(source)}
			className={styles.cta}
		>
			{label ?? 'Đăng ký tham gia UNRELEASED'}
			<span aria-hidden="true">↗</span>
		</a>
	);
}

/** Small register link for the top bar. */
export function RegisterLink({ source }: { source: string }) {
	return (
		<a
			href={EVENT.registerUrl}
			target="_blank"
			rel="noopener noreferrer"
			onClick={() => onRegister(source)}
			className={styles.outline}
		>
			Đăng ký <span aria-hidden="true">↗</span>
		</a>
	);
}

export function EventFacts() {
	return (
		<dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[auto_1fr]">
			<dt className={styles.label}>Thời gian</dt>
			<dd className="-mt-2 sm:mt-0">
				{EVENT.time} · {EVENT.date}
			</dd>
			<dt className={styles.label}>Địa điểm</dt>
			<dd className="-mt-2 sm:mt-0">{EVENT.venue}</dd>
			<dt className={styles.label}>Tổ chức</dt>
			<dd className="-mt-2 sm:mt-0">{EVENT.organizer}</dd>
		</dl>
	);
}

/** The event as a ticket: big date, the facts, then the register button. */
export function EventTicket({ children }: { children?: ReactNode }) {
	return (
		<div className={`${styles.ticket} p-6 sm:p-8`}>
			<p className={styles.label}>Backstage pass / Workshop UNRELEASED</p>
			<div className="mt-5 space-y-6">
				<div>
					<p className={`${styles.ticketDate} text-6xl sm:text-7xl`}>{EVENT.dateBadge}</p>
					<p className={`${styles.label} mt-2 ${styles.muted}`}>{EVENT.weekday}</p>
				</div>
				<div className="text-[0.95rem] leading-relaxed">
					<EventFacts />
				</div>
			</div>
			{children ? <div className={`${styles.ticketDivider} mt-7 pt-6`}>{children}</div> : null}
		</div>
	);
}

export function RegisterBlock({ source, note }: RegisterBlockProps) {
	return (
		<EventTicket>
			<RegisterButton source={source} />
			{note ? <p className={`${styles.muted} mt-4 text-sm`}>{note}</p> : null}
		</EventTicket>
	);
}
