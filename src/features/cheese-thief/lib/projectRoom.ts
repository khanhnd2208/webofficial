import {
	CHEESE_HOUR_SECONDS_DEFAULT,
	CHEESE_SECRET_MAX_MS,
	followersAreCustom,
	resolveFollowers,
	type CheeseMode,
	type CheesePhase,
	type FollowerKnows,
	type FollowerSettings,
	type NightNumber,
	type TablePreset,
} from '@/features/cheese-thief/config/cheeseThief';
import {
	cardIsEmpty,
	hoursInNight,
	secretCardFor,
	secretJobFor,
	theftHourOf,
	wakeHoursOf,
	type CheeseRole,
	type NightContext,
	type ResolvedSecret,
	type Seat,
} from '@/features/cheese-thief/lib/rules';
import type {
	PlayerPublicDTO,
	PlayerSelfDTO,
	RevealRowDTO,
	RoomStateDTO,
} from '@/features/cheese-thief/types';

export interface ProjectPlayer {
	token: string;
	id: string;
	name: string;
	avatarSeed: string;
	connected: boolean;
	role?: CheeseRole;
	dice: number[];
	dice2?: number[];
	chosenHour?: number;
	hasMemorizedRole: boolean;
	hasChosenSecret?: boolean;
	hasSeenSecret: boolean;
	voteId?: string;
}

export interface ProjectRoom {
	code: string;
	name: string;
	phase: CheesePhase;
	version: number;
	isPublic: boolean;
	maxPlayers: number;
	scapegoatEnabled: boolean;
	mode?: CheeseMode;
	followerCount?: number;
	followerKnowledge?: FollowerKnows;
	hourSeconds?: number;
	nightNumber?: NightNumber;
	theftNight?: NightNumber;
	voteRound?: number;
	hostToken: string;
	nightStartedAt?: Date;
	secretStartedAt?: Date;
	dayStartedAt?: Date;
	choiceCount: number;
	isRunoff: boolean;
	voteCandidateIds: string[];
	flippedIds: string[];
	followerIds: string[];
	winner?: RoomStateDTO['winner'];
	resolved?: ResolvedSecret;
	preset?: TablePreset;
	players: ProjectPlayer[];
}

function seatsOf(room: ProjectRoom): Seat[] {
	return room.players.map((player) => ({
		id: player.id,
		role: player.role ?? 'sleepyhead',
		dice: player.dice,
		...(player.dice2 ? { dice2: player.dice2 } : {}),
		...(player.chosenHour !== undefined ? { chosenHour: player.chosenHour } : {}),
	}));
}

function nightContextOf(room: ProjectRoom): NightContext {
	return { mode: room.mode ?? 'classic', theftNight: room.theftNight ?? 1 };
}

function namesOf(room: ProjectRoom): Map<string, string> {
	return new Map(room.players.map((player) => [player.id, player.name]));
}

/**
 * Private facts stay on `self`, and only in the phase that needs them.
 * Before reveal, player X's payload has nobody else's role, hour, or secret card.
 */
