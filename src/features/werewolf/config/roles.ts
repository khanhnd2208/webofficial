import type { Faction, RoleCount, RoleDefinition } from '@/features/werewolf/types';

export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 20;
export const WEREWOLF_POLL_INTERVAL_MS = 1500;
export const WEREWOLF_DISCONNECT_THRESHOLD_MS = 10_000;
export const ROOM_CODE_LENGTH = 6;
export const PLAYER_TOKEN_LENGTH = 21;
/** Served from /public. Callers must prefix with withBasePath when the site has a base path. */
export const CARD_BACK_IMAGE = '/board-game/ma-soi/00.webp';

export const FACTION_LABELS: Record<Faction, string> = {
	villager: 'Phe Dân',
	werewolf: 'Phe Sói',
	solo: 'Phe thứ ba / Độc lập',
};

const VILLAGER_OBJECTIVE = 'Giúp phe Dân tìm và loại bỏ Ma Sói.';
const WOLF_OBJECTIVE = 'Loại bỏ phe Dân và kiểm soát những người còn sống.';

const CARD = '/board-game/ma-soi';

export const ROLES: RoleDefinition[] = [
	{
		roleId: 'villager',
		name: 'Dân Làng',
		faction: 'villager',
		image: `${CARD}/01.webp`,
		emoji: '👤',
		gradient: 'from-slate-600 to-slate-800',
		shortDescription:
			'Không có kỹ năng ban đêm. Ban ngày tham gia thảo luận và bỏ phiếu để tìm, loại bỏ phe Sói cùng các mối đe dọa khác.',
		objective: VILLAGER_OBJECTIVE,
		displayOrder: 1,
		isEnabled: true,
	},
	{
		roleId: 'seer',
		name: 'Tiên Tri',
		faction: 'villager',
		image: `${CARD}/02.webp`,
		emoji: '🔮',
		gradient: 'from-indigo-700 to-indigo-950',
		shortDescription:
			'Mỗi đêm chọn một người để kiểm tra. Quản trò cho biết người đó có thuộc phe Ma Sói hay không, nhưng không tiết lộ chính xác vai trò.',
		objective: VILLAGER_OBJECTIVE,
		displayOrder: 2,
		isEnabled: true,
	},
	{
		roleId: 'bodyguard',
		name: 'Bảo Vệ',
		faction: 'villager',
		image: `${CARD}/03.webp`,
		emoji: '🛡️',
		gradient: 'from-teal-700 to-teal-950',
		shortDescription:
			'Mỗi đêm chọn một người để bảo vệ. Người đó không chết bởi đòn tấn công của Ma Sói trong đêm ấy. Không được bảo vệ cùng một người trong hai đêm liên tiếp.',
		objective: VILLAGER_OBJECTIVE,
		displayOrder: 3,
		isEnabled: true,
	},
	{
		roleId: 'witch',
		name: 'Phù Thủy',
		faction: 'villager',
		image: `${CARD}/04.webp`,
		emoji: '🧪',
		gradient: 'from-purple-700 to-purple-950',
		shortDescription:
			'Có một bình cứu và một bình độc. Mỗi bình chỉ được sử dụng một lần trong cả ván. Bình cứu cứu người bị Sói cắn; bình độc giết một người do Phù Thủy lựa chọn.',
		objective: VILLAGER_OBJECTIVE,
		displayOrder: 4,
		isEnabled: true,
	},
	{
		roleId: 'hunter',
		name: 'Thợ Săn',
		faction: 'villager',
		image: `${CARD}/05.webp`,
		emoji: '🏹',
		gradient: 'from-amber-700 to-amber-950',
		shortDescription:
			'Khi chết, được chọn một người khác chết cùng. Vẫn được sử dụng khả năng này nếu bị giết trong đêm, kể cả khi chết vì độc.',
		objective: VILLAGER_OBJECTIVE,
		displayOrder: 5,
		isEnabled: true,
	},
	{
		roleId: 'cupid',
		name: 'Cupid – Thần Tình Yêu',
		faction: 'villager',
		image: `${CARD}/06.webp`,
		emoji: '💘',
		gradient: 'from-rose-700 to-pink-950',
		shortDescription:
			'Trong đêm đầu tiên, chọn hai người trở thành người yêu. Khi một người chết, người còn lại chết theo. Nếu hai người khác phe, họ tạo thành phe thứ ba và chỉ thắng khi trở thành hai người sống sót cuối cùng.',
		objective: 'Tạo liên kết định mệnh hoặc giúp phe Dân — tùy cặp đôi được chọn.',
		displayOrder: 6,
		isEnabled: true,
	},
	{
		roleId: 'elder',
		name: 'Già Làng',
		faction: 'villager',
		image: `${CARD}/07.webp`,
		emoji: '🧓',
		gradient: 'from-amber-800 to-stone-900',
		shortDescription:
			'Sống sót sau lần đầu tiên bị Ma Sói tấn công. Nếu bị dân làng bỏ phiếu treo cổ, tất cả các vai đặc biệt thuộc phe Dân còn sống sẽ mất kỹ năng và trở thành Dân làng thường.',
		objective: VILLAGER_OBJECTIVE,
		displayOrder: 7,
		isEnabled: true,
	},
	{
		roleId: 'two_sisters',
		name: 'Hai Chị Em',
		faction: 'villager',
		image: `${CARD}/08.webp`,
		emoji: '👭',
		gradient: 'from-teal-800 to-cyan-950',
		shortDescription:
			'Thuộc phe Dân. Trong đêm đầu tiên, hai chị em thức dậy để nhận biết nhau. Sau đó không có kỹ năng đặc biệt nhưng có thể âm thầm hỗ trợ và bảo vệ nhau trong thảo luận.',
		objective: VILLAGER_OBJECTIVE,
		displayOrder: 8,
		isEnabled: true,
	},
	{
		roleId: 'three_brothers',
		name: 'Ba Anh Em',
		faction: 'villager',
		image: `${CARD}/09.webp`,
		emoji: '👨‍👨‍👦',
		gradient: 'from-blue-800 to-slate-950',
		shortDescription:
			'Thuộc phe Dân. Trong đêm đầu tiên, ba anh em thức dậy để nhận biết nhau. Họ không có kỹ năng khác nhưng biết chắc danh tính của hai đồng minh.',
		objective: VILLAGER_OBJECTIVE,
		displayOrder: 9,
		isEnabled: true,
	},
	{
		roleId: 'werewolf',
		name: 'Ma Sói',
		faction: 'werewolf',
		image: `${CARD}/10.webp`,
		emoji: '🐺',
		gradient: 'from-rose-900 to-red-950',
		shortDescription:
			'Mỗi đêm thức dậy cùng những Ma Sói khác và thống nhất chọn một người để giết. Phe Sói thắng khi có thể kiểm soát hoàn toàn những người còn sống.',
		objective: WOLF_OBJECTIVE,
		displayOrder: 10,
		isEnabled: true,
	},
	{
		roleId: 'wolf_cub',
		name: 'Sói Con',
		faction: 'werewolf',
		image: `${CARD}/11.webp`,
		emoji: '🐾',
		gradient: 'from-red-900 to-stone-950',
		shortDescription:
			'Thức dậy và giết người cùng phe Sói. Nếu Sói con chết, trong đêm tiếp theo phe Sói được quyền tấn công hai nạn nhân để trả thù.',
		objective: WOLF_OBJECTIVE,
		displayOrder: 11,
		isEnabled: true,
	},
	{
		roleId: 'white_wolf',
		name: 'Sói Trắng',
		faction: 'werewolf',
		image: `${CARD}/12.webp`,
		emoji: '🐺',
		gradient: 'from-slate-300 to-slate-600',
		shortDescription:
			'Thức dậy và săn mồi cùng phe Sói. Cách một đêm, sau lượt của Ma Sói, Sói trắng có thể bí mật giết một Ma Sói khác. Sói trắng chỉ thắng khi trở thành người sống sót cuối cùng.',
		objective: 'Trở thành người sống sót cuối cùng.',
		displayOrder: 12,
		isEnabled: true,
	},
	{
		roleId: 'wolf_curse',
		name: 'Sói Nguyền',
		faction: 'werewolf',
		image: `${CARD}/13.webp`,
		emoji: '☠️',
		gradient: 'from-red-950 to-black',
		shortDescription:
			'Một lần duy nhất trong cả ván, có thể biến người bị phe Sói tấn công thành Ma Sói thay vì giết họ. Nạn nhân mất phe và năng lực cũ, sau đó trở thành Ma Sói thường.',
		objective: WOLF_OBJECTIVE,
		displayOrder: 13,
		isEnabled: true,
	},
	{
		roleId: 'wolf_seer',
		name: 'Sói Tiên Tri',
		faction: 'werewolf',
		image: `${CARD}/14.webp`,
		emoji: '👁️',
		gradient: 'from-purple-900 to-red-950',
		shortDescription:
			'Thuộc phe Sói. Mỗi đêm chọn một người để xem chính xác vai trò của người đó, giúp phe Sói xác định các vai nguy hiểm cần loại bỏ.',
		objective: WOLF_OBJECTIVE,
		displayOrder: 14,
		isEnabled: true,
	},
	{
		roleId: 'wolf_disguise',
		name: 'Sói Hóa Trang',
		faction: 'werewolf',
		image: `${CARD}/15.webp`,
		emoji: '🎭',
		gradient: 'from-amber-900 to-red-950',
		shortDescription:
			'Thuộc phe Sói nhưng khi bị Tiên tri kiểm tra sẽ hiện kết quả như một người không thuộc phe Sói. Vẫn thức dậy và tấn công cùng các Ma Sói khác.',
		objective: WOLF_OBJECTIVE,
		displayOrder: 15,
		isEnabled: true,
	},
	{
		roleId: 'wolf_mute',
		name: 'Sói Câm',
		faction: 'werewolf',
		image: `${CARD}/16.webp`,
		emoji: '🤐',
		gradient: 'from-slate-800 to-black',
		shortDescription:
			'Mỗi đêm chọn một người. Trong ngày tiếp theo, người đó không được nói hoặc truyền đạt thông tin bằng lời, nhưng vẫn có thể tham gia bỏ phiếu.',
		objective: WOLF_OBJECTIVE,
		displayOrder: 16,
		isEnabled: true,
	},
	{
		roleId: 'serial_killer',
		name: 'Sát Nhân Hàng Loạt',
		faction: 'solo',
		image: `${CARD}/17.webp`,
		emoji: '🔪',
		gradient: 'from-purple-950 to-black',
		shortDescription:
			'Không thuộc phe Dân hay phe Sói. Mỗi đêm tự chọn một người để giết. Chỉ thắng khi trở thành người sống sót cuối cùng.',
		objective: 'Trở thành người sống sót cuối cùng.',
		displayOrder: 17,
		isEnabled: true,
	},
];

