'use client';

import { useState } from 'react';

import { useT } from '@/features/spy-fall/components/i18n/LocaleProvider';
import {
	Button,
	Card,
	Checkbox,
	Field,
	Input,
	Panel,
	Select,
} from '@/features/spy-fall/components/ui';
import {
	SPY_COUNTS,
	SPY_MAX_PLAYERS,
	SPY_MIN_PLAYERS,
	minPlayersForSpies,
} from '@/features/spy-fall/config/spyGame';
import { isValidPlayerName, normalizePlayerName } from '@/features/spy-fall/lib/spy/playerName';
import { playConfirm } from '@/features/spy-fall/lib/sounds';
import type { RoomStateDTO } from '@/features/spy-fall/types/spyGame';

import ActionBar, { ActionBarNote } from '../ActionBar';
import PlayerNameInput from '../PlayerNameInput';
import PlayerList from '../PlayerList';
import QrInvite from '../QrInvite';
import StepGuide from '../StepGuide';
import WordFilterSettings from '../WordFilterSettings';
import GameIcon from '@/features/spy-fall/components/ui/GameIcon';

interface Props {
	state: RoomStateDTO;
	onStart: () => void;
	onSettings: (settings: Record<string, unknown>) => void;
	onRename?: (name: string) => void;
	onKick?: (targetToken: string) => void;
	busy?: boolean;
}

