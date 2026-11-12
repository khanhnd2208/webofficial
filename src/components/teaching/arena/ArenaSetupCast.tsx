'use client';

import { useEffect, useRef, useState } from 'react';

import { useMotionTier } from '@/components/motion';

import { ArenaCharacter } from './ArenaCharacter';
import { ArenaMonster } from './ArenaFigures';
import { ArenaStrike } from './ArenaStrike';
import { ARENA_BOSSES, arenaBossFor } from './arenaBosses';
import { ARENA_CHARACTERS, arenaCast, type ArenaCharacter as Hero } from './arenaCharacters';
import type { ArenaConfig } from './arenaGame';
import { STRIKE_HERO_SCALE, STRIKE_MS, type StrikeCue } from './arenaStrikes';
import styles from './arena.module.css';
import setup from './arenaSetup.module.css';

type Beat = 'idle' | 'walk' | 'attack';

const HERO_SIZE = 84;
const WALK_MS = 1300;

/**
 * A small stage that loops the selected hero: walk in, attack the chosen
 * boss with the real in-game effect, rest. What plays here is what the class
 * will see.
 */
function CastStage({ hero, bossId }: { hero: Hero; bossId: string | null }) {
	const { reduced } = useMotionTier();
	const stageRef = useRef<HTMLDivElement>(null);
	const heroRef = useRef<HTMLDivElement>(null);
	const bossRef = useRef<HTMLDivElement>(null);
	const [beat, setBeat] = useState<Beat>('idle');
	const [cue, setCue] = useState<StrikeCue | null>(null);
	const [hit, setHit] = useState(false);
	const [loop, setLoop] = useState(0);
	const boss = arenaBossFor(1, bossId);

	useEffect(() => {
		if (reduced) return;
		const timers: number[] = [];
		const at = (ms: number, run: () => void) => timers.push(window.setTimeout(run, ms));
		at(250, () => setBeat('walk'));
		at(250 + WALK_MS, () => {
			const stage = stageRef.current?.getBoundingClientRect();
			const from = heroRef.current?.getBoundingClientRect();
			const to = bossRef.current?.getBoundingClientRect();
			setBeat('attack');
			if (!stage || !from || !to) return;
			// The hero grows from the feet while attacking, as on the floor.
			const feetX = from.left + from.width / 2;
			const feetY = from.bottom;
			setCue({
				id: loop + 1,
				from: {
					x:
						feetX +
						(from.left + (from.width * hero.origin[0]) / 100 - feetX) * STRIKE_HERO_SCALE -
						stage.left,
					y:
						feetY +
						(from.top + (from.height * hero.origin[1]) / 100 - feetY) * STRIKE_HERO_SCALE -
						stage.top,
				},
				to: { x: to.left + to.width / 2 - stage.left, y: to.top + to.height / 2 - stage.top },
				accent: hero.accent,
				effect: hero.effect,
				skill: hero.skill,
				power: 1,
			});
		});
		at(250 + WALK_MS + STRIKE_MS.impact, () => setHit(true));
		at(250 + WALK_MS + STRIKE_MS.end, () => {
			setBeat('idle');
			setCue(null);
			setHit(false);
		});
		at(250 + WALK_MS + STRIKE_MS.end + 700, () => setLoop((value) => value + 1));
		return () => {
			timers.forEach((timer) => window.clearTimeout(timer));
			setBeat('idle');
			setCue(null);
			setHit(false);
		};
	}, [hero, loop, reduced]);

	return (
		<div ref={stageRef} className={setup.castStage}>
			<div className={setup.castInfo}>
				<strong>{hero.name}</strong>
				<span className={styles.setupHint}>Chiêu: {hero.skill}</span>
			</div>
			<div className={setup.castHero} data-beat={beat}>
				<div ref={heroRef}>
					<ArenaCharacter
						character={hero}
						size={HERO_SIZE}
						walking={beat === 'walk'}
						attacking={beat === 'attack'}
					/>
				</div>
			</div>
			<div ref={bossRef} className={setup.castBoss}>
				<ArenaMonster mood={hit ? 'hurt' : 'idle'} size={104} boss={boss} decorative />
			</div>
			{cue ? <ArenaStrike key={cue.id} cue={cue} quiet /> : null}
		</div>
	);
}

/**
 * Step 4: the cast. One tab ticks the heroes handed out to students, the
 * other picks the boss; the stage above plays the current pair. Both lists
 * come straight from the catalogues, so new art shows up here as soon as it
 * is registered.
 */
