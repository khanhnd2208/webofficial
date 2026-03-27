/* ════════════════════════════════════════════════════════════════════════
   SD3 Question Configuration (27 items + 1 attention check)

   Source: Jones & Paulhus (2014). Introducing the Short Dark Triad (SD3)

   The form presents SD3 questions INTERLEAVED across domains (M-N-P pattern),
   NOT grouped by domain. `formOrder` matches the exact Google Form column order.

   Form order mapping (formOrder → academic itemNumber → domain):
     Form  1 → M1  "It's not wise to tell your secrets"
     Form  2 → N10 "People see me as a natural leader"
     Form  3 → P19 "I like to get revenge on authorities"
     Form  4 → M2  "I like to use clever manipulation"
     Form  5 → N11R "I hate being the center of attention"
     Form  6 → P20R "I avoid dangerous situations"
     Form  7 → M3  "Whatever it takes, get important people on your side"
     Form  8 → N12 "Many group activities dull without me"
     Form  9 → P21 "Payback needs to be quick and nasty"
     Form 10 → M4  "Avoid direct conflict, useful in the future"
     Form 11 → N13 "I know I am special"
     Form 12 → P22 "People say I am out of control"
     Form 13 → M5  "Keep track of information against people"
     Form 14 → N14 "I like to get acquainted with important people"
     Form 15 → P23 "I can be mean to others"
     Form 16 → M6  "Wait for the right time to get back at people"
     Form 17 = ATTENTION CHECK — "Choose number 2" (expected: 2)
     Form 18 → N17R "I feel embarrassed if someone compliments me"
     Form 19 → P24  "People who mess with me always regret it"
     Form 20 → M7   "Hide things to preserve your reputation"
     Form 21 → N16  "I have been compared to famous people"
     Form 22 → P25R "I have never gotten into trouble with the law"
     Form 23 → M8   "Make sure plans benefit yourself"
     Form 24 → N15R "I am an average person" ← RESTORED REVERSE ITEM
     Form 25 → P26  "I enjoy having sex with people I hardly know"
     Form 26 → M9   "Most people can be manipulated"
     Form 27 → N18  "I insist on getting the respect I deserve"
     Form 28 → P27  "I'll say anything to get what I want"
   ════════════════════════════════════════════════════════════════════════ */

import type { QuestionConfig } from '@/types/personalityTest';

