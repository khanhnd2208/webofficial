import type { SpyDifficulty } from '@/features/spy-fall/config/spyGame';
import type { Locale } from '@/features/spy-fall/lib/i18n/types';

import { WORD_BANK_EN } from './wordBank.en';

export interface WordPairEntry {
	id: string;
	category: string;
	difficulty: Exclude<SpyDifficulty, 'mixed'>;
	wordA: string;
	wordB: string;
}

/** 60 curated pairs — wordA/wordB are neutral; civilian/spy assignment is randomized per game. */
export const WORD_BANK: WordPairEntry[] = [
	// Cấp 1 — easy (20)
	{ id: 'pair-01', category: 'địa điểm', difficulty: 'easy', wordA: 'Khách sạn', wordB: 'Bệnh viện' },
	{ id: 'pair-02', category: 'địa điểm', difficulty: 'easy', wordA: 'Rạp chiếu phim', wordB: 'Máy bay' },
	{ id: 'pair-03', category: 'địa điểm', difficulty: 'easy', wordA: 'Siêu thị', wordB: 'Bảo tàng' },
	{ id: 'pair-04', category: 'địa điểm', difficulty: 'easy', wordA: 'Sân bay', wordB: 'Trung tâm thương mại' },
	{ id: 'pair-05', category: 'địa điểm', difficulty: 'easy', wordA: 'Nhà kho', wordB: 'Thư viện' },
	{ id: 'pair-06', category: 'địa điểm', difficulty: 'easy', wordA: 'Salon tóc', wordB: 'Phòng khám nha khoa' },
	{ id: 'pair-07', category: 'địa điểm', difficulty: 'easy', wordA: 'Phòng gym', wordB: 'Công trường' },
	{ id: 'pair-08', category: 'hoạt động', difficulty: 'easy', wordA: 'Nhà hàng', wordB: 'Tiệc cưới' },
	{ id: 'pair-09', category: 'địa điểm', difficulty: 'easy', wordA: 'Trường học', wordB: 'Nhà tù' },
	{ id: 'pair-10', category: 'địa điểm', difficulty: 'easy', wordA: 'Công viên', wordB: 'Nghĩa trang' },
	{ id: 'pair-11', category: 'đồ vật', difficulty: 'easy', wordA: 'Tủ lạnh', wordB: 'Két sắt' },
	{ id: 'pair-12', category: 'đồ vật', difficulty: 'easy', wordA: 'Máy giặt', wordB: 'Máy pha cà phê' },
	{ id: 'pair-13', category: 'đồ vật', difficulty: 'easy', wordA: 'Gương', wordB: 'Camera' },
	{ id: 'pair-14', category: 'đồ vật', difficulty: 'easy', wordA: 'Vali', wordB: 'Tủ quần áo' },
	{ id: 'pair-15', category: 'đồ vật', difficulty: 'easy', wordA: 'Kính râm', wordB: 'Khẩu trang' },
	{ id: 'pair-16', category: 'đồ vật', difficulty: 'easy', wordA: 'Máy sấy tóc', wordB: 'Máy hút bụi' },
	{ id: 'pair-17', category: 'đồ vật', difficulty: 'easy', wordA: 'Đồng hồ', wordB: 'Cân điện tử' },
	{ id: 'pair-18', category: 'đồ vật', difficulty: 'easy', wordA: 'Hộp cơm', wordB: 'Hộp cứu thương' },
	{ id: 'pair-19', category: 'đồ vật', difficulty: 'easy', wordA: 'Bàn chải đánh răng', wordB: 'Cây lau nhà' },
	{ id: 'pair-20', category: 'đồ vật', difficulty: 'easy', wordA: 'Robot hút bụi', wordB: 'Thú cưng' },

	// Cấp 2 — standard (20)
	{ id: 'pair-21', category: 'nghề nghiệp', difficulty: 'standard', wordA: 'Giáo viên', wordB: 'MC' },
	{ id: 'pair-22', category: 'nghề nghiệp', difficulty: 'standard', wordA: 'Bác sĩ', wordB: 'Thợ sửa xe' },
	{ id: 'pair-23', category: 'nghề nghiệp', difficulty: 'standard', wordA: 'Y tá', wordB: 'Tiếp viên hàng không' },
	{ id: 'pair-24', category: 'nghề nghiệp', difficulty: 'standard', wordA: 'Nhiếp ảnh gia', wordB: 'Nhà báo' },
	{ id: 'pair-25', category: 'nghề nghiệp', difficulty: 'standard', wordA: 'Phi công', wordB: 'Bác sĩ phẫu thuật' },
	{ id: 'pair-26', category: 'nghề nghiệp', difficulty: 'standard', wordA: 'Luật sư', wordB: 'Diễn viên' },
	{ id: 'pair-27', category: 'nghề nghiệp', difficulty: 'standard', wordA: 'Đầu bếp', wordB: 'Nhà khoa học' },
	{ id: 'pair-28', category: 'nghề nghiệp', difficulty: 'standard', wordA: 'Kiểm toán viên', wordB: 'Thám tử' },
	{ id: 'pair-29', category: 'nghề nghiệp', difficulty: 'standard', wordA: 'DJ', wordB: 'Thợ pha chế' },
	{ id: 'pair-30', category: 'nghề nghiệp', difficulty: 'standard', wordA: 'Kiến trúc sư', wordB: 'Đạo diễn' },
	{ id: 'pair-31', category: 'nghề nghiệp', difficulty: 'standard', wordA: 'Ca sĩ', wordB: 'Vận động viên' },
	{ id: 'pair-32', category: 'nghề nghiệp', difficulty: 'standard', wordA: 'Lính cứu hỏa', wordB: 'Thợ lặn' },
	{ id: 'pair-33', category: 'hoạt động', difficulty: 'standard', wordA: 'Phỏng vấn xin việc', wordB: 'Hẹn hò' },
	{ id: 'pair-34', category: 'hoạt động', difficulty: 'standard', wordA: 'Thi đại học', wordB: 'Chuyến tàu' },
	{ id: 'pair-35', category: 'hoạt động', difficulty: 'standard', wordA: 'Nấu ăn', wordB: 'Làm thí nghiệm' },
	{ id: 'pair-36', category: 'hoạt động', difficulty: 'standard', wordA: 'Đi khám bệnh', wordB: 'Bảo dưỡng xe' },
	{ id: 'pair-37', category: 'hoạt động', difficulty: 'standard', wordA: 'Học nhóm', wordB: 'Chơi board game' },
	{ id: 'pair-38', category: 'hoạt động', difficulty: 'standard', wordA: 'Đi karaoke', wordB: 'Thuyết trình' },
	{ id: 'pair-39', category: 'hoạt động', difficulty: 'standard', wordA: 'Tập gym', wordB: 'Chuyển nhà' },
	{ id: 'pair-40', category: 'hoạt động', difficulty: 'standard', wordA: 'Làm bài thi', wordB: 'Chơi escape room' },

	// Cấp 3 — hard (20)
	{ id: 'pair-41', category: 'hoạt động', difficulty: 'hard', wordA: 'Đi mua sắm', wordB: 'Tham quan triển lãm' },
	{ id: 'pair-42', category: 'hoạt động', difficulty: 'hard', wordA: 'Cắt tóc', wordB: 'Xăm hình' },
	{ id: 'pair-43', category: 'hoạt động', difficulty: 'hard', wordA: 'Gói quà', wordB: 'Băng bó vết thương' },
	{ id: 'pair-44', category: 'hoạt động', difficulty: 'hard', wordA: 'Ra mắt sản phẩm', wordB: 'Lễ tốt nghiệp' },
	{ id: 'pair-45', category: 'hoạt động', difficulty: 'hard', wordA: 'Giặt quần áo', wordB: 'Rửa xe' },
	{ id: 'pair-46', category: 'liên tưởng', difficulty: 'hard', wordA: 'Dọn nhà', wordB: 'Chơi Tetris' },
	{ id: 'pair-47', category: 'hoạt động', difficulty: 'hard', wordA: 'Học ngoại ngữ', wordB: 'Luyện nhạc cụ' },
	{ id: 'pair-48', category: 'liên tưởng', difficulty: 'hard', wordA: 'Cà phê', wordB: 'Pin điện thoại' },
	{ id: 'pair-49', category: 'liên tưởng', difficulty: 'hard', wordA: 'Bỏng ngô', wordB: 'Pháo hoa' },
	{ id: 'pair-50', category: 'liên tưởng', difficulty: 'hard', wordA: 'Mì spaghetti', wordB: 'Dây điện' },
	{ id: 'pair-51', category: 'liên tưởng', difficulty: 'hard', wordA: 'Sushi', wordB: 'Lego' },
	{ id: 'pair-52', category: 'liên tưởng', difficulty: 'hard', wordA: 'Kẹo cao su', wordB: 'Keo dán' },
	{ id: 'pair-53', category: 'liên tưởng', difficulty: 'hard', wordA: 'Nước mắm', wordB: 'Nước hoa' },
	{ id: 'pair-54', category: 'liên tưởng', difficulty: 'hard', wordA: 'Bánh quy', wordB: 'Đồng xu' },
	{ id: 'pair-55', category: 'liên tưởng', difficulty: 'hard', wordA: 'Mì ăn liền', wordB: 'Pin dự phòng' },
	{ id: 'pair-56', category: 'liên tưởng', difficulty: 'hard', wordA: 'Mèo', wordB: 'Bảo vệ ca đêm' },
	{ id: 'pair-57', category: 'liên tưởng', difficulty: 'hard', wordA: 'Chim cánh cụt', wordB: 'Nhân viên văn phòng' },
	{ id: 'pair-58', category: 'liên tưởng', difficulty: 'hard', wordA: 'Rùa', wordB: 'Xe tăng' },
	{ id: 'pair-59', category: 'liên tưởng', difficulty: 'hard', wordA: 'Kỳ nghỉ', wordB: 'Thất nghiệp' },
	{ id: 'pair-60', category: 'liên tưởng', difficulty: 'hard', wordA: 'Giảm cân', wordB: 'Tiết kiệm tiền' },
];

