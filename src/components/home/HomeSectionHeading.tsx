import styles from './home.module.css';

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
		<header className={styles.sectionHeading}>
			<p className={styles.eyebrow}>{eyebrow}</p>
			<h2 id={id} className={styles.sectionTitle}>
				{title}
			</h2>
			{description ? <p className={styles.sectionDescription}>{description}</p> : null}
		</header>
	);
}