export function ArenaSetupCast({
	config,
	onChange,
}: {
	config: ArenaConfig;
	onChange: (next: ArenaConfig) => void;
}) {
	const cast = arenaCast(config.heroIds);
	const inCast = new Set(cast.map((hero) => hero.id));
	const [previewId, setPreviewId] = useState(cast[0]!.id);
	const preview = ARENA_CHARACTERS.find((hero) => hero.id === previewId) ?? cast[0]!;
	const everyone = cast.length === ARENA_CHARACTERS.length;
	const [tab, setTab] = useState<'heroes' | 'boss'>('heroes');
	const chosenBoss = ARENA_BOSSES.find((boss) => boss.id === config.bossId);

	function toggle(id: string) {
		const next = ARENA_CHARACTERS.filter((hero) =>
			hero.id === id ? !inCast.has(id) : inCast.has(hero.id),
		).map((hero) => hero.id);
		if (next.length === 0) return;
		// Everyone ticked is stored as "no choice", so heroes added later join in.
		onChange({ ...config, heroIds: next.length === ARENA_CHARACTERS.length ? [] : next });
	}

	return (
		<div className={setup.section}>
			<CastStage hero={preview} bossId={config.bossId} />

			<div className={setup.castTabs} role="tablist" aria-label="Chọn nhân vật hoặc boss">
				<button
					type="button"
					role="tab"
					id="arena-cast-tab-heroes"
					aria-selected={tab === 'heroes'}
					aria-controls="arena-cast-panel"
					onClick={() => setTab('heroes')}
				>
					Nhân vật
					<span className={setup.castTabNote}>
						{cast.length}/{ARENA_CHARACTERS.length}
					</span>
				</button>
				<button
					type="button"
					role="tab"
					id="arena-cast-tab-boss"
					aria-selected={tab === 'boss'}
					aria-controls="arena-cast-panel"
					onClick={() => setTab('boss')}
				>
					Boss
					<span className={setup.castTabNote}>{chosenBoss ? chosenBoss.name : 'Lần lượt'}</span>
				</button>
			</div>

			{tab === 'heroes' ? (
				<div
					id="arena-cast-panel"
					role="tabpanel"
					aria-labelledby="arena-cast-tab-heroes"
					className={setup.section}
				>
					<div className={setup.sectionHead}>
						<span className={setup.total}>
							Nhân vật của sinh viên · {cast.length}/{ARENA_CHARACTERS.length}
						</span>
						<button
							type="button"
							className={styles.smallButton}
							disabled={everyone}
							onClick={() => onChange({ ...config, heroIds: [] })}
						>
							Chọn tất cả
						</button>
					</div>
					<p className={styles.setupHint}>
						Mỗi bạn được giao ngẫu nhiên một nhân vật trong số đã tick và giữ nguyên qua các buổi.
						Bấm vào hình để xem nhân vật ra đòn.
					</p>
					<ul className={setup.castGrid}>
						{ARENA_CHARACTERS.map((hero) => {
							const checked = inCast.has(hero.id);
							return (
								<li
									key={hero.id}
									className={setup.castCard}
									data-checked={checked || undefined}
									data-preview={hero.id === preview.id || undefined}
									data-nameplate={hero.nameplate || undefined}
								>
									<button
										type="button"
										className={setup.castPick}
										aria-pressed={hero.id === preview.id}
										aria-label={`Xem ${hero.name}`}
										onClick={() => setPreviewId(hero.id)}
									>
										<ArenaCharacter character={hero} size={64} />
									</button>
									<label className={setup.castLabel}>
										<input
											type="checkbox"
											checked={checked}
											disabled={checked && cast.length === 1}
											onChange={() => toggle(hero.id)}
										/>
										<span>{hero.name}</span>
									</label>
								</li>
							);
						})}
					</ul>
				</div>
			) : (
				<div
					id="arena-cast-panel"
					role="tabpanel"
					aria-labelledby="arena-cast-tab-boss"
					className={setup.section}
				>
					<p className={styles.setupHint}>
						Chọn một boss cho mọi ván, hoặc để các boss lần lượt ra trận: hạ xong boss này thì boss
						kế tiếp xuất hiện.
					</p>
					<div className={setup.bossGrid} role="group" aria-label="Chọn boss">
						<button
							type="button"
							className={setup.bossCard}
							aria-pressed={config.bossId === null}
							onClick={() => onChange({ ...config, bossId: null })}
						>
							<span className={setup.bossAuto} aria-hidden="true">
								{ARENA_BOSSES.length}
							</span>
							<span>Lần lượt từng boss</span>
						</button>
						{ARENA_BOSSES.map((boss) => (
							<button
								key={boss.id}
								type="button"
								className={setup.bossCard}
								aria-pressed={config.bossId === boss.id}
								onClick={() => onChange({ ...config, bossId: boss.id })}
							>
								<ArenaMonster mood="idle" size={84} boss={boss} decorative />
								<span>{boss.name}</span>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
