/* ════════════════════════════════════════════════════════════════════════
   BFI-2-S Question Configuration (30 items + 1 attention check)

   Source: Soto & John (2017). Big Five Inventory–2 (BFI-2 / BFI-2-S).

   `formOrder` matches the EXACT column order from the Google Form spreadsheet.
   Item text is stored in adjective-phrase form (as shown in the Google Form),
   NOT the "I am someone who…" prefix form.

   KEY MAPPING RULE:
     formOrder  1–24 → itemNumber = formOrder  (items 1–24 in standard BFI-2-S order)
     formOrder 25    = ATTENTION CHECK (itemNumber 99)
     formOrder 26–31 → itemNumber = formOrder − 1  (items 25–30)

   Official BFI-2-S Scoring Key (Soto & John, 2017):
     Extraversion (E):           1R,  6,  11,  16,  21R, 26R   (3R + 3)
     Agreeableness (A):          2,   7R, 12,  17R, 22,  27R   (3R + 3)
     Conscientiousness (C):      3R,  8R, 13,  18,  23,  28R   (3R + 3)
     Negative Emotionality (N):  4,   9,  14R, 19R, 24R, 29    (3R + 3)
     Open-Mindedness (O):        5,  10R, 15,  20R, 25,  30R   (3R + 3)

   Google Form column order (formOrder → academic itemNumber → domain → reversed):
     Form  1 → Item  1R  (E, R)   "Tends to be quiet."
     Form  2 → Item  2   (A, -)   "Is compassionate, has a soft heart."
     Form  3 → Item  3R  (C, R)   "Tends to be disorganized."
     Form  4 → Item  4   (N, -)   "Worries a lot."
     Form  5 → Item  5   (O, -)   "Is fascinated by art, music, or literature."
     Form  6 → Item  6   (E, -)   "Is dominant, acts as a leader."
     Form  7 → Item  7R  (A, R)   "Is sometimes rude to others."
     Form  8 → Item  8R  (C, R)   "Has difficulty getting started on tasks."
     Form  9 → Item  9   (N, -)   "Tends to feel depressed, blue."
     Form 10 → Item 10R  (O, R)   "Has little interest in abstract ideas."
     Form 11 → Item 11   (E, -)   "Is full of energy."
     Form 12 → Item 12   (A, -)   "Assumes the best about people."
     Form 13 → Item 13   (C, -)   "Is reliable, can always be counted on."
     Form 14 → Item 14R  (N, R)   "Is emotionally stable, not easily upset."
     Form 15 → Item 15   (O, -)   "Is original, comes up with new ideas."
     Form 16 → Item 16   (E, -)   "Is outgoing, sociable."
     Form 17 → Item 17R  (A, R)   "Can be cold and uncaring."
     Form 18 → Item 18   (C, -)   "Keeps things neat and tidy."
     Form 19 → Item 19R  (N, R)   "Is relaxed, handles stress well."
     Form 20 → Item 20R  (O, R)   "Has few artistic interests."
     Form 21 → Item 21R  (E, R)   "Prefers to have others take charge."
     Form 22 → Item 22   (A, -)   "Is respectful, treats others with respect."
     Form 23 → Item 23   (C, -)   "Is persistent, works until the task is finished."
     Form 24 → Item 24R  (N, R)   "Feels secure, comfortable with self."
     Form 25 = ATTENTION CHECK — "Hãy chọn số 1" (expected: 1) — excluded from scoring
     Form 26 → Item 25   (O, -)   "Is complex, a deep thinker."
     Form 27 → Item 26R  (E, R)   "Is less active than other people."
     Form 28 → Item 27R  (A, R)   "Tends to find fault with others."
     Form 29 → Item 28R  (C, R)   "Can be somewhat careless."
     Form 30 → Item 29   (N, -)   "Is temperamental, gets emotional easily."
     Form 31 → Item 30R  (O, R)   "Has little creativity."
   ════════════════════════════════════════════════════════════════════════ */

import type { QuestionConfig } from '@/types/personalityTest';

