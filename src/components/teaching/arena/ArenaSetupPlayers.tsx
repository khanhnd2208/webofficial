'use client';

import { useMemo, useState, type FormEvent } from 'react';

import {
	arenaCpSession,
	presentAt,
	type ArenaGroup,
	type ArenaGroupFilter,
} from '@/features/teaching/domain/recallArena';
import type {
	RecallArenaData,
	RecallArenaPlayer,
	TeachingSessionRecord,
} from '@/features/teaching/types';

import { ArenaCpStatus } from './ArenaCpStatus';
import {
	fullName,
	importArenaNames,
	matchesPlayerSearch,
	newManualPlayer,
	type ArenaConfig,
} from './arenaGame';
import styles from './arena.module.css';
import setup from './arenaSetup.module.css';

const FILTER_LABEL: Record<ArenaGroupFilter, string> = {
	ALL: 'Cả lớp',
	CHALLENGE: 'Chỉ Challenging',
	SUPPORT: 'Chỉ Supporting',
};

const GROUP_TAG = { CHALLENGE: 'Challenging', SUPPORT: 'Supporting' } as const;
const SEARCH_LIMIT = 8;

/**
 * Step 2: who plays. Everyone marked in the room starts ticked; the lecturer
 * can untick a student, or search the whole course to add a make-up student
 * from another class. A guest's CP still goes to their own class.
 */
