/* ════════════════════════════════════════════════════════════════════════
   Personality Test — Scoring Engine
   
   Core business logic for:
   1. Attention check validation
   2. Reverse scoring
   3. Domain-level trait averaging (BFI-2-S OCEAN + SD3 Dark Triad)
   4. Archetype/persona profile generation
   
   Academic references:
   - BFI-2-S: Soto & John (2017) — 30-item short form
   - SD3: Jones & Paulhus (2014) — 27-item measure
   
   IMPORTANT: `itemNumber` = academic item numbering (used for scoring).
              `formOrder`   = order displayed in the Google Form survey (1-based).
              Questions are PRESENTED to the user sorted by `formOrder`.
   ════════════════════════════════════════════════════════════════════════ */

import type {
	QuestionConfig,
	RawResponse,
	ScoringResult,
	TraitScore,
	OceanScores,
	DarkTriadScores,
	OceanDomain,
	DarkTriadDomain,
	PersonalityDomain,
	ArchetypeProfile,
} from '@/types/personalityTest';

// ─── Constants ─────────────────────────────────────────────────────────────────

const LIKERT_MIN = 1;
const LIKERT_MAX = 5;
const REVERSE_CONSTANT = 6; // Reversed score = 6 - raw score

// Trait level is now computed from z-score in normativeData.ts (5-tier system).
// A preliminary 3-tier is still used at scoring time (before percentile calculation)
// and is overridden once z-scores are available in the results dashboard.
const LEVEL_LOW_THRESHOLD = 2.5;
const LEVEL_HIGH_THRESHOLD = 3.5;

// ─── BFI-2-S Question Configuration (30 items) ────────────────────────────────
// Source: Soto & John (2017). Short and extra-short forms of the Big Five
// Inventory–2: The BFI-2-S and BFI-2-XS.
//
// `formOrder` matches the exact column order from the Google Form spreadsheet.
// The form presents questions in a DIFFERENT order than the academic item numbering.
//
// Form order mapping (formOrder → academic itemNumber → domain):
//   Form  1 → Item 16R (Extraversion)     "Tends to be quiet"
//   Form  2 → Item  7  (Agreeableness)    "Is compassionate"
//   Form  3 → Item  8R (Conscientiousness) "Tends to be disorganized"
//   Form  4 → Item  4  (Neg. Emot.)       "Worries a lot"
//   Form  5 → Item  5R (Open-Mindedness)  "Few artistic interests"
//   Form  6 → Item  1  (Extraversion)     "Is outgoing, sociable"
//   Form  7 → Item 12R (Agreeableness)    "Sometimes rude to others"
//   Form  8 → Item  3  (Conscientiousness) "Is dependable, steady"
//   Form  9 → Item  9R (Neg. Emot.)       "Relaxed, handles stress well"
//   Form 10 → Item 10  (Open-Mindedness)  "Curious about many things"
//   Form 11 → Item 21  (Extraversion)     "Full of energy"
//   Form 12 → Item  2R (Agreeableness)    "Tends to find fault"
//   Form 13 → Item 23  (Conscientiousness) "Keeps things neat"
//   Form 14 → Item 14  (Neg. Emot.)       "Tends to feel depressed"
//   Form 15 → Item 15  (Open-Mindedness)  "Is inventive"
//   Form 16 → Item  6  (Extraversion)     "Is dominant, leader"
//   Form 17 → Item 17  (Agreeableness)    "Assumes the best"
//   Form 18 → Item 13  (Conscientiousness) "Is persistent"
//   Form 19 → Item 19R (Neg. Emot.)       "Emotionally stable"
//   Form 20 → Item 20R (Open-Mindedness)  "Little interest in abstract ideas"
//   Form 21 → Item 26  (Extraversion)     "Shows enthusiasm"
//   Form 22 → Item 22R (Agreeableness)    "Can be cold and uncaring"
//   Form 23 → Item 28R (Conscientiousness) "Easily distracted"
//   Form 24 → Item 24  (Neg. Emot.)       "Moody, mood swings"
//   Form 25 = ATTENTION CHECK — "Hãy chọn số 1" (expected: 1) — stored as col 31 in Excel; excluded from scoring
//   Form 26 → Item 25  (Open-Mindedness)  "Is complex, a deep thinker" ← RESTORED (was missing)
//   Form 27 → Item 11R (Extraversion)     "Less active than other people"
//   Form 28 → Item 27  (Agreeableness)    "Respectful"
//   Form 29 → Item 18R (Conscientiousness) "Can be careless"
//   Form 30 → Item 29  (Neg. Emot.)       "Can be tense"
//   Form 31 → Item 30R (Open-Mindedness)  "Prefers routine work"