export const SD3_QUESTIONS: QuestionConfig[] = [
	// ── Machiavellianism (M) ────────────────────────────────────────────────────
	// formOrder 1 → M1
	{ itemNumber: 1,  formOrder: 1,  testType: 'SD3', domain: 'machiavellianism', text: "It's not wise to tell your secrets.",                                        textVi: 'Không khôn ngoan khi để lộ bí mật của mình.',                            explanationVi: 'Câu này hỏi mức độ bạn tin rằng nên giữ kín thông tin cá nhân để bảo vệ bản thân — thay vì chia sẻ cởi mở với mọi người.', isReversed: false, isAttentionCheck: false },
	// formOrder 2 → N10
	{ itemNumber: 10, formOrder: 2,  testType: 'SD3', domain: 'narcissism',       text: 'People see me as a natural leader.',                                          textVi: 'Mọi người xem tôi là nhà lãnh đạo bẩm sinh.',                            explanationVi: '"Natural leader" = bạn tin rằng người khác tự nhiên nhìn nhận bạn ở vị trí dẫn dắt, không cần phải chứng minh. Ở đây nhấn mạnh nhận thức về sự ngưỡng mộ từ người khác.', isReversed: false, isAttentionCheck: false },
	// formOrder 3 → P19
	{ itemNumber: 19, formOrder: 3,  testType: 'SD3', domain: 'psychopathy',      text: 'I like to get revenge on authorities.',                                        textVi: 'Tôi thích trả đũa những người nắm quyền.',                                explanationVi: '"Revenge on authorities" = có xu hướng chống đối, muốn trả miếng khi bị người có quyền lực (giảng viên, sếp, quản lý) gây khó dễ hoặc đối xử bất công.', isReversed: false, isAttentionCheck: false },
	// formOrder 4 → M2
	{ itemNumber: 2,  formOrder: 4,  testType: 'SD3', domain: 'machiavellianism', text: 'I like to use clever manipulation to get my way.',                            textVi: 'Tôi thích dùng chiến thuật khéo léo để đạt mục đích.', explanationVi: '"Clever manipulation" = sử dụng các kỹ thuật giao tiếp một cách có tính toán (ví dụ: nịnh nọt, tạo ấn tượng, kiểm soát thông tin) để đạt được những gì mình muốn.', isReversed: false, isAttentionCheck: false },
	// formOrder 5 → N11R
	{ itemNumber: 11, formOrder: 5,  testType: 'SD3', domain: 'narcissism',       text: 'I hate being the center of attention.',                                       textVi: 'Tôi ghét phải trở thành trung tâm sự chú ý.',                            explanationVi: 'Câu này hỏi bạn có khó chịu khi trở thành tâm điểm của mọi người không — hay ngược lại, bạn tận hưởng việc được chú ý và tỏa sáng.', isReversed: true,  isAttentionCheck: false },
	// formOrder 6 → P20R
	{ itemNumber: 20, formOrder: 6,  testType: 'SD3', domain: 'psychopathy',      text: 'I avoid dangerous situations.',                                                textVi: 'Tôi thường tránh những tình huống nguy hiểm.',                            explanationVi: '"Avoid dangerous situations" = bạn cẩn thận, không tìm kiếm cảm giác mạnh. Hay bạn là người thích mạo hiểm, ưa kích thích?', isReversed: true,  isAttentionCheck: false },
	// formOrder 7 → M3
	{ itemNumber: 3,  formOrder: 7,  testType: 'SD3', domain: 'machiavellianism', text: 'Whatever it takes, you must get the important people on your side.',          textVi: 'Dù bằng cách nào, bạn phải tranh thủ được những người có ảnh hưởng.',     explanationVi: '"Whatever it takes" = sẵn sàng dùng mọi phương tiện để kéo người có quyền lực về phía mình. Câu này hỏi bạn có sẵn sàng làm như vậy không.', isReversed: false, isAttentionCheck: false },
	// formOrder 8 → N12
	{ itemNumber: 12, formOrder: 8,  testType: 'SD3', domain: 'narcissism',       text: 'Many group activities tend to be dull without me.',                            textVi: 'Nhiều hoạt động nhóm trở nên nhàm chán nếu thiếu tôi.',                  explanationVi: 'Bạn có tin rằng sự hiện diện của mình tạo ra sự khác biệt đáng kể cho nhóm không? Câu này hỏi về cách bạn đánh giá vai trò của bản thân trong các hoạt động chung.', isReversed: false, isAttentionCheck: false },
	// formOrder 9 → P21
	{ itemNumber: 21, formOrder: 9,  testType: 'SD3', domain: 'psychopathy',      text: 'Payback needs to be quick and nasty.',                                         textVi: 'Trả đũa cần phải nhanh gọn và mạnh tay.',                                explanationVi: '"Quick and nasty" = không chần chừ khi trả thù và sẵn sàng gây tổn thương. Câu này hỏi về xu hướng hành động bốc đồng, thiếu suy xét hậu quả.', isReversed: false, isAttentionCheck: false },
	// formOrder 10 → M4
	{ itemNumber: 4,  formOrder: 10, testType: 'SD3', domain: 'machiavellianism', text: 'Avoid direct conflict with others because they may be useful in the future.', textVi: 'Nên tránh xung đột trực tiếp vì họ có thể hữu ích trong tương lai.',     explanationVi: 'Câu này hỏi mức độ bạn tính toán dài hạn trong quan hệ: không đối đầu vì muốn giữ "lợi thế" sau này, thay vì vì lịch sự hay tử tế.', isReversed: false, isAttentionCheck: false },
	// formOrder 11 → N13
	{ itemNumber: 13, formOrder: 11, testType: 'SD3', domain: 'narcissism',       text: 'I know that I am special because everyone keeps telling me so.',               textVi: 'Tôi biết mình đặc biệt vì mọi người luôn nói vậy.',                      explanationVi: '"Everyone keeps telling me" = bạn diễn giải phản hồi từ người khác như bằng chứng cho sự đặc biệt của mình. Câu này hỏi về mức độ bạn cảm thấy mình khác biệt so với đa số.', isReversed: false, isAttentionCheck: false },
	// formOrder 12 → P22
	{ itemNumber: 22, formOrder: 12, testType: 'SD3', domain: 'psychopathy',      text: 'People often say I am out of control.',                                        textVi: 'Mọi người thường nói tôi khó kiểm soát bản thân.',                        explanationVi: '"Out of control" = hành vi thất thường, khó dự đoán — có thể bao gồm nổi giận bất ngờ, chi tiêu bừa bãi, hoặc hành động không suy nghĩ.', isReversed: false, isAttentionCheck: false },
	// formOrder 13 → M5
	{ itemNumber: 5,  formOrder: 13, testType: 'SD3', domain: 'machiavellianism', text: "It's wise to keep track of information that you can use against people later.", textVi: 'Khôn ngoan là lưu giữ thông tin để có thể dùng gây áp lực sau này.',      explanationVi: 'Câu này hỏi bạn có xem thông tin như "vũ khí" không — ghi nhớ điểm yếu hay bí mật của người khác để dùng khi cần.', isReversed: false, isAttentionCheck: false },
	// formOrder 14 → N14
	{ itemNumber: 14, formOrder: 14, testType: 'SD3', domain: 'narcissism',       text: 'I like to get acquainted with important people.',                              textVi: 'Tôi thích kết giao với những người có tầm ảnh hưởng.',                    explanationVi: '"Important people" = người có quyền lực, danh tiếng, ảnh hưởng xã hội. Câu này hỏi bạn có chủ động muốn kết nối với những người như vậy không.', isReversed: false, isAttentionCheck: false },
	// formOrder 15 → P23
	{ itemNumber: 23, formOrder: 15, testType: 'SD3', domain: 'psychopathy',      text: "It's true that I can be mean to others.",                                      textVi: 'Đúng là tôi có thể cư xử tàn nhẫn với người khác.',                       explanationVi: '"Mean" = gây tổn thương cảm xúc hoặc thể chất một cách có chủ ý hoặc thờ ơ. Câu này hỏi bạn có tự nhận mình đôi khi hành xử ác ý không.', isReversed: false, isAttentionCheck: false },
	// formOrder 16 → M6
	{ itemNumber: 6,  formOrder: 16, testType: 'SD3', domain: 'machiavellianism', text: 'You should wait for the right time to get back at people.',                   textVi: 'Nên chờ đúng thời điểm để trả đũa.',                                     explanationVi: 'Câu này hỏi bạn có tin rằng nên kiên nhẫn chờ đúng thời điểm thuận lợi nhất để trả đũa không, thay vì phản ứng ngay.', isReversed: false, isAttentionCheck: false },
	// formOrder 17 = ATTENTION CHECK — "Choose number 2" — NOT in any domain score
	{ itemNumber: 98, formOrder: 17, testType: 'SD3', domain: 'narcissism',       text: 'Choose number 2 if you are still here with us.',                                   textVi: 'Đây là câu kiểm tra sự chú ý. Hãy chọn số 2 (Không đồng ý).',           isReversed: false, isAttentionCheck: true, attentionCheckExpected: 2 },
	// formOrder 18 → N17R
	{ itemNumber: 17, formOrder: 18, testType: 'SD3', domain: 'narcissism',       text: 'I feel embarrassed if someone compliments me.',                                    textVi: 'Tôi cảm thấy ngại ngùng khi được người khác khen.',                       explanationVi: '"Embarrassed by compliments" = không thoải mái khi nhận lời khen. Câu này hỏi bạn có ngại ngùng khi được khen không, hay bạn tận hưởng việc đó.', isReversed: true,  isAttentionCheck: false },
	// formOrder 19 → P24
	{ itemNumber: 24, formOrder: 19, testType: 'SD3', domain: 'psychopathy',      text: 'People who mess with me always regret it.',                                        textVi: 'Ai chọc giận tôi đều phải hối hận.',                                      explanationVi: '"Always regret it" = bạn tin rằng mình luôn trả đũa thành công và đối phương sẽ phải chịu hậu quả. Câu này hỏi về xu hướng trừng phạt người làm phiền bạn.', isReversed: false, isAttentionCheck: false },
	// formOrder 20 → M7
	{ itemNumber: 7,  formOrder: 20, testType: 'SD3', domain: 'machiavellianism', text: 'There are things you should hide from other people to preserve your reputation.',  textVi: 'Có những điều nên giấu để bảo vệ danh tiếng bản thân.',                   explanationVi: 'Câu này hỏi bạn có tin rằng việc kiểm soát thông tin cá nhân là cần thiết để duy trì hình ảnh tốt trước người khác không.', isReversed: false, isAttentionCheck: false },
	// formOrder 21 → N16
	{ itemNumber: 16, formOrder: 21, testType: 'SD3', domain: 'narcissism',       text: 'I have been compared to famous people.',                                           textVi: 'Tôi từng được so sánh với những người nổi tiếng.',                        explanationVi: '"Compared to famous people" = bạn tin rằng người khác nhìn thấy ở bạn những phẩm chất tương đương với người nổi tiếng.', isReversed: false, isAttentionCheck: false },
	// formOrder 22 → P25R
	{ itemNumber: 25, formOrder: 22, testType: 'SD3', domain: 'psychopathy',      text: 'I have never gotten into trouble with the law.',                                   textVi: 'Tôi chưa bao giờ gặp rắc rối với pháp luật.',                             explanationVi: 'Câu này hỏi bạn có luôn tuân thủ luật pháp và chưa từng có xung đột với hệ thống pháp lý không.', isReversed: true,  isAttentionCheck: false },
	// formOrder 23 → M8
	{ itemNumber: 8,  formOrder: 23, testType: 'SD3', domain: 'machiavellianism', text: 'Make sure your plans benefit yourself, not others.',                               textVi: 'Luôn đảm bảo kế hoạch có lợi cho bản thân, không phải cho người khác.',   explanationVi: 'Câu này hỏi bạn có thường đặt lợi ích cá nhân lên trên lợi ích tập thể khi lập kế hoạch không.', isReversed: false, isAttentionCheck: false },
	// formOrder 24 → N15R "I am an average person" — RESTORED REVERSE ITEM
	{ itemNumber: 15, formOrder: 24, testType: 'SD3', domain: 'narcissism',       text: 'I am an average person.',                                                          textVi: 'Tôi là một người bình thường.',                                            explanationVi: '"Average person" = bạn tự nhìn nhận mình không có gì đặc biệt hơn người khác. Câu này hỏi bạn có chấp nhận mình là người "bình thường" không.', isReversed: true,  isAttentionCheck: false },
	// formOrder 25 → P26
	{ itemNumber: 26, formOrder: 25, testType: 'SD3', domain: 'psychopathy',      text: 'I enjoy having sex with people I hardly know.',                                    textVi: 'Tôi thích quan hệ thân mật với người mình hầu như không quen biết.',       explanationVi: 'Câu này hỏi về xu hướng tìm kiếm trải nghiệm mới, mạo hiểm trong quan hệ — ít cân nhắc rủi ro, ưu tiên cảm giác mạnh.', isReversed: false, isAttentionCheck: false },
	// formOrder 26 → M9
	{ itemNumber: 9,  formOrder: 26, testType: 'SD3', domain: 'machiavellianism', text: 'Most people can be manipulated.',                                                  textVi: 'Hầu hết mọi người đều có thể bị thao túng.',                              explanationVi: 'Câu này hỏi bạn có tin rằng hầu hết mọi người đều dễ bị điều khiển không — một cái nhìn hoài nghi về bản chất con người.', isReversed: false, isAttentionCheck: false },
	// formOrder 27 → N18
	{ itemNumber: 18, formOrder: 27, testType: 'SD3', domain: 'narcissism',       text: 'I insist on getting the respect I deserve.',                                       textVi: 'Tôi đòi hỏi được nhận sự tôn trọng xứng đáng.',                          explanationVi: '"Insist" = không chỉ mong muốn mà còn yêu cầu, đòi hỏi sự tôn trọng. Câu này hỏi bạn có cảm thấy mình xứng đáng được đối xử đặc biệt không.', isReversed: false, isAttentionCheck: false },
	// formOrder 28 → P27
	{ itemNumber: 27, formOrder: 28, testType: 'SD3', domain: 'psychopathy',      text: "I'll say anything to get what I want.",                                             textVi: 'Tôi sẵn sàng nói bất cứ điều gì để đạt được mục đích.',                   explanationVi: '"Say anything" = sẵn sàng nói dối, phóng đại, hay bịa đặt miễn là đạt được mục tiêu. Câu này hỏi bạn có cảm thấy tội lỗi khi không trung thực không.', isReversed: false, isAttentionCheck: false },
];