export function ArenaSetupPlayers({
	data,
	config,
	sessions,
	hosts,
	roster,
	openingCpId,
	onChange,
	onOpenCp,
}: {
	data: RecallArenaData;
	config: ArenaConfig;
	sessions: TeachingSessionRecord[];
	hosts: TeachingSessionRecord[];
	roster: RecallArenaPlayer[];
	openingCpId: string | null;
	onChange: (next: ArenaConfig) => void;
	onOpenCp: (sessionId: string) => void;
}) {
	const [query, setQuery] = useState('');
	const [bulkNames, setBulkNames] = useState('');
	const [bulkGroup, setBulkGroup] = useState<ArenaGroup>('SUPPORT');
	const [bulkStatus, setBulkStatus] = useState('');
	const [bulkOpen, setBulkOpen] = useState(false);
	const [manualName, setManualName] = useState('');
	const [manualGroup, setManualGroup] = useState<ArenaGroup>('SUPPORT');
	const [editingId, setEditingId] = useState<string | null>(null);
	const classCode = useMemo(
		() => new Map(data.classes.map((item) => [item.id, item.classCode])),
		[data.classes],
	);
	const inGame = new Set(roster.map((player) => player.enrollmentId));
	const guests = new Set(config.guestIds);
	const excluded = new Set(config.excludedIds);
	const inRoom = (player: RecallArenaPlayer) => hosts.some((session) => presentAt(player, session));

	// Everyone the lecturer can tick here: the room, plus guests, grouped by class.
	const listed = data.players.filter((player) => inRoom(player) || guests.has(player.enrollmentId));
	const byClass = data.classes
		.map((item) => ({
			item,
			players: listed.filter((player) => player.classId === item.id),
		}))
		.filter((group) => group.players.length > 0);

	const results = query.trim()
		? data.players
				.filter((player) => !inGame.has(player.enrollmentId))
				.filter((player) => matchesPlayerSearch(player, query))
				.slice(0, SEARCH_LIMIT)
		: [];

	const counts: Record<ArenaGroupFilter, number> = {
		ALL: roster.length,
		CHALLENGE: roster.filter((player) => player.group === 'CHALLENGE').length,
		SUPPORT: roster.filter((player) => player.group === 'SUPPORT').length,
	};
	const noGroup = roster.length - counts.CHALLENGE - counts.SUPPORT;

	function add(player: RecallArenaPlayer) {
		onChange({
			...config,
			guestIds:
				inRoom(player) || guests.has(player.enrollmentId)
					? config.guestIds
					: [...config.guestIds, player.enrollmentId],
			excludedIds: config.excludedIds.filter((id) => id !== player.enrollmentId),
		});
		setQuery('');
	}

	function importNames(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const result = importArenaNames(bulkNames, bulkGroup, data.players, config, roster);
		if (result.enrolled || result.guestsAdded) onChange(result.config);
		setBulkNames(result.remaining.join('\n'));
		setBulkStatus(
			[
				`Đã thêm ${result.enrolled + result.guestsAdded} người`,
				result.guestsAdded ? `${result.guestsAdded} khách chơi thử` : '',
				result.duplicates ? `${result.duplicates} mục đã có` : '',
				result.ambiguous
					? `${result.ambiguous} tên trùng trong môn, hãy tìm theo mã sinh viên`
					: '',
				result.tooLong ? `${result.tooLong} tên dài quá 80 ký tự` : '',
			]
				.filter(Boolean)
				.join(' · '),
		);
	}

	function saveManual(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const name = manualName.trim().replace(/\s+/g, ' ');
		if (!name) return;
		const manualPlayers = editingId
			? config.manualPlayers.map((player) =>
					player.id === editingId ? { ...player, name, group: manualGroup } : player,
				)
			: [...config.manualPlayers, newManualPlayer(name, manualGroup)];
		onChange({ ...config, manualPlayers });
		setManualName('');
		setManualGroup('SUPPORT');
		setEditingId(null);
	}

	function editManual(id: string) {
		const player = config.manualPlayers.find((item) => item.id === id);
		if (!player) return;
		setManualName(player.name);
		setManualGroup(player.group);
		setEditingId(id);
	}

	function toggle(player: RecallArenaPlayer) {
		const id = player.enrollmentId;
		if (guests.has(id) && !inRoom(player)) {
			onChange({ ...config, guestIds: config.guestIds.filter((item) => item !== id) });
			return;
		}
		onChange({
			...config,
			excludedIds: excluded.has(id)
				? config.excludedIds.filter((item) => item !== id)
				: [...config.excludedIds, id],
		});
	}

	function guestNote(player: RecallArenaPlayer) {
		const target = arenaCpSession(player, hosts, sessions);
		if (!target) {
			return (
				<span className={styles.setupHint} data-tone="bad">
					Chưa có buổi phù hợp để ghi CP cho bạn này ở lớp {classCode.get(player.classId)}.
				</span>
			);
		}
		return (
			<span className={setup.guestNote}>
				<span className={styles.setupHint}>
					Học bù · CP ghi vào lớp {classCode.get(player.classId)}, tuần {target.weekNumber}
				</span>
				{target.participationOpen ? null : (
					<ArenaCpStatus session={target} opening={openingCpId === target.id} onOpen={onOpenCp} />
				)}
			</span>
		);
	}

	return (
		<div className={setup.section}>
			<div className={setup.sectionHead}>
				<span className={setup.total}>{roster.length} bạn trong trận</span>
				<label className={setup.inline}>
					<span className={setup.inlineLabel}>Gọi ai</span>
					<select
						className={setup.select}
						value={config.filter}
						onChange={(event) =>
							onChange({ ...config, filter: event.target.value as ArenaGroupFilter })
						}
					>
						{(Object.keys(FILTER_LABEL) as ArenaGroupFilter[]).map((filter) => (
							<option key={filter} value={filter}>
								{FILTER_LABEL[filter]} ({counts[filter]})
							</option>
						))}
					</select>
				</label>
			</div>
			{noGroup > 0 && config.filter !== 'ALL' ? (
				<p className={styles.setupHint}>
					{noGroup} bạn chưa chọn nhóm chỉ được gọi khi chọn “Cả lớp”.
				</p>
			) : null}

			<div className={setup.search}>
				<label className={setup.searchLabel} htmlFor="arena-player-search">
					Thêm bạn học bù từ lớp khác
				</label>
				<input
					id="arena-player-search"
					type="search"
					className={setup.searchInput}
					placeholder="Tìm theo tên hoặc mã sinh viên"
					autoComplete="off"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
				/>
				{query.trim() ? (
					results.length ? (
						<ul className={setup.results} aria-label="Kết quả tìm sinh viên">
							{results.map((player) => (
								<li key={player.enrollmentId}>
									<button type="button" className={setup.result} onClick={() => add(player)}>
										<span>
											{fullName(player)}
											<span className={styles.setupHint}>
												{' '}
												· Lớp {classCode.get(player.classId)} · {player.studentCode}
											</span>
										</span>
										<span className={styles.smallButton}>Thêm</span>
									</button>
								</li>
							))}
						</ul>
					) : (
						<p className={styles.setupHint}>Không tìm thấy sinh viên nào khác trong môn.</p>
					)
				) : null}
			</div>

			<form className={setup.search} onSubmit={saveManual}>
				<label className={setup.searchLabel} htmlFor="arena-manual-name">
					{editingId ? 'Sửa người ngoài danh sách' : 'Thêm người không có trong danh sách'}
				</label>
				<p className={styles.setupHint}>Khách tham gia ở chế độ chơi thử.</p>
				<div className={setup.manualFields}>
					<input
						id="arena-manual-name"
						className={setup.searchInput}
						placeholder="Họ và tên"
						value={manualName}
						onChange={(event) => setManualName(event.target.value)}
						maxLength={80}
						required
					/>
					<select
						className={setup.select}
						aria-label="Nhóm của người ngoài danh sách"
						value={manualGroup}
						onChange={(event) => setManualGroup(event.target.value as ArenaGroup)}
					>
						<option value="SUPPORT">Supporting</option>
						<option value="CHALLENGE">Challenging</option>
					</select>
					<button type="submit" className={styles.smallButton} disabled={!manualName.trim()}>
						{editingId ? 'Lưu sửa' : 'Thêm vào trận'}
					</button>
					{editingId ? (
						<button
							type="button"
							className={styles.textButton}
							onClick={() => {
								setEditingId(null);
								setManualName('');
								setManualGroup('SUPPORT');
							}}
						>
							Hủy
						</button>
					) : null}
				</div>
			</form>

			<button
				type="button"
				className={styles.smallButton}
				aria-expanded={bulkOpen}
				onClick={() => setBulkOpen((open) => !open)}
			>
				Dán danh sách tên
			</button>
			{bulkOpen ? (
				<form className={setup.search} onSubmit={importNames}>
					<label className={setup.searchLabel} htmlFor="arena-bulk-names">
						Danh sách họ và tên
					</label>
					<p id="arena-bulk-help" className={styles.setupHint}>
						Mỗi dòng một tên. Có thể dùng dấu phẩy, chấm phẩy, dấu | hoặc tab. Tên khớp duy nhất với
						danh sách môn được gắn với hồ sơ sinh viên.
					</p>
					<textarea
						id="arena-bulk-names"
						className={`${setup.searchInput} ${setup.bulkInput}`}
						aria-describedby="arena-bulk-help"
						rows={4}
						value={bulkNames}
						onChange={(event) => {
							setBulkNames(event.target.value);
							setBulkStatus('');
						}}
					/>
					<div className={setup.manualFields}>
						<label className={setup.inline}>
							<span className={setup.inlineLabel}>Nhóm cho khách</span>
							<select
								className={setup.select}
								value={bulkGroup}
								onChange={(event) => setBulkGroup(event.target.value as ArenaGroup)}
							>
								<option value="SUPPORT">Supporting</option>
								<option value="CHALLENGE">Challenging</option>
							</select>
						</label>
						<button type="submit" className={styles.smallButton} disabled={!bulkNames.trim()}>
							Thêm danh sách
						</button>
					</div>
					{bulkStatus ? (
						<p className={styles.setupHint} role="status">
							{bulkStatus}
						</p>
					) : null}
				</form>
			) : null}

			{config.manualPlayers.length > 0 ? (
				<section className={setup.playerGroup} aria-label="Người ngoài danh sách">
					<h3 className={setup.groupTitle}>
						Người ngoài danh sách{' '}
						<span className={styles.count}>{config.manualPlayers.length}</span>
					</h3>
					<ul className={`${setup.playerList} ${setup.manualPlayerList}`}>
						{config.manualPlayers.map((player) => (
							<li key={player.id} className={setup.player}>
								<div className={setup.playerHead}>
									<span className={setup.playerName}>{player.name}</span>
									<span className={setup.groupTag}>{GROUP_TAG[player.group]}</span>
								</div>
								<div className={setup.manualActions}>
									<button
										type="button"
										className={styles.linkButton}
										onClick={() => editManual(player.id)}
									>
										Sửa
									</button>
									<button
										type="button"
										className={styles.linkButton}
										onClick={() => {
											onChange({
												...config,
												manualPlayers: config.manualPlayers.filter((item) => item.id !== player.id),
											});
											if (editingId === player.id) {
												setEditingId(null);
												setManualName('');
												setManualGroup('SUPPORT');
											}
										}}
									>
										Xóa
									</button>
								</div>
							</li>
						))}
					</ul>
				</section>
			) : null}

			{byClass.length === 0 && config.manualPlayers.length === 0 ? (
				<p className={styles.setupHint} data-tone="bad">
					Chưa có ai trong trận. Chọn lớp ở bước 1, điểm danh, hoặc thêm sinh viên ở ô trên.
				</p>
			) : (
				byClass.map(({ item, players }) => (
					<section key={item.id} className={setup.playerGroup} aria-label={`Lớp ${item.classCode}`}>
						<h3 className={setup.groupTitle}>
							Lớp {item.classCode}
							<span className={styles.count}>
								{players.filter((player) => inGame.has(player.enrollmentId)).length}
							</span>
						</h3>
						<ul className={setup.playerList}>
							{players.map((player) => {
								const guest = !inRoom(player);
								return (
									<li key={player.enrollmentId} className={setup.player}>
										<label className={setup.playerHead}>
											<input
												type="checkbox"
												checked={inGame.has(player.enrollmentId)}
												onChange={() => toggle(player)}
											/>
											<span className={setup.playerName}>{fullName(player)}</span>
											{player.group ? (
												<span className={setup.groupTag}>{GROUP_TAG[player.group]}</span>
											) : null}
										</label>
										{guest ? guestNote(player) : null}
									</li>
								);
							})}
						</ul>
					</section>
				))
			)}
		</div>
	);
}