export const BFI2S_QUESTIONS: QuestionConfig[] = [
	// formOrder 1 → academic item 16R Extraversion
	{ itemNumber: 16, formOrder: 1,  testType: 'BFI2S', domain: 'extraversion',         text: 'I am someone who tends to be quiet.',                                textVi: 'Tôi là người có xu hướng trầm lặng.',                          isReversed: true,  isAttentionCheck: false },
	// formOrder 2 → academic item 7 Agreeableness
	{ itemNumber: 7,  formOrder: 2,  testType: 'BFI2S', domain: 'agreeableness',        text: 'I am someone who is compassionate, has a soft heart.',               textVi: 'Tôi là người giàu lòng trắc ẩn.',                              isReversed: false, isAttentionCheck: false },
	// formOrder 3 → academic item 8R Conscientiousness
	{ itemNumber: 8,  formOrder: 3,  testType: 'BFI2S', domain: 'conscientiousness',    text: 'I am someone who tends to be disorganized.',                         textVi: 'Tôi là người có xu hướng thiếu tổ chức.',                      isReversed: true,  isAttentionCheck: false },
	// formOrder 4 → academic item 4 Negative Emotionality
	{ itemNumber: 4,  formOrder: 4,  testType: 'BFI2S', domain: 'negativeEmotionality', text: 'I am someone who worries a lot.',                                    textVi: 'Tôi là người hay lo lắng.',                                    isReversed: false, isAttentionCheck: false },
	// formOrder 5 → academic item 5R Open-Mindedness
	{ itemNumber: 5,  formOrder: 5,  testType: 'BFI2S', domain: 'openMindedness',       text: 'I am someone who has few artistic interests.',                       textVi: 'Tôi là người ít quan tâm đến nghệ thuật.',                     isReversed: true,  isAttentionCheck: false },
	// formOrder 6 → academic item 1 Extraversion
	{ itemNumber: 1,  formOrder: 6,  testType: 'BFI2S', domain: 'extraversion',         text: 'I am someone who is outgoing, sociable.',                            textVi: 'Tôi là người cởi mở, hòa đồng.',                              isReversed: false, isAttentionCheck: false },
	// formOrder 7 → academic item 12R Agreeableness
	{ itemNumber: 12, formOrder: 7,  testType: 'BFI2S', domain: 'agreeableness',        text: 'I am someone who is sometimes rude to others.',                      textVi: 'Tôi là người đôi khi thô lỗ với người khác.',                  isReversed: true,  isAttentionCheck: false },
	// formOrder 8 → academic item 3 Conscientiousness
	{ itemNumber: 3,  formOrder: 8,  testType: 'BFI2S', domain: 'conscientiousness',    text: 'I am someone who is dependable, steady.',                            textVi: 'Tôi là người đáng tin cậy, kiên định.',                        isReversed: false, isAttentionCheck: false },
	// formOrder 9 → academic item 9R Negative Emotionality
	{ itemNumber: 9,  formOrder: 9,  testType: 'BFI2S', domain: 'negativeEmotionality', text: 'I am someone who is relaxed, handles stress well.',                  textVi: 'Tôi là người thư thái, xử lý stress tốt.',                    isReversed: true,  isAttentionCheck: false },
	// formOrder 10 → academic item 10 Open-Mindedness
	{ itemNumber: 10, formOrder: 10, testType: 'BFI2S', domain: 'openMindedness',       text: 'I am someone who is curious about many different things.',           textVi: 'Tôi là người tò mò về nhiều thứ khác nhau.',                   isReversed: false, isAttentionCheck: false },
	// formOrder 11 → academic item 21 Extraversion
	{ itemNumber: 21, formOrder: 11, testType: 'BFI2S', domain: 'extraversion',         text: 'I am someone who is full of energy.',                                textVi: 'Tôi là người tràn đầy năng lượng.',                            isReversed: false, isAttentionCheck: false },
	// formOrder 12 → academic item 2R Agreeableness
	{ itemNumber: 2,  formOrder: 12, testType: 'BFI2S', domain: 'agreeableness',        text: 'I am someone who tends to find fault with others.',                  textVi: 'Tôi là người hay tìm lỗi ở người khác.',                      isReversed: true,  isAttentionCheck: false },
	// formOrder 13 → academic item 23 Conscientiousness
	{ itemNumber: 23, formOrder: 13, testType: 'BFI2S', domain: 'conscientiousness',    text: 'I am someone who keeps things neat and tidy.',                       textVi: 'Tôi là người giữ mọi thứ gọn gàng, ngăn nắp.',                isReversed: false, isAttentionCheck: false },
	// formOrder 14 → academic item 14 Negative Emotionality
	{ itemNumber: 14, formOrder: 14, testType: 'BFI2S', domain: 'negativeEmotionality', text: 'I am someone who tends to feel depressed, blue.',                    textVi: 'Tôi là người có xu hướng cảm thấy buồn bã, u sầu.',           isReversed: false, isAttentionCheck: false },
	// formOrder 15 → academic item 15 Open-Mindedness
	{ itemNumber: 15, formOrder: 15, testType: 'BFI2S', domain: 'openMindedness',       text: 'I am someone who is inventive, finds clever ways to do things.',    textVi: 'Tôi là người sáng tạo, tìm ra cách thông minh để làm việc.',   isReversed: false, isAttentionCheck: false },
	// formOrder 16 → academic item 6 Extraversion
	{ itemNumber: 6,  formOrder: 16, testType: 'BFI2S', domain: 'extraversion',         text: 'I am someone who is dominant, acts as a leader.',                    textVi: 'Tôi là người có tố chất lãnh đạo.',                            isReversed: false, isAttentionCheck: false },
	// formOrder 17 → academic item 17 Agreeableness
	{ itemNumber: 17, formOrder: 17, testType: 'BFI2S', domain: 'agreeableness',        text: 'I am someone who assumes the best about people.',                    textVi: 'Tôi là người luôn nghĩ tốt về người khác.',                    isReversed: false, isAttentionCheck: false },
	// formOrder 18 → academic item 13 Conscientiousness
	{ itemNumber: 13, formOrder: 18, testType: 'BFI2S', domain: 'conscientiousness',    text: 'I am someone who is persistent, works until the task is finished.',  textVi: 'Tôi là người kiên trì, làm việc đến khi hoàn thành.',          isReversed: false, isAttentionCheck: false },
	// formOrder 19 → academic item 19R Negative Emotionality
	{ itemNumber: 19, formOrder: 19, testType: 'BFI2S', domain: 'negativeEmotionality', text: 'I am someone who is emotionally stable, not easily upset.',          textVi: 'Tôi là người ổn định về cảm xúc, không dễ bực bội.',           isReversed: true,  isAttentionCheck: false },
	// formOrder 20 → academic item 20R Open-Mindedness
	{ itemNumber: 20, formOrder: 20, testType: 'BFI2S', domain: 'openMindedness',       text: 'I am someone who has little interest in abstract ideas.',            textVi: 'Tôi là người ít quan tâm đến các ý tưởng trừu tượng.',         isReversed: true,  isAttentionCheck: false },
	// formOrder 21 → academic item 26 Extraversion
	{ itemNumber: 26, formOrder: 21, testType: 'BFI2S', domain: 'extraversion',         text: 'I am someone who shows a lot of enthusiasm.',                        textVi: 'Tôi là người thể hiện nhiều nhiệt huyết.',                     isReversed: false, isAttentionCheck: false },
	// formOrder 22 → academic item 22R Agreeableness
	{ itemNumber: 22, formOrder: 22, testType: 'BFI2S', domain: 'agreeableness',        text: 'I am someone who can be cold and uncaring.',                         textVi: 'Tôi là người có thể lạnh lùng và vô tâm.',                     isReversed: true,  isAttentionCheck: false },
	// formOrder 23 → academic item 28R Conscientiousness
	{ itemNumber: 28, formOrder: 23, testType: 'BFI2S', domain: 'conscientiousness',    text: 'I am someone who is easily distracted.',                             textVi: 'Tôi là người dễ bị phân tâm.',                                 isReversed: true,  isAttentionCheck: false },
	// formOrder 24 → academic item 24 Negative Emotionality
	{ itemNumber: 24, formOrder: 24, testType: 'BFI2S', domain: 'negativeEmotionality', text: 'I am someone who is moody, has up and down mood swings.',            textVi: 'Tôi là người hay thay đổi tâm trạng.',                         isReversed: false, isAttentionCheck: false },
	// formOrder 25 = ATTENTION CHECK — "Hãy chọn số 1" — interleaved in middle of BFI block
	// Stored in Excel as column 31 (separate); NOT included in Open-Mindedness scoring
	{ itemNumber: 99, formOrder: 25, testType: 'BFI2S', domain: 'openMindedness',       text: 'Please select number 1 for this question. / Hãy chọn số 1 ở câu này.',  textVi: 'Hãy chọn số 1 ở câu này/Please choose number 1 for this question', isReversed: false, isAttentionCheck: true, attentionCheckExpected: 1 },
	// formOrder 26 → academic item 25 Open-Mindedness — RESTORED (was wrongly used as attention check)
	{ itemNumber: 25, formOrder: 26, testType: 'BFI2S', domain: 'openMindedness',       text: 'I am someone who is complex, a deep thinker.',                       textVi: 'Tôi là người phức tạp, suy nghĩ sâu.',                         isReversed: false, isAttentionCheck: false },
	// formOrder 27 → academic item 11R Extraversion
	{ itemNumber: 11, formOrder: 27, testType: 'BFI2S', domain: 'extraversion',         text: 'I am someone who is less active than other people.',                 textVi: 'Tôi là người ít năng động hơn những người khác.',              isReversed: true,  isAttentionCheck: false },
	// formOrder 28 → academic item 27 Agreeableness
	{ itemNumber: 27, formOrder: 28, testType: 'BFI2S', domain: 'agreeableness',        text: 'I am someone who is respectful, treats others with respect.',        textVi: 'Tôi là người tôn trọng, đối xử tôn trọng với người khác.',     isReversed: false, isAttentionCheck: false },
	// formOrder 29 → academic item 18R Conscientiousness
	{ itemNumber: 18, formOrder: 29, testType: 'BFI2S', domain: 'conscientiousness',    text: 'I am someone who can be somewhat careless.',                         textVi: 'Tôi là người đôi khi hơi bất cẩn.',                            isReversed: true,  isAttentionCheck: false },
	// formOrder 30 → academic item 29 Negative Emotionality
	{ itemNumber: 29, formOrder: 30, testType: 'BFI2S', domain: 'negativeEmotionality', text: 'I am someone who can be tense.',                                     textVi: 'Tôi là người có thể bị căng thẳng.',                           isReversed: false, isAttentionCheck: false },
	// formOrder 31 → academic item 30R Open-Mindedness
	{ itemNumber: 30, formOrder: 31, testType: 'BFI2S', domain: 'openMindedness',       text: 'I am someone who prefers work that is routine and simple.',          textVi: 'Tôi là người thích công việc đơn giản, lặp đi lặp lại.',       isReversed: true,  isAttentionCheck: false },
];

