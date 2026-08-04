type SectionIntroProps = {
	eyebrow?: string;
	title: string;
	lead?: string;
	id?: string;
	className?: string;
};

export function SectionIntro({ eyebrow, title, lead, id, className = '' }: SectionIntroProps) {
	return (
		<header className={`max-w-3xl ${className}`}>
			{eyebrow ? <p className="editorial-label">{eyebrow}</p> : null}
			<h2 id={id} className={`editorial-heading ${eyebrow ? 'mt-5' : ''}`}>
				{title}
			</h2>
			{lead ? <p className="premium-lead mt-5">{lead}</p> : null}
		</header>
	);
}
