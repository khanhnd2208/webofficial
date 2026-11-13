import type { Metadata } from 'next';

import styles from './stage.module.css';

export const metadata: Metadata = {
	title: 'FMT 2026 · Nhận quà trở về',
	description: 'Quầy bốc quà của FMT 2026.',
	robots: { index: false, follow: false },
};

export default function Fmt2026Page() {
	return (
		<iframe
			className={styles.stage}
			title="Quầy quà FMT 2026"
			src="/fmt2026/stage/index.html"
			allowFullScreen
		/>
	);
}