export const BFI2S_QUESTIONS: QuestionConfig[] = [
	// ── Extraversion (E) ────────────────────────────────────────────────────────
	// formOrder 1 → item 1R · E reversed · "Tends to be quiet."
	{ itemNumber: 1,  formOrder: 1,  testType: 'BFI2S', domain: 'extraversion',         text: 'Tends to be quiet.',                                        textVi: 'Có xu hướng ít nói, trầm tính.',                        explanationVi: '"Quiet" ở đây nghĩa là bạn thường không chủ động nói nhiều trong các cuộc trò chuyện, thích quan sát hơn là tham gia trao đổi sôi nổi.', isReversed: true,  isAttentionCheck: false },
	// formOrder 2 → item 2 · A · "Is compassionate, has a soft heart."
	{ itemNumber: 2,  formOrder: 2,  testType: 'BFI2S', domain: 'agreeableness',        text: 'Is compassionate, has a soft heart.',                       textVi: 'Giàu lòng trắc ẩn, có trái tim nhạy cảm.',             explanationVi: '"Soft heart" = dễ mủi lòng trước nỗi khổ của người khác, hay đặt mình vào vị trí người khác để cảm thông.', isReversed: false, isAttentionCheck: false },
	// formOrder 3 → item 3R · C reversed · "Tends to be disorganized."
	{ itemNumber: 3,  formOrder: 3,  testType: 'BFI2S', domain: 'conscientiousness',    text: 'Tends to be disorganized.',                                 textVi: 'Có xu hướng thiếu ngăn nắp, lộn xộn.',                 explanationVi: '"Disorganized" = không có hệ thống sắp xếp rõ ràng — bàn học bừa bộn, lịch trình không rõ ràng, hay khó tìm thấy đồ vật khi cần.', isReversed: true,  isAttentionCheck: false },
	// formOrder 4 → item 4 · N · "Worries a lot."
	{ itemNumber: 4,  formOrder: 4,  testType: 'BFI2S', domain: 'negativeEmotionality', text: 'Worries a lot.',                                            textVi: 'Hay lo lắng, thường suy nghĩ nhiều.',                  explanationVi: '"Worries a lot" = bạn thường xuyên lo lắng về tương lai, về những việc có thể xảy ra sai — kể cả khi chưa có lý do cụ thể.', isReversed: false, isAttentionCheck: false },
	// formOrder 5 → item 5 · O · "Is fascinated by art, music, or literature."
	{ itemNumber: 5,  formOrder: 5,  testType: 'BFI2S', domain: 'openMindedness',       text: 'Is fascinated by art, music, or literature.',              textVi: 'Say mê nghệ thuật, âm nhạc hoặc văn học.',             explanationVi: '"Fascinated" = không chỉ thích mà còn bị cuốn hút sâu sắc bởi cái đẹp trong nghệ thuật — có thể là hội họa, phim ảnh, thơ ca, hay bất kỳ hình thức sáng tạo nào.', isReversed: false, isAttentionCheck: false },
	// formOrder 6 → item 6 · E · "Is dominant, acts as a leader."
	{ itemNumber: 6,  formOrder: 6,  testType: 'BFI2S', domain: 'extraversion',         text: 'Is dominant, acts as a leader.',                            textVi: 'Có tính quyết đoán, thường đảm nhận vai trò dẫn dắt.', explanationVi: '"Dominant" ở đây không mang nghĩa tiêu cực — nó chỉ bạn thường tự tin đứng ra chỉ đạo, đưa ra quyết định trong nhóm thay vì chờ người khác làm.', isReversed: false, isAttentionCheck: false },
	// formOrder 7 → item 7R · A reversed · "Is sometimes rude to others."
	{ itemNumber: 7,  formOrder: 7,  testType: 'BFI2S', domain: 'agreeableness',        text: 'Is sometimes rude to others.',                              textVi: 'Đôi khi cư xử thiếu tế nhị với người khác.',           explanationVi: '"Rude" = nói hoặc hành động thiếu lịch sự, có thể vô tình làm tổn thương người khác. Câu này hỏi bạn có đôi khi ưu tiên sự thẳng thắn hơn là giữ hài hòa không.', isReversed: true,  isAttentionCheck: false },
	// formOrder 8 → item 8R · C reversed · "Has difficulty getting started on tasks."
	{ itemNumber: 8,  formOrder: 8,  testType: 'BFI2S', domain: 'conscientiousness',    text: 'Has difficulty getting started on tasks.',                  textVi: 'Khó khăn khi bắt đầu làm việc (hay trì hoãn).',        explanationVi: '"Difficulty getting started" = hiện tượng trì hoãn (procrastination) — bạn biết phải làm nhưng cứ lần lữa mãi mới bắt tay vào.', isReversed: true,  isAttentionCheck: false },
	// formOrder 9 → item 9 · N · "Tends to feel depressed, blue."
	{ itemNumber: 9,  formOrder: 9,  testType: 'BFI2S', domain: 'negativeEmotionality', text: 'Tends to feel depressed, blue.',                            textVi: 'Có xu hướng cảm thấy buồn bã, chán nản.',              explanationVi: '"Blue" = trạng thái buồn man mác, uể oải, không hào hứng. Lưu ý: đây là xu hướng cảm xúc bình thường, không phải chẩn đoán bệnh lý trầm cảm.', isReversed: false, isAttentionCheck: false },
	// formOrder 10 → item 10R · O reversed · "Has little interest in abstract ideas."
	{ itemNumber: 10, formOrder: 10, testType: 'BFI2S', domain: 'openMindedness',       text: 'Has little interest in abstract ideas.',                    textVi: 'Ít quan tâm đến các ý tưởng trừu tượng.',              explanationVi: '"Abstract ideas" = những khái niệm lý thuyết không gắn với thực tế cụ thể — ví dụ triết học, toán lý thuyết, đạo đức học. Câu này hỏi bạn có thấy hứng thú với những chủ đề như vậy không.', isReversed: true,  isAttentionCheck: false },
	// formOrder 11 → item 11 · E · "Is full of energy."
	{ itemNumber: 11, formOrder: 11, testType: 'BFI2S', domain: 'extraversion',         text: 'Is full of energy.',                                        textVi: 'Tràn đầy năng lượng, sôi nổi.',                        explanationVi: 'Bạn có cảm thấy mình luôn hoạt bát, hăng hái, sẵn sàng tham gia các hoạt động không? Hay bạn thường cần thời gian nghỉ ngơi để nạp lại năng lượng?', isReversed: false, isAttentionCheck: false },
	// formOrder 12 → item 12 · A · "Assumes the best about people."
	{ itemNumber: 12, formOrder: 12, testType: 'BFI2S', domain: 'agreeableness',        text: 'Assumes the best about people.',                            textVi: 'Thường nghĩ tốt về người khác trước.',                  explanationVi: '"Assumes the best" = khi gặp ai mới, bạn có xu hướng tin rằng họ có thiện ý thay vì nghi ngờ động cơ của họ.', isReversed: false, isAttentionCheck: false },
	// formOrder 13 → item 13 · C · "Is reliable, can always be counted on."
	{ itemNumber: 13, formOrder: 13, testType: 'BFI2S', domain: 'conscientiousness',    text: 'Is reliable, can always be counted on.',                    textVi: 'Đáng tin cậy, luôn giữ lời hứa.',                      explanationVi: '"Can be counted on" = khi bạn đã cam kết điều gì, người khác có thể yên tâm rằng bạn sẽ thực hiện. Ví dụ: nộp bài đúng hạn, đến đúng giờ, hoàn thành phần việc nhóm.', isReversed: false, isAttentionCheck: false },
	// formOrder 14 → item 14R · N reversed · "Is emotionally stable, not easily upset."
	{ itemNumber: 14, formOrder: 14, testType: 'BFI2S', domain: 'negativeEmotionality', text: 'Is emotionally stable, not easily upset.',                  textVi: 'Ổn định cảm xúc, không dễ bực bội hay nổi nóng.',      explanationVi: '"Emotionally stable" = cảm xúc ít dao động, bạn không dễ bị ảnh hưởng bởi chuyện nhỏ. "Not easily upset" = khi gặp vấn đề, bạn vẫn giữ được bình tĩnh thay vì phản ứng mạnh.', isReversed: true,  isAttentionCheck: false },
	// formOrder 15 → item 15 · O · "Is original, comes up with new ideas."
	{ itemNumber: 15, formOrder: 15, testType: 'BFI2S', domain: 'openMindedness',       text: 'Is original, comes up with new ideas.',                    textVi: 'Có tư duy độc đáo, hay nghĩ ra ý tưởng mới.',          explanationVi: '"Original" = ý tưởng của bạn thường khác biệt, không theo lối mòn. Ví dụ: khi làm bài nhóm, bạn hay đề xuất góc nhìn mà chưa ai nghĩ tới.', isReversed: false, isAttentionCheck: false },
	// formOrder 16 → item 16 · E · "Is outgoing, sociable."
	{ itemNumber: 16, formOrder: 16, testType: 'BFI2S', domain: 'extraversion',         text: 'Is outgoing, sociable.',                                    textVi: 'Cởi mở, thích giao tiếp xã hội.',                      explanationVi: '"Outgoing" = chủ động tìm kiếm tương tác xã hội; "sociable" = cảm thấy thoải mái khi ở giữa đám đông. Bạn có thích gặp gỡ, trò chuyện với nhiều người không?', isReversed: false, isAttentionCheck: false },
	// formOrder 17 → item 17R · A reversed · "Can be cold and uncaring."
	{ itemNumber: 17, formOrder: 17, testType: 'BFI2S', domain: 'agreeableness',        text: 'Can be cold and uncaring.',                                 textVi: 'Có thể tỏ ra lạnh lùng, ít quan tâm.',                  explanationVi: '"Cold" = ít bộc lộ cảm xúc ấm áp; "uncaring" = không quá bận tâm đến cảm xúc hay hoàn cảnh của người khác. Ví dụ: bạn bè buồn mà bạn không để ý hoặc không biết cách an ủi.', isReversed: true,  isAttentionCheck: false },
	// formOrder 18 → item 18 · C · "Keeps things neat and tidy."
	{ itemNumber: 18, formOrder: 18, testType: 'BFI2S', domain: 'conscientiousness',    text: 'Keeps things neat and tidy.',                               textVi: 'Giữ mọi thứ gọn gàng, ngăn nắp.',                     explanationVi: '"Neat and tidy" = không gian sống và làm việc sạch sẽ, có hệ thống. Ví dụ: file được đặt tên rõ ràng, ghi chú có cấu trúc, bàn học không bừa bộn.', isReversed: false, isAttentionCheck: false },
	// formOrder 19 → item 19R · N reversed · "Is relaxed, handles stress well."
	{ itemNumber: 19, formOrder: 19, testType: 'BFI2S', domain: 'negativeEmotionality', text: 'Is relaxed, handles stress well.',                          textVi: 'Bình thản, xử lý căng thẳng tốt.',                    explanationVi: '"Relaxed" = không dễ căng thẳng; "handles stress well" = khi deadline dồn dập hay gặp áp lực, bạn vẫn giữ được sự tỉnh táo thay vì hoảng loạn.', isReversed: true,  isAttentionCheck: false },
	// formOrder 20 → item 20R · O reversed · "Has few artistic interests."
	{ itemNumber: 20, formOrder: 20, testType: 'BFI2S', domain: 'openMindedness',       text: 'Has few artistic interests.',                               textVi: 'Ít có hứng thú với các hoạt động nghệ thuật.',          explanationVi: '"Few artistic interests" = bạn không đặc biệt bị thu hút bởi hội họa, âm nhạc, điện ảnh hay các hình thức sáng tạo khác.', isReversed: true,  isAttentionCheck: false },
	// formOrder 21 → item 21R · E reversed · "Prefers to have others take charge."
	{ itemNumber: 21, formOrder: 21, testType: 'BFI2S', domain: 'extraversion',         text: 'Prefers to have others take charge.',                       textVi: 'Thích để người khác đứng ra lãnh đạo.',                explanationVi: '"Take charge" = đảm nhận vai trò quyết định. Câu này hỏi bạn có thoải mái hơn ở vị trí hỗ trợ thay vì đứng ra lãnh đạo không.', isReversed: true,  isAttentionCheck: false },
	// formOrder 22 → item 22 · A · "Is respectful, treats others with respect."
	{ itemNumber: 22, formOrder: 22, testType: 'BFI2S', domain: 'agreeableness',        text: 'Is respectful, treats others with respect.',                textVi: 'Tôn trọng mọi người, đối xử lịch thiệp.',             explanationVi: 'Câu này hỏi bạn có thường xuyên thể hiện sự tôn trọng trong lời nói và hành vi — dù đó là bạn bè, người lớn tuổi hay người lạ.', isReversed: false, isAttentionCheck: false },
	// formOrder 23 → item 23 · C · "Is persistent, works until the task is finished."
	{ itemNumber: 23, formOrder: 23, testType: 'BFI2S', domain: 'conscientiousness',    text: 'Is persistent, works until the task is finished.',          textVi: 'Kiên trì, làm việc cho đến khi hoàn thành.',           explanationVi: '"Persistent" = không dễ bỏ cuộc, kể cả khi gặp khó khăn. Bạn có phải người sẽ ngồi lại làm xong bài dù đã khuya, hay dễ chuyển sang việc khác?', isReversed: false, isAttentionCheck: false },
	// formOrder 24 → item 24R · N reversed · "Feels secure, comfortable with self."
	{ itemNumber: 24, formOrder: 24, testType: 'BFI2S', domain: 'negativeEmotionality', text: 'Feels secure, comfortable with self.',                      textVi: 'Cảm thấy an tâm, thoải mái với chính mình.',           explanationVi: '"Secure" = không hay tự nghi ngờ bản thân; "comfortable with self" = chấp nhận con người mình, không dằn vặt về những điểm yếu.', isReversed: true,  isAttentionCheck: false },
	// formOrder 25 = ATTENTION CHECK — "Hãy chọn số 1" (expected: 1) — excluded from scoring
	{ itemNumber: 99, formOrder: 25, testType: 'BFI2S', domain: 'openMindedness',       text: 'Hãy chọn số 1 ở câu này/Please choose number 1 for this question', textVi: 'Hãy chọn số 1 ở câu này/Please choose number 1 for this question', isReversed: false, isAttentionCheck: true, attentionCheckExpected: 1 },
	// formOrder 26 → item 25 · O · "Is complex, a deep thinker."
	{ itemNumber: 25, formOrder: 26, testType: 'BFI2S', domain: 'openMindedness',       text: 'Is complex, a deep thinker.',                               textVi: 'Hay suy nghĩ sâu sắc, nội tâm phong phú.',             explanationVi: '"Complex" = tâm hồn nhiều tầng lớp, không đơn giản; "deep thinker" = thích phân tích vấn đề từ nhiều góc độ, không dừng ở bề mặt. Ví dụ: xem phim xong bạn hay suy ngẫm về thông điệp ẩn.', isReversed: false, isAttentionCheck: false },
	// formOrder 27 → item 26R · E reversed · "Is less active than other people."
	{ itemNumber: 26, formOrder: 27, testType: 'BFI2S', domain: 'extraversion',         text: 'Is less active than other people.',                         textVi: 'Ít hoạt bát hơn so với mọi người.',                    explanationVi: '"Less active" = bạn cảm thấy mình ít vận động, ít tham gia hoạt động xã hội hơn những người xung quanh.', isReversed: true,  isAttentionCheck: false },
	// formOrder 28 → item 27R · A reversed · "Tends to find fault with others."
	{ itemNumber: 27, formOrder: 28, testType: 'BFI2S', domain: 'agreeableness',        text: 'Tends to find fault with others.',                          textVi: 'Hay chỉ ra lỗi sai của người khác.',                   explanationVi: '"Find fault" = có xu hướng tìm kiếm và nhấn mạnh khuyết điểm của người xung quanh thay vì bỏ qua. Không nhất thiết là xấu — có người coi đó là thẳng thắn.', isReversed: true,  isAttentionCheck: false },
	// formOrder 29 → item 28R · C reversed · "Can be somewhat careless."
	{ itemNumber: 28, formOrder: 29, testType: 'BFI2S', domain: 'conscientiousness',    text: 'Can be somewhat careless.',                                 textVi: 'Đôi khi hơi bất cẩn, thiếu cẩn thận.',                explanationVi: '"Careless" = không chú ý đến chi tiết — ví dụ: hay mắc lỗi đánh máy, quên kiểm tra lại bài, bỏ sót bước trong quy trình.', isReversed: true,  isAttentionCheck: false },
	// formOrder 30 → item 29 · N · "Is temperamental, gets emotional easily."
	{ itemNumber: 29, formOrder: 30, testType: 'BFI2S', domain: 'negativeEmotionality', text: 'Is temperamental, gets emotional easily.',                  textVi: 'Tính khí thất thường, dễ bị xúc động.',                explanationVi: '"Temperamental" = cảm xúc hay thay đổi bất ngờ — lúc vui lúc buồn; "gets emotional easily" = dễ xúc động, dễ khóc, hoặc dễ tức giận khi có chuyện xảy ra.', isReversed: false, isAttentionCheck: false },
	// formOrder 31 → item 30R · O reversed · "Has little creativity."
	{ itemNumber: 30, formOrder: 31, testType: 'BFI2S', domain: 'openMindedness',       text: 'Has little creativity.',                                    textVi: 'Ít sáng tạo, ít nghĩ ra cách làm mới.',                explanationVi: '"Little creativity" = bạn thường làm theo cách đã biết thay vì thử nghiệm phương pháp mới.', isReversed: true,  isAttentionCheck: false },
];
