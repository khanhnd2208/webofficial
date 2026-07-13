type TestimonialBlockProps = {
	quote: string;
	personName?: string;
	role?: string;
	organization?: string;
	/** Only approved testimonials should be passed in. */
	anonymous?: boolean;
};

/**
 * Testimonial block. Callers must filter to permissionStatus === 'approved'.
 * Anonymous mode omits identifying metadata.
 */
export function TestimonialBlock({
	quote,
	personName,
	role,
	organization,
	anonymous = false,
}: TestimonialBlockProps) {
	const attribution = anonymous
		? null
		: [personName, role, organization].filter(Boolean).join(' · ');

	return (
		<figure className="border-l border-vermilion pl-5">
			<blockquote className="font-serif text-lg leading-relaxed text-ink sm:text-xl">
				“{quote}”
			</blockquote>
			{attribution ? (
				<figcaption className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-secondary">
					{attribution}
				</figcaption>
			) : null}
		</figure>
	);
}
