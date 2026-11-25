'use client';

import { useRef, useState } from 'react';

import { Icon } from '@/components/ui/Icon';

import { TEST_BOSSES } from './bossChoice';
import BossPicker from './BossPicker';
import styles from './bossPicker.module.css';

/**
 * "Đổi boss" in the battle bar: a dialog with the boss grid. Picking is two
 * steps (choose, then confirm) so arrow keys can browse without swapping on
 * every press. The run itself is untouched: HP is the cards left to answer.
 */
export default function BossSwitch({
	bossId,
	onPick,
	disabled = false,
	crowded = false,
}: {
	bossId: string;
	onPick: (bossId: string) => void;
	disabled?: boolean;
	/** The bar also holds EN/VI: on phones the button drops its words. */
	crowded?: boolean;
}) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [draft, setDraft] = useState(bossId);
	const draftBoss = TEST_BOSSES.find((boss) => boss.id === draft);

	const open = () => {
		setDraft(bossId);
		dialogRef.current?.showModal();
	};
	const close = () => dialogRef.current?.close();
	const confirm = () => {
		if (draft !== bossId) onPick(draft);
		close();
	};

	return (
		<>
			<button
				type="button"
				className={styles.switchButton}
				onClick={open}
				disabled={disabled}
				aria-haspopup="dialog"
				data-crowded={crowded || undefined}
				title="Đổi boss"
			>
				<Icon name="shuffle" size={18} aria-hidden="true" />
				<span className={styles.switchLabel}>Đổi boss</span>
			</button>
			<dialog
				ref={dialogRef}
				className={styles.dialog}
				aria-labelledby="boss-switch-title"
				onClick={(event) => {
					// A tap on the backdrop (the dialog box itself, outside the panel) closes it.
					if (event.target === event.currentTarget) close();
				}}
			>
				<div className={styles.panel}>
					<header className={styles.dialogHead}>
						<div>
							<h2 id="boss-switch-title" className={styles.dialogTitle}>
								Đổi boss
							</h2>
							<p className={styles.dialogText}>
								Trận đấu giữ nguyên: câu đã nhớ vẫn tính, boss mới chỉ còn đúng lượng máu hiện tại.
							</p>
						</div>
						<button type="button" className={styles.closeButton} onClick={close} aria-label="Đóng">
							<Icon name="close" size={20} aria-hidden="true" />
						</button>
					</header>
					<div className={styles.dialogBody}>
						<BossPicker value={draft} onChange={setDraft} label="Chọn boss để đấu tiếp" />
					</div>
					<footer className={styles.dialogFoot}>
						<button type="button" className={styles.cancelButton} onClick={close}>
							Giữ boss này
						</button>
						<button
							type="button"
							className={styles.confirmButton}
							onClick={confirm}
							disabled={draft === bossId}
						>
							{draft === bossId || !draftBoss ? 'Chọn một boss khác' : `Đấu với ${draftBoss.name}`}
						</button>
					</footer>
				</div>
			</dialog>
		</>
	);
}