// ─── SD3 Question Configuration (27 items) ─────────────────────────────────────
// Source: Jones & Paulhus (2014). Introducing the Short Dark Triad (SD3)
//
// The form presents SD3 questions INTERLEAVED across domains (M-N-P-M-N-P pattern),
// NOT grouped by domain. `formOrder` matches the exact Google Form column order.
//
// Form order mapping (formOrder → academic itemNumber → domain):
//   Form  1 → M1  "It's not wise to tell your secrets"
//   Form  2 → N10 "People see me as a natural leader"
//   Form  3 → P19 "I like to get revenge on authorities"
//   Form  4 → M2  "I like to use clever manipulation"
//   Form  5 → N11R "I hate being the center of attention"
//   Form  6 → P20R "I avoid dangerous situations"
//   Form  7 → M3  "Whatever it takes, get important people on your side"
//   Form  8 → N12 "Many group activities dull without me"
//   Form  9 → P21 "Payback needs to be quick and nasty"
//   Form 10 → M4  "Avoid direct conflict, useful in the future"
//   Form 11 → N13 "I know I am special"
//   Form 12 → P22 "People say I am out of control"
//   Form 13 → M5  "Keep track of information against people"
//   Form 14 → N14 "I like to get acquainted with important people"
//   Form 15 → P23 "I can be mean to others"
//   Form 16 → M6  "Wait for the right time to get back at people"
//   Form 17 = ATTENTION CHECK — "Choose number 2" (expected: 2) — stored as col 28 in Excel; excluded from scoring
//   Form 18 → N17R "I feel embarrassed if someone compliments me"  (academic N17R)
//   Form 19 → P24  "People who mess with me always regret it"
//   Form 20 → M7   "Hide things to preserve your reputation"
//   Form 21 → N16  "I have been compared to famous people"  ← matches Google Form column order
//   Form 22 → P25R "I have never gotten into trouble with the law"
//   Form 23 → M8   "Make sure plans benefit yourself"
//   Form 24 → N15R "I am an average person" ← RESTORED REVERSE ITEM
//   Form 25 → P26  "I enjoy having sex with people I hardly know"
//   Form 26 → M9   "Most people can be manipulated"
//   Form 27 → N18  "I insist on getting the respect I deserve"
//   Form 28 → P27  "I'll say anything to get what I want"

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
	// formOrder 17 = ATTENTION CHECK — "Choose number 2" — stored as col 28 in Excel; NOT in any domain score
	{ itemNumber: 98, formOrder: 17, testType: 'SD3', domain: 'narcissism',       text: 'Choose number 2 if you are still here with us.',                                   textVi: 'Đây là câu kiểm tra sự chú ý. Hãy chọn số 2 (Không đồng ý).',           isReversed: false, isAttentionCheck: true, attentionCheckExpected: 2 },
	// formOrder 18 → N17R (N8 in narc subscale) "I feel embarrassed if someone compliments me" — itemNumber 17 = N8 = 9th narc item (10..18)
	{ itemNumber: 17, formOrder: 18, testType: 'SD3', domain: 'narcissism',       text: 'I feel embarrassed if someone compliments me.',                                    textVi: 'Tôi cảm thấy ngại khi ai đó khen ngợi mình.',                            isReversed: true,  isAttentionCheck: false },
	// formOrder 19 → P24 (P6 in psych subscale) "People who mess with me always regret it"
	{ itemNumber: 24, formOrder: 19, testType: 'SD3', domain: 'psychopathy',      text: 'People who mess with me always regret it.',                                        textVi: 'Người chọc giận tôi luôn phải hối hận.',                                  isReversed: false, isAttentionCheck: false },
	// formOrder 20 → M7 "There are things you should hide from other people to preserve your reputation"
	{ itemNumber: 7,  formOrder: 20, testType: 'SD3', domain: 'machiavellianism', text: 'There are things you should hide from other people to preserve your reputation.',  textVi: 'Có những thứ bạn nên giấu người khác để giữ gìn danh tiếng.',            isReversed: false, isAttentionCheck: false },
	// formOrder 21 → N16 "I have been compared to famous people"
	{ itemNumber: 16, formOrder: 21, testType: 'SD3', domain: 'narcissism',       text: 'I have been compared to famous people.',                                           textVi: 'Tôi từng được so sánh với những người nổi tiếng.',                        isReversed: false, isAttentionCheck: false },
	// formOrder 22 → P25R "I have never gotten into trouble with the law"
	{ itemNumber: 25, formOrder: 22, testType: 'SD3', domain: 'psychopathy',      text: 'I have never gotten into trouble with the law.',                                   textVi: 'Tôi chưa bao giờ gặp rắc rối với pháp luật.',                             isReversed: true,  isAttentionCheck: false },
	// formOrder 23 → M8 "Make sure your plans benefit yourself, not others"
	{ itemNumber: 8,  formOrder: 23, testType: 'SD3', domain: 'machiavellianism', text: 'Make sure your plans benefit yourself, not others.',                               textVi: 'Đảm bảo kế hoạch có lợi cho bản thân, không phải người khác.',           isReversed: false, isAttentionCheck: false },
	// formOrder 24 → N15R "I am an average person" — RESTORED REVERSE ITEM
	{ itemNumber: 15, formOrder: 24, testType: 'SD3', domain: 'narcissism',       text: 'I am an average person.',                                                          textVi: 'Tôi là một người bình thường.',                                            isReversed: true,  isAttentionCheck: false },
	// formOrder 25 → P26 "I enjoy having sex with people I hardly know"
	{ itemNumber: 26, formOrder: 25, testType: 'SD3', domain: 'psychopathy',      text: 'I enjoy having sex with people I hardly know.',                                    textVi: 'I enjoy having sex with people I hardly know.',                                    isReversed: false, isAttentionCheck: false },
	// formOrder 26 → M9 "Most people can be manipulated"
	{ itemNumber: 9,  formOrder: 26, testType: 'SD3', domain: 'machiavellianism', text: 'Most people can be manipulated.',                                                  textVi: 'Hầu hết mọi người đều có thể bị thao túng.',                             isReversed: false, isAttentionCheck: false },
	// formOrder 27 → N18 "I insist on getting the respect I deserve"
	{ itemNumber: 18, formOrder: 27, testType: 'SD3', domain: 'narcissism',       text: 'I insist on getting the respect I deserve.',                                       textVi: 'Tôi đòi hỏi được nhận sự tôn trọng mà tôi xứng đáng.',                  isReversed: false, isAttentionCheck: false },
	// formOrder 28 → P27 "I'll say anything to get what I want"
	{ itemNumber: 27, formOrder: 28, testType: 'SD3', domain: 'psychopathy',      text: "I'll say anything to get what I want.",                                             textVi: 'Tôi sẵn sàng nói bất cứ điều gì để đạt được điều mình muốn.',             isReversed: false, isAttentionCheck: false },
];

