/* ════════════════════════════════════════════════════════════════════════
   Personality Test — Internationalisation (EN / VI)

   Design decisions:
   - English is the primary language (academic standard).
   - Vietnamese toggle translates ALL user-facing text.
   - Terminology annotations: when translating a technical term,
     the original English is shown in parentheses so students
     learn both the concept AND the English vocabulary.
   ════════════════════════════════════════════════════════════════════════ */

import type { PersonalityDomain } from '@/types/personalityTest';

export type Lang = 'en' | 'vi';

// ─── Domain labels ─────────────────────────────────────────────────────────────

export const DOMAIN_EN: Record<PersonalityDomain, string> = {
	extraversion: 'Extraversion',
	agreeableness: 'Agreeableness',
	conscientiousness: 'Conscientiousness',
	negativeEmotionality: 'Negative Emotionality',
	openMindedness: 'Open-Mindedness',
	machiavellianism: 'Machiavellianism',
	narcissism: 'Narcissism',
	psychopathy: 'Psychopathy',
};

export const DOMAIN_VI: Record<PersonalityDomain, string> = {
	extraversion: 'Hướng ngoại (Extraversion)',
	agreeableness: 'Dễ chịu (Agreeableness)',
	conscientiousness: 'Tận tâm (Conscientiousness)',
	negativeEmotionality: 'Cảm xúc tiêu cực (Negative Emotionality)',
	openMindedness: 'Cởi mở (Open-Mindedness)',
	machiavellianism: 'Mưu lược (Machiavellianism)',
	narcissism: 'Ái kỷ (Narcissism)',
	psychopathy: 'Thái nhân cách (Psychopathy)',
};

// ─── 5-tier level labels ───────────────────────────────────────────────────────

export type FiveTier = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

export const TIER_EN: Record<FiveTier, string> = {
	very_low: 'Very Low',
	low: 'Low',
	moderate: 'Moderate',
	high: 'High',
	very_high: 'Very High',
};

export const TIER_VI: Record<FiveTier, string> = {
	very_low: 'Rất thấp',
	low: 'Thấp',
	moderate: 'Trung bình',
	high: 'Cao',
	very_high: 'Rất cao',
};

// ─── Static UI strings ─────────────────────────────────────────────────────────

export interface UiStrings {
	langToggle: string;
	resultsReady: string;
	comprehensiveProfile: string;
	profileSubtitle: string;
	yourArchetype: string;
	strengths: string;
	blindSpots: string;
	archetypeDisclaimer: string;
	oceanTitle: string;
	oceanSubtitle: string;
	darkTriadTitle: string;
	darkTriadSubtitle: string;
	darkTriadNote: string;
	tapToExplore: string;
	crossTraitTitle: string;
	crossTraitSubtitle: string;
	percentileTitle: string;
	percentileSubtitle: string;
	refGroupLabel: string;
	oceanRefGroup: string;
	darkTriadRefGroup: string;
	loadingPercentile: string;
	percentileExplainer: string;
	zScoreExplainer: string;
	tierSystemTitle: string;
	quickReminder: string;
	quickReminderText: string;
	scoreTableTitle: string;
	thTrait: string;
	thType: string;
	thScore: string;
	thZ: string;
	thLevel: string;
	thPercentile: string;
	goBack: string;
	retakeTest: string;
	limitationsTitle: string;
	whatThisMeans: string;
	careerFit: string;
	academicContext: string;
	obLesson: string;
	derailmentRisk: string;
	studentAction: string;
	refGroupMean: string;
	/* Interstitial gate */
	beforeYouSeeResults: string;
	beforeSubtitle: string;
	howToReadTitle: string;
	limitationsGateTitle: string;
	darkTriadWarning: string;
	darkTriadWarningText: string;
	confirmTitle: string;
	confirmInstruction: string;
	confirmLabel: string;
	viewResults: string;
	pleaseConfirm: string;
	/* Percentile visual */
	lowerThanYou: string;
	avgOfGroup: string;
	yourScore: string;
	/* Invalid */
	invalidTitle: string;
	invalidText: string;
	retakeLink: string;
	attentionWarningTitle: string;
	attentionWarningText: string;
	/* Limitations */
	limitSelfReport: string;
	limitSelfReportText: string;
	limitNotClinical: string;
	limitNotClinicalText: string;
	limitCulture: string;
	limitCultureText: string;
	limitChange: string;
	limitChangeText: string;
	limitContext: string;
	limitContextText: string;
	limitEffect: string;
	limitEffectText: string;
	referencesTitle: string;
	/* Norm disclaimer & local norms */
	normDisclaimer: string;
	normDisclaimerDetail: string;
	normDisclaimerCollapse: string;
	localNormsLabel: string;
	localNormsDescription: string;
	localNormsBadge: string;
	internationalNormsBadge: string;
	groupSelectorHint: string;
	groupSource: string;
	groupDescription: string;
	minLocalN: string;
}

