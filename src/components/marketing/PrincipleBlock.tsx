type Principle = {
	id: string;
	title: string;
	body: string;
};

type PrincipleBlockProps = {
	eyebrow?: string;
	title?: string;
	items: readonly Principle[];
};

export function PrincipleBlock({
	eyebrow = 'Tôi tin vào điều gì',
	title,
	items,
}: PrincipleBlockProps) {
	return (
		<section className="editorial-section border-b border-hairline bg-paper">
			<div className="shell">
				<p className="editorial-label">{eyebrow}</p>
				{title ? <h2 className="editorial-heading mt-5">{title}</h2> : null}
				<div className="mt-12 space-y-12 border-t border-hairline pt-12 md:space-y-16">
					{items.map((item, index) => (
						<article key={item.id} className="grid gap-4 md:grid-cols-12 md:gap-10">
							<span className="font-mono text-xs text-accent md:col-span-1">
								{String(index + 1).padStart(2, '0')}
							</span>
							<div className="md:col-span-10">
								<h3 className="font-display text-2xl font-medium tracking-[-0.02em] text-ink md:text-3xl">
									{item.title}
								</h3>
								<p className="mt-4 max-w-2xl text-lg leading-[1.7] text-ink-secondary">{item.body}</p>
							</div>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}