export default function LobbyPhase({
	state,
	onStart,
	onSettings,
	onRename,
	onKick,
	busy,
}: Props) {
	const t = useT();
	const [showSettings, setShowSettings] = useState(false);
	const [editingName, setEditingName] = useState(false);
	const [draftName, setDraftName] = useState(state.self?.name ?? '');
	const [renameError, setRenameError] = useState<string | null>(null);
	const minPlayers = minPlayersForSpies(state.spyCount);
	const missing = Math.max(0, minPlayers - state.playerCount);

	function handleRenameSubmit(e: React.FormEvent) {
		e.preventDefault();
		const normalized = normalizePlayerName(draftName);
		if (!isValidPlayerName(normalized)) {
			setRenameError(t('spy.lobby.nameInvalid'));
			return;
		}
		if (normalized === state.self?.name) {
			setEditingName(false);
			setRenameError(null);
			return;
		}
		setRenameError(null);
		onRename?.(normalized);
		setEditingName(false);
	}

	const crew = (
		<Panel
			title={t('spy.lobby.crew', { count: state.playerCount, max: state.maxPlayers })}
			description={
				missing > 0 ? t('spy.lobby.needMore', { count: missing }) : t('spy.lobby.crewReady')
			}
		>
			<PlayerList
				players={state.players}
				selfToken={state.self?.token}
				onKick={
					state.isHost && onKick
						? (token) => {
								const name = state.players.find((p) => p.token === token)?.name ?? '?';
								if (window.confirm(t('spy.lobby.kickConfirm', { name }))) {
									onKick(token);
								}
							}
						: undefined
				}
			/>
			{state.self && !editingName ? (
				<button
					type="button"
					className="min-h-9 text-sm font-medium text-accent underline-offset-2 hover:underline"
					onClick={() => {
						setDraftName(state.self!.name);
						setRenameError(null);
						setEditingName(true);
					}}
				>
					{t('spy.lobby.rename')}
				</button>
			) : null}
			{editingName ? (
				<Card>
					<form onSubmit={handleRenameSubmit} className="space-y-3">
						<Field label={t('spy.menu.yourName')} htmlFor="lobby-rename" error={renameError}>
							<PlayerNameInput
								id="lobby-rename"
								value={draftName}
								onChange={(e) => {
									setDraftName(e.target.value);
									if (renameError) setRenameError(null);
								}}
								maxLength={24}
								autoFocus
								error={Boolean(renameError)}
							/>
						</Field>
						<div className="flex gap-2">
							<Button type="submit" size="md" loading={busy}>
								{t('spy.lobby.saveName')}
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="md"
								onClick={() => {
									setEditingName(false);
									setRenameError(null);
									setDraftName(state.self!.name);
								}}
							>
								{t('spy.lobby.cancel')}
							</Button>
						</div>
					</form>
				</Card>
			) : null}
		</Panel>
	);

	const invite = <QrInvite code={state.code} roomName={state.name} />;

	const rules = (
		<Card className="space-y-2 text-sm">
			<h2 className="text-xs font-bold uppercase tracking-wider text-muted">
				{t('spy.lobby.rulesTitle')}
			</h2>
			<ul className="space-y-1.5">
				<li className="flex items-start gap-2">
					<GameIcon name="target" size={15} className="mt-0.5 shrink-0 text-accent" />
					<span>
						{state.spyCount > 1
							? t('spy.lobby.ruleManySpies', { count: state.spyCount })
							: t('spy.lobby.ruleOneSpy')}
					</span>
				</li>
				<li className="flex items-start gap-2">
					<GameIcon name={state.revealRoles ? 'eye' : 'lock'} size={15} className="mt-0.5 shrink-0 text-accent" />
					<span>
						{t(state.revealRoles ? 'spy.lobby.ruleRolesShown' : 'spy.lobby.ruleRolesHidden')}
					</span>
				</li>
			</ul>
		</Card>
	);

	return (
		<>
			<div className="space-y-6 lg:grid lg:grid-cols-[1fr_minmax(280px,360px)] lg:items-start lg:gap-8 lg:space-y-0">
				<div className="space-y-6">
					<StepGuide stepsKey={state.isHost ? 'spy.steps.lobbyHost' : 'spy.steps.lobbyGuest'} />
					{rules}
					{state.isHost ? (
						<>
							{invite}
							{crew}
						</>
					) : (
						<>
							{crew}
							{invite}
						</>
					)}
				</div>

				{state.isHost ? (
					<div className="space-y-3 lg:sticky lg:top-28">
						<Button
							variant="secondary"
							size="md"
							fullWidth
							aria-expanded={showSettings}
							onClick={() => setShowSettings(!showSettings)}
						>
											<GameIcon name="settings" size={16} /> {showSettings ? t('spy.lobby.hideSettings') : t('spy.lobby.settings')}
						</Button>
						{showSettings ? (
							<Card className="space-y-4 text-sm">
								<Field label={t('spy.lobby.roomName')} htmlFor="settings-name">
									<Input
										id="settings-name"
										defaultValue={state.name}
										onBlur={(e) => onSettings({ name: e.target.value })}
									/>
								</Field>
								<Field label={t('spy.lobby.maxPlayers')} htmlFor="settings-max-players">
									<Select
										id="settings-max-players"
										defaultValue={state.maxPlayers}
										onChange={(e) => onSettings({ maxPlayers: Number(e.target.value) })}
									>
										{Array.from({ length: SPY_MAX_PLAYERS - SPY_MIN_PLAYERS + 1 }, (_, i) => {
											const n = SPY_MIN_PLAYERS + i;
											return (
												<option key={n} value={n} disabled={n < minPlayers}>
													{n}
												</option>
											);
										})}
									</Select>
								</Field>
								<Field
									label={t('spy.lobby.spyCount')}
									htmlFor="settings-spy-count"
									hint={
										state.spyCount > 1
											? t('spy.lobby.spyCountHintMany', { count: state.spyCount, min: minPlayers })
											: t('spy.lobby.spyCountHintOne')
									}
								>
									<Select
										id="settings-spy-count"
										defaultValue={state.spyCount}
										onChange={(e) => onSettings({ spyCount: Number(e.target.value) })}
									>
										{SPY_COUNTS.map((count) => {
											const min = minPlayersForSpies(count);
											const fits = state.maxPlayers >= min;
											return (
												<option key={count} value={count} disabled={!fits}>
													{fits
														? t('spy.lobby.spyCountOption', { count })
														: t('spy.lobby.spyCountNeedRoom', { count, min })}
												</option>
											);
										})}
									</Select>
								</Field>
								<div className="space-y-1">
									<Checkbox
										id="settings-reveal-roles"
										label={t('spy.lobby.revealRoles')}
										defaultChecked={state.revealRoles}
										onChange={(e) => onSettings({ revealRoles: e.target.checked })}
									/>
									<p className="pl-8 text-xs text-muted">{t('spy.lobby.revealRolesHint')}</p>
								</div>
								<WordFilterSettings
									topic={state.topic}
									excludedTags={state.excludedTags ?? []}
									onChange={onSettings}
								/>
								<Checkbox
									label={t('spy.lobby.publicRoom')}
									defaultChecked={state.isPublic}
									onChange={(e) => onSettings({ isPublic: e.target.checked })}
								/>
								<Checkbox
									label={t('spy.lobby.playtest')}
									defaultChecked={state.playtestMode}
									onChange={(e) => onSettings({ playtestMode: e.target.checked })}
								/>
							</Card>
						) : null}
					</div>
				) : null}
			</div>

			<ActionBar>
				{state.isHost ? (
					<Button
						fullWidth
						variant="success"
						disabled={missing > 0}
						loading={busy}
						onClick={() => {
							playConfirm();
							onStart();
						}}
					>
						{missing > 0
							? t('spy.lobby.needMore', { count: missing })
							: t('spy.lobby.startWith', { count: state.playerCount })}
					</Button>
				) : (
					<ActionBarNote>{t('spy.lobby.waitHost')}</ActionBarNote>
				)}
			</ActionBar>
		</>
	);
}
