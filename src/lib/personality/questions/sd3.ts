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
	// formOrder 1 → M1
	{ itemNumber: 1,  formOrder: 1,  testType: 'SD3', domain: 'machiavellianism', text: "It's not wise to tell your secrets.",                                        textVi: 'Không khôn ngoan khi tiết lộ bí mật của bạn.',                           isReversed: false, isAttentionCheck: false },
	// formOrder 2 → N10
	{ itemNumber: 10, formOrder: 2,  testType: 'SD3', domain: 'narcissism',       text: 'People see me as a natural leader.',                                          textVi: 'Mọi người xem tôi là một nhà lãnh đạo bẩm sinh.',                        isReversed: false, isAttentionCheck: false },
	// formOrder 3 → P19
	{ itemNumber: 19, formOrder: 3,  testType: 'SD3', domain: 'psychopathy',      text: 'I like to get revenge on authorities.',                                        textVi: 'Tôi thích trả thù những người có quyền lực.',                             isReversed: false, isAttentionCheck: false },
	// formOrder 4 → M2
	{ itemNumber: 2,  formOrder: 4,  testType: 'SD3', domain: 'machiavellianism', text: 'I like to use clever manipulation to get my way.',                            textVi: 'Tôi thích dùng thủ thuật khéo léo để đạt được mục đích.',                isReversed: false, isAttentionCheck: false },
	// formOrder 5 → N11R
	{ itemNumber: 11, formOrder: 5,  testType: 'SD3', domain: 'narcissism',       text: 'I hate being the center of attention.',                                       textVi: 'Tôi ghét trở thành trung tâm của sự chú ý.',                             isReversed: true,  isAttentionCheck: false },
	// formOrder 6 → P20R
	{ itemNumber: 20, formOrder: 6,  testType: 'SD3', domain: 'psychopathy',      text: 'I avoid dangerous situations.',                                                textVi: 'Tôi tránh những tình huống nguy hiểm.',                                   isReversed: true,  isAttentionCheck: false },
	// formOrder 7 → M3
	{ itemNumber: 3,  formOrder: 7,  testType: 'SD3', domain: 'machiavellianism', text: 'Whatever it takes, you must get the important people on your side.',          textVi: 'Dù bằng cách nào, bạn phải lôi kéo được những người quan trọng về phía mình.', isReversed: false, isAttentionCheck: false },
	// formOrder 8 → N12
	{ itemNumber: 12, formOrder: 8,  testType: 'SD3', domain: 'narcissism',       text: 'Many group activities tend to be dull without me.',                            textVi: 'Nhiều hoạt động nhóm trở nên nhàm chán nếu thiếu tôi.',                  isReversed: false, isAttentionCheck: false },
	// formOrder 9 → P21
	{ itemNumber: 21, formOrder: 9,  testType: 'SD3', domain: 'psychopathy',      text: 'Payback needs to be quick and nasty.',                                         textVi: 'Trả đũa cần phải nhanh và mạnh.',                                         isReversed: false, isAttentionCheck: false },
	// formOrder 10 → M4
	{ itemNumber: 4,  formOrder: 10, testType: 'SD3', domain: 'machiavellianism', text: 'Avoid direct conflict with others because they may be useful in the future.', textVi: 'Tránh xung đột trực tiếp vì họ có thể hữu ích trong tương lai.',         isReversed: false, isAttentionCheck: false },
	// formOrder 11 → N13
	{ itemNumber: 13, formOrder: 11, testType: 'SD3', domain: 'narcissism',       text: 'I know that I am special because everyone keeps telling me so.',               textVi: 'Tôi biết mình đặc biệt vì mọi người luôn nói như vậy.',                  isReversed: false, isAttentionCheck: false },
	// formOrder 12 → P22
	{ itemNumber: 22, formOrder: 12, testType: 'SD3', domain: 'psychopathy',      text: 'People often say I am out of control.',                                        textVi: 'Mọi người thường nói tôi mất kiểm soát.',                                 isReversed: false, isAttentionCheck: false },
	// formOrder 13 → M5
	{ itemNumber: 5,  formOrder: 13, testType: 'SD3', domain: 'machiavellianism', text: "It's wise to keep track of information that you can use against people later.", textVi: 'Khôn ngoan là ghi nhớ thông tin để có thể dùng chống lại người khác sau này.', isReversed: false, isAttentionCheck: false },
	// formOrder 14 → N14
	{ itemNumber: 14, formOrder: 14, testType: 'SD3', domain: 'narcissism',       text: 'I like to get acquainted with important people.',                              textVi: 'Tôi thích quen biết những người quan trọng.',                             isReversed: false, isAttentionCheck: false },
	// formOrder 15 → P23
	{ itemNumber: 23, formOrder: 15, testType: 'SD3', domain: 'psychopathy',      text: "It's true that I can be mean to others.",                                      textVi: 'Đúng là tôi có thể ác ý với người khác.',                                 isReversed: false, isAttentionCheck: false },
	// formOrder 16 → M6
	{ itemNumber: 6,  formOrder: 16, testType: 'SD3', domain: 'machiavellianism', text: 'You should wait for the right time to get back at people.',                   textVi: 'Bạn nên chờ đúng thời điểm để trả đũa người khác.',                     isReversed: false, isAttentionCheck: false },
	// formOrder 17 = ATTENTION CHECK — "Choose number 2" — NOT in any domain score
	{ itemNumber: 98, formOrder: 17, testType: 'SD3', domain: 'narcissism',       text: 'Choose number 2 if you are still here with us.',                                   textVi: 'Đây là câu kiểm tra sự chú ý. Hãy chọn số 2 (Không đồng ý).',           isReversed: false, isAttentionCheck: true, attentionCheckExpected: 2 },
	// formOrder 18 → N17R
	{ itemNumber: 17, formOrder: 18, testType: 'SD3', domain: 'narcissism',       text: 'I feel embarrassed if someone compliments me.',                                    textVi: 'Tôi cảm thấy ngại khi ai đó khen ngợi mình.',                            isReversed: true,  isAttentionCheck: false },
	// formOrder 19 → P24
	{ itemNumber: 24, formOrder: 19, testType: 'SD3', domain: 'psychopathy',      text: 'People who mess with me always regret it.',                                        textVi: 'Người chọc giận tôi luôn phải hối hận.',                                  isReversed: false, isAttentionCheck: false },
	// formOrder 20 → M7
	{ itemNumber: 7,  formOrder: 20, testType: 'SD3', domain: 'machiavellianism', text: 'There are things you should hide from other people to preserve your reputation.',  textVi: 'Có những thứ bạn nên giấu người khác để giữ gìn danh tiếng.',            isReversed: false, isAttentionCheck: false },
	// formOrder 21 → N16
	{ itemNumber: 16, formOrder: 21, testType: 'SD3', domain: 'narcissism',       text: 'I have been compared to famous people.',                                           textVi: 'Tôi từng được so sánh với những người nổi tiếng.',                        isReversed: false, isAttentionCheck: false },
	// formOrder 22 → P25R
	{ itemNumber: 25, formOrder: 22, testType: 'SD3', domain: 'psychopathy',      text: 'I have never gotten into trouble with the law.',                                   textVi: 'Tôi chưa bao giờ gặp rắc rối với pháp luật.',                             isReversed: true,  isAttentionCheck: false },
	// formOrder 23 → M8
	{ itemNumber: 8,  formOrder: 23, testType: 'SD3', domain: 'machiavellianism', text: 'Make sure your plans benefit yourself, not others.',                               textVi: 'Đảm bảo kế hoạch có lợi cho bản thân, không phải người khác.',           isReversed: false, isAttentionCheck: false },
	// formOrder 24 → N15R "I am an average person" — RESTORED REVERSE ITEM
	{ itemNumber: 15, formOrder: 24, testType: 'SD3', domain: 'narcissism',       text: 'I am an average person.',                                                          textVi: 'Tôi là một người bình thường.',                                            isReversed: true,  isAttentionCheck: false },
	// formOrder 25 → P26
	{ itemNumber: 26, formOrder: 25, testType: 'SD3', domain: 'psychopathy',      text: 'I enjoy having sex with people I hardly know.',                                    textVi: 'I enjoy having sex with people I hardly know.',                                    isReversed: false, isAttentionCheck: false },
	// formOrder 26 → M9
	{ itemNumber: 9,  formOrder: 26, testType: 'SD3', domain: 'machiavellianism', text: 'Most people can be manipulated.',                                                  textVi: 'Hầu hết mọi người đều có thể bị thao túng.',                             isReversed: false, isAttentionCheck: false },
	// formOrder 27 → N18
	{ itemNumber: 18, formOrder: 27, testType: 'SD3', domain: 'narcissism',       text: 'I insist on getting the respect I deserve.',                                       textVi: 'Tôi đòi hỏi được nhận sự tôn trọng mà tôi xứng đáng.',                  isReversed: false, isAttentionCheck: false },
	// formOrder 28 → P27
	{ itemNumber: 27, formOrder: 28, testType: 'SD3', domain: 'psychopathy',      text: "I'll say anything to get what I want.",                                             textVi: 'Tôi sẵn sàng nói bất cứ điều gì để đạt được điều mình muốn.',             isReversed: false, isAttentionCheck: false },
];
