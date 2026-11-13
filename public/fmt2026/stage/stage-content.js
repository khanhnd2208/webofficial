export const SHORT_NAMES = {
	'binh-nuoc': ['Bình nước FMT', 'Bình nước'],
	'hoodie-zip': ['Áo hoodie zip FMT', 'Hoodie'],
	'ao-do': ['Áo FMT đỏ', 'Áo đỏ'],
	'ao-vang': ['Áo FMT vàng', 'Áo vàng'],
	so: ['Sổ FMT', 'Sổ'],
	tui: ['Túi FMT', 'Túi'],
};
export const LUCK = { short: 'Quà tinh thần', tier: 'luck' };
export const TIER_LABEL = {
	common: 'Quà FMT',
	rare: 'Quà hiếm',
	epic: 'Quà đặc biệt',
	luck: 'Quà tinh thần',
};
export const COLORS = {
	common: ['#fff0d0', '#f5b74d', '#ed7770', '#ffffff'],
	rare: ['#bfe9ff', '#7cc8f5', '#fff0d0', '#f5b74d'],
	epic: ['#fff2bb', '#ffcb5c', '#d89631', '#ffffff'],
	luck: ['#ff8fa3', '#e64a51', '#ffd1d9'],
};
// Phiếu quà tinh thần: người không trúng hiện vật vẫn có thứ để cười và chụp ảnh.
export const COUPONS = [
	['Phiếu được thầy cô khen 1 lần', 'Dùng ngay tại quầy: “Giỏi lắm!”'],
	['Phiếu miễn 1 deadline', 'Hết hạn từ ngày nhận bằng tốt nghiệp.'],
	['Phiếu cộng 0,25 điểm chuyên cần', 'Áp dụng cho kiếp sinh viên sau.'],
	['Phiếu điểm danh hộ', 'Chỉ dùng được hôm nay, mà hôm nay bạn có mặt rồi.'],
	['Phiếu chụp ảnh cùng thầy cô', 'Không giới hạn số kiểu, miễn là cười thật tươi.'],
	['Phiếu về thăm trường', 'Hạn dùng: trọn đời. FMT luôn chờ bạn.'],
	['Phiếu xin lại tuổi hai mươi', 'Đang chờ phòng đào tạo duyệt.'],
	['Phiếu thi lại môn May mắn', 'Hẹn bạn ở lượt rút năm sau!'],
	['Phiếu một cái ôm từ FMT', 'Đổi được ngay, không cần xếp hàng.'],
	['Phiếu kể chuyện ngày xưa', 'Thầy cô nghe miễn phí, kể càng dài càng vui.'],
];
// Dòng phụ dưới chữ chấm điểm cú lắc.
export const RATING_NOTES = {
	perfect: ['Không lệch một li!', 'Tay vàng đây rồi!', 'Tuyệt đối luôn!'],
	near: ['Lệch có một chút xíu!', 'Suýt nữa là tuyệt đối!'],
	ok: ['Quà vẫn bay lên nhé!', 'Túi vẫn tung như thường!'],
	auto: ['Giữ lâu quá, túi tự tung rồi!'],
};
export const LINES = {
	invite: ['Chọn {self} nhé!', 'Rút với {self} đi!', 'Tay {self} mát lắm!', 'Lại đây với {self} nào!'],
	ready: [
		'Giữ nút để {self} lắc túi nhé!',
		'Lắc càng hăng, quà càng bay cao!',
		'Sẵn sàng chưa nào?',
	],
	shake: [
		'Mềm mềm… hình như cái áo!',
		'Tròn tròn, có nắp…',
		'Nghe sột soạt rồi đó!',
		'Túi nặng ghê!',
		'Có cái khóa kéo này…',
	],
	fizzle: ['Chưa đủ đô! Giữ lâu hơn nào.', 'Giữ nút chứ đừng chạm nhẹ nhé!'],
	launch: [
		'Rồi, cú này {self} nghe có tiếng… đắt tiền!',
		'Xem {self} tung này. Mọi người nhìn theo kim nhé!',
		'Một, hai, ba… tung! Quà FMT lên sóng!',
	],
	slow: ['Khoan, khoan… nó còn nhích!', 'Chậm rồi… cả quầy nín thở nào!', 'Nghe tiếng kim kìa… sắp rồi!'],
	common: ['Có quà rồi nhé!', 'Quà FMT về tay!'],
	rare: ['Ồ, quà xịn đấy!', 'Mát tay ghê!'],
	epic: ['Xin chúc mừng!', 'Quá đỉnh luôn!', 'Mát tay nhất hôm nay!'],
	luck: ['Có quà tinh thần nha!', 'Quà này không đụng hàng đâu!'],
};

// Mỗi cặp là một màn đối đáp trọn vẹn của thầy và cô.
export const SPIN_DIALOGUES = [
	['Ôi, iPhone kìa!', 'Thầy nhìn kỹ đi, đấy là cái sổ. Có màn hình đâu!'],
	['Có khóa kéo… chắc là ô tô!', 'Vâng, ô tô gấp gọn, để vừa trong túi FMT.'],
	['Sột soạt thế này… học bổng chăng?', 'Phiếu về thăm trường đấy thầy. Hạn dùng trọn đời!'],
	['Cô ơi, hoodie vừa chạy qua!', 'Thầy cứ bình tĩnh. Nó chạy vòng, lát lại gặp.'],
	['Quay nhanh thế, có kịp điểm danh không cô?', 'Có mặt là được. Cái kim thì đang chạy muộn.'],
	['Thầy thấy một bình nước. Có kèm trà sữa không?', 'Có bình rồi. Trà sữa thì thầy mời nhé!'],
	['Quay một vòng là xong môn này hả cô?', 'Xong môn Hồi hộp. Môn đó ai cũng qua!'],
	['Hình như có quà to lắm, cô ơi!', 'Thầy nói bé thôi, kẻo cái túi nghe được lại phồng lên.'],
];