export const UI_EN: UiStrings = {
	langToggle: '🇻🇳 Tiếng Việt',
	resultsReady: 'Your results are ready ✨',
	comprehensiveProfile: 'Comprehensive Personality Profile',
	profileSubtitle: 'Below is the full picture of your personality — based on two widely-researched psychological models.',
	yourArchetype: 'Your Archetype',
	strengths: 'Strengths',
	blindSpots: 'Blind Spots',
	archetypeDisclaimer: 'This profile reflects your most prominent tendencies in the data, not the whole you. People are more complex than any label — depending on context (school, family, career), different facets come to the fore. Use this archetype as a starting point for self-awareness, not a verdict.',
	oceanTitle: 'The Big Five (OCEAN)',
	oceanSubtitle: 'BFI-2-S · Soto & John, 2017',
	darkTriadTitle: 'Social Instincts (Dark Triad)',
	darkTriadSubtitle: 'SD3 · Jones & Paulhus, 2014',
	darkTriadNote: 'A high Dark Triad score is not automatically negative — moderate levels reflect strategic intelligence and leadership capacity.',
	tapToExplore: 'Tap any trait to explore your personalized insights',
	crossTraitTitle: 'Your Unique Profile Insights',
	crossTraitSubtitle: 'Combining multiple traits to generate personalized observations. Note: people are more complex than any two traits combined — these are tendencies, not conclusions.',
	percentileTitle: 'How You Compare',
	percentileSubtitle: 'Your scores compared against international research reference groups',
	refGroupLabel: 'Reference Group',
	oceanRefGroup: 'OCEAN Group',
	darkTriadRefGroup: 'Dark Triad Group',
	loadingPercentile: 'Calculating percentiles…',
	percentileExplainer: 'P = percentile (% of people who scored lower than you)',
	zScoreExplainer: 'Z = standard deviations from the group mean',
	tierSystemTitle: '5-Tier System (based on Z-score)',
	quickReminder: 'Quick Reminder',
	quickReminderText: 'P = percentile (% scoring lower than you) · Z = deviations from mean · Vertical line on bar = group average position',
	scoreTableTitle: 'Detailed Score Table',
	thTrait: 'Trait',
	thType: 'Type',
	thScore: 'Score',
	thZ: 'Z',
	thLevel: 'Level',
	thPercentile: 'Percentile',
	goBack: '← Back',
	retakeTest: 'Retake Assessment 🔁',
	limitationsTitle: 'Limitations & Research Context',
	whatThisMeans: 'What this means for you',
	careerFit: 'Career Fit',
	academicContext: 'Academic Context',
	obLesson: 'OB Lesson',
	derailmentRisk: 'Derailment Risk',
	studentAction: 'Student Action',
	refGroupMean: 'Group mean',
	beforeYouSeeResults: 'Before You See Your Results',
	beforeSubtitle: 'Personality test results can be powerful — but only if you understand what they mean and what they don\'t mean. Please read carefully.',
	howToReadTitle: 'How to Read Your Results',
	limitationsGateTitle: 'Limitations & Context',
	darkTriadWarning: 'Especially important for Dark Triad',
	darkTriadWarningText: 'Dark Triad (Machiavellianism, Narcissism, Psychopathy) are normal personality traits on a continuum, NOT a "good/bad" label or clinical diagnosis. High scores are not automatically negative — at moderate levels, they relate to confidence, strategy, and composure under pressure. Results are provided to help you develop self-awareness, not to judge or label.',
	confirmTitle: '✅ Final Step: Confirm to View Results',
	confirmInstruction: 'Please read the information above carefully, then tick the checkbox below to unlock your results.',
	confirmLabel: 'I have read and understand that this is an educational tool, not a psychological diagnosis. Results are for reference and depend on many factors. I will use them for self-awareness and personal growth, not for labeling.',
	viewResults: '🎯 View My Results',
	pleaseConfirm: '☝️ Tick the checkbox above first, then this button will unlock',
	lowerThanYou: 'scored lower than you',
	avgOfGroup: 'group average',
	yourScore: 'your score',
	invalidTitle: 'Unable to Analyze Results',
	invalidText: 'The submission did not pass the attention check. This can happen if you rushed through or didn\'t read the items carefully — please try again when you have time to focus.',
	retakeLink: 'Retake the assessment →',
	attentionWarningTitle: 'Attention Check Not Passed',
	attentionWarningText: 'One or more attention-check items were answered incorrectly. Your results are shown below for educational purposes only and may not accurately reflect your personality profile. Consider retaking the test when you have time to focus.',
	limitSelfReport: 'Self-Report Bias',
	limitSelfReportText: 'Results are based on self-assessment — they can be influenced by social desirability bias and your current mood. Results might differ on another day.',
	limitNotClinical: 'NOT a Clinical Diagnosis',
	limitNotClinicalText: 'BFI-2-S and SD3 are research tools for the general population. High Dark Triad ≠ you\'re bad. Does NOT replace professional psychological evaluation. This is an educational tool.',
	limitCulture: 'Cultural Context',
	limitCultureText: 'Normative data comes primarily from Western samples. Trait meanings may differ in Vietnamese context — e.g., low Agreeableness in the West = "assertive", in Vietnam it may = "difficult".',
	limitChange: 'Personality ≠ Destiny',
	limitChangeText: 'Personality explains ~10-15% of life variance. Skills, effort, opportunities, luck — all matter. And personality CAN change over time (Roberts et al., 2006).',
	limitContext: 'Context Matters',
	limitContextText: 'NO profile is "the best". Each trait has value depending on context: high N = good for art, risky for surgery. Always evaluate in specific career contexts.',
	limitEffect: 'Effect Size',
	limitEffectText: 'Correlations between traits and outcomes are typically r=0.2-0.4. Personality explains ~10-15% variance — other factors (skill, opportunity, effort) matter equally.',
	referencesTitle: 'Key References',
	/* Norm disclaimer & local norms */
	normDisclaimer: '⚠️ Important: These percentiles use Western reference norms',
	normDisclaimerDetail: 'The default reference groups come from US/Canadian adult samples (Soto & John 2017; Jones & Paulhus 2014). Cultural differences in self-reporting style and values mean Vietnamese students often score higher on Agreeableness, Conscientiousness, and Narcissism compared to these Western norms — this is a sample mismatch, not a personality issue. For a more relevant comparison, select "Local Student Norms" below to compare against other students on this platform.',
	normDisclaimerCollapse: 'Show details',
	localNormsLabel: 'Local Student Norms',
	localNormsDescription: 'Compare against students who completed this test on this platform. Updated live from the database.',
	localNormsBadge: '🏫 Local',
	internationalNormsBadge: '🌍 International',
	groupSelectorHint: 'Click a group to change your comparison baseline. Hover for details.',
	groupSource: 'Source',
	groupDescription: 'Description',
	minLocalN: 'Local norms require at least 10 valid responses to be available.',
};