// ─── Human-readable Labels ──────────────────────────────────────────────────────

const DOMAIN_LABELS: Record<PersonalityDomain, string> = {
	extraversion: 'Extraversion',
	agreeableness: 'Agreeableness',
	conscientiousness: 'Conscientiousness',
	negativeEmotionality: 'Negative Emotionality',
	openMindedness: 'Open-Mindedness',
	machiavellianism: 'Machiavellianism',
	narcissism: 'Narcissism',
	psychopathy: 'Psychopathy',
};

export const DOMAIN_LABELS_VI: Record<PersonalityDomain, string> = {
	extraversion: 'Hướng ngoại',
	agreeableness: 'Dễ chịu',
	conscientiousness: 'Tận tâm',
	negativeEmotionality: 'Cảm xúc tiêu cực',
	openMindedness: 'Cởi mở',
	machiavellianism: 'Mưu lược',
	narcissism: 'Ái kỷ',
	psychopathy: 'Thái nhân cách',
};

// ─── Likert Scale Labels ────────────────────────────────────────────────────────

export const LIKERT_LABELS: Record<number, string> = {
	1: 'Strongly Disagree',
	2: 'Disagree',
	3: 'Neutral',
	4: 'Agree',
	5: 'Strongly Agree',
};

export const LIKERT_LABELS_VI: Record<number, string> = {
	1: 'Rất không đồng ý',
	2: 'Không đồng ý',
	3: 'Trung lập',
	4: 'Đồng ý',
	5: 'Rất đồng ý',
};

