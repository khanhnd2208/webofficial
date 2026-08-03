import { homePageContent } from '@/content/home';

import styles from './home.module.css';

export default function HomeStatement() {
	const { hero } = homePageContent;

	return (
		<section className={styles.statement} aria-labelledby="home-statement-title">
			<div className="shell">
				<div className={styles.statementInner}>
					<p className={styles.eyebrow}>Một cách nhìn</p>
					<h2 id="home-statement-title">{hero.becomingQuote}</h2>
					<p className={styles.statementCaption}>{hero.caption}</p>
				</div>
			</div>
		</section>
	);
}
