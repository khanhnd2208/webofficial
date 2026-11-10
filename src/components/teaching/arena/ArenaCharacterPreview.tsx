'use client';

import { useEffect, useRef, useState } from 'react';

import { ArenaCharacter } from './ArenaCharacter';
import { ARENA_CHARACTERS } from './arenaCharacters';
import styles from './arenaCharacter.module.css';

type PreviewBeat = 'idle' | 'walk' | 'attack' | 'return';

/** A local studio: inspect the full walk and attack twice without grading a student. */
export function ArenaCharacterPreview() {
	const [open, setOpen] = useState(false);
	const [index, setIndex] = useState(0);
	const [replay, setReplay] = useState(0);
	const [beat, setBeat] = useState<PreviewBeat>('idle');
	const [vector, setVector] = useState({ x: 155, y: -120 });
	const travelerRef = useRef<HTMLDivElement>(null);
	const targetRef = useRef<HTMLDivElement>(null);
	const character = ARENA_CHARACTERS[index]!;

	useEffect(() => {
		if (beat !== 'attack' || !travelerRef.current || !targetRef.current) return;
		const from = travelerRef.current.getBoundingClientRect();
		const to = targetRef.current.getBoundingClientRect();
		setVector({
			x: to.left + to.width / 2 - (from.left + (from.width * character.origin[0]) / 100),
			y: to.top + to.height / 2 - (from.top + (from.height * character.origin[1]) / 100),
		});
	}, [beat, character]);

	useEffect(() => {
		if (!open) return;
		const timers = [
			window.setTimeout(() => setBeat('walk'), 350),
			window.setTimeout(() => setBeat('attack'), 2250),
			window.setTimeout(() => setBeat('return'), 4250),
			window.setTimeout(() => {
				setBeat('idle');
				setReplay((value) => value + 1);
			}, 6150),
		];
		return () => timers.forEach((timer) => window.clearTimeout(timer));
	}, [open, index, replay]);

	useEffect(() => {
		if (!open) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setOpen(false);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [open]);

	if (process.env.NODE_ENV !== 'development') return null;

	return (
		<>
			<button type="button" className={styles.previewTrigger} onClick={() => setOpen(true)}>
				Xem 10 nhân vật
			</button>
			{open ? (
				<div className={styles.previewBackdrop} onClick={() => setOpen(false)}>
					<section
						className={styles.previewCard}
						role="dialog"
						aria-modal="true"
						aria-label="Xem chuyển động nhân vật Arena"
						onClick={(event) => event.stopPropagation()}
					>
						<button
							type="button"
							className={styles.previewClose}
							onClick={() => setOpen(false)}
							aria-label="Đóng bản xem trước"
							autoFocus
						>
							×
						</button>
						<h2>{character.name}</h2>
						<p>Đi → lấy đà → tung chiêu → hồi tư thế → đi tiếp</p>
						<div className={styles.previewChoices} role="group" aria-label="Chọn nhân vật">
							{ARENA_CHARACTERS.map((item, itemIndex) => (
								<button
									key={item.id}
									type="button"
									aria-pressed={index === itemIndex}
									onClick={() => {
										setIndex(itemIndex);
										setBeat('idle');
										setReplay((value) => value + 1);
									}}
								>
									{item.name}
								</button>
							))}
						</div>
						<div className={styles.previewStage}>
							<div ref={targetRef} className={styles.previewTarget} aria-hidden="true">
								✦
							</div>
							<div ref={travelerRef} className={styles.previewTraveler} data-beat={beat}>
								<ArenaCharacter
									character={character}
									size={224}
									walking={beat === 'walk' || beat === 'return'}
									attacking={beat === 'attack'}
									facingLeft={beat === 'return'}
									attackVector={vector}
									decorative={false}
								/>
							</div>
						</div>
						<div className={styles.previewFooter}>
							<span>Kích thước trên sân</span>
							<ArenaCharacter character={character} size={74} decorative={false} />
							<button
								type="button"
								onClick={() => {
									setBeat('idle');
									setReplay((value) => value + 1);
								}}
							>
								Xem lại
							</button>
						</div>
					</section>
				</div>
			) : null}
		</>
	);
}