// ════════════════════════════════════════════════════════════════════════════════
// SCORING ENGINE
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Validates that a raw response value is within the Likert scale range.
 */
function isValidLikertValue(value: number): boolean {
	return Number.isInteger(value) && value >= LIKERT_MIN && value <= LIKERT_MAX;
}

/**
 * Step 1: Validate attention checks.
 * Returns { valid: true } or { valid: false, reason: string }.
 */
export function validateAttentionChecks(
	responses: RawResponse[]
): { valid: true } | { valid: false; reason: string } {
	const allQuestions = [...BFI2S_QUESTIONS, ...SD3_QUESTIONS];
	const attentionChecks = allQuestions.filter((q) => q.isAttentionCheck);

	for (const check of attentionChecks) {
		const response = responses.find(
			(r) => r.testType === check.testType && r.itemNumber === check.itemNumber
		);
		if (!response) {
			return {
				valid: false,
				reason: `Missing response for attention check: ${check.testType} item ${check.itemNumber}`,
			};
		}
		if (response.value !== check.attentionCheckExpected) {
			return {
				valid: false,
				reason: `Failed attention check: ${check.testType} item ${check.itemNumber} — expected ${check.attentionCheckExpected}, got ${response.value}`,
			};
		}
	}
	return { valid: true };
}

/**
 * Step 2: Apply reverse scoring where needed.
 * Returns the effective score for a given response.
 */
export function getEffectiveScore(
	rawValue: number,
	isReversed: boolean
): number {
	return isReversed ? REVERSE_CONSTANT - rawValue : rawValue;
}

/**
 * Step 3: Calculate the average score for a specific domain.
 */
function calculateDomainScore(
	domain: PersonalityDomain,
	questions: QuestionConfig[],
	responses: RawResponse[]
): number {
	const domainQuestions = questions.filter(
		(q) => q.domain === domain && !q.isAttentionCheck
	);

	if (domainQuestions.length === 0) return 0;

	let total = 0;
	let count = 0;

	for (const q of domainQuestions) {
		const response = responses.find(
			(r) => r.testType === q.testType && r.itemNumber === q.itemNumber
		);
		if (response && isValidLikertValue(response.value)) {
			total += getEffectiveScore(response.value, q.isReversed);
			count++;
		}
	}

	return count > 0 ? Math.round((total / count) * 100) / 100 : 0;
}

