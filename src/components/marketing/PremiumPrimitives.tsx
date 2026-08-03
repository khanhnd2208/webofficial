import type { ReactNode } from 'react';

export function TrustStrip({ items }: { items: ReadonlyArray<{ label: string; value: string }> }) {
	return (
		<div className="trust-strip" aria-label="Thông tin chuyên môn đã xác minh">
			{items.map((item) => (
				<div key={item.label} className="trust-strip__item">
					<p className="editorial-label">{item.label}</p>
					<p className="mt-2 text-base leading-[1.55] text-ink">{item.value}</p>
				</div>
			))}
		</div>
	);
}

export function ImpactMetric({ value, label }: { value: string; label: string }) {
	return (
		<div className="impact-metric">
			<p className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-medium leading-none text-ink">
				{value}
			</p>
			<p className="mt-3 max-w-52 text-sm leading-[1.65] text-ink-secondary">{label}</p>
		</div>
	);
}

export function ProofNote({ children }: { children: ReactNode }) {
	return (
		<p className="proof-note">
			<span className="proof-note__mark" aria-hidden />
			{children}
		</p>
	);
}