export function getRoleById(roleId: string): RoleDefinition | undefined {
	return ROLES.find((role) => role.roleId === roleId);
}

export function getEnabledRoles(): RoleDefinition[] {
	return ROLES.filter((role) => role.isEnabled).sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getSuggestedRoleSet(playerCount: number): RoleCount[] {
	if (playerCount < MIN_PLAYERS) return [];

	const wolves = Math.max(1, Math.floor(playerCount / 4));
	const specials = playerCount >= 8 ? 3 : playerCount >= 6 ? 2 : 1;
	const villagers = playerCount - wolves - specials;

	const selections: RoleCount[] = [{ roleId: 'werewolf', count: wolves }];
	if (specials >= 1) selections.push({ roleId: 'seer', count: 1 });
	if (specials >= 2) selections.push({ roleId: 'bodyguard', count: 1 });
	if (specials >= 3) selections.push({ roleId: 'witch', count: 1 });
	if (villagers > 0) selections.push({ roleId: 'villager', count: villagers });
	return selections;
}

export function getTotalRoleCount(selections: RoleCount[]): number {
	return selections.reduce((sum, selection) => sum + selection.count, 0);
}

export function getWerewolfWarning(selections: RoleCount[], playerCount: number): string | null {
	const wolfFactionIds = new Set(
		ROLES.filter((role) => role.faction === 'werewolf').map((role) => role.roleId),
	);
	const wolfCount = selections.reduce(
		(sum, selection) => sum + (wolfFactionIds.has(selection.roleId) ? selection.count : 0),
		0,
	);
	if (wolfCount >= 3 && playerCount <= 10) return 'mafia.roles.wolfWarning';
	return null;
}