/**
 * Determine a preliminary level label for a raw score (1-5 scale).
 * This is a coarse 3-tier estimate used immediately after scoring,
 * before z-score calculation. The results dashboard overrides this
 * with the 5-tier z-score system once percentiles are computed.
 */
function getLevel(score: number): 'very_low' | 'low' | 'moderate' | 'high' | 'very_high' {
	if (score < LEVEL_LOW_THRESHOLD) return 'low';
	if (score > LEVEL_HIGH_THRESHOLD) return 'high';
	return 'moderate';
}

/**
 * Build a TraitScore object for a domain.
 */
function buildTraitScore(
	domain: PersonalityDomain,
	questions: QuestionConfig[],
	responses: RawResponse[]
): TraitScore {
	const score = calculateDomainScore(domain, questions, responses);
	return {
		domain,
		score,
		label: DOMAIN_LABELS[domain],
		percentile: null, // Calculated later via aggregation
		level: getLevel(score),
	};
}

/**
 * Main scoring function: validates, scores, and generates archetype.
 * 
 * IMPORTANT: Always computes scores regardless of attention check results.
 * If attention checks fail, isValid=false but ocean/darkTriad/archetype are
 * still populated so users can see results for educational purposes.
 * All data is saved to DB regardless of validity.
 */
export function scorePersonalityTest(responses: RawResponse[]): ScoringResult {
	// ── Validation: count check ──
	// BFI: 30 real items + 1 attention check = 31 total
	// SD3: 27 real items + 1 attention check = 28 total → grand total 59
	const totalExpected = BFI2S_QUESTIONS.length + SD3_QUESTIONS.length;
	if (responses.length !== totalExpected) {
		return {
			isValid: false,
			invalidReason: `Expected ${totalExpected} responses, got ${responses.length}`,
			ocean: null,
			darkTriad: null,
			archetype: null,
		};
	}

	// Validate all values are valid Likert
	for (const r of responses) {
		if (!isValidLikertValue(r.value)) {
			return {
				isValid: false,
				invalidReason: `Invalid response value ${r.value} for ${r.testType} item ${r.itemNumber}`,
				ocean: null,
				darkTriad: null,
				archetype: null,
			};
		}
	}

	// ── Attention Checks — record result but don't block scoring ──
	const attentionResult = validateAttentionChecks(responses);

	// ── Calculate OCEAN Scores (always, regardless of attention check) ──
	const oceanDomains: OceanDomain[] = [
		'extraversion',
		'agreeableness',
		'conscientiousness',
		'negativeEmotionality',
		'openMindedness',
	];
	const oceanScores: OceanScores = {} as OceanScores;
	for (const domain of oceanDomains) {
		oceanScores[domain] = buildTraitScore(domain, BFI2S_QUESTIONS, responses);
	}

	// ── Calculate Dark Triad Scores (always, regardless of attention check) ──
	const darkDomains: DarkTriadDomain[] = [
		'machiavellianism',
		'narcissism',
		'psychopathy',
	];
	const darkTriadScores: DarkTriadScores = {} as DarkTriadScores;
	for (const domain of darkDomains) {
		darkTriadScores[domain] = buildTraitScore(domain, SD3_QUESTIONS, responses);
	}

	// ── Generate Archetype (always) ──
	const archetype = generateArchetype(oceanScores, darkTriadScores);

	return {
		isValid: attentionResult.valid,
		invalidReason: attentionResult.valid ? undefined : attentionResult.reason,
		ocean: oceanScores,
		darkTriad: darkTriadScores,
		archetype,
	};
}

// ════════════════════════════════════════════════════════════════════════════════
// ARCHETYPE ENGINE
// ════════════════════════════════════════════════════════════════════════════════

interface ArchetypeRule {
	name: string;
	tagline: string;
	icon: string;
	colorTheme: ArchetypeProfile['colorTheme'];
	/** Returns a priority score (0 = no match). Higher = stronger match. */
	match: (ocean: OceanScores, dark: DarkTriadScores) => number;
	strengths: string[];
	blindspots: string[];
	narrative: string;
}