export interface ResolvedWordPair {
	civilianWord: string;
	spyWord: string;
	topic: string;
}

/** Randomly assign which neutral word goes to civilians vs spy (50/50). */
export function resolveWordPairForGame(
	entry: WordPairEntry,
	random: () => number = Math.random,
): ResolvedWordPair {
	const swap = random() < 0.5;
	return {
		civilianWord: swap ? entry.wordB : entry.wordA,
		spyWord: swap ? entry.wordA : entry.wordB,
		topic: entry.category,
	};
}

type PickableDifficulty = Exclude<SpyDifficulty, 'mixed'>;

function pickWeightedDifficulty(random: () => number): PickableDifficulty {
	const r = random();
	if (r < 0.5) return 'easy';
	if (r < 0.85) return 'standard';
	return 'hard';
}

export function filterWordPairs(
	category?: string,
	difficulty?: SpyDifficulty,
	bank: WordPairEntry[] = WORD_BANK,
): WordPairEntry[] {
	return bank.filter((pair) => {
		if (category && category !== 'any' && pair.category !== category) return false;
		if (difficulty && difficulty !== 'mixed' && pair.difficulty !== difficulty) return false;
		return true;
	});
}

export function pickWordPair(
	options: {
		topic?: string;
		difficulty?: SpyDifficulty;
		recentIds?: string[];
		random?: () => number;
		locale?: Locale;
	},
): WordPairEntry {
	const {
		topic,
		difficulty = 'mixed',
		recentIds = [],
		random = Math.random,
		locale = 'vi',
	} = options;

	const bank = locale === 'en' ? WORD_BANK_EN : WORD_BANK;

	const effectiveDifficulty =
		difficulty === 'mixed' ? pickWeightedDifficulty(random) : difficulty;

	let candidates = filterWordPairs(topic, effectiveDifficulty, bank);

	if (candidates.length === 0 && topic && topic !== 'any') {
		candidates = filterWordPairs(undefined, effectiveDifficulty, bank);
	}
	if (candidates.length === 0 && difficulty === 'mixed') {
		candidates = filterWordPairs(topic, pickWeightedDifficulty(random), bank);
	}
	if (candidates.length === 0) {
		candidates = filterWordPairs(topic, undefined, bank);
	}
	if (candidates.length === 0) {
		candidates = [...bank];
	}

	const recentSet = new Set(recentIds);
	const fresh = candidates.filter((c) => !recentSet.has(c.id));
	const pool = fresh.length > 0 ? fresh : candidates;

	const index = Math.floor(random() * pool.length);
	return pool[index]!;
}

export function wordPairToId(pair: WordPairEntry): string {
	return pair.id;
}
