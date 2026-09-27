import type { CheesePhase, TablePreset } from '@/features/cheese-thief/config/cheeseThief';
import {
	cardIsEmpty,
	secretCardFor,
	wakeHoursOf,
	type CheeseRole,
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
	chosenHour?: number;
	hasMemorizedRole: boolean;
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
	hostToken: string;
	nightStartedAt?: Date;
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
		...(player.chosenHour !== undefined ? { chosenHour: player.chosenHour } : {}),
	}));
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
		const card = secretCardFor(viewer.id, seats, names, room.preset, resolved);
		secretCard = cardIsEmpty(card) ? { peek: null, allies: null, recruited: null } : card;
	}

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
											chosenHour: viewer.chosenHour,
										},
										room.preset.dicePerPlayer,
									)
								: [],
						}
					: {}),
				...(voting ? { voteId: viewer.voteId ?? null } : {}),
				...(secretCard ? { secretCard } : {}),
			}
		: null;

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
		playerCount: room.players.length,
		players,
		self,
	};

	if (room.phase === 'night' && room.nightStartedAt) {
		dto.nightStartedAt = room.nightStartedAt.toISOString();
	}
	if (room.phase === 'day' && room.dayStartedAt) {
		dto.dayStartedAt = room.dayStartedAt.toISOString();
	}
	if (room.phase === 'secret') dto.choiceCount = room.choiceCount;
	if (voting) {
		dto.isRunoff = room.isRunoff;
		dto.voteCandidateIds = room.isRunoff ? room.voteCandidateIds : room.players.map((player) => player.id);
		dto.votesCast = room.players.filter((player) => player.voteId).length;
	}
	if (reveal && room.preset) {
		dto.flippedIds = room.flippedIds;
		dto.followerIds = room.followerIds;
		dto.winner = room.winner;
		dto.roster = room.players.map((player): RevealRowDTO => {
			const role = player.role ?? 'sleepyhead';
			const hunch = resolved.hunchByPlayer[player.id];
			return {
				id: player.id,
				name: player.name,
				role,
				wakeHours: wakeHoursOf(
					{ id: player.id, role, dice: player.dice, chosenHour: player.chosenHour },
					room.preset!.dicePerPlayer,
				),
				hunchCorrect: hunch ? seats.find((seat) => seat.id === hunch)?.role === 'thief' : null,
				flipped: room.flippedIds.includes(player.id),
				follower: room.followerIds.includes(player.id),
			};
		});
	}

	return dto;
}
