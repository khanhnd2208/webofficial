'use client';

import { useState } from 'react';

import { useT } from '@/components/i18n/LocaleProvider';
import {
	Button,
	Card,
	Checkbox,
	Field,
	Input,
	Panel,
	Select,
} from '@/components/ui';
import {
	SPY_DIFFICULTIES,
	SPY_MAX_PLAYERS,
	SPY_MIN_PLAYERS,
	SPY_TOPICS,
} from '@/config/spyGame';
import { isValidPlayerName, normalizePlayerName } from '@/lib/spy/playerName';
import { playConfirm, playTap } from '@/lib/sounds';
import type { RoomStateDTO } from '@/types/spyGame';

import PlayerNameInput from '../PlayerNameInput';
import PlayerList from '../PlayerList';
import QrInvite from '../QrInvite';

interface Props {
	state: RoomStateDTO;
	onReady: (ready: boolean) => void;
	onStart: () => void;
	onSettings: (settings: Record<string, unknown>) => void;
	onRename?: (name: string) => void;
	onKick?: (targetToken: string) => void;
	busy?: boolean;
}

function getStartBlockReason(
	state: RoomStateDTO,
	t: (key: string, params?: Record<string, string | number>) => string,
): string | null {
	if (state.playerCount < SPY_MIN_PLAYERS) {
		return t('spy.lobby.needPlayers', { min: SPY_MIN_PLAYERS });
	}
	if (!state.players.every((p) => p.isReady)) {
		return t('spy.lobby.waitReady');
	}
	if (!state.players.every((p) => p.connected)) {
		return t('spy.lobby.waitConnect');
	}
	return null;
}

export default function LobbyPhase({
	state,
	onReady,
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
	const canStart = state.isHost && getStartBlockReason(state, t) === null;
	const blockReason = state.isHost ? getStartBlockReason(state, t) : null;

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

	return (
		<div className="space-y-6 lg:grid lg:grid-cols-[1fr_minmax(280px,360px)] lg:items-start lg:gap-8">
			<div className="space-y-6">
				<QrInvite code={state.code} roomName={state.name} />

				{state.self ? (
					<Card className="space-y-3">
						<div className="flex items-center justify-between gap-2">
							<p className="text-sm font-medium text-foreground">{t('spy.lobby.profile')}</p>
							{!editingName ? (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => {
										setDraftName(state.self!.name);
										setRenameError(null);
										setEditingName(true);
									}}
								>
									{t('spy.lobby.rename')}
								</Button>
							) : null}
						</div>
						{editingName ? (
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
									<Button type="submit" size="sm" loading={busy}>
										{t('spy.lobby.saveName')}
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="sm"
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
						) : (
							<p className="text-lg font-semibold text-ink">{state.self.name}</p>
						)}
					</Card>
				) : null}

				<Panel
					title={t('spy.lobby.crew', { count: state.playerCount, max: state.maxPlayers })}
					description={t('spy.lobby.crewHint')}
				>
					<PlayerList
						players={state.players}
						showReady
						onKick={
							state.isHost && onKick
								? (token) => {
										const name =
											state.players.find((p) => p.token === token)?.name ?? '?';
										if (window.confirm(t('spy.lobby.kickConfirm', { name }))) {
											onKick(token);
										}
									}
								: undefined
						}
					/>
				</Panel>

				{state.self ? (
					<Button
						fullWidth
						variant={state.self.isReady ? 'secondary' : 'primary'}
						loading={busy}
						onClick={() => {
							playTap();
							onReady(!state.self!.isReady);
						}}
					>
						{state.self.isReady ? t('spy.lobby.unready') : t('spy.lobby.ready')}
					</Button>
				) : null}

				{!state.isHost ? (
					<p className="text-center text-sm text-muted">{t('spy.lobby.waitHost')}</p>
				) : null}
			</div>

			{state.isHost ? (
				<div className="space-y-4 lg:sticky lg:top-6">
					<Button
						fullWidth
						variant="success"
						disabled={!canStart}
						loading={busy}
						onClick={() => {
							playConfirm();
							onStart();
						}}
					>
						{t('spy.lobby.start')}
					</Button>
					{blockReason ? (
						<p className="text-center text-xs text-muted">{blockReason}</p>
					) : null}
					<Button
						variant="ghost"
						size="sm"
						fullWidth
						onClick={() => setShowSettings(!showSettings)}
					>
						{showSettings ? t('spy.lobby.hideSettings') : t('spy.lobby.settings')}
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
							<Field label={t('spy.lobby.maxPlayers')}>
								<Select
									defaultValue={state.maxPlayers}
									onChange={(e) => onSettings({ maxPlayers: Number(e.target.value) })}
								>
									{Array.from({ length: SPY_MAX_PLAYERS - SPY_MIN_PLAYERS + 1 }, (_, i) => {
										const n = SPY_MIN_PLAYERS + i;
										return (
											<option key={n} value={n}>
												{n}
											</option>
										);
									})}
								</Select>
							</Field>
							<Field label={t('spy.lobby.topic')}>
								<Select
									defaultValue={state.topic}
									onChange={(e) => onSettings({ topic: e.target.value })}
								>
									<option value="any">{t('spy.lobby.topicAny')}</option>
									{SPY_TOPICS.map((topic) => (
										<option key={topic} value={topic}>
											{t(`spy.topics.${topic}`)}
										</option>
									))}
								</Select>
							</Field>
							<Field label={t('spy.lobby.difficulty')}>
								<Select
									defaultValue={state.difficulty}
									onChange={(e) => onSettings({ difficulty: e.target.value })}
								>
									{SPY_DIFFICULTIES.map((d) => (
										<option key={d} value={d}>
											{t(`spy.difficulty.${d}`)}
										</option>
									))}
								</Select>
							</Field>
							<Checkbox
								label={t('spy.lobby.publicRoom')}
								defaultChecked={state.isPublic}
								onChange={(e) => onSettings({ isPublic: e.target.checked })}
							/>
							<Checkbox
								label={t('spy.lobby.questionHints')}
								defaultChecked={state.showQuestionHints}
								onChange={(e) => onSettings({ showQuestionHints: e.target.checked })}
							/>
							<Checkbox
								label={t('spy.lobby.hideRoles')}
								defaultChecked={state.hideRoles}
								onChange={(e) => onSettings({ hideRoles: e.target.checked })}
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
	);
}