const ARCHETYPE_RULES: ArchetypeRule[] = [
	// ── 1. The Strategic Executor ──
	{
		name: 'The Strategic Executor',
		tagline: 'Discipline meets strategic awareness',
		icon: '♟️',
		colorTheme: 'amber',
		match: (o, d) => {
			let score = 0;
			if (o.conscientiousness.level === 'high') score += 3;
			if (d.machiavellianism.level === 'high') score += 3;
			if (o.agreeableness.level !== 'high') score += 1;
			return score >= 5 ? score : 0;
		},
		strengths: [
			'Exceptional project execution — delivers results regardless of obstacles',
			'Strategic resource allocation — reads organizational politics flawlessly',
			'Long-term planning with pragmatic flexibility when needed',
			'High reliability under ambiguous or high-pressure conditions',
		],
		blindspots: [
			'May sacrifice team morale for efficiency — "the mission over the people"',
			'Prone to information hoarding as a power lever',
			'Risk of becoming the person who "always has an agenda"',
			'Can erode trust over time due to perceived inauthenticity',
			'The "Brilliant Jerk" trap: organizations ultimately remove people who deliver results but destroy team culture — no matter how talented they are',
		],
		narrative:
			'You combine the disciplined work ethic of high Conscientiousness with the strategic calculus of Machiavellianism. In organizations, you are the person who gets things done — efficiently, precisely, and with full awareness of the political landscape. Your danger zone? When your pragmatism crosses into manipulation, you risk becoming the leader people respect but never truly trust. Research consistently shows: long-term career success depends more on trust than on tactics.',
	},

	// ── 2. The Charismatic Disruptor ──
	{
		name: 'The Charismatic Disruptor',
		tagline: 'Magnetic presence with a volatile core',
		icon: '⚡',
		colorTheme: 'rose',
		match: (o, d) => {
			let score = 0;
			if (o.extraversion.level === 'high') score += 3;
			if (d.narcissism.level === 'high') score += 3;
			if (o.openMindedness.level === 'high') score += 1;
			return score >= 5 ? score : 0;
		},
		strengths: [
			'Exceptional at inspiring and rallying teams around a vision',
			'Natural confidence that opens doors and creates opportunities',
			'High energy and enthusiasm that is genuinely contagious',
			'Comfortable taking bold risks when others hesitate',
		],
		blindspots: [
			'Feedback resistance — may dismiss criticism as jealousy or incompetence',
			'Risk of over-promising and under-delivering to maintain image',
			'Can unconsciously create a "cult of personality" that stifles dissent',
			'May prioritize personal glory over collective success',
		],
		narrative:
			'Your high Extraversion gives you magnetic social energy, amplified by a Narcissistic confidence that makes you a natural center of gravity. You thrive in roles requiring vision-casting and persuasion. The critical blindspot: you may confuse admiration for connection, and your need for validation can sabotage the very relationships you depend on.',
	},

	// ── 3. The Cold Architect ──
	{
		name: 'The Detached Analyst',
		tagline: 'Calm intellect, high cost of disconnection',
		icon: '🏛️',
		colorTheme: 'indigo',
		match: (o, d) => {
			let score = 0;
			if (o.openMindedness.level === 'high') score += 2;
			if (o.negativeEmotionality.level === 'low') score += 2;
			if (d.psychopathy.level === 'high') score += 3;
			if (o.agreeableness.level === 'low') score += 1;
			return score >= 5 ? score : 0;
		},
		strengths: [
			'Calm under crisis — can make clear-headed decisions when others panic',
			'Sees systemic patterns others miss due to analytical open-mindedness',
			'Capable of making hard, unpopular decisions without emotional paralysis',
			'Valuable in restructuring, turnarounds, and crisis leadership',
		],
		blindspots: [
			'Emotional detachment can drift into indifference to human cost — without you noticing',
			'May unconsciously view people as "resources" to be optimized, eroding team trust',
			'Risk of creating toxic environments disguised as "high performance" culture',
			'Long-term isolation as colleagues learn to keep their distance — this is the highest career cost of this profile',
			'Organizations ultimately remove people who deliver results but destroy team culture (the "Brilliant Jerk" effect)',
		],
		narrative:
			'Your combination of Open-Mindedness, emotional stability (low Negative Emotionality), and elevated subclinical Psychopathy creates a profile of intellectual fearlessness. You can design complex systems and make tough calls others cannot. However — and this is critical — your emotional detachment, while an asset in crisis, becomes a serious liability in sustained relationships. The research is clear: the long-term cost of low empathy in leadership is isolation, talent flight, and eventual organizational pushback.',
	},

	// ── 4. The Empathic Strategist ──
	{
		name: 'The Empathic Strategist',
		tagline: 'Heart of gold, mind of a chess player',
		icon: '🎭',
		colorTheme: 'teal',
		match: (o, d) => {
			let score = 0;
			if (o.agreeableness.level === 'high') score += 3;
			if (d.machiavellianism.level === 'moderate' || d.machiavellianism.level === 'high') score += 2;
			if (o.conscientiousness.level === 'high') score += 1;
			if (d.psychopathy.level === 'low') score += 1;
			return score >= 5 ? score : 0;
		},
		strengths: [
			'Reads people with remarkable accuracy — combines empathy with strategic thinking',
			'Builds genuine alliances while maintaining awareness of political dynamics',
			'Excellent mediator — uses social intelligence to resolve complex conflicts',
			'Trusted enough to receive confidential information, smart enough to use it wisely',
		],
		blindspots: [
			'Internal conflict between genuine care and calculated moves can cause stress',
			'Risk of being perceived as "two-faced" if strategy overrides authenticity',
			'May over-invest emotionally in strategic relationships, leading to burnout',
			'Could rationalize manipulative behavior as "helping" others',
		],
		narrative:
			'You are the rare profile that balances genuine warmth with strategic awareness. High Agreeableness gives you authentic empathy, while your Machiavellian awareness means you understand the game even if you don\'t always play it. Your challenge is maintaining integrity when your strategic mind tempts you to "manage" people rather than truly connect with them.',
	},

	// ── 5. The Vulnerable Perfectionist ──
	{
		name: 'The Vulnerable Perfectionist',
		tagline: 'Driven by anxiety, sharpened by standards',
		icon: '🔬',
		colorTheme: 'purple',
		match: (o, d) => {
			let score = 0;
			if (o.conscientiousness.level === 'high') score += 3;
			if (o.negativeEmotionality.level === 'high') score += 3;
			if (d.narcissism.level === 'low' || d.narcissism.level === 'moderate') score += 1;
			return score >= 5 ? score : 0;
		},
		strengths: [
			'Exceptionally thorough — catches errors others overlook due to heightened vigilance',
			'Self-aware about limitations in ways that drive genuine improvement',
			'High accountability — takes ownership of failures rather than deflecting',
			'Produces consistently high-quality work fueled by intrinsic standards',
		],
		blindspots: [
			'Paralysis by analysis — the pursuit of perfection can delay critical decisions',
			'Chronic self-doubt undermines leadership presence and authority',
			'Risk of burnout from sustained emotional intensity paired with high standards',
			'May inadvertently project their anxiety onto team members',
		],
		narrative:
			'Your high Conscientiousness drives you to excel, but it\'s fueled by an anxious engine (high Negative Emotionality). You are the person who triple-checks everything — not because you\'re thorough by nature, but because your anxiety won\'t let you rest until it\'s right. This can produce extraordinary work, but the personal cost is high. Your growth edge: learning that "good enough" is sometimes excellent.',
	},

	// ── 6. The Balanced Operator ──
	{
		name: 'The Balanced Operator',
		tagline: 'Steady hands, clear conscience',
		icon: '⚖️',
		colorTheme: 'emerald',
		match: (o, d) => {
			let score = 0;
			// All dark triad traits low
			if (d.machiavellianism.level === 'low') score += 2;
			if (d.narcissism.level === 'low') score += 2;
			if (d.psychopathy.level === 'low') score += 2;
			// At least moderate positive traits
			if (o.agreeableness.level !== 'low') score += 1;
			if (o.conscientiousness.level !== 'low') score += 1;
			return score >= 6 ? score : 0;
		},
		strengths: [
			'High interpersonal trust — teams feel safe and supported around you',
			'Consistent, reliable performance without the drama or politics',
			'Excellent at building sustainable, healthy team cultures',
			'Genuine integrity that creates long-term organizational loyalty',
		],
		blindspots: [
			'May be outmaneuvered by more politically savvy colleagues',
			'Risk of being overlooked for promotions in highly competitive environments',
			'Could be slow to recognize or respond to manipulative behavior in others',
			'May avoid necessary confrontation in pursuit of harmony',
		],
		narrative:
			'Your profile shows low Dark Triad tendencies paired with constructive personality traits. You are the organizational backbone — trustworthy, ethical, and consistent. In healthy organizations, you thrive and rise. The risk? In toxic environments, your integrity can become a disadvantage when others play games you refuse to engage in.',
	},
];

