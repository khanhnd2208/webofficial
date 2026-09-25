import { SPY_TOPICS, type SpyTag, type SpyTopic } from '@/features/spy-fall/config/spyGame';
import type { Locale } from '@/features/spy-fall/lib/i18n/types';

import { WORD_BANK_EN } from './wordBank.en';

export interface WordPairEntry {
	id: string;
	category: SpyTopic;
	wordA: string;
	wordB: string;
	/** Own tags only; see `tagsOf` for the full set including topic-wide tags. */
	tags: SpyTag[];
}

export interface ResolvedWordPair {
	civilianWord: string;
	spyWord: string;
	topic: string;
}

function pair(
	id: string,
	category: SpyTopic,
	wordA: string,
	wordB: string,
	tags: SpyTag[] = [],
): WordPairEntry {
	return { id, category, wordA, wordB, tags };
}

/**
 * Close pairs only. Each word appears once. Civilian/spy assignment is randomized per game.
 * Ids are stable: never renumber, only append.
 */
export const WORD_BANK: WordPairEntry[] = [
	// món ăn
	pair('vi-01', 'món ăn', 'Phở', 'Bún bò', ['vietnam']),
	pair('vi-02', 'món ăn', 'Bánh mì', 'Xôi', ['vietnam']),
	pair('vi-04', 'món ăn', 'Cơm tấm', 'Cơm gà', ['vietnam']),
	pair('vi-05', 'món ăn', 'Bún chả', 'Bún đậu', ['vietnam']),
	pair('vi-07', 'món ăn', 'Lẩu', 'Nướng'),
	pair('vi-08', 'món ăn', 'Pizza', 'Burger'),
	pair('vi-10', 'món ăn', 'Bánh tráng trộn', 'Bắp xào', ['vietnam', 'school']),
	pair('vi-11', 'món ăn', 'Mì Quảng', 'Hủ tiếu', ['vietnam']),
	pair('vi-12', 'món ăn', 'Cháo', 'Súp'),
	pair('vi-13', 'món ăn', 'Kem', 'Sữa chua'),
	pair('vi-14', 'món ăn', 'Bánh cuốn', 'Bánh ướt', ['vietnam']),
	pair('vi-15', 'món ăn', 'Gỏi cuốn', 'Nem rán', ['vietnam']),
	pair('vi-17', 'món ăn', 'Cơm rang', 'Mì xào'),
	pair('vi-103', 'món ăn', 'Bánh xèo', 'Bánh khọt', ['vietnam']),
	pair('vi-104', 'món ăn', 'Bánh chưng', 'Bánh tét', ['vietnam']),
	pair('vi-105', 'món ăn', 'Sushi', 'Kimbap'),
	pair('vi-106', 'món ăn', 'Tokbokki', 'Mì cay', ['genz', 'anime-kpop']),
	pair('vi-107', 'món ăn', 'Hột vịt lộn', 'Trứng cút nướng', ['vietnam', 'icky']),
	pair('vi-108', 'món ăn', 'Sầu riêng', 'Mít'),
	pair('vi-109', 'món ăn', 'Mắm tôm', 'Mắm ruốc', ['vietnam', 'icky']),
	pair('vi-110', 'món ăn', 'Bánh tráng nướng', 'Bánh mì nướng muối ớt', ['vietnam', 'genz']),
	pair('vi-111', 'món ăn', 'Gà rán', 'Cánh gà chiên nước mắm'),
	pair('vi-112', 'món ăn', 'Mì tôm', 'Cháo gói', ['school']),
	pair('vi-113', 'món ăn', 'Ốc luộc', 'Nghêu hấp', ['vietnam']),
	pair('vi-114', 'món ăn', 'Bánh flan', 'Rau câu'),
	pair('vi-115', 'món ăn', 'Bắp rang bơ', 'Khoai tây chiên'),
	pair('vi-116', 'món ăn', 'Bánh trung thu', 'Bánh pía'),
	pair('vi-117', 'món ăn', 'Xíu mại', 'Há cảo'),
	pair('vi-118', 'món ăn', 'Thịt kho trứng', 'Cá kho tộ', ['vietnam']),
	pair('vi-119', 'món ăn', 'Canh chua', 'Lẩu thái'),
	pair('vi-120', 'món ăn', 'Bít tết', 'Bò lúc lắc'),
	pair('vi-121', 'món ăn', 'Bánh bao', 'Bánh giò', ['vietnam']),
	pair('vi-122', 'món ăn', 'Spaghetti', 'Ramen'),
	pair('vi-123', 'món ăn', 'Salad', 'Nộm'),
	pair('vi-124', 'món ăn', 'Snack Oishi', 'Bim bim Poca', ['childhood', 'brands']),
	pair('vi-125', 'món ăn', 'Kẹo bông gòn', 'Kẹo mút', ['childhood']),

	// đồ uống
	pair('vi-03', 'đồ uống', 'Cà phê sữa đá', 'Trà sữa'),
	pair('vi-06', 'đồ uống', 'Chè', 'Sinh tố'),
	pair('vi-09', 'đồ uống', 'Trà đá', 'Nước ngọt'),
	pair('vi-16', 'đồ uống', 'Trà chanh', 'Nước mía', ['vietnam']),
	pair('vi-126', 'đồ uống', 'Cà phê muối', 'Cà phê trứng', ['vietnam']),
	pair('vi-127', 'đồ uống', 'Bạc xỉu', 'Cappuccino'),
	pair('vi-128', 'đồ uống', 'Trà đào cam sả', 'Trà vải'),
	pair('vi-129', 'đồ uống', 'Bia', 'Rượu vang', ['nightlife']),
	pair('vi-130', 'đồ uống', 'Soju', 'Sake', ['nightlife']),
	pair('vi-131', 'đồ uống', 'Cocktail', 'Mocktail', ['nightlife']),
	pair('vi-132', 'đồ uống', 'Nước dừa', 'Nước sâm'),
	pair('vi-133', 'đồ uống', 'Sữa đậu nành', 'Sữa bắp'),
	pair('vi-134', 'đồ uống', 'Coca-Cola', 'Pepsi', ['brands']),
	pair('vi-135', 'đồ uống', 'Red Bull', 'Sting', ['brands']),
	pair('vi-136', 'đồ uống', 'Matcha latte', 'Cacao nóng'),
	pair('vi-137', 'đồ uống', 'Kombucha', 'Yakult', ['genz']),
	pair('vi-138', 'đồ uống', 'Rau má đậu xanh', 'Nước ép cần tây', ['genz']),
	pair('vi-139', 'đồ uống', 'Sữa tươi', 'Sữa đặc'),
	pair('vi-140', 'đồ uống', 'Espresso', 'Americano'),
	pair('vi-141', 'đồ uống', 'Rượu cần', 'Rượu đế', ['vietnam', 'nightlife']),
	pair('vi-142', 'đồ uống', 'Trà mãng cầu', 'Trà tắc', ['vietnam', 'genz']),
	pair('vi-143', 'đồ uống', 'Soda Ý', 'Soda chanh'),

	// địa điểm
	pair('vi-18', 'địa điểm', 'Khách sạn', 'Bệnh viện'),
	pair('vi-19', 'địa điểm', 'Sân bay', 'Ga tàu'),
	pair('vi-20', 'địa điểm', 'Đà Lạt', 'Sa Pa', ['vietnam']),
	pair('vi-21', 'địa điểm', 'Quán karaoke', 'Quán bar', ['nightlife']),
	pair('vi-22', 'địa điểm', 'Quán cà phê', 'Nhà hàng'),
	pair('vi-23', 'địa điểm', 'Siêu thị', 'Chợ'),
	pair('vi-24', 'địa điểm', 'Rạp chiếu phim', 'Nhà hát'),
	pair('vi-25', 'địa điểm', 'Phòng gym', 'Sân bóng'),
	pair('vi-26', 'địa điểm', 'Thư viện', 'Hiệu sách'),
	pair('vi-27', 'địa điểm', 'Bãi biển', 'Hồ bơi'),
	pair('vi-28', 'địa điểm', 'Trường học', 'Văn phòng'),
	pair('vi-29', 'địa điểm', 'Salon tóc', 'Spa'),
	pair('vi-30', 'địa điểm', 'Bảo tàng', 'Phòng triển lãm'),
	pair('vi-31', 'địa điểm', 'Công viên', 'Phố đi bộ'),
	pair('vi-32', 'địa điểm', 'Ký túc xá', 'Nhà trọ', ['school']),
	pair('vi-33', 'địa điểm', 'Trung tâm thương mại', 'Chợ đêm'),
	pair('vi-34', 'địa điểm', 'Quán net', 'Phòng game', ['gaming']),
	pair('vi-144', 'địa điểm', 'Vịnh Hạ Long', 'Tràng An', ['vietnam']),
	pair('vi-145', 'địa điểm', 'Hội An', 'Phố cổ Hà Nội', ['vietnam']),
	pair('vi-146', 'địa điểm', 'Phú Quốc', 'Côn Đảo', ['vietnam']),
	pair('vi-147', 'địa điểm', 'Paris', 'London'),
	pair('vi-148', 'địa điểm', 'Tokyo', 'Seoul'),
	pair('vi-149', 'địa điểm', 'Tháp Eiffel', 'Tượng Nữ thần Tự do'),
	pair('vi-150', 'địa điểm', 'Kim tự tháp', 'Vạn Lý Trường Thành', ['history']),
	pair('vi-151', 'địa điểm', 'Mặt Trăng', 'Sao Hỏa'),
	pair('vi-152', 'địa điểm', 'Nhà ma', 'Nghĩa địa', ['spooky']),
	pair('vi-153', 'địa điểm', 'Quán nhậu', 'Beer club', ['vietnam', 'nightlife']),
	pair('vi-154', 'địa điểm', 'Nhà nghỉ', 'Homestay', ['romance']),
	pair('vi-155', 'địa điểm', 'Đầm Sen', 'Suối Tiên', ['vietnam', 'childhood']),
	pair('vi-156', 'địa điểm', 'Disneyland', 'Universal Studios'),
	pair('vi-157', 'địa điểm', 'Bắc Cực', 'Nam Cực'),
	pair('vi-158', 'địa điểm', 'Sa mạc', 'Thảo nguyên'),
	pair('vi-159', 'địa điểm', 'Thang máy', 'Cáp treo'),
	pair('vi-160', 'địa điểm', 'Tàu ngầm', 'Trạm vũ trụ'),
	pair('vi-161', 'địa điểm', 'Chợ nổi', 'Làng chài', ['vietnam']),
	pair('vi-162', 'địa điểm', 'Phòng thi', 'Phòng họp', ['school', 'office']),
	pair('vi-163', 'địa điểm', 'Phòng cấp cứu', 'Phòng mổ'),
	pair('vi-164', 'địa điểm', 'Căng tin trường', 'Quán cóc cổng trường', ['vietnam', 'school', 'childhood']),
	pair('vi-165', 'địa điểm', 'Tiệm game thùng', 'Khu trò chơi xu', ['childhood', 'gaming']),

	// đồ vật
	pair('vi-35', 'đồ vật', 'Tai nghe', 'Loa bluetooth'),
	pair('vi-36', 'đồ vật', 'Ô', 'Áo mưa'),
	pair('vi-37', 'đồ vật', 'Vali', 'Ba lô'),
	pair('vi-38', 'đồ vật', 'Kính râm', 'Khẩu trang'),
	pair('vi-39', 'đồ vật', 'Pin dự phòng', 'Cục sạc'),
	pair('vi-40', 'đồ vật', 'Bình nước', 'Ly giữ nhiệt'),
	pair('vi-41', 'đồ vật', 'Quạt', 'Điều hòa'),
	pair('vi-42', 'đồ vật', 'Nồi cơm điện', 'Lò vi sóng'),
	pair('vi-43', 'đồ vật', 'Bàn chải đánh răng', 'Dao cạo'),
	pair('vi-44', 'đồ vật', 'Gối', 'Chăn'),
	pair('vi-45', 'đồ vật', 'Ví', 'Túi xách'),
	pair('vi-46', 'đồ vật', 'Đồng hồ đeo tay', 'Đồng hồ báo thức'),
	pair('vi-47', 'đồ vật', 'Máy sấy tóc', 'Máy uốn tóc'),
	pair('vi-48', 'đồ vật', 'Thớt', 'Chảo'),
	pair('vi-49', 'đồ vật', 'Khăn tắm', 'Khăn giấy'),
	pair('vi-50', 'đồ vật', 'Bút bi', 'Bút chì', ['school']),
	pair('vi-51', 'đồ vật', 'Ghế', 'Đệm ngồi'),
	pair('vi-166', 'đồ vật', 'Remote TV', 'Tay cầm chơi game', ['gaming']),
	pair('vi-167', 'đồ vật', 'Nồi chiên không dầu', 'Lò nướng'),
	pair('vi-168', 'đồ vật', 'Bàn phím cơ', 'Máy đánh chữ'),
	pair('vi-169', 'đồ vật', 'Gậy tự sướng', 'Chân máy ảnh'),
	pair('vi-170', 'đồ vật', 'Dép tổ ong', 'Dép lào', ['vietnam', 'childhood']),
	pair('vi-171', 'đồ vật', 'Nón lá', 'Mũ bảo hiểm', ['vietnam']),
	pair('vi-172', 'đồ vật', 'Băng cát-sét', 'Đĩa CD', ['childhood']),
	pair('vi-173', 'đồ vật', 'Tamagotchi', 'Game Boy', ['childhood', 'gaming']),
	pair('vi-174', 'đồ vật', 'Cục tẩy', 'Bút xóa', ['school']),
	pair('vi-175', 'đồ vật', 'Bao lì xì', 'Phong bì đám cưới', ['vietnam']),
	pair('vi-176', 'đồ vật', 'Đèn ông sao', 'Đèn kéo quân', ['vietnam', 'childhood']),
	pair('vi-177', 'đồ vật', 'Nến thơm', 'Tinh dầu'),
	pair('vi-178', 'đồ vật', 'Nhẫn cưới', 'Nhẫn cầu hôn', ['romance']),
	pair('vi-179', 'đồ vật', 'Rubik', 'Lego'),
	pair('vi-180', 'đồ vật', 'Gấu bông', 'Gối ôm'),
	pair('vi-181', 'đồ vật', 'Ổ khóa', 'Két sắt'),
	pair('vi-182', 'đồ vật', 'Bấm móng tay', 'Nhíp'),
	pair('vi-183', 'đồ vật', 'Giấy vệ sinh', 'Khăn ướt', ['icky']),
	pair('vi-184', 'đồ vật', 'Bình hoa', 'Chậu cây'),
	pair('vi-185', 'đồ vật', 'Búp bê ma', 'Gương cổ', ['spooky']),
	pair('vi-186', 'đồ vật', 'Quả cầu tuyết', 'Hộp nhạc'),
	pair('vi-187', 'đồ vật', 'Máy chấm công', 'Thẻ nhân viên', ['office']),
	pair('vi-188', 'đồ vật', 'Bảng trắng', 'Máy chiếu', ['office', 'school']),
	pair('vi-189', 'đồ vật', 'Bàn ủi', 'Máy hấp quần áo'),

	// nghề nghiệp
	pair('vi-52', 'nghề nghiệp', 'Y tá', 'Tiếp viên hàng không'),
	pair('vi-53', 'nghề nghiệp', 'Nhiếp ảnh gia', 'Nhà báo'),
	pair('vi-54', 'nghề nghiệp', 'DJ', 'Thợ pha chế', ['nightlife']),
	pair('vi-55', 'nghề nghiệp', 'Giáo viên', 'MC'),
	pair('vi-56', 'nghề nghiệp', 'Bác sĩ', 'Dược sĩ'),
	pair('vi-57', 'nghề nghiệp', 'Đầu bếp', 'Thợ làm bánh'),
	pair('vi-58', 'nghề nghiệp', 'Tài xế taxi', 'Tài xế xe buýt'),
	pair('vi-59', 'nghề nghiệp', 'Kiến trúc sư', 'Kỹ sư xây dựng'),
	pair('vi-60', 'nghề nghiệp', 'Ca sĩ', 'Diễn viên'),
	pair('vi-61', 'nghề nghiệp', 'Huấn luyện viên gym', 'Huấn luyện viên bóng đá'),
	pair('vi-62', 'nghề nghiệp', 'Luật sư', 'Công chứng viên'),
	pair('vi-63', 'nghề nghiệp', 'Phi công', 'Thuyền trưởng'),
	pair('vi-64', 'nghề nghiệp', 'Thợ cắt tóc', 'Thợ làm nail'),
	pair('vi-65', 'nghề nghiệp', 'Bảo vệ', 'Lễ tân'),
	pair('vi-66', 'nghề nghiệp', 'Shipper', 'Nhân viên kho'),
	pair('vi-67', 'nghề nghiệp', 'Streamer', 'TikToker', ['genz']),
	pair('vi-68', 'nghề nghiệp', 'Nha sĩ', 'Bác sĩ mắt'),
	pair('vi-190', 'nghề nghiệp', 'Thám tử', 'Cảnh sát'),
	pair('vi-191', 'nghề nghiệp', 'Ảo thuật gia', 'Chú hề'),
	pair('vi-192', 'nghề nghiệp', 'Phi hành gia', 'Thợ lặn biển sâu'),
	pair('vi-193', 'nghề nghiệp', 'Hướng dẫn viên du lịch', 'Quản trò team building', ['office']),
	pair('vi-194', 'nghề nghiệp', 'Thầy bói', 'Chuyên gia tâm lý'),
	pair('vi-195', 'nghề nghiệp', 'KOL', 'Người mẫu ảnh', ['genz']),
	pair('vi-196', 'nghề nghiệp', 'Hoa hậu', 'Á hậu', ['vietnam', 'pop-culture']),
	pair('vi-197', 'nghề nghiệp', 'Bình luận viên bóng đá', 'Trọng tài', ['football']),
	pair('vi-198', 'nghề nghiệp', 'Lính cứu hỏa', 'Cứu hộ bãi biển'),
	pair('vi-199', 'nghề nghiệp', 'Thợ điện', 'Thợ sửa ống nước'),
	pair('vi-200', 'nghề nghiệp', 'Bảo mẫu', 'Giáo viên mầm non'),
	pair('vi-201', 'nghề nghiệp', 'Xe ôm', 'Tài xế công nghệ', ['vietnam']),
	pair('vi-202', 'nghề nghiệp', 'Kế toán', 'Kiểm toán', ['office']),
	pair('vi-203', 'nghề nghiệp', 'Nhân viên HR', 'Headhunter', ['office']),
	pair('vi-204', 'nghề nghiệp', 'Lập trình viên', 'Hacker'),
	pair('vi-205', 'nghề nghiệp', 'Thầy cúng', 'Pháp sư trừ tà', ['spooky']),
	pair('vi-206', 'nghề nghiệp', 'Đạo diễn', 'Biên kịch'),
	pair('vi-207', 'nghề nghiệp', 'Barista', 'Phục vụ bàn'),

	// hoạt động
	pair('vi-69', 'hoạt động', 'Phỏng vấn xin việc', 'Hẹn hò', ['romance']),
	pair('vi-70', 'hoạt động', 'Học nhóm', 'Chơi board game', ['school']),
	pair('vi-71', 'hoạt động', 'Giặt quần áo', 'Rửa xe'),
	pair('vi-72', 'hoạt động', 'Học ngoại ngữ', 'Luyện nhạc cụ'),
	pair('vi-73', 'hoạt động', 'Đi karaoke', 'Đi bar', ['nightlife']),
	pair('vi-74', 'hoạt động', 'Tập gym', 'Chạy bộ'),
	pair('vi-75', 'hoạt động', 'Xem phim', 'Xem concert'),
	pair('vi-76', 'hoạt động', 'Nấu ăn', 'Nướng BBQ'),
	pair('vi-77', 'hoạt động', 'Mua sắm online', 'Mua sắm tại cửa hàng'),
	pair('vi-78', 'hoạt động', 'Đi du lịch', 'Về quê'),
	pair('vi-79', 'hoạt động', 'Họp online', 'Họp trực tiếp', ['office']),
	pair('vi-80', 'hoạt động', 'Chụp ảnh', 'Quay video'),
	pair('vi-81', 'hoạt động', 'Dọn phòng', 'Sắp vali'),
	pair('vi-82', 'hoạt động', 'Đi cà phê', 'Đi trà sữa'),
	pair('vi-83', 'hoạt động', 'Cắt tóc', 'Làm nail'),
	pair('vi-85', 'hoạt động', 'Thi cuối kỳ', 'Bảo vệ đồ án', ['school']),
	pair('vi-208', 'hoạt động', 'Đi phượt', 'Cắm trại'),
	pair('vi-209', 'hoạt động', 'Cosplay', 'Đóng kịch', ['anime-kpop']),
	pair('vi-210', 'hoạt động', 'Livestream bán hàng', 'Bán hàng rong', ['vietnam', 'genz']),
	pair('vi-211', 'hoạt động', 'Tỏ tình', 'Cầu hôn', ['romance']),
	pair('vi-212', 'hoạt động', 'Chia tay', 'Bị ghost', ['romance', 'genz']),
	pair('vi-213', 'hoạt động', 'Nhậu lai rai', 'Đi tăng hai', ['vietnam', 'nightlife']),
	pair('vi-214', 'hoạt động', 'Săn sale', 'Đi chợ Tết', ['vietnam']),
	pair('vi-215', 'hoạt động', 'Xem bói', 'Xem tarot'),
	pair('vi-216', 'hoạt động', 'Ngủ nướng', 'Ngủ trưa'),
	pair('vi-217', 'hoạt động', 'Leo núi', 'Lặn biển'),
	pair('vi-218', 'hoạt động', 'Chạy deadline', 'Ôn thi cấp tốc', ['school', 'office']),
	pair('vi-219', 'hoạt động', 'Thả diều', 'Bắn bi', ['childhood']),
	pair('vi-220', 'hoạt động', 'Nhảy dây', 'Ô ăn quan', ['vietnam', 'childhood']),
	pair('vi-221', 'hoạt động', 'Trốn tìm', 'Bịt mắt bắt dê', ['childhood']),
	pair('vi-222', 'hoạt động', 'Ăn cỗ', 'Đi đám giỗ', ['vietnam']),
	pair('vi-223', 'hoạt động', 'Chuyển nhà', 'Dọn kho'),
	pair('vi-224', 'hoạt động', 'Picnic', 'Glamping'),
	pair('vi-225', 'hoạt động', 'Tắm biển', 'Tắm suối'),
	pair('vi-226', 'hoạt động', 'Làm việc từ xa', 'Làm việc ở quán cà phê', ['office', 'genz']),
	pair('vi-227', 'hoạt động', 'Nhổ răng khôn', 'Đi tiêm'),
	pair('vi-228', 'hoạt động', 'Kể chuyện ma', 'Xem phim kinh dị', ['spooky']),
	pair('vi-229', 'hoạt động', 'Học lái xe', 'Học bơi'),

	// công nghệ
	pair('vi-86', 'công nghệ', 'Grab', 'Be', ['vietnam', 'brands']),
	pair('vi-87', 'công nghệ', 'Shopee', 'TikTok Shop', ['brands']),
	pair('vi-88', 'công nghệ', 'Zalo', 'Messenger', ['vietnam']),
	pair('vi-89', 'công nghệ', 'Facebook', 'Instagram'),
	pair('vi-90', 'công nghệ', 'iPhone', 'Điện thoại Samsung', ['brands']),
	pair('vi-91', 'công nghệ', 'Laptop', 'Máy tính bảng'),
	pair('vi-92', 'công nghệ', 'Netflix', 'YouTube'),
	pair('vi-93', 'công nghệ', 'Google Maps', 'Apple Maps'),
	pair('vi-94', 'công nghệ', 'MoMo', 'ZaloPay', ['vietnam']),
	pair('vi-95', 'công nghệ', 'Spotify', 'Apple Music'),
	pair('vi-96', 'công nghệ', 'ChatGPT', 'Gemini'),
	pair('vi-97', 'công nghệ', 'Zoom', 'Google Meet', ['office']),
	pair('vi-98', 'công nghệ', 'Gmail', 'Outlook', ['office']),
	pair('vi-99', 'công nghệ', 'TikTok', 'Facebook Reels', ['genz']),
	pair('vi-100', 'công nghệ', 'Wi-Fi', '4G'),
	pair('vi-101', 'công nghệ', 'Microsoft Word', 'Google Docs', ['office']),
	pair('vi-102', 'công nghệ', 'Canva', 'PowerPoint', ['office']),
	pair('vi-230', 'công nghệ', 'Liên Quân Mobile', 'Liên Minh Huyền Thoại', ['gaming']),
	pair('vi-231', 'công nghệ', 'Minecraft', 'Roblox', ['gaming']),
	pair('vi-232', 'công nghệ', 'PUBG', 'Free Fire', ['gaming']),
	pair('vi-233', 'công nghệ', 'Among Us', 'Ma Sói', ['gaming']),
	pair('vi-234', 'công nghệ', 'Threads', 'X (Twitter)', ['genz']),
	pair('vi-235', 'công nghệ', 'Tinder', 'Bumble', ['romance']),
	pair('vi-236', 'công nghệ', 'AirPods', 'Tai nghe có dây'),
	pair('vi-237', 'công nghệ', 'PlayStation 5', 'Nintendo Switch', ['gaming']),
	pair('vi-238', 'công nghệ', 'Flappy Bird', 'Temple Run', ['gaming']),
	pair('vi-239', 'công nghệ', 'Face ID', 'Vân tay'),
	pair('vi-240', 'công nghệ', 'Mã QR', 'Mã vạch'),
	pair('vi-241', 'công nghệ', 'Robot hút bụi', 'Máy rửa bát'),
	pair('vi-242', 'công nghệ', 'Excel', 'Google Sheets', ['office']),
	pair('vi-243', 'công nghệ', 'Slack', 'Microsoft Teams', ['office']),
	pair('vi-244', 'công nghệ', 'Bluetooth', 'NFC'),
	pair('vi-245', 'công nghệ', 'Drone', 'Máy bay điều khiển'),
	pair('vi-246', 'công nghệ', 'Rắn săn mồi Nokia', 'Trò khủng long Chrome', ['childhood', 'gaming']),
	pair('vi-247', 'công nghệ', 'Nokia cục gạch', 'BlackBerry', ['childhood']),
	pair('vi-248', 'công nghệ', 'Yahoo Messenger', 'Zing Me', ['vietnam', 'childhood']),
	pair('vi-249', 'công nghệ', 'Google Dịch', 'Từ điển giấy'),
	pair('vi-250', 'công nghệ', 'Smartwatch', 'Vòng đeo tay thông minh'),

	// người nổi tiếng (luôn mang tag real-people)
	pair('vi-251', 'người nổi tiếng', 'Sơn Tùng M-TP', 'HIEUTHUHAI', ['vietnam', 'pop-culture']),
	pair('vi-252', 'người nổi tiếng', 'Mỹ Tâm', 'Hồ Ngọc Hà', ['vietnam', 'pop-culture']),
	pair('vi-253', 'người nổi tiếng', 'Đen Vâu', 'Binz', ['vietnam', 'pop-culture']),
	pair('vi-254', 'người nổi tiếng', 'Trấn Thành', 'Trường Giang', ['vietnam', 'pop-culture']),
	pair('vi-255', 'người nổi tiếng', 'Xuân Bắc', 'Tự Long', ['vietnam', 'pop-culture']),
	pair('vi-256', 'người nổi tiếng', 'Độ Mixi', 'PewPew', ['vietnam', 'gaming']),
	pair('vi-257', 'người nổi tiếng', 'Quang Hải', 'Công Phượng', ['vietnam', 'football']),
	pair('vi-258', 'người nổi tiếng', 'Park Hang-seo', 'Kim Sang-sik', ['vietnam', 'football']),
	pair('vi-259', 'người nổi tiếng', 'Messi', 'Ronaldo', ['football']),
	pair('vi-260', 'người nổi tiếng', 'Taylor Swift', 'Beyoncé', ['pop-culture']),
	pair('vi-261', 'người nổi tiếng', 'Lisa', 'Jennie', ['anime-kpop']),
	pair('vi-262', 'người nổi tiếng', 'BTS', 'BLACKPINK', ['anime-kpop']),
	pair('vi-263', 'người nổi tiếng', 'Elon Musk', 'Mark Zuckerberg'),
	pair('vi-264', 'người nổi tiếng', 'Steve Jobs', 'Bill Gates'),
	pair('vi-265', 'người nổi tiếng', 'Albert Einstein', 'Isaac Newton', ['history']),
	pair('vi-266', 'người nổi tiếng', 'Thomas Edison', 'Nikola Tesla', ['history']),
	pair('vi-267', 'người nổi tiếng', 'Neil Armstrong', 'Yuri Gagarin', ['history']),
	pair('vi-268', 'người nổi tiếng', 'Leonardo da Vinci', 'Picasso', ['history']),
	pair('vi-269', 'người nổi tiếng', 'Mozart', 'Beethoven', ['history']),
	pair('vi-270', 'người nổi tiếng', 'Michael Jackson', 'Elvis Presley', ['pop-culture']),
	pair('vi-271', 'người nổi tiếng', 'Thành Long', 'Lý Tiểu Long', ['pop-culture']),
	pair('vi-272', 'người nổi tiếng', 'Charlie Chaplin', 'Mr. Bean', ['pop-culture']),
	pair('vi-273', 'người nổi tiếng', 'Châu Tinh Trì', 'Ngô Mạnh Đạt', ['pop-culture', 'childhood']),
	pair('vi-274', 'người nổi tiếng', 'Usain Bolt', 'Michael Phelps'),
	pair('vi-275', 'người nổi tiếng', 'Faker', 'Levi', ['gaming']),
	pair('vi-276', 'người nổi tiếng', 'Cleopatra', 'Võ Tắc Thiên', ['history']),
	pair('vi-277', 'người nổi tiếng', 'Napoleon', 'Thành Cát Tư Hãn', ['history']),
	pair('vi-278', 'người nổi tiếng', 'Hai Bà Trưng', 'Bà Triệu', ['history', 'vietnam']),
	pair('vi-279', 'người nổi tiếng', 'Trần Hưng Đạo', 'Quang Trung', ['history', 'vietnam']),
	pair('vi-280', 'người nổi tiếng', 'Nguyễn Du', 'Hồ Xuân Hương', ['history', 'vietnam', 'school']),
	pair('vi-281', 'người nổi tiếng', 'Leonardo DiCaprio', 'Brad Pitt', ['pop-culture']),

	// nhân vật (hư cấu: truyện, phim, game, cổ tích)
	pair('vi-282', 'nhân vật', 'Doraemon', 'Pikachu', ['childhood', 'anime-kpop']),
	pair('vi-283', 'nhân vật', 'Nobita', 'Shin - Cậu bé bút chì', ['childhood', 'anime-kpop']),
	pair('vi-284', 'nhân vật', 'Thám tử Conan', 'Sherlock Holmes'),
	pair('vi-285', 'nhân vật', 'Luffy', 'Naruto', ['anime-kpop']),
	pair('vi-286', 'nhân vật', 'Songoku', 'Saitama', ['anime-kpop']),
	pair('vi-287', 'nhân vật', 'Harry Potter', 'Frodo', ['pop-culture']),
	pair('vi-288', 'nhân vật', 'Iron Man', 'Batman', ['pop-culture']),
	pair('vi-289', 'nhân vật', 'Superman', 'Thor', ['pop-culture']),
	pair('vi-290', 'nhân vật', 'Spider-Man', 'Deadpool', ['pop-culture']),
	pair('vi-291', 'nhân vật', 'Elsa', 'Rapunzel', ['childhood']),
	pair('vi-292', 'nhân vật', 'Tôn Ngộ Không', 'Trư Bát Giới', ['childhood']),
	pair('vi-293', 'nhân vật', 'Cô Tấm', 'Lọ Lem', ['vietnam', 'childhood']),
	pair('vi-294', 'nhân vật', 'Thạch Sanh', 'Thánh Gióng', ['vietnam', 'childhood']),
	pair('vi-295', 'nhân vật', 'Chú Cuội', 'Chị Hằng', ['vietnam', 'childhood']),
	pair('vi-296', 'nhân vật', 'Mario', 'Sonic', ['gaming']),
	pair('vi-297', 'nhân vật', 'Joker', 'Thanos', ['pop-culture']),
	pair('vi-298', 'nhân vật', 'Tom', 'Jerry', ['childhood']),
	pair('vi-299', 'nhân vật', 'Chuột Mickey', 'Vịt Donald', ['childhood']),
	pair('vi-300', 'nhân vật', 'Ma cà rồng', 'Người sói', ['spooky']),
	pair('vi-301', 'nhân vật', 'Zombie', 'Xác ướp', ['spooky']),
	pair('vi-302', 'nhân vật', 'Chí Phèo', 'Lão Hạc', ['vietnam', 'school']),
	pair('vi-303', 'nhân vật', 'Shrek', 'Hulk', ['pop-culture']),
	pair('vi-304', 'nhân vật', 'Ông già Noel', 'Ông Táo', ['vietnam']),
	pair('vi-305', 'nhân vật', 'Thần đèn', 'Bà tiên', ['childhood']),
	pair('vi-306', 'nhân vật', 'Gấu Pooh', 'Heo Peppa', ['childhood']),
	pair('vi-307', 'nhân vật', 'Sơn Tinh', 'Thủy Tinh', ['vietnam', 'childhood']),

	// động vật
	pair('vi-308', 'động vật', 'Mèo', 'Chó'),
	pair('vi-309', 'động vật', 'Cá sấu', 'Kỳ đà'),
	pair('vi-310', 'động vật', 'Chim cánh cụt', 'Hải cẩu'),
	pair('vi-311', 'động vật', 'Gấu trúc', 'Gấu Bắc Cực'),
	pair('vi-312', 'động vật', 'Hà mã', 'Tê giác'),
	pair('vi-313', 'động vật', 'Bạch tuộc', 'Mực'),
	pair('vi-314', 'động vật', 'Ong', 'Kiến'),
	pair('vi-315', 'động vật', 'Muỗi', 'Gián', ['icky']),
	pair('vi-316', 'động vật', 'Capybara', 'Chuột lang', ['genz']),
	pair('vi-317', 'động vật', 'Hươu cao cổ', 'Lạc đà'),
	pair('vi-318', 'động vật', 'Cá mập', 'Cá voi'),
	pair('vi-319', 'động vật', 'Rùa', 'Ốc sên'),
	pair('vi-320', 'động vật', 'Vẹt', 'Quạ'),
	pair('vi-321', 'động vật', 'Khủng long', 'Rồng'),
	pair('vi-322', 'động vật', 'Sư tử', 'Hổ'),
	pair('vi-323', 'động vật', 'Thỏ', 'Chuột hamster'),
	pair('vi-324', 'động vật', 'Cú mèo', 'Dơi'),
	pair('vi-325', 'động vật', 'Sứa', 'Sao biển'),
	pair('vi-326', 'động vật', 'Rắn', 'Lươn', ['icky']),
	pair('vi-327', 'động vật', 'Cá vàng', 'Cá betta'),
	pair('vi-328', 'động vật', 'Gà', 'Vịt'),
	pair('vi-329', 'động vật', 'Trâu', 'Bò', ['vietnam']),

	// thể thao
	pair('vi-330', 'thể thao', 'Bóng đá', 'Futsal', ['football']),
	pair('vi-331', 'thể thao', 'Cầu lông', 'Pickleball', ['genz']),
	pair('vi-332', 'thể thao', 'Tennis', 'Bóng bàn'),
	pair('vi-333', 'thể thao', 'Yoga', 'Pilates'),
	pair('vi-334', 'thể thao', 'Boxing', 'Vovinam', ['vietnam']),
	pair('vi-335', 'thể thao', 'Cờ vua', 'Cờ tướng'),
	pair('vi-336', 'thể thao', 'Bi-a', 'Bowling'),
	pair('vi-337', 'thể thao', 'Đá cầu', 'Cầu mây', ['vietnam']),
	pair('vi-338', 'thể thao', 'Marathon', 'Triathlon'),
	pair('vi-339', 'thể thao', 'Trượt tuyết', 'Lướt sóng'),
	pair('vi-340', 'thể thao', 'World Cup', 'Olympic', ['football']),
	pair('vi-341', 'thể thao', 'SEA Games', 'AFF Cup', ['vietnam', 'football']),
	pair('vi-342', 'thể thao', 'Manchester United', 'Manchester City', ['football']),
	pair('vi-343', 'thể thao', 'Real Madrid', 'Barcelona', ['football']),
	pair('vi-344', 'thể thao', 'Bóng rổ', 'Bóng chuyền'),
	pair('vi-345', 'thể thao', 'Golf', 'Cricket'),
	pair('vi-346', 'thể thao', 'Đua xe F1', 'MotoGP'),
	pair('vi-347', 'thể thao', 'Sumo', 'Đấu vật'),
	pair('vi-348', 'thể thao', 'Kéo co', 'Nhảy bao bố', ['vietnam', 'childhood']),

	// giải trí (phim, show, nhạc, truyện)
	pair('vi-349', 'giải trí', 'Titanic', 'Avatar', ['pop-culture']),
	pair('vi-350', 'giải trí', 'Squid Game', 'Hunger Games', ['pop-culture']),
	pair('vi-351', 'giải trí', 'Táo Quân', 'Gặp nhau cuối tuần', ['vietnam', 'childhood']),
	pair('vi-352', 'giải trí', 'Running Man', '2 Ngày 1 Đêm', ['anime-kpop']),
	pair('vi-353', 'giải trí', 'Anh Trai Say Hi', 'Anh Trai Vượt Ngàn Chông Gai', ['vietnam', 'genz']),
	pair('vi-354', 'giải trí', 'Rap Việt', 'Giọng hát Việt', ['vietnam']),
	pair('vi-355', 'giải trí', 'Chúa tể những chiếc nhẫn', 'Game of Thrones', ['pop-culture']),
	pair('vi-356', 'giải trí', 'Tây Du Ký', 'Tam Quốc Diễn Nghĩa', ['childhood']),
	pair('vi-357', 'giải trí', 'Frozen', 'Moana', ['pop-culture']),
	pair('vi-358', 'giải trí', 'Marvel', 'DC', ['pop-culture']),
	pair('vi-359', 'giải trí', 'Pokémon', 'Digimon', ['anime-kpop', 'childhood']),
	pair('vi-360', 'giải trí', 'Money Heist', "Ocean's Eleven", ['pop-culture']),
	pair('vi-361', 'giải trí', 'Ai là triệu phú', 'Đường lên đỉnh Olympia', ['vietnam']),
	pair('vi-362', 'giải trí', 'Đuổi hình bắt chữ', 'Chiếc nón kỳ diệu', ['vietnam', 'childhood']),
	pair('vi-363', 'giải trí', 'The Conjuring', 'Insidious', ['spooky']),
	pair('vi-364', 'giải trí', 'Friends', 'How I Met Your Mother', ['pop-culture']),
	pair('vi-365', 'giải trí', 'Hậu duệ mặt trời', 'Hạ cánh nơi anh', ['anime-kpop', 'romance']),
	pair('vi-366', 'giải trí', 'Nhạc Trịnh', 'Nhạc Bolero', ['vietnam']),
	pair('vi-367', 'giải trí', 'Thần đồng Đất Việt', 'Trạng Quỷnh', ['vietnam', 'childhood']),

	// lễ hội & phong tục
	pair('vi-84', 'lễ hội', 'Tết', 'Trung thu', ['vietnam']),
	pair('vi-368', 'lễ hội', 'Halloween', 'Rằm tháng Bảy', ['vietnam', 'spooky']),
	pair('vi-369', 'lễ hội', 'Valentine', 'Ngày 8/3', ['romance']),
	pair('vi-370', 'lễ hội', 'Giáng sinh', 'Tết Dương lịch'),
	pair('vi-371', 'lễ hội', 'Chúc Tết', 'Mừng thọ', ['vietnam']),
	pair('vi-372', 'lễ hội', 'Đám cưới', 'Đám hỏi', ['vietnam']),
	pair('vi-373', 'lễ hội', 'Thôi nôi', 'Đầy tháng', ['vietnam']),
	pair('vi-374', 'lễ hội', 'Múa lân', 'Múa rồng', ['vietnam']),
	pair('vi-375', 'lễ hội', 'Giao thừa', 'Đêm countdown'),
	pair('vi-376', 'lễ hội', 'Lễ tốt nghiệp', 'Lễ khai giảng', ['school']),
	pair('vi-377', 'lễ hội', 'Sinh nhật', 'Kỷ niệm ngày cưới', ['romance']),
	pair('vi-378', 'lễ hội', 'Lễ hội pháo hoa Đà Nẵng', 'Festival hoa Đà Lạt', ['vietnam']),
	pair('vi-379', 'lễ hội', 'Oktoberfest', 'Songkran', ['nightlife']),
	pair('vi-380', 'lễ hội', 'Lễ hội Carnival', 'Lễ hội hóa trang Venice'),
	pair('vi-381', 'lễ hội', 'Year End Party', 'Team building', ['office']),
	pair('vi-382', 'lễ hội', 'Black Friday', 'Sale 11.11', ['genz']),
	pair('vi-383', 'lễ hội', 'Tết Hàn thực', 'Tết Đoan ngọ', ['vietnam']),
	pair('vi-384', 'lễ hội', 'Lễ Vu Lan', 'Ngày của Mẹ', ['vietnam']),

	// thương hiệu (luôn mang tag brands)
	pair('vi-385', 'thương hiệu', 'KFC', 'Lotteria'),
	pair('vi-386', 'thương hiệu', "McDonald's", 'Burger King'),
	pair('vi-387', 'thương hiệu', 'Highlands Coffee', 'Starbucks'),
	pair('vi-388', 'thương hiệu', 'Phúc Long', 'Katinat', ['vietnam', 'genz']),
	pair('vi-389', 'thương hiệu', 'Nike', 'Adidas'),
	pair('vi-390', 'thương hiệu', 'WinMart', 'Bách Hóa Xanh', ['vietnam']),
	pair('vi-391', 'thương hiệu', 'Circle K', '7-Eleven'),
	pair('vi-392', 'thương hiệu', 'Uniqlo', 'Zara'),
	pair('vi-393', 'thương hiệu', 'IKEA', 'Muji'),
	pair('vi-394', 'thương hiệu', 'VinFast', 'Tesla'),
	pair('vi-395', 'thương hiệu', 'Honda Wave', 'Yamaha Sirius', ['vietnam']),
	pair('vi-396', 'thương hiệu', 'Hảo Hảo', 'Omachi', ['vietnam']),
	pair('vi-397', 'thương hiệu', 'Vinamilk', 'TH True Milk', ['vietnam']),
	pair('vi-398', 'thương hiệu', "Biti's", 'Converse'),
	pair('vi-399', 'thương hiệu', 'Lazada', 'Tiki', ['vietnam']),
	pair('vi-400', 'thương hiệu', 'Louis Vuitton', 'Gucci'),
	pair('vi-401', 'thương hiệu', 'Disney', 'Pixar'),
	pair('vi-402', 'thương hiệu', 'Toyota', 'Hyundai'),
	pair('vi-403', 'thương hiệu', 'Heineken', 'Tiger', ['nightlife']),
	pair('vi-404', 'thương hiệu', 'Mixue', 'Tocotoco', ['vietnam', 'genz']),

	// khái niệm (luôn mang tag abstract)
	pair('vi-405', 'khái niệm', 'Tình yêu', 'Tình bạn'),
	pair('vi-406', 'khái niệm', 'Crush', 'Người yêu cũ', ['romance']),
	pair('vi-407', 'khái niệm', 'Nói dối', 'Bí mật'),
	pair('vi-408', 'khái niệm', 'Bình minh', 'Hoàng hôn'),
	pair('vi-409', 'khái niệm', 'Mất ngủ', 'Ngủ gật'),
	pair('vi-410', 'khái niệm', 'FOMO', 'Overthinking', ['genz']),
	pair('vi-411', 'khái niệm', 'Mạng lag', 'Hết pin', ['genz']),
	pair('vi-412', 'khái niệm', 'Tắc đường', 'Ngập nước', ['vietnam']),
	pair('vi-413', 'khái niệm', 'Mưa phùn', 'Nồm ẩm', ['vietnam']),
	pair('vi-414', 'khái niệm', 'Thứ Hai', 'Chủ Nhật', ['office']),
	pair('vi-415', 'khái niệm', 'Déjà vu', 'Linh cảm'),
	pair('vi-416', 'khái niệm', 'Hạnh phúc', 'Tự do'),
	pair('vi-417', 'khái niệm', 'Deadline', 'Nợ', ['office']),
	pair('vi-418', 'khái niệm', 'Tuổi thơ', 'Kỷ niệm', ['childhood']),
	pair('vi-419', 'khái niệm', 'Ác mộng', 'Bóng đè', ['spooky']),
	pair('vi-420', 'khái niệm', 'Lương tháng', 'Thưởng Tết', ['vietnam', 'office']),
	pair('vi-421', 'khái niệm', 'Ghen', 'Giận dỗi', ['romance']),
	pair('vi-422', 'khái niệm', 'Drama', 'Thị phi', ['genz']),
	pair('vi-423', 'khái niệm', 'Sống ảo', 'Check-in', ['genz']),
	pair('vi-424', 'khái niệm', 'Hàng xóm hát karaoke', 'Hàng xóm khoan tường', ['vietnam']),
];

