'use client';

import { trackEvent } from '@/lib/analytics';

import { EVENT } from '../content/results';
import { noteRegisterClick } from './responseClient';

type RegisterBlockProps = {
	/** Analytics label: where the click came from (intro, result group, closing). */
	source: string;
	note?: string;
};

export function RegisterButton({ source, label }: { source: string; label?: string }) {
	return (
		<a
			href={EVENT.registerUrl}
			target="_blank"
			rel="noopener noreferrer"
			onClick={() => {
				trackEvent('unreleased_register_click', { sourcePage: 'unreleased', label: source });
				noteRegisterClick();
			}}
			className="inline-flex min-h-12 items-center justify-center rounded-[4px] bg-ink px-6 text-sm font-semibold uppercase tracking-wider text-paper transition-colors duration-250 hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
		>
			{label ?? 'Đăng ký tham gia UNRELEASED'}
			<span aria-hidden="true" className="ml-2">
				↗
			</span>
		</a>
	);
}

export function EventFacts() {
	return (
		<dl className="grid gap-x-6 gap-y-2 text-sm text-ink-secondary sm:grid-cols-[auto_1fr]">
			<dt className="font-semibold text-ink">Thời gian</dt>
			<dd>
				{EVENT.time} · {EVENT.date}
			</dd>
			<dt className="font-semibold text-ink">Địa điểm</dt>
			<dd>{EVENT.venue}</dd>
			<dt className="font-semibold text-ink">Tổ chức</dt>
			<dd>{EVENT.organizer}</dd>
		</dl>
	);
}

export function RegisterBlock({ source, note }: RegisterBlockProps) {
	return (
		<div className="border border-ink bg-paper p-5 sm:p-7">
			<p className="editorial-label">Workshop UNRELEASED</p>
			<div className="mt-4">
				<EventFacts />
			</div>
			<div className="mt-6">
				<RegisterButton source={source} />
			</div>
			{note ? <p className="mt-4 text-sm italic text-ink-secondary">{note}</p> : null}
		</div>
	);
}
