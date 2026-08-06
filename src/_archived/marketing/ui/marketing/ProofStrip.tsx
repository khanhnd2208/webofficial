type ProofItem = {
	id: string;
	label: string;
	value: string;
};

type ProofStripProps = {
	items: ProofItem[];
};

/**
 * Credibility strip. Render only with real, owner-approved figures — never placeholders.
 */
export function ProofStrip({ items }: ProofStripProps) {
	if (items.length === 0) return null;

	return (
		<ul className="flex flex-wrap gap-x-10 gap-y-4 border-y border-hairline py-6">
			{items.map((item) => (
				<li key={item.id}>
					<p className="font-display text-2xl font-medium text-ink">{item.value}</p>
					<p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-secondary">
						{item.label}
					</p>
				</li>
			))}
		</ul>
	);
}