const TOPIC_SET = new Set<string>(SPY_TOPICS);

/** Tags every pair of a topic carries, so data lines stay short and cannot forget them. */
const TOPIC_TAGS: Partial<Record<SpyTopic, SpyTag[]>> = {
	'người nổi tiếng': ['real-people'],
	'thương hiệu': ['brands'],
	'khái niệm': ['abstract'],
};

export function tagsOf(entry: WordPairEntry): SpyTag[] {
	const implied = TOPIC_TAGS[entry.category];
	return implied ? [...new Set([...implied, ...entry.tags])] : entry.tags;
}

export function wordBankFor(locale: Locale = 'vi'): WordPairEntry[] {
	return locale === 'en' ? WORD_BANK_EN : WORD_BANK;
}

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

/**
 * Excluded tags are a hard filter; the topic narrows further. Any/unknown topic
 * means every topic.
 */
export function filterWordPairs(
	category?: string,
	bank: WordPairEntry[] = WORD_BANK,
	excludedTags: readonly string[] = [],
): WordPairEntry[] {
	const excluded = new Set(excludedTags);
	const allowed =
		excluded.size > 0
			? bank.filter((entry) => !tagsOf(entry).some((tag) => excluded.has(tag)))
			: [...bank];
	if (!category || category === 'any' || !TOPIC_SET.has(category)) return allowed;
	return allowed.filter((entry) => entry.category === category);
}

export function pickWordPair(options: {
	topic?: string;
	excludedTags?: readonly string[];
	recentIds?: string[];
	random?: () => number;
	locale?: Locale;
}): WordPairEntry {
	const { topic, excludedTags = [], recentIds = [], random = Math.random, locale = 'vi' } = options;
	const bank = wordBankFor(locale);
	const scoped = filterWordPairs(topic, bank, excludedTags);
	// Callers check `filterWordPairs(...).length` first; the fallbacks only keep this total.
	const candidates =
		scoped.length > 0 ? scoped : filterWordPairs('any', bank, excludedTags);
	const pool0 = candidates.length > 0 ? candidates : [...bank];
	const recent = new Set(recentIds);
	const fresh = pool0.filter((entry) => !recent.has(entry.id));
	const pool = fresh.length > 0 ? fresh : pool0;
	return pool[Math.floor(random() * pool.length)]!;
}

export function wordPairToId(pair: WordPairEntry): string {
	return pair.id;
}
