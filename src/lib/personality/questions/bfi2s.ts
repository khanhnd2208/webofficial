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
	// formOrder 1 → item 1R · E reversed · "Tends to be quiet."
	{ itemNumber: 1,  formOrder: 1,  testType: 'BFI2S', domain: 'extraversion',         text: 'Tends to be quiet.',                                        textVi: 'Có xu hướng trầm lặng.',                                isReversed: true,  isAttentionCheck: false },
	// formOrder 2 → item 2 · A · "Is compassionate, has a soft heart."
	{ itemNumber: 2,  formOrder: 2,  testType: 'BFI2S', domain: 'agreeableness',        text: 'Is compassionate, has a soft heart.',                        textVi: 'Giàu lòng trắc ẩn, có trái tim mềm mỏng.',             isReversed: false, isAttentionCheck: false },
	// formOrder 3 → item 3R · C reversed · "Tends to be disorganized."
	{ itemNumber: 3,  formOrder: 3,  testType: 'BFI2S', domain: 'conscientiousness',    text: 'Tends to be disorganized.',                                 textVi: 'Có xu hướng thiếu tổ chức.',                            isReversed: true,  isAttentionCheck: false },
	// formOrder 4 → item 4 · N · "Worries a lot."
	{ itemNumber: 4,  formOrder: 4,  testType: 'BFI2S', domain: 'negativeEmotionality', text: 'Worries a lot.',                                            textVi: 'Hay lo lắng nhiều.',                                    isReversed: false, isAttentionCheck: false },
	// formOrder 5 → item 5 · O · "Is fascinated by art, music, or literature."
	{ itemNumber: 5,  formOrder: 5,  testType: 'BFI2S', domain: 'openMindedness',       text: 'Is fascinated by art, music, or literature.',               textVi: 'Say mê nghệ thuật, âm nhạc hoặc văn học.',             isReversed: false, isAttentionCheck: false },
	// formOrder 6 → item 6 · E · "Is dominant, acts as a leader."
	{ itemNumber: 6,  formOrder: 6,  testType: 'BFI2S', domain: 'extraversion',         text: 'Is dominant, acts as a leader.',                            textVi: 'Có tố chất lãnh đạo, hay dẫn đầu.',                    isReversed: false, isAttentionCheck: false },
	// formOrder 7 → item 7R · A reversed · "Is sometimes rude to others."
	{ itemNumber: 7,  formOrder: 7,  testType: 'BFI2S', domain: 'agreeableness',        text: 'Is sometimes rude to others.',                              textVi: 'Đôi khi thô lỗ với người khác.',                        isReversed: true,  isAttentionCheck: false },
	// formOrder 8 → item 8R · C reversed · "Has difficulty getting started on tasks."
	{ itemNumber: 8,  formOrder: 8,  testType: 'BFI2S', domain: 'conscientiousness',    text: 'Has difficulty getting started on tasks.',                  textVi: 'Khó bắt đầu công việc.',                                isReversed: true,  isAttentionCheck: false },
	// formOrder 9 → item 9 · N · "Tends to feel depressed, blue."
	{ itemNumber: 9,  formOrder: 9,  testType: 'BFI2S', domain: 'negativeEmotionality', text: 'Tends to feel depressed, blue.',                            textVi: 'Có xu hướng cảm thấy buồn bã, u sầu.',                 isReversed: false, isAttentionCheck: false },
	// formOrder 10 → item 10R · O reversed · "Has little interest in abstract ideas."
	{ itemNumber: 10, formOrder: 10, testType: 'BFI2S', domain: 'openMindedness',       text: 'Has little interest in abstract ideas.',                    textVi: 'Ít quan tâm đến các ý tưởng trừu tượng.',              isReversed: true,  isAttentionCheck: false },
	// formOrder 11 → item 11 · E · "Is full of energy."
	{ itemNumber: 11, formOrder: 11, testType: 'BFI2S', domain: 'extraversion',         text: 'Is full of energy.',                                        textVi: 'Tràn đầy năng lượng.',                                  isReversed: false, isAttentionCheck: false },
	// formOrder 12 → item 12 · A · "Assumes the best about people."
	{ itemNumber: 12, formOrder: 12, testType: 'BFI2S', domain: 'agreeableness',        text: 'Assumes the best about people.',                            textVi: 'Luôn nghĩ tốt về người khác.',                          isReversed: false, isAttentionCheck: false },
	// formOrder 13 → item 13 · C · "Is reliable, can always be counted on."
	{ itemNumber: 13, formOrder: 13, testType: 'BFI2S', domain: 'conscientiousness',    text: 'Is reliable, can always be counted on.',                    textVi: 'Đáng tin cậy, luôn được tin tưởng.',                    isReversed: false, isAttentionCheck: false },
	// formOrder 14 → item 14R · N reversed · "Is emotionally stable, not easily upset."
	{ itemNumber: 14, formOrder: 14, testType: 'BFI2S', domain: 'negativeEmotionality', text: 'Is emotionally stable, not easily upset.',                  textVi: 'Ổn định về cảm xúc, không dễ bực bội.',                isReversed: true,  isAttentionCheck: false },
	// formOrder 15 → item 15 · O · "Is original, comes up with new ideas."
	{ itemNumber: 15, formOrder: 15, testType: 'BFI2S', domain: 'openMindedness',       text: 'Is original, comes up with new ideas.',                     textVi: 'Sáng tạo, hay đưa ra ý tưởng mới.',                    isReversed: false, isAttentionCheck: false },
	// formOrder 16 → item 16 · E · "Is outgoing, sociable."
	{ itemNumber: 16, formOrder: 16, testType: 'BFI2S', domain: 'extraversion',         text: 'Is outgoing, sociable.',                                    textVi: 'Cởi mở, hòa đồng.',                                    isReversed: false, isAttentionCheck: false },
	// formOrder 17 → item 17R · A reversed · "Can be cold and uncaring."
	{ itemNumber: 17, formOrder: 17, testType: 'BFI2S', domain: 'agreeableness',        text: 'Can be cold and uncaring.',                                 textVi: 'Có thể lạnh lùng và vô tâm.',                           isReversed: true,  isAttentionCheck: false },
	// formOrder 18 → item 18 · C · "Keeps things neat and tidy."
	{ itemNumber: 18, formOrder: 18, testType: 'BFI2S', domain: 'conscientiousness',    text: 'Keeps things neat and tidy.',                               textVi: 'Giữ mọi thứ gọn gàng, ngăn nắp.',                      isReversed: false, isAttentionCheck: false },
	// formOrder 19 → item 19R · N reversed · "Is relaxed, handles stress well."
	{ itemNumber: 19, formOrder: 19, testType: 'BFI2S', domain: 'negativeEmotionality', text: 'Is relaxed, handles stress well.',                          textVi: 'Thư thái, xử lý stress tốt.',                          isReversed: true,  isAttentionCheck: false },
	// formOrder 20 → item 20R · O reversed · "Has few artistic interests."
	{ itemNumber: 20, formOrder: 20, testType: 'BFI2S', domain: 'openMindedness',       text: 'Has few artistic interests.',                               textVi: 'Ít quan tâm đến nghệ thuật.',                           isReversed: true,  isAttentionCheck: false },
	// formOrder 21 → item 21R · E reversed · "Prefers to have others take charge."
	{ itemNumber: 21, formOrder: 21, testType: 'BFI2S', domain: 'extraversion',         text: 'Prefers to have others take charge.',                        textVi: 'Thích để người khác dẫn đầu, lãnh đạo.',               isReversed: true,  isAttentionCheck: false },
	// formOrder 22 → item 22 · A · "Is respectful, treats others with respect."
	{ itemNumber: 22, formOrder: 22, testType: 'BFI2S', domain: 'agreeableness',        text: 'Is respectful, treats others with respect.',                textVi: 'Tôn trọng, đối xử tôn trọng với người khác.',          isReversed: false, isAttentionCheck: false },
	// formOrder 23 → item 23 · C · "Is persistent, works until the task is finished."
	{ itemNumber: 23, formOrder: 23, testType: 'BFI2S', domain: 'conscientiousness',    text: 'Is persistent, works until the task is finished.',          textVi: 'Kiên trì, làm việc đến khi hoàn thành.',               isReversed: false, isAttentionCheck: false },
	// formOrder 24 → item 24R · N reversed · "Feels secure, comfortable with self."
	{ itemNumber: 24, formOrder: 24, testType: 'BFI2S', domain: 'negativeEmotionality', text: 'Feels secure, comfortable with self.',                      textVi: 'Cảm thấy an toàn, thoải mái với bản thân.',            isReversed: true,  isAttentionCheck: false },
	// formOrder 25 = ATTENTION CHECK — "Hãy chọn số 1" (expected: 1) — excluded from scoring
	{ itemNumber: 99, formOrder: 25, testType: 'BFI2S', domain: 'openMindedness',       text: 'Hãy chọn số 1 ở câu này/Please choose number 1 for this question', textVi: 'Hãy chọn số 1 ở câu này/Please choose number 1 for this question', isReversed: false, isAttentionCheck: true, attentionCheckExpected: 1 },
	// formOrder 26 → item 25 · O · "Is complex, a deep thinker."
	{ itemNumber: 25, formOrder: 26, testType: 'BFI2S', domain: 'openMindedness',       text: 'Is complex, a deep thinker.',                               textVi: 'Phức tạp, suy nghĩ sâu sắc.',                          isReversed: false, isAttentionCheck: false },
	// formOrder 27 → item 26R · E reversed · "Is less active than other people."
	{ itemNumber: 26, formOrder: 27, testType: 'BFI2S', domain: 'extraversion',         text: 'Is less active than other people.',                         textVi: 'Ít năng động hơn những người khác.',                    isReversed: true,  isAttentionCheck: false },
	// formOrder 28 → item 27R · A reversed · "Tends to find fault with others."
	{ itemNumber: 27, formOrder: 28, testType: 'BFI2S', domain: 'agreeableness',        text: 'Tends to find fault with others.',                          textVi: 'Hay tìm lỗi ở người khác.',                            isReversed: true,  isAttentionCheck: false },
	// formOrder 29 → item 28R · C reversed · "Can be somewhat careless."
	{ itemNumber: 28, formOrder: 29, testType: 'BFI2S', domain: 'conscientiousness',    text: 'Can be somewhat careless.',                                 textVi: 'Đôi khi hơi bất cẩn.',                                 isReversed: true,  isAttentionCheck: false },
	// formOrder 30 → item 29 · N · "Is temperamental, gets emotional easily."
	{ itemNumber: 29, formOrder: 30, testType: 'BFI2S', domain: 'negativeEmotionality', text: 'Is temperamental, gets emotional easily.',                  textVi: 'Dễ bị xúc động, cảm xúc thay đổi thất thường.',        isReversed: false, isAttentionCheck: false },
	// formOrder 31 → item 30R · O reversed · "Has little creativity."
	{ itemNumber: 30, formOrder: 31, testType: 'BFI2S', domain: 'openMindedness',       text: 'Has little creativity.',                                    textVi: 'Ít sáng tạo.',                                          isReversed: true,  isAttentionCheck: false },
];