export function projectRoom(room: ProjectRoom, viewerToken: string | null, at: Date): RoomStateDTO {
	const viewer = viewerToken ? room.players.find((player) => player.token === viewerToken) : undefined;
	const reveal = room.phase === 'reveal';
	const deal = room.phase === 'deal';
	const secretResult = room.phase === 'secret-result';
	const voting = room.phase === 'vote';
	const seats = room.preset ? seatsOf(room) : [];
	const names = namesOf(room);
	const resolved = room.resolved ?? { followerIds: room.followerIds, peekByPlayer: {}, hunchByPlayer: {} };
	const mode = room.mode ?? 'classic';
	const ctx = nightContextOf(room);
	const night2Played = mode === 'two-night' && room.theftNight === 2;

	const players: PlayerPublicDTO[] = room.players.map((player) => {
		const row: PlayerPublicDTO = {
			id: player.id,
			name: player.name,
			avatarSeed: player.avatarSeed,
			connected: player.connected,
			isHost: player.token === room.hostToken,
		};
		if (deal) row.hasMemorizedRole = player.hasMemorizedRole;
		if (reveal && player.role && room.preset) {
			row.role = player.role;
			row.wakeHours = wakeHoursOf(
				{ id: player.id, role: player.role, dice: player.dice, chosenHour: player.chosenHour },
				room.preset.dicePerPlayer,
			);
			const hunch = resolved.hunchByPlayer[player.id];
			row.hunchCorrect = hunch ? seats.find((seat) => seat.id === hunch)?.role === 'thief' : null;
		}
		return row;
	});

	let secretCard: PlayerSelfDTO['secretCard'];
	if (secretResult && viewer && room.preset && viewer.role) {
		const card = secretCardFor(viewer.id, seats, names, room.preset, resolved, ctx);
		secretCard = cardIsEmpty(card) ? { peek: null, allies: null, recruited: null } : card;
	}
	const secretJob =
		room.phase === 'secret' && viewer && room.preset && viewer.role
			? secretJobFor(
					seats.find((seat) => seat.id === viewer.id) ?? {
						id: viewer.id,
						role: viewer.role,
						dice: viewer.dice,
						dice2: viewer.dice2,
					},
					seats,
					room.preset,
					ctx,
				)
			: undefined;

	const self: PlayerSelfDTO | null = viewer
		? {
				id: viewer.id,
				token: viewer.token,
				name: viewer.name,
				avatarSeed: viewer.avatarSeed,
				isHost: viewer.token === room.hostToken,
				hasMemorizedRole: viewer.hasMemorizedRole,
				hasSeenSecret: viewer.hasSeenSecret,
				...(deal && viewer.role
					? {
							role: viewer.role,
							dice: viewer.dice,
							wakeHours: room.preset
								? wakeHoursOf(
										{
											id: viewer.id,
											role: viewer.role,
											dice: viewer.dice,
											dice2: viewer.dice2,
											chosenHour: viewer.chosenHour,
										},
										room.preset.dicePerPlayer,
									)
								: [],
							...(mode === 'two-night' && room.preset
								? {
										wakeHours2: hoursInNight(
											{
												id: viewer.id,
												role: viewer.role,
												dice: viewer.dice,
												dice2: viewer.dice2,
											},
											2,
											room.preset.dicePerPlayer,
										),
									}
								: {}),
						}
					: {}),
				...(secretJob ? { secretJob: { followers: secretJob.followers?.count ?? 0, peek: secretJob.peek } } : {}),
				...(room.phase === 'secret' ? { hasChosenSecret: Boolean(viewer.hasChosenSecret) } : {}),
				...(voting ? { voteId: viewer.voteId ?? null } : {}),
				...(secretCard ? { secretCard } : {}),
			}
		: null;

	const followerSettings: FollowerSettings = {
		...(room.followerCount !== undefined ? { count: room.followerCount } : {}),
		...(room.followerKnowledge ? { knowledge: room.followerKnowledge } : {}),
	};
	const resolvedFollowers = resolveFollowers(room.maxPlayers, followerSettings);
	const dto: RoomStateDTO = {
		code: room.code,
		name: room.name,
		phase: room.phase,
		version: room.version,
		serverNow: at.toISOString(),
		isHost: viewerToken === room.hostToken,
		isPublic: room.isPublic,
		maxPlayers: room.maxPlayers,
		scapegoatEnabled: room.scapegoatEnabled,
		mode,
		followers: { ...resolvedFollowers, customized: followersAreCustom(resolvedFollowers) },
		hourSeconds: room.hourSeconds ?? CHEESE_HOUR_SECONDS_DEFAULT,
		playerCount: room.players.length,
		players,
		self,
	};

	if ((room.phase === 'night' || room.phase === 'cheese-check') && room.nightNumber) {
		dto.nightNumber = room.nightNumber;
	}
	if (room.phase === 'night' && room.nightStartedAt) {
		dto.nightStartedAt = room.nightStartedAt.toISOString();
	}
	if (mode === 'two-night' && room.theftNight && !['lobby', 'deal', 'night', 'cheese-check'].includes(room.phase)) {
		dto.theftNight = room.theftNight;
	}
	if (room.phase === 'day' && room.dayStartedAt) {
		dto.dayStartedAt = room.dayStartedAt.toISOString();
	}
	if (room.phase === 'secret') {
		dto.choiceCount = room.choiceCount;
		if (room.secretStartedAt) {
			dto.secretEndsAt = new Date(room.secretStartedAt.getTime() + CHEESE_SECRET_MAX_MS).toISOString();
		}
	}
	if (voting || room.phase === 'tie') {
		dto.voteRound = room.voteRound ?? 1;
		dto.isRunoff = room.isRunoff || room.phase === 'tie';
		dto.voteCandidateIds =
			room.isRunoff || room.phase === 'tie' ? room.voteCandidateIds : room.players.map((player) => player.id);
		if (voting) dto.votesCast = room.players.filter((player) => player.voteId).length;
	}
	if (reveal && room.preset) {
		dto.flippedIds = room.flippedIds;
		dto.followerIds = room.followerIds;
		dto.winner = room.winner;
		const thief = seats.find((seat) => seat.role === 'thief');
		if (thief) dto.theftHour = theftHourOf(thief, room.preset.dicePerPlayer, room.theftNight ?? 1);
		dto.roster = room.players.map((player): RevealRowDTO => {
			const role = player.role ?? 'sleepyhead';
			const hunch = resolved.hunchByPlayer[player.id];
			return {
				id: player.id,
				name: player.name,
				role,
				wakeHours: wakeHoursOf(
					{ id: player.id, role, dice: player.dice, dice2: player.dice2, chosenHour: player.chosenHour },
					room.preset!.dicePerPlayer,
				),
				wakeHours2: night2Played
					? hoursInNight(
							{ id: player.id, role, dice: player.dice, dice2: player.dice2 },
							2,
							room.preset!.dicePerPlayer,
						)
					: null,
				hunchCorrect: hunch ? seats.find((seat) => seat.id === hunch)?.role === 'thief' : null,
				flipped: room.flippedIds.includes(player.id),
				follower: room.followerIds.includes(player.id),
			};
		});
	}

	return dto;
}