/**
 * Fallback archetype when no specific rule matches strongly.
 */
const FALLBACK_ARCHETYPE: ArchetypeProfile = {
	name: 'The Complex Mosaic',
	tagline: 'Defying simple categorization',
	icon: '🧩',
	colorTheme: 'purple',
	strengths: [
		'Multifaceted personality that adapts across different contexts',
		'No single dominant tendency — provides versatility and flexibility',
		'Capable of understanding diverse perspectives due to mixed trait profile',
		'Harder to predict, which can be an advantage in negotiations and creativity',
	],
	blindspots: [
		'May struggle with a clear sense of professional identity or direction',
		'Mixed motivations can create internal conflict during high-stakes decisions',
		'Others may find it hard to "read" you, creating trust ambiguity',
		'Risk of context-switching stress as different situations activate different traits',
	],
	narrative:
		'Your personality profile doesn\'t fit neatly into a single archetype — and that\'s not a weakness. You are a complex blend of light and shadow traits that manifests differently depending on context. Your growth opportunity lies in developing self-awareness about which "version" of yourself shows up in different situations, and making that a conscious choice rather than an automatic reaction.',
};

/**
 * Match scores against archetype rules and return the best-fit persona.
 */
export function generateArchetype(
	ocean: OceanScores,
	darkTriad: DarkTriadScores
): ArchetypeProfile {
	let bestMatch: ArchetypeRule | null = null;
	let bestScore = 0;

	for (const rule of ARCHETYPE_RULES) {
		const score = rule.match(ocean, darkTriad);
		if (score > bestScore) {
			bestScore = score;
			bestMatch = rule;
		}
	}

	if (!bestMatch) {
		return FALLBACK_ARCHETYPE;
	}

	return {
		name: bestMatch.name,
		tagline: bestMatch.tagline,
		icon: bestMatch.icon,
		colorTheme: bestMatch.colorTheme,
		strengths: bestMatch.strengths,
		blindspots: bestMatch.blindspots,
		narrative: bestMatch.narrative,
	};
}

/**
 * Get the full test configuration for the client.
 * Questions are sorted by formOrder so they appear in Google Form order.
 */
export function getTestConfig() {
	const bfiSorted = [...BFI2S_QUESTIONS].sort((a, b) => a.formOrder - b.formOrder);
	const sd3Sorted = [...SD3_QUESTIONS].sort((a, b) => a.formOrder - b.formOrder);

	return {
		bfiQuestions: bfiSorted,
		sd3Questions: sd3Sorted,
		totalQuestions: BFI2S_QUESTIONS.length + SD3_QUESTIONS.length,
		likertScale: {
			min: LIKERT_MIN,
			max: LIKERT_MAX,
			labels: LIKERT_LABELS,
		},
	};
}
