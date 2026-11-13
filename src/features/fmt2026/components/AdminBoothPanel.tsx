'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { AdminBadge, AdminButton, AdminStat } from '@/components/admin/AdminPrimitives';
import styles from '@/components/admin/AdminStudio.module.css';

import { PRIZE_TIERS, type PrizeTier } from '../domain/drawPool';
import type { AdminOverview, AdminPrize } from '../types';
import { boothEndpoints, boothFetch } from './boothApi';

const REFRESH_MS = 10_000;

const TIER_LABEL: Record<PrizeTier, string> = {
	common: 'Thường',
	rare: 'Hiếm',
	epic: 'Đặc biệt',
};

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
	timeZone: 'Asia/Ho_Chi_Minh',
	day: '2-digit',
	month: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
});

type Notice = { tone: 'success' | 'danger'; text: string } | null;

export function AdminBoothPanel({ initial }: { initial: AdminOverview }) {
	const [overview, setOverview] = useState(initial);
	const [notice, setNotice] = useState<Notice>(null);
	const [busy, setBusy] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		try {
			setOverview(await boothFetch<AdminOverview>(boothEndpoints.admin));
		} catch {
			// Keep the last good numbers; the next tick retries.
		}
	}, []);

	useEffect(() => {
		const timer = window.setInterval(() => void refresh(), REFRESH_MS);
		return () => window.clearInterval(timer);
	}, [refresh]);

	async function run(key: string, action: () => Promise<unknown>, success: string) {
		setBusy(key);
		setNotice(null);
		try {
			await action();
			await refresh();
			setNotice({ tone: 'success', text: success });
		} catch (error) {
			setNotice({ tone: 'danger', text: error instanceof Error ? error.message : 'Có lỗi xảy ra' });
		} finally {
			setBusy(null);
		}
	}

	const patchSettings = (body: Record<string, unknown>) =>
		boothFetch(boothEndpoints.adminSettings, { method: 'PATCH', body: JSON.stringify(body) });

	const shortfall = overview.prizesLeft - (overview.settings.totalSpins - overview.spinsUsed);

	return (
		<div className="mt-6 grid gap-8">
			<section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Tổng quan">
				<AdminStat
					label="Trạng thái"
					value={overview.settings.isOpen ? 'Đang mở' : 'Đang đóng'}
					note={overview.settings.hasPin ? 'Đã đặt PIN' : 'Chưa đặt PIN'}
				/>
				<AdminStat
					label="Đã quay"
					value={`${overview.spinsUsed}/${overview.settings.totalSpins}`}
					note="Lượt đã dùng / tổng lượt"
				/>
				<AdminStat label="Quà còn" value={String(overview.prizesLeft)} note="Tổng các món quà" />
				<AdminStat
					label="Chúc may mắn còn"
					value={String(overview.luckLeft)}
					note={`Còn ${overview.spinsLeft} lượt quay`}
				/>
			</section>

			{notice && (
				<p role="status" className={`${styles.panel} text-sm`}>
					<AdminBadge tone={notice.tone}>{notice.tone === 'success' ? 'Xong' : 'Lỗi'}</AdminBadge>{' '}
					{notice.text}
				</p>
			)}

			<SettingsForm
				key={overview.settings.totalSpins}
				overview={overview}
				busy={busy}
				shortfall={shortfall}
				onToggle={() =>
					run(
						'open',
						() => patchSettings({ isOpen: !overview.settings.isOpen }),
						overview.settings.isOpen ? 'Đã đóng quầy quà' : 'Đã mở quầy quà',
					)
				}
				onTotal={(totalSpins) =>
					run('total', () => patchSettings({ totalSpins }), 'Đã lưu tổng lượt')
				}
				onPin={(pin) =>
					run('pin', () => patchSettings({ pin }), 'Đã đổi PIN; máy cũ phải nhập lại')
				}
			/>

			<section>
				<h2 className={styles.sectionTitle}>Kho quà</h2>
				<p className="mt-1 text-sm text-muted">
					Sửa số lượng bất cứ lúc nào, kể cả khi đang quay. Món bị tắt sẽ không được rút.
				</p>
				<div className={`${styles.tableWrap} mt-4`}>
					<table className={`${styles.table} ${styles.tableWide}`}>
						<thead>
							<tr>
								<th>Tên quà</th>
								<th>Còn lại</th>
								<th>Độ hiếm</th>
								<th>Bật</th>
								<th aria-label="Lưu" />
							</tr>
						</thead>
						<tbody>
							{overview.prizes.map((prize) => (
								<PrizeRow
									key={`${prize.id}:${prize.remaining}:${prize.name}:${prize.tier}:${prize.isActive}`}
									prize={prize}
									busy={busy === prize.id}
									onSave={(body) =>
										run(
											prize.id,
											() =>
												boothFetch(boothEndpoints.adminPrize(prize.id), {
													method: 'PATCH',
													body: JSON.stringify(body),
												}),
											`Đã lưu ${body.name ?? prize.name}`,
										)
									}
								/>
							))}
						</tbody>
					</table>
				</div>
				<NewPrizeForm
					busy={busy === 'new'}
					onCreate={(body) =>
						run(
							'new',
							() =>
								boothFetch(boothEndpoints.adminPrizes, {
									method: 'POST',
									body: JSON.stringify(body),
								}),
							`Đã thêm ${body.name}`,
						)
					}
				/>
			</section>

			<section>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<h2 className={styles.sectionTitle}>Lịch sử lượt quay</h2>
					<AdminButton
						tone="danger"
						pending={busy === 'void'}
						disabled={overview.spinsUsed === 0}
						onClick={() => {
							if (!window.confirm('Hoàn tác lượt quay gần nhất và trả quà về kho?')) return;
							void run(
								'void',
								() => boothFetch(boothEndpoints.adminVoid, { method: 'POST' }),
								'Đã hoàn tác lượt gần nhất',
							);
						}}
					>
						Hoàn tác lượt cuối
					</AdminButton>
				</div>
				{overview.draws.length === 0 ? (
					<p className="mt-3 text-sm text-muted">Chưa có lượt quay nào.</p>
				) : (
					<div className={`${styles.tableWrap} mt-4`}>
						<table className={`${styles.table} ${styles.tableMedium}`}>
							<thead>
								<tr>
									<th>Thời gian</th>
									<th>Kết quả</th>
									<th>Ghi chú</th>
								</tr>
							</thead>
							<tbody>
								{overview.draws.map((draw) => (
									<tr key={draw.id}>
										<td>{timeFormatter.format(new Date(draw.createdAt))}</td>
										<td>{draw.voidedAt ? <s>{draw.prizeName}</s> : draw.prizeName}</td>
										<td>
											{draw.voidedAt ? (
												<AdminBadge tone="warning">Đã hoàn tác</AdminBadge>
											) : draw.isLuck ? (
												<AdminBadge>May mắn</AdminBadge>
											) : (
												<AdminBadge tone="success">Trúng quà</AdminBadge>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>
		</div>
	);
}

function SettingsForm({
	overview,
	busy,
	shortfall,
	onToggle,
	onTotal,
	onPin,
}: {
	overview: AdminOverview;
	busy: string | null;
	shortfall: number;
	onToggle: () => void;
	onTotal: (totalSpins: number) => void;
	onPin: (pin: string) => void;
}) {
	const [total, setTotal] = useState(String(overview.settings.totalSpins));
	const [pin, setPin] = useState('');

	function submitTotal(event: FormEvent) {
		event.preventDefault();
		const value = Number(total);
		if (Number.isInteger(value) && value >= 0) onTotal(value);
	}

	function submitPin(event: FormEvent) {
		event.preventDefault();
		if (/^\d{4,12}$/.test(pin)) {
			onPin(pin);
			setPin('');
		}
	}

	return (
		<section className="grid gap-4 lg:grid-cols-3">
			<div className={styles.panel}>
				<p className={styles.meta}>Quầy quà</p>
				<p className="mt-2 text-sm">
					{overview.settings.isOpen
						? 'Máy ở booth đang quay được.'
						: 'Đóng: máy ở booth chỉ xem, không quay được.'}
				</p>
				<AdminButton
					className="mt-4"
					tone={overview.settings.isOpen ? 'danger' : 'primary'}
					pending={busy === 'open'}
					onClick={onToggle}
				>
					{overview.settings.isOpen ? 'Đóng quầy' : 'Mở quầy'}
				</AdminButton>
			</div>

			<form className={styles.panel} onSubmit={submitTotal}>
				<label className={styles.field}>
					Tổng lượt quay
					<input
						className={styles.control}
						type="number"
						min={0}
						inputMode="numeric"
						value={total}
						onChange={(event) => setTotal(event.target.value)}
					/>
				</label>
				<p className="mt-2 text-xs text-muted">
					Ô &ldquo;Chúc may mắn&rdquo; = tổng lượt − đã quay − quà còn.
				</p>
				{shortfall > 0 && (
					<p className="mt-2 text-xs font-semibold text-[var(--error)]">
						Quà nhiều hơn số lượt còn lại {shortfall} món: sẽ không có ô Chúc may mắn.
					</p>
				)}
				<AdminButton className="mt-3" tone="secondary" pending={busy === 'total'} type="submit">
					Lưu tổng lượt
				</AdminButton>
			</form>

			<form className={styles.panel} onSubmit={submitPin}>
				<label className={styles.field}>
					{overview.settings.hasPin ? 'Đổi mã PIN' : 'Đặt mã PIN'}
					<input
						className={styles.control}
						type="password"
						inputMode="numeric"
						autoComplete="new-password"
						placeholder="4–12 chữ số"
						value={pin}
						onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 12))}
					/>
				</label>
				<p className="mt-2 text-xs text-muted">Máy ở booth nhập PIN này một lần để mở khóa.</p>
				<AdminButton
					className="mt-3"
					tone="secondary"
					pending={busy === 'pin'}
					disabled={!/^\d{4,12}$/.test(pin)}
					type="submit"
				>
					Lưu PIN
				</AdminButton>
			</form>
		</section>
	);
}

type PrizePatch = Partial<Pick<AdminPrize, 'name' | 'remaining' | 'tier' | 'isActive'>>;

function PrizeRow({
	prize,
	busy,
	onSave,
}: {
	prize: AdminPrize;
	busy: boolean;
	onSave: (body: PrizePatch) => void;
}) {
	const [name, setName] = useState(prize.name);
	const [remaining, setRemaining] = useState(String(prize.remaining));
	const [tier, setTier] = useState<PrizeTier>(prize.tier);
	const [isActive, setIsActive] = useState(prize.isActive);

	const count = Number(remaining);
	const valid = name.trim().length > 0 && Number.isInteger(count) && count >= 0;
	const dirty =
		name !== prize.name ||
		count !== prize.remaining ||
		tier !== prize.tier ||
		isActive !== prize.isActive;

	function save() {
		const body: PrizePatch = {};
		if (name !== prize.name) body.name = name.trim();
		if (count !== prize.remaining) body.remaining = count;
		if (tier !== prize.tier) body.tier = tier;
		if (isActive !== prize.isActive) body.isActive = isActive;
		onSave(body);
	}

	return (
		<tr>
			<td>
				<input
					className={styles.control}
					aria-label="Tên quà"
					value={name}
					onChange={(event) => setName(event.target.value)}
				/>
			</td>
			<td>
				<div className="flex items-center gap-2">
					<AdminButton
						tone="quiet"
						aria-label={`Bớt 1 ${prize.name}`}
						disabled={busy || prize.remaining === 0}
						onClick={() => onSave({ remaining: prize.remaining - 1 })}
					>
						−
					</AdminButton>
					<input
						className={`${styles.control} w-20 text-center`}
						aria-label={`Số ${prize.name} còn lại`}
						type="number"
						min={0}
						inputMode="numeric"
						value={remaining}
						onChange={(event) => setRemaining(event.target.value)}
					/>
					<AdminButton
						tone="quiet"
						aria-label={`Thêm 1 ${prize.name}`}
						disabled={busy}
						onClick={() => onSave({ remaining: prize.remaining + 1 })}
					>
						+
					</AdminButton>
				</div>
			</td>
			<td>
				<select
					className={styles.control}
					aria-label="Độ hiếm"
					value={tier}
					onChange={(event) => setTier(event.target.value as PrizeTier)}
				>
					{PRIZE_TIERS.map((value) => (
						<option key={value} value={value}>
							{TIER_LABEL[value]}
						</option>
					))}
				</select>
			</td>
			<td>
				<input
					type="checkbox"
					className="h-5 w-5"
					aria-label={`Bật ${prize.name}`}
					checked={isActive}
					onChange={(event) => setIsActive(event.target.checked)}
				/>
			</td>
			<td>
				<AdminButton tone="primary" pending={busy} disabled={!dirty || !valid} onClick={save}>
					Lưu
				</AdminButton>
			</td>
		</tr>
	);
}

function NewPrizeForm({
	busy,
	onCreate,
}: {
	busy: boolean;
	onCreate: (body: { name: string; remaining: number; tier: PrizeTier }) => void;
}) {
	const [name, setName] = useState('');
	const [remaining, setRemaining] = useState('1');
	const [tier, setTier] = useState<PrizeTier>('common');
	const count = Number(remaining);
	const valid = name.trim().length > 0 && Number.isInteger(count) && count >= 0;

	function submit(event: FormEvent) {
		event.preventDefault();
		if (!valid) return;
		onCreate({ name: name.trim(), remaining: count, tier });
		setName('');
		setRemaining('1');
	}

	return (
		<form className={`${styles.toolbar} mt-4`} onSubmit={submit}>
			<label className={styles.field}>
				Thêm món quà
				<input
					className={styles.control}
					placeholder="Ví dụ: Móc khóa FMT"
					value={name}
					onChange={(event) => setName(event.target.value)}
				/>
			</label>
			<label className={styles.field}>
				Số lượng
				<input
					className={`${styles.control} w-24`}
					type="number"
					min={0}
					value={remaining}
					onChange={(event) => setRemaining(event.target.value)}
				/>
			</label>
			<label className={styles.field}>
				Độ hiếm
				<select
					className={styles.control}
					value={tier}
					onChange={(event) => setTier(event.target.value as PrizeTier)}
				>
					{PRIZE_TIERS.map((value) => (
						<option key={value} value={value}>
							{TIER_LABEL[value]}
						</option>
					))}
				</select>
			</label>
			<AdminButton tone="secondary" pending={busy} disabled={!valid} type="submit">
				Thêm
			</AdminButton>
		</form>
	);
}