export const UI_VI: UiStrings = {
	langToggle: '🇬🇧 English',
	resultsReady: 'Kết quả của bạn đã sẵn sàng ✨',
	comprehensiveProfile: 'Hồ sơ Tính cách Toàn diện',
	profileSubtitle: 'Dưới đây là bức tranh toàn cảnh về tính cách của bạn — dựa trên hai mô hình tâm lý học được nghiên cứu rộng rãi.',
	yourArchetype: 'Nguyên mẫu (Archetype) của bạn',
	strengths: 'Điểm mạnh',
	blindSpots: 'Điểm mù',
	archetypeDisclaimer: 'Hồ sơ này phản ánh xu hướng nổi trội nhất trong dữ liệu của bạn, không phải toàn bộ con người bạn. Con người phức tạp hơn bất kỳ nhãn dán nào — tùy bối cảnh (học tập, gia đình, công việc), các mảnh ghép tính cách khác sẽ lên tiếng. Hãy dùng archetype này như điểm khởi đầu cho sự tự nhận thức, không phải lời tuyên án.',
	oceanTitle: '5 Nét tính cách lớn (OCEAN)',
	oceanSubtitle: 'BFI-2-S · Soto & John, 2017',
	darkTriadTitle: 'Bản năng Xã hội (Dark Triad)',
	darkTriadSubtitle: 'SD3 · Jones & Paulhus, 2014',
	darkTriadNote: 'Dark Triad cao không tự động có nghĩa xấu — mức vừa phải phản ánh trí tuệ chiến lược và khả năng lãnh đạo.',
	tapToExplore: 'Nhấn vào từng đặc điểm để xem phân tích riêng cho bạn',
	crossTraitTitle: 'Điểm Độc đáo của Bạn',
	crossTraitSubtitle: 'Kết hợp nhiều đặc điểm để tạo ra nhận định riêng cho bạn. Lưu ý: con người phức tạp hơn 2 traits cộng lại — đây là xu hướng, không phải kết luận.',
	percentileTitle: 'Bạn ở đâu so với mọi người?',
	percentileSubtitle: 'So sánh với nhóm tham chiếu nghiên cứu quốc tế',
	refGroupLabel: 'Nhóm tham chiếu',
	oceanRefGroup: 'Nhóm OCEAN',
	darkTriadRefGroup: 'Nhóm Dark Triad',
	loadingPercentile: 'Đang tính toán percentile…',
	percentileExplainer: 'P = percentile (% người có điểm thấp hơn bạn)',
	zScoreExplainer: 'Z = độ lệch chuẩn so với trung bình nhóm',
	tierSystemTitle: 'Hệ thống 5 mức (dựa trên Z-score)',
	quickReminder: 'Nhắc nhanh',
	quickReminderText: 'P = percentile (% người có điểm thấp hơn bạn) · Z = độ lệch từ trung bình · Đường dọc trên bar = vị trí trung bình nhóm',
	scoreTableTitle: 'Bảng điểm Chi tiết',
	thTrait: 'Đặc điểm',
	thType: 'Loại',
	thScore: 'Điểm',
	thZ: 'Z',
	thLevel: 'Mức',
	thPercentile: 'Percentile',
	goBack: '← Quay lại',
	retakeTest: 'Làm lại bài đánh giá 🔁',
	limitationsTitle: 'Giới hạn & Bối cảnh Nghiên cứu',
	whatThisMeans: 'Điều này có nghĩa gì với bạn',
	careerFit: 'Nghề nghiệp phù hợp',
	academicContext: 'Bối cảnh Học thuật',
	obLesson: 'Bài học Hành vi Tổ chức (OB)',
	derailmentRisk: 'Rủi ro Chệch bánh (Derailment)',
	studentAction: 'Hành động cho Sinh viên',
	refGroupMean: 'Trung bình nhóm',
	beforeYouSeeResults: 'Trước khi Xem Kết quả',
	beforeSubtitle: 'Kết quả trắc nghiệm tính cách có sức mạnh lớn — nhưng chỉ khi bạn hiểu chúng có nghĩa gì và KHÔNG có nghĩa gì. Hãy đọc kỹ.',
	howToReadTitle: 'Hướng dẫn Đọc Kết quả',
	limitationsGateTitle: 'Giới hạn & Bối cảnh',
	darkTriadWarning: 'Đặc biệt quan trọng với Dark Triad',
	darkTriadWarningText: 'Dark Triad (Mưu lược, Ái kỷ, Thái nhân cách) là đặc điểm tính cách bình thường trên phổ liên tục, KHÔNG phải nhãn "tốt/xấu" hay chẩn đoán bệnh lý. Mức cao không tự động nghĩa là tiêu cực — ở mức vừa phải, chúng liên quan đến tự tin, chiến lược, và bình tĩnh dưới áp lực. Kết quả được đưa ra để giúp bạn tự nhận thức và phát triển, không phải để phán xét hay gán nhãn.',
	confirmTitle: '✅ Bước cuối: Xác nhận để Xem Kết quả',
	confirmInstruction: 'Hãy đọc kỹ các thông tin phía trên, sau đó tick vào ô bên dưới để mở khoá kết quả của bạn.',
	confirmLabel: 'Tôi đã đọc và hiểu rằng đây là công cụ giáo dục, không phải chẩn đoán tâm lý. Kết quả mang tính tham khảo và phụ thuộc vào nhiều yếu tố. Tôi sẽ sử dụng kết quả để tự nhận thức và phát triển bản thân, không phải để gán nhãn.',
	viewResults: '🎯 Xem Kết quả của tôi',
	pleaseConfirm: '☝️ Hãy tick vào ô phía trên trước, sau đó nút này sẽ mở khoá',
	lowerThanYou: 'có điểm thấp hơn bạn',
	avgOfGroup: 'trung bình nhóm',
	yourScore: 'điểm của bạn',
	invalidTitle: 'Không thể Phân tích Kết quả',
	invalidText: 'Bài nộp không vượt qua kiểm tra chú ý (attention check). Điều này có thể xảy ra nếu bạn làm vội hoặc không đọc kỹ câu hỏi — hãy thử lại khi bạn có thời gian tập trung.',
	retakeLink: 'Làm lại bài đánh giá →',
	attentionWarningTitle: 'Không vượt qua Kiểm tra Chú ý',
	attentionWarningText: 'Một hoặc nhiều câu kiểm tra chú ý (attention check) được trả lời sai. Kết quả bên dưới chỉ mang tính giáo dục và có thể không phản ánh chính xác tính cách của bạn. Hãy cân nhắc làm lại khi có thời gian tập trung.',
	limitSelfReport: 'Thiên lệch Tự báo cáo (Self-Report Bias)',
	limitSelfReportText: 'Kết quả dựa trên tự đánh giá — có thể bị ảnh hưởng bởi social desirability bias (muốn trả lời "đẹp") và trạng thái tâm lý hiện tại. Kết quả có thể khác nếu bạn làm vào ngày khác.',
	limitNotClinical: 'KHÔNG phải Chẩn đoán Lâm sàng',
	limitNotClinicalText: 'BFI-2-S và SD3 là công cụ nghiên cứu cho dân số bình thường. Dark Triad cao ≠ bạn xấu. KHÔNG thay thế đánh giá tâm lý chuyên nghiệp. Đây là công cụ giáo dục.',
	limitCulture: 'Bối cảnh Văn hóa',
	limitCultureText: 'Normative data chủ yếu từ mẫu phương Tây. Ý nghĩa trait có thể khác trong bối cảnh VN — ví dụ: thấp Agreeableness ở phương Tây = "assertive", ở VN có thể = "khó chịu".',
	limitChange: 'Tính cách ≠ Số phận',
	limitChangeText: 'Personality giải thích ~10-15% variance trong cuộc sống. Skills, effort, opportunities, luck — tất cả đều quan trọng. Và tính cách CÓ THỂ thay đổi theo thời gian (Roberts et al., 2006).',
	limitContext: 'Bối cảnh là Tất cả',
	limitContextText: 'KHÔNG CÓ profile nào là "tốt nhất". Mỗi trait có giá trị tùy context: N cao = tốt cho nghệ thuật, rủi ro cho phẫu thuật. Luôn đánh giá trong bối cảnh công việc cụ thể.',
	limitEffect: 'Kích thước Hiệu ứng (Effect Size)',
	limitEffectText: 'Tương quan giữa trait và outcomes thường r=0.2-0.4. Personality giải thích ~10-15% variance — yếu tố khác (skill, opportunity, effort) quan trọng không kém.',
	referencesTitle: 'Tài liệu Tham khảo chính',
	/* Norm disclaimer & local norms */
	normDisclaimer: '⚠️ Lưu ý: Percentile đang dùng chuẩn mực phương Tây',
	normDisclaimerDetail: 'Nhóm tham chiếu mặc định đến từ người trưởng thành Mỹ/Canada (Soto & John 2017; Jones & Paulhus 2014). Do khác biệt văn hóa trong cách tự đánh giá và hệ giá trị, sinh viên Việt Nam thường có điểm Dễ chịu (Agreeableness), Tận tâm (Conscientiousness) và Ái kỷ (Narcissism) cao hơn so với chuẩn phương Tây — đây là sự không khớp mẫu, không phải vấn đề tính cách. Để so sánh phù hợp hơn, hãy chọn "Chuẩn sinh viên tại đây" bên dưới để so với các bạn cùng làm bài trên nền tảng này.',
	normDisclaimerCollapse: 'Xem chi tiết',
	localNormsLabel: 'Chuẩn sinh viên tại đây',
	localNormsDescription: 'So sánh với các sinh viên đã làm bài trên nền tảng này. Cập nhật trực tiếp từ cơ sở dữ liệu.',
	localNormsBadge: '🏫 Tại đây',
	internationalNormsBadge: '🌍 Quốc tế',
	groupSelectorHint: 'Nhấn vào nhóm để thay đổi cơ sở so sánh. Di chuột để xem mô tả.',
	groupSource: 'Nguồn',
	groupDescription: 'Mô tả',
	minLocalN: 'Chuẩn mực tại đây cần ít nhất 10 bài hợp lệ mới khả dụng.',
};

export function getStrings(lang: Lang): UiStrings {
	return lang === 'vi' ? UI_VI : UI_EN;
}

export function getDomainLabel(domain: PersonalityDomain, lang: Lang): string {
	return lang === 'vi' ? DOMAIN_VI[domain] : DOMAIN_EN[domain];
}

export function getTierLabel(tier: FiveTier, lang: Lang): string {
	return lang === 'vi' ? TIER_VI[tier] : TIER_EN[tier];
}
