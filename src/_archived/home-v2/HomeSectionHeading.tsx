import { SectionHeading } from '@/components/marketing';

type HomeSectionHeadingProps = {
	eyebrow: string;
	title: string;
	description?: string;
	id?: string;
};

export default function HomeSectionHeading({
	eyebrow,
	title,
	description,
	id,
}: HomeSectionHeadingProps) {
	return (
		<SectionHeading
			id={id}
			eyebrow={eyebrow}
			title={title}
			description={description}
			variant="major"
		/>
	);
}
