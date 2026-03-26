'use client';

/* ════════════════════════════════════════════════════════════════════════
   PersonalityResultsDashboard — Visual results display

   Design:
   - SVG radar/spider chart for OCEAN and Dark Triad
   - 5-tier level system: very_low / low / moderate / high / very_high
   - Expandable per-trait insight cards (what, career, tip, academic)
   - Cross-trait insights with action steps
   - Collapsible limitations & research context section
   ════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

import type {
	PersonalityTestSessionDTO,
	TraitScore,
	ArchetypeProfile,
	PersonalityDomain,
} from '@/types/personalityTest';
import { DOMAIN_LABELS_VI } from '@/lib/personalityScoring';

// ─── 5-tier helpers ────────────────────────────────────────────────────────────

type FiveTier = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

function getZTier(zScore: number | undefined): FiveTier {
	if (zScore === undefined) return 'moderate';
	if (zScore >= 1.5) return 'very_high';
	if (zScore >= 0.5) return 'high';
	if (zScore >= -0.5) return 'moderate';
	if (zScore >= -1.5) return 'low';
	return 'very_low';
}

function getLevelLabel(tier: FiveTier): string {
	return { very_low: 'Rất thấp', low: 'Thấp', moderate: 'Trung bình', high: 'Cao', very_high: 'Rất cao' }[tier];
}

function getLevelBadgeClass(tier: FiveTier): string {
	return {
		very_high: 'bg-error-subtle text-error',
		high: 'bg-rose-subtle text-rose',
		moderate: 'bg-warning-subtle text-warning',
		low: 'bg-teal-subtle text-teal',
		very_low: 'bg-indigo-subtle text-indigo',
	}[tier];
}

// ─── Trait Insight Data ────────────────────────────────────────────────────────

interface TraitInsight {
	icon: string;
	what: string;
	very_high: string;
	high: string;
	moderate: string;
	low: string;
	very_low: string;
	career: string;
	tip: string;
	academic: string;
	derailment?: string; // Career/social derailment risk — especially for Dark Triad
	obLesson?: string; // Organizational Behavior lesson for year-3 students
}

const TRAIT_INSIGHTS: Record<PersonalityDomain, TraitInsight> = {
	extraversion: {
		icon: '🗣️',
		what: 'Extraversion phản ánh xu hướng tìm kiếm sự kích thích từ thế giới bên ngoài — gồm 3 thành phần: Sociability (thích giao tiếp), Assertiveness (quyết đoán, dẫn dắt), và Energy Level (mức năng lượng tổng thể). Đây không chỉ đơn giản là "thích nói chuyện" — mà là cách bạn lấy năng lượng và tương tác với thế giới.',
		very_high: 'Bạn thuộc nhóm cực kỳ hướng ngoại — bạn "sống" bằng năng lượng xã hội, chủ động khởi xướng và cảm thấy tù túng khi phải làm việc một mình lâu. ⚠️ Cẩn thận: trong đồ án nhóm, bạn có thể chiếm sóng và khiến thành viên hướng nội cảm thấy bị "nuốt chửng". Nghiên cứu của Judge et al. (2002) cho thấy E rất cao liên quan đến emergent leadership nhưng KHÔNG nhất thiết đến leadership effectiveness — bạn có thể được bầu làm trưởng nhóm nhưng không chắc dẫn dắt tốt.',
		high: 'Bạn thích giao tiếp, năng lượng tốt trong nhóm và dễ kết nối. Đây là lợi thế rõ ràng cho networking và làm việc cross-functional. Tuy nhiên, trong văn hóa VN, E cao đôi khi bị đánh giá là "nói nhiều hơn làm" — hãy kết hợp với hành động cụ thể.',
		moderate: 'Bạn là ambivert — linh hoạt chuyển đổi giữa giao tiếp và độc lập. Nghiên cứu mới của Grant (2013, Wharton) cho thấy ambivert thực ra bán hàng tốt hơn cả người hướng ngoại thuần, vì họ biết khi nào nên nói và khi nào nên lắng nghe.',
		low: 'Bạn hướng nội — cần thời gian riêng để xử lý thông tin và nạp năng lượng. Đây KHÔNG phải nhược điểm: Susan Cain trong "Quiet" đã chỉ ra rằng 1/3 đến 1/2 dân số là introvert, và nhiều CEO thành công nhất (Bill Gates, Warren Buffett) là hướng nội. Bạn mạnh ở deep listening và deliberate thinking.',
		very_low: 'Bạn rất hướng nội — tương tác xã hội tiêu tốn nhiều năng lượng. Trong context sắp đi làm: bạn cần chiến lược cụ thể cho networking (ví dụ: 1-on-1 coffee thay vì party lớn) và phỏng vấn xin việc (chuẩn bị kỹ talking points). Đừng để sự im lặng bị hiểu lầm là "thiếu năng lực".',
		career: 'E cao → Sales, Account Management, Event, PR, Training, Quản lý dự án. E thấp → Nghiên cứu, Data Analysis, UX Research, Backend Dev, Editing, Technical Writing. E trung bình → Consulting, Product Management, Business Analysis — cần cả lắng nghe và trình bày.',
		tip: 'Với sinh viên năm 3: Trong phỏng vấn xin việc, E không quan trọng bằng CÁCH bạn thể hiện giá trị. Người hướng nội nên tập STAR method (Situation-Task-Action-Result) để trả lời có cấu trúc. Người hướng ngoại nên tập dừng lại sau mỗi câu trả lời thay vì nói tràn.',
		academic: 'Soto & John (2017): E dự báo satisfaction trong công việc nhóm và emergent leadership. Judge et al. (2002) meta-analysis: E có r=.31 với leadership emergence nhưng chỉ r=.16 với leadership effectiveness — cho thấy "được bầu" ≠ "dẫn dắt giỏi".',
	},
	agreeableness: {
		icon: '🤝',
		what: 'Agreeableness đo lường 3 khía cạnh: Compassion (lòng trắc ẩn), Respectfulness (tôn trọng quy tắc xã hội), và Trust (niềm tin vào người khác). Đây không phải "dễ bảo" mà là thiên hướng hợp tác vs. cạnh tranh trong mối quan hệ — một trong những yếu tố quyết định bạn sẽ thành công hay thất bại trong tổ chức.',
		very_high: 'Bạn cực kỳ hợp tác và đồng cảm — luôn đặt nhu cầu người khác lên trước. ⚠️ Derailment risk thực sự: Bạn dễ trở thành "organizational doormat" — người mà ai cũng nhờ nhưng không ai ghi nhận. Trong đồ án nhóm, bạn có thể gánh việc cho thành viên free-ride mà không dám nói. Nghiên cứu Judge et al. (2012) cho thấy A rất cao liên quan đến THẤP hơn về lương — "nice penalty" là có thật, đặc biệt với nam giới.',
		high: 'Bạn hợp tác, đồng cảm, và xây dựng mối quan hệ tốt. Đây là nền tảng cho OCB (Organizational Citizenship Behavior) — hành vi vì tổ chức vượt ngoài mô tả công việc. Nhưng cần học cách nói "không" một cách tử tế và đặt ranh giới.',
		moderate: 'Bạn biết khi nào cần hợp tác và khi nào cần đứng vững lập trường. Đây thường là mức tối ưu cho quản lý: đủ empathy để hiểu nhân viên, đủ tough để đưa quyết định khó.',
		low: 'Bạn thiên về lý trí, trực tiếp, và ít bị cảm xúc chi phối trong quyết định. Trong OB, điều này phù hợp cho vai trò cần objective decision-making: restructuring, layoffs, M&A. Nhưng trong văn hóa VN thiên về harmony, A thấp có thể bị coi là "khó chịu" — bạn cần học diplomatic communication.',
		very_low: 'Bạn rất độc lập và skeptical — ít tin tưởng người khác và đặt lợi ích bản thân lên trước. ⚠️ Thực tế: trong team project ở VN, điều này gây xung đột nhanh chóng. Bạn cần chủ động thể hiện thiện chí (ví dụ: chủ động giúp đỡ 1 việc nhỏ) để xây dựng trust ban đầu.',
		career: 'A cao → Tư vấn tâm lý, HR, Giảng dạy, Y tế, CSR, Social Work. A thấp → Tài chính, Luật, Consulting chiến lược, Turnaround Management. A trung bình → Product Management, Business Development — cần cả empathy với user lẫn tough negotiation với stakeholder.',
		tip: 'Với sinh viên năm 3 sắp đi thực tập: A cao — tập nói "Tôi cần thêm thời gian để suy nghĩ" thay vì đồng ý ngay. A thấp — trong 2 tuần đầu ở công ty mới, hãy ưu tiên listening mode: ghi chú thay vì phản bác.',
		academic: 'Judge et al. (2012): A cao → lương thấp hơn trung bình ~$7,000/năm (agreeable penalty). Organ & Ryan (1995): A là predictor mạnh nhất của OCB. Graziano & Eisenberg (1997): A cao = prosocial behavior nhưng cũng dễ bị exploitation.',
		obLesson: 'Trong Organizational Behavior, Agreeableness liên quan trực tiếp đến khái niệm "Voice behavior" (Morrison, 2011): người A cao ít dám lên tiếng về vấn đề trong tổ chức vì sợ phá vỡ hòa khí. Đây là một trong những nguyên nhân gốc rễ của groupthink.',
	},
	conscientiousness: {
		icon: '📋',
		what: 'Conscientiousness gồm 3 facet: Organization (ngăn nắp, có hệ thống), Productiveness (hiệu suất, drive hoàn thành), và Responsibility (trách nhiệm, giữ lời). Đây là Big Five trait dự báo job performance mạnh nhất — quan trọng hơn cả IQ trong nhiều bối cảnh. Nếu chỉ được chọn 1 trait để tuyển dụng, hầu hết HR manager chọn C.',
		very_high: 'Bạn cực kỳ có kỷ luật và tổ chức — mọi thứ đều có kế hoạch, deadline luôn được met. ⚠️ Derailment risk: Perfectionism + burnout. Nghiên cứu của Carter et al. (2016) cho thấy C rất cao liên quan đến "workaholism" và khó khăn trong việc delegate — bạn không tin ai làm tốt bằng bạn, dẫn đến kiệt sức. Trong đồ án nhóm, bạn có thể trở thành micro-manager khiến team bất mãn.',
		high: 'Bạn đáng tin cậy, có kế hoạch rõ ràng và follow-through tốt. Meta-analysis của Barrick & Mount (1991) xác nhận C là predictor mạnh nhất cho job performance across tất cả ngành nghề, với r=.22-.23. Đây là nền tảng "career insurance" của bạn.',
		moderate: 'Bạn cân bằng giữa kỷ luật và linh hoạt. Trong startup hoặc môi trường agile, đây có thể là mức optimal vì bạn đủ organized để deliver nhưng đủ flexible để pivot khi cần.',
		low: 'Bạn ưu tiên flexibility và spontaneity. ⚠️ Thực tế phũ phàng: Trong thị trường lao động VN hiện tại, C thấp là red flag lớn nhất mà employer nhìn thấy — trễ deadline, không follow-up, quên reply email. Tin tốt: C là trait CÓ THỂ cải thiện được nhiều nhất qua hệ thống và thói quen (Roberts et al., 2006).',
		very_low: 'Bạn gần như hoạt động theo impulse và ít có hệ thống. ⚠️ Cảnh báo nghiêm túc cho sinh viên năm 3: đây là thách thức sống còn khi đi làm. Hãy BẮT ĐẦU NGAY: (1) dùng calendar blocking, (2) to-do list hàng ngày, (3) rule "touch it once" cho email. Không có hệ thống, bạn sẽ dựa vào ý chí — và ý chí luôn thua thói quen.',
		career: 'C cao → Tài chính, Y tế, Kỹ thuật, Project Management, Quality Assurance — bất kỳ vai trò nào cần precision. C thấp → Creative roles CÓ hệ thống hỗ trợ (creative director có assistant), Freelance VỚI ĐIỀU KIỆN tự xây routine.',
		tip: 'Với sinh viên năm 3: Bất kể C score của bạn, hãy xây 1 system ngay bây giờ: Inbox Zero cho email, Weekly Review cho mục tiêu, và Time Blocking cho lịch. Dùng tool (Notion, Todoist, Google Calendar) thay vì dựa vào trí nhớ. C thấp + good system > C cao + no system.',
		academic: 'Barrick & Mount (1991): C là predictor duy nhất valid cho job performance across mọi occupation types. Noftle & Robins (2007): C dự báo GPA mạnh hơn SAT scores (r=.28 vs r=.25). Roberts et al. (2006): C tăng tự nhiên từ 20-40 tuổi ("maturity principle").',
		obLesson: 'Trong OB, C liên quan đến Self-Regulation Theory (Baumeister): khả năng kiểm soát hành vi hướng đến mục tiêu dài hạn. Nó cũng là core component của "Psychological Capital" (Luthans) — khả năng phục hồi và kiên trì.',
	},
	negativeEmotionality: {
		icon: '🌊',
		what: 'Negative Emotionality (Neuroticism) gồm 3 facet: Anxiety (lo lắng, bất an), Depression (buồn bã, bi quan), và Emotional Volatility (biến động cảm xúc, dễ nổi nóng). Đây KHÔNG phải "bệnh" — mà là continuum cho thấy hệ thống cảnh báo nguy hiểm (threat detection system) của bạn nhạy đến mức nào.',
		very_high: 'Hệ thống cảnh báo của bạn ở mức rất nhạy — bạn detect threats nhanh hơn người khác nhưng cũng false alarm nhiều hơn. ⚠️ Derailment risk nghiêm trọng: N rất cao + stress của năm cuối/đi thực tập có thể tạo "anxiety spiral" — lo lắng về việc lo lắng. Nghiên cứu: N cao là predictor mạnh nhất cho burnout (Swider & Zimmerman, 2010). Bạn CẦN có coping strategies: mindfulness, exercise, và social support TRƯỚC khi khủng hoảng xảy ra.',
		high: 'Bạn nhạy cảm với stress và trải nghiệm cảm xúc tiêu cực mạnh hơn trung bình. Mặt tích cực: N cao liên quan đến creative achievement (Feist, 1998) — sự nhạy cảm giúp bạn thấy nuances mà người khác bỏ qua. Mặt tiêu cực: trong deadline crunch, bạn dễ "catastrophize" (phóng đại hậu quả).',
		moderate: 'Bạn có sự ổn định cảm xúc ở mức bình thường — lo lắng khi cần nhưng recovery nhanh. Đây là mức chức năng tốt cho hầu hết environments.',
		low: 'Bạn khá "cool under pressure" — stress ít ảnh hưởng đến performance của bạn. Đây là lợi thế rất lớn cho vai trò high-stakes: phỏng vấn, thuyết trình, đàm phán. Nhưng hãy cẩn thận: N thấp đôi khi đi kèm complacency — bạn có thể không nhận ra khi tình huống thực sự nguy hiểm.',
		very_low: 'Bạn gần như "bulletproof" về cảm xúc — rất bình tĩnh dù trong khủng hoảng. Giá trị cực lớn cho leadership, crisis management, và high-pressure roles. Tuy nhiên, người xung quanh có thể cảm thấy bạn "cold" hoặc thiếu empathy — hãy chủ động thể hiện sự quan tâm.',
		career: 'N thấp → Leadership, Surgery, Pilot, Military Officer, Trading Floor, Emergency Medicine. N cao → Roles cần sensitivity: Art, Counseling, UX Research, Writing, Quality Assurance. N trung bình → phù hợp đa số vai trò.',
		tip: 'Cho sinh viên năm 3: Nếu N cao, hãy chuẩn bị "emotional first-aid kit" cho thực tập: (1) Danh sách người tin cậy để gọi khi stress, (2) 1 hoạt động physical mỗi ngày (gym, chạy bộ, yoga), (3) Journaling 5 phút trước ngủ. Nếu N thấp, hãy chủ động hỏi thăm đồng nghiệp — đừng giả định mọi người "ổn" như bạn.',
		academic: 'Swider & Zimmerman (2010): N là predictor mạnh nhất của burnout (r=.44). Feist (1998): N liên quan tích cực đến artistic creativity. Suls & Martin (2005): N cao → interpretive bias — xu hướng diễn giải sự kiện mơ hồ theo hướng tiêu cực.',
		obLesson: 'Trong OB, N liên quan đến Affective Events Theory (Weiss & Cropanzano, 1996): cảm xúc tại nơi làm việc ảnh hưởng đến thái độ và hành vi. Người N cao phản ứng mạnh hơn với "affective events" (conflict, criticism) → cần emotional regulation skills.',
	},
	openMindedness: {
		icon: '🎨',
		what: 'Open-Mindedness gồm 3 facet: Intellectual Curiosity (tò mò trí tuệ), Aesthetic Sensitivity (nhạy cảm thẩm mỹ), và Creative Imagination (trí tưởng tượng sáng tạo). Đây là trait dự báo mạnh nhất cho "lifelong learning" — khả năng thích nghi trong thế giới VUCA (Volatility, Uncertainty, Complexity, Ambiguity).',
		very_high: 'Bạn cực kỳ tò mò, sáng tạo, và thích thách thức quy ước. Bạn là "idea machine" — luôn có ý tưởng mới. ⚠️ Derailment risk: "Shiny object syndrome" — bạn nhảy từ ý tưởng này sang ý tưởng khác mà không hoàn thành gì cả. Nếu O rất cao + C thấp, bạn sẽ là "dreamer who never delivers". Kết hợp O cao với C là bắt buộc.',
		high: 'Bạn thích khám phá, học hỏi và suy nghĩ trừu tượng. Trong thế giới VUCA hiện tại, O cao là competitive advantage: bạn thích nghi nhanh hơn khi industry disruption xảy ra. McCrae (1987): O cao liên quan mạnh đến divergent thinking.',
		moderate: 'Bạn cân bằng giữa đổi mới và thực tế — sẵn sàng thử cái mới nhưng cũng biết giữ những gì hoạt động tốt. Đây là mức phù hợp cho hầu hết roles trừ pure creative hoặc pure operational.',
		low: 'Bạn thiên về practical, conventional, và preferring proven methods. Trong operational roles (logistics, manufacturing, compliance), đây là STRENGTH — bạn không bị distracted bởi "the next big thing" mà focus vào execution. Nhưng trong môi trường startup hoặc innovation, bạn có thể bị stuck.',
		very_low: 'Bạn rất truyền thống và resist change mạnh. ⚠️ Trong context hiện tại với AI disruption, O rất thấp là rủi ro lớn — bạn có thể bỏ qua signals quan trọng về thay đổi ngành. Hãy chủ động expose bản thân với ideas mới: đọc 1 bài ngoài lĩnh vực chuyên môn mỗi tuần.',
		career: 'O cao → Design Thinking, R&D, Startup, Innovation Labs, Strategy Consulting, Academic Research, UX Design. O thấp → Kế toán, Operations, Compliance, Quality Control, Process Engineering — roles cần consistency và precision.',
		tip: 'Cho sinh viên năm 3: O cao — hãy chọn 1 idea và COMMIT trong ít nhất 3 tháng trước khi đổi hướng. O thấp — hãy thử ChatGPT/AI tools NGAY vì industry của bạn ĐANG bị disrupted, dù bạn có thích hay không. Sự thoải mái với status quo là luxury mà năm 2024 không cho phép.',
		academic: 'McCrae (1987): O là predictor mạnh nhất cho divergent thinking. Chamorro-Premuzic (2006): O dự báo academic performance trong arts & humanities (r=.20-.30). George & Zhou (2001): O cao + supportive environment = creative performance tối ưu.',
		obLesson: 'Trong OB, O liên quan đến Absorptive Capacity (Cohen & Levinthal, 1990): khả năng nhận biết, tiếp thu, và ứng dụng kiến thức mới. Tổ chức cần mix giữa high-O (explore) và low-O (exploit) — đây là bài toán Ambidexterity.',
	},
	machiavellianism: {
		icon: '♟️',
		what: 'Machiavellianism đo lường xu hướng "chơi game quyền lực" trong mối quan hệ: sẵn sàng thao túng, sử dụng chiến thuật xã hội, và ưu tiên kết quả hơn đạo đức. Tên gọi từ Niccolò Machiavelli — tác giả "The Prince" (1513), cuốn sách dạy ruler cách giữ quyền lực bằng mọi giá. Trong tổ chức, M cao là "political skill" phiên bản tối.',
		very_high: 'Bạn là "strategic calculator" — luôn tính toán xem mối quan hệ nào có lợi, và sẵn sàng manipulate để đạt mục tiêu. ⚠️ DERAILMENT RISK NGHIÊM TRỌNG: Nghiên cứu Hogan & Hogan (2001) về "Dark Side of Leadership": M rất cao là 1 trong 11 derailment factors phổ biến nhất — bạn có thể thăng tiến nhanh nhưng khi bị phát hiện (VÀ BẠN SẼ BỊ), sự sụp đổ rất thảm hại. Ví dụ thực tế: Trong thực tập, nếu bạn "chơi chính trị" giữa các phòng ban, bạn sẽ bị blacklist nhanh hơn bạn tưởng — đây là community nhỏ.',
		high: 'Bạn có tư duy chiến lược mạnh và hiểu "game" trong tổ chức. Mặt sáng: Political Skill (Ferris et al., 2005) — khả năng đọc tình huống, xây dựng coalition, và influence stakeholder. Mặt tối: nếu thiếu moral compass, bạn sẽ tối ưu hóa lợi ích ngắn hạn và phá hủy trust dài hạn. Trong OB, trust mất 10x lâu hơn để xây lại so với phá.',
		moderate: 'Bạn có social awareness tốt mà không quá tính toán — "trí tuệ xã hội" lành mạnh. Bạn hiểu organizational politics mà không bị cuốn vào game. Đây thường là mức optimal cho leadership trong bối cảnh VN.',
		low: 'Bạn trực tính, chân thành, và transparent. Đây là nền tảng cho authentic leadership (Avolio & Gardner, 2005). Nhưng trong organizational reality, bạn có thể naive về office politics — hãy ít nhất NHẬN BIẾT rằng politics tồn tại, dù bạn không chơi.',
		very_low: 'Bạn rất thành thật và gần như zero strategic calculation. ⚠️ Rủi ro: trong tổ chức có political environment mạnh (ngân hàng, bất động sản, chính phủ), bạn sẽ bị exploit bởi những người M cao. Hãy đọc "Influence" của Robert Cialdini — không phải để thao túng, mà để NHẬN RA khi bị thao túng.',
		career: 'M vừa phải → Đàm phán, Business Development, Consulting, Diplomacy, Government Relations. M cao → Rủi ro cao trong mọi ngành — có thể thành công ngắn hạn nhưng dễ bị "cancel" dài hạn. M thấp → Roles cần trust: Doctor, Teacher, Non-profit, Social Enterprise.',
		tip: 'Cho sinh viên năm 3: Ranh giới giữa "political skill" (tốt) và "manipulation" (xấu) nằm ở 2 câu hỏi: (1) Bạn có willing nói thật khi bị hỏi trực tiếp không? (2) Bạn có sẵn sàng chịu hậu quả nếu chiến thuật bị phát hiện không? Nếu answer là "không" cho cả hai, bạn đang manipulate.',
		academic: 'Paulhus & Williams (2002): M = "strategic manipulation". Christie & Geis (1970): M cao → thành công trong "loose situations" (ít quy tắc) nhưng thất bại trong "tight situations" (nhiều giám sát). Dahling et al. (2009): M cao → counterproductive work behavior (CWB) và giảm OCB.',
		derailment: '🚨 Derailment cụ thể: Trong thực tập, nếu bạn nói xấu đồng nghiệp với sếp để được đánh giá cao hơn, bạn ĐANG dùng M cao. Khi (không phải nếu) bị phát hiện, bạn sẽ không chỉ mất thực tập mà còn mất reference — trong ngành nhỏ ở VN, 1 reference xấu có thể theo bạn 5-10 năm.',
		obLesson: 'OB concept: Organizational Politics (Mintzberg, 1983). M cao phản ánh tendency dùng "political tactics": impression management, coalition building, blame deflection. Khi có ethical leadership ở top, M cao bị kiểm soát. Khi leadership yếu, M cao trở thành cancer.',
	},
	narcissism: {
		icon: '👑',
		what: 'Narcissism (Ái kỷ) đo lường nhu cầu được ngưỡng mộ, cảm giác đặc biệt (entitlement), và xu hướng exploit người khác vì self-esteem. QUAN TRỌNG: Đây là subclinical narcissism — một đặc điểm tính cách bình thường, KHÔNG phải NPD (Narcissistic Personality Disorder). Ở mức vừa phải, nó liên quan đến self-confidence và leadership emergence.',
		very_high: 'Bạn có nhu cầu được công nhận rất mạnh và cảm giác mình "đặc biệt" hơn người khác. ⚠️ DERAILMENT RISK: Nghiên cứu Grijalva et al. (2015) meta-analysis: N rất cao là "double-edged sword" — liên quan đến leadership emergence (+) NHƯNG cũng đến interpersonal conflict, entitlement, và exploitation (-). Ví dụ thực tế: Trong đồ án nhóm, bạn có thể claim credit cho ý tưởng của team, dismiss ý kiến người khác, hoặc từ chối làm "boring tasks". Kết quả: team sẽ passive-aggressive hoặc abandon bạn.',
		high: 'Bạn tự tin và muốn được công nhận — "healthy narcissism" theo Kohut. Đây là fuel cho self-promotion, public speaking, và entrepreneurship. Nhưng ranh giới giữa "confident" và "arrogant" rất mỏng — feedback từ người tin cậy là ESSENTIAL để bạn calibrate.',
		moderate: 'Self-confidence lành mạnh — tin vào bản thân mà không cần phải luôn là trung tâm. Đây là mức tối ưu: đủ tự tin để present ideas, đủ humble để nhận feedback. Nghiên cứu: moderate narcissism liên quan đến resilience và emotional well-being (Sedikides et al., 2004).',
		low: 'Bạn khiêm tốn và ít tìm kiếm spotlight. Trong văn hóa VN, đây thường được đánh giá tích cực ("khiêm tốn là đức tính tốt"). Nhưng trong competitive job market, bạn cần học self-advocacy: nói về achievements của mình không phải "khoe" mà là "communicate value".',
		very_low: 'Bạn rất khiêm tốn, gần như invisible trong nhóm. ⚠️ Rủi ro thực tế: Trong thực tập và phỏng vấn, bạn sẽ bị overlooked. Người tuyển dụng không phải mind reader — nếu bạn không nói, họ sẽ giả định bạn không có gì để nói. Hãy tập "elevator pitch" — 30 giây nói về 3 strengths của bạn.',
		career: 'N vừa phải → CEO, Entrepreneurship, Sales, Politics, Performing Arts, Public Relations — roles cần "stage presence". N cao → Rủi ro ở mọi roles cần teamwork dài hạn. N thấp → Research, Backend Engineering, Finance Analysis — roles được đánh giá bằng output, không phải visibility.',
		tip: 'Cho sinh viên năm 3: N cao — trước khi nói "ý tưởng của tôi", hãy hỏi "team nghĩ sao?". Tập viết "we" thay vì "I" trong email. N thấp — tập nói "Tôi đã làm..." thay vì "Team đã làm..." khi CHÍNH BẠN là người chủ lực. Bạn không cần humble brag, bạn cần accurate attribution.',
		academic: 'Grijalva et al. (2015): Narcissism có curvilinear relationship với leadership effectiveness — tăng đến 1 điểm rồi GIẢM. Campbell et al. (2011): "Narcissistic leaders" tạo short-term gains nhưng long-term organizational damage. Sedikides et al. (2004): moderate narcissism → psychological well-being.',
		derailment: '🚨 Derailment cụ thể: "Credit stealing" — nhận công của người khác — là derailment #1 của N cao. Trong đồ án nhóm, nếu bạn present ý tưởng của member khác như của mình, group chat sẽ trở thành bằng chứng. Trong tổ chức thật, Glassdoor reviews và LinkedIn network sẽ expose bạn.',
		obLesson: 'OB concept: Leader-Member Exchange (LMX) Theory — N cao tạo "in-group" (người ngưỡng mộ) và "out-group" (người không đồng ý). Kết quả: team polarized, talent bỏ đi, chỉ còn yes-men. Đây là pattern của nhiều startup founder bị board lật đổ.',
	},
	psychopathy: {
		icon: '⚡',
		what: 'Subclinical Psychopathy đo lường 3 khía cạnh: Callousness (thiếu đồng cảm, cold-hearted), Impulsivity (bốc đồng, hành động không suy nghĩ), và Thrill-seeking (tìm kiếm cảm giác mạnh). QUAN TRỌNG: Đây KHÔNG phải "kẻ giết người" — subclinical psychopathy là một đặc điểm tính cách trên phổ bình thường. Ở mức thấp-vừa, nó liên quan đến fearless dominance và stress immunity.',
		very_high: 'Bạn có xu hướng rất mạnh về impulsivity, thrill-seeking, và callousness. ⚠️ DERAILMENT RISK CỰC KỲ NGHIÊM TRỌNG: Đây là Dark Triad trait nguy hiểm nhất cho career. Nghiên cứu Boddy (2011): "Corporate Psychopaths" — P rất cao trong leadership gây ra bullying, fraud, và organizational destruction. Ví dụ thực tế cho SV: Bạn có thể nói lời tàn nhẫn trong conflict mà không cảm thấy hối hận, phá vỡ cam kết vì bored, hoặc chấp nhận rủi ro extreme mà team không đồng ý.',
		high: 'Bạn liều lĩnh, ít bị ảnh hưởng bởi sợ hãi, và có "cool head" dưới áp lực. Mặt sáng: "Fearless Dominance" (Lilienfeld et al., 2012) — bình tĩnh trong khủng hoảng, decisive, không bị paralysis by analysis. Mặt tối: bạn có thể hurt người khác mà không fully register impact. Trong đồ án nhóm, lời nói "thẳng" của bạn có thể làm member khóc và bạn không hiểu tại sao.',
		moderate: 'Bạn bình tĩnh trong tình huống căng thẳng và có can đảm đưa quyết định khó. Nhưng vẫn care about consequences và people. Đây là mức functional tốt cho leadership — "tough but fair".',
		low: 'Bạn đồng cảm cao, careful, và cân nhắc impact của hành động. Đây là nền tảng tuyệt vời cho mọi mối quan hệ — cá nhân và nghề nghiệp. Bạn tự nhiên giỏi trong emotional labor và caregiving roles.',
		very_low: 'Bạn rất đồng cảm và nhạy cảm với đau khổ người khác. Đây là gift cho helping professions nhưng cũng là vulnerability: bạn có thể bị "compassion fatigue" trong môi trường nhiều conflict. Và bạn có thể tránh né quyết định gây pain cho người khác — dù đó là quyết định đúng (ví dụ: sa thải nhân viên incompetent).',
		career: 'P thấp → Y tế, Giảng dạy, Tâm lý, HR, Non-profit, Social Work — mọi vai trò cần empathy. P vừa phải → Crisis Management, Surgery, Military, Trading, Venture Capital, Turnaround Consulting — cần "ice in veins". P cao → HIGH RISK ở mọi position — impulsivity + callousness = career bomb.',
		tip: 'Cho sinh viên năm 3: P cao — TRƯỚC KHI nói/hành động trong conflict, đếm đến 10 và hỏi: "Nếu cuộc nói chuyện này bị record, tôi có muốn sếp nghe không?". P thấp — tập phân biệt "empathy" (tốt) và "people-pleasing" (xấu). Bạn có thể care about people VÀ vẫn đưa quyết định tough.',
		academic: 'Boddy (2011): "Corporate Psychopaths" — P cao ở leadership level liên quan đến organizational destruction, bullying, fraud. Lilienfeld et al. (2012): "Fearless Dominance" component có thể positive — liên quan đến heroism, courage, stress immunity. Hare (1999): P rất cao ở ~1% population, subclinical P cao ở ~10%.',
		derailment: '🚨 Derailment cụ thể nhất: Trong thực tập, nếu bạn nói lời tàn nhẫn với đồng nghiệp ("Em ngu thế?", "Cái này ai cũng biết") — dù bạn không coi đó là big deal — nó sẽ trở thành story mà TOÀN BỘ công ty biết trong 24 giờ. Ở VN, reputation trong ngành lan CỰC NHANH qua group chat và mạng xã hội.',
		obLesson: 'OB concept: Emotional Intelligence (Goleman, 1995) — P cao = low EQ, đặc biệt ở component "empathy" và "social skills". Trong OB, EQ là predictor mạnh hơn IQ cho leadership effectiveness ở mọi cấp (Boyatzis, 2008). P cao + high position = toxic leadership.',
	},
};

// ─── SVG Radar Chart ─────────────────────────────────────────────────────────

interface RadarChartProps {
	traits: { label: string; score: number; maxScore?: number }[];
	colorFill: string;
	colorStroke: string;
	size?: number;
}

function RadarChart({ traits, colorFill, colorStroke, size = 200 }: RadarChartProps) {
	const n = traits.length;
	if (n < 3) return null;
	const cx = size / 2;
	const cy = size / 2;
	const r = size * 0.38;
	const labelR = size * 0.49;

	const angles = traits.map((_, i) => (i / n) * 2 * Math.PI - Math.PI / 2);
	const toPoint = (angle: number, radius: number) => ({
		x: cx + radius * Math.cos(angle),
		y: cy + radius * Math.sin(angle),
	});
	const webLevels = [0.33, 0.66, 1.0];

	const scorePoints = traits.map((t, i) => {
		const norm = Math.max(0, Math.min(1, (t.score - 1) / ((t.maxScore ?? 5) - 1)));
		return toPoint(angles[i], norm * r);
	});

	const scorePath =
		scorePoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';

	return (
		<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
			{webLevels.map((lvl) => {
				const pts = angles.map((a) => toPoint(a, lvl * r));
				const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';
				return <path key={lvl} d={d} fill="none" stroke="currentColor" strokeWidth="0.5"
					className="text-border opacity-60" strokeDasharray={lvl < 1 ? '2,2' : undefined} />;
			})}
			{angles.map((a, i) => {
				const end = toPoint(a, r);
				return <line key={i} x1={cx} y1={cy} x2={end.x.toFixed(1)} y2={end.y.toFixed(1)}
					stroke="currentColor" strokeWidth="0.5" className="text-border opacity-50" />;
			})}
			<path d={scorePath} fill={colorFill} stroke={colorStroke} strokeWidth="2" strokeLinejoin="round" />
			{scorePoints.map((p, i) => (
				<circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3" fill={colorStroke} />
			))}
			{traits.map((t, i) => {
				const lp = toPoint(angles[i], labelR);
				const anchor = lp.x < cx - 5 ? 'end' : lp.x > cx + 5 ? 'start' : 'middle';
				return (
					<text key={i} x={lp.x.toFixed(1)} y={lp.y.toFixed(1)}
						textAnchor={anchor} dominantBaseline="middle"
						fontSize="11" fill="currentColor" className="text-muted font-semibold">
						{t.label}
					</text>
				);
			})}
		</svg>
	);
}

// ─── Percentile Result type ────────────────────────────────────────────────────

interface PercentileResult {
	domain: PersonalityDomain;
	score: number;
	referenceGroupId: string;
	referenceGroupLabel: string;
	referenceGroupLabelVi: string;
	mean: number;
	sd: number;
	zScore: number;
	percentile: number;
	interpretation: string;
	interpretationVi: string;
}

interface ReferenceGroupOption {
	id: string;
	label: string;
	labelVi: string;
	type: 'ocean' | 'darkTriad';
	n: number;
}

interface ReferenceGroupDetail {
	id: string;
	label: string;
	labelVi: string;
	description: string;
	descriptionVi: string;
	source: string;
}

interface PercentilesApiResponse {
	sessionId: string;
	percentiles: Record<string, PercentileResult>;
	selectedGroups: { ocean: string; darkTriad: string };
	availableGroups: ReferenceGroupOption[];
	referenceGroupDetails: {
		ocean: ReferenceGroupDetail;
		darkTriad: ReferenceGroupDetail;
	};
}

// ─── TraitBar with expandable insight ─────────────────────────────────────────

function TraitBar({
	trait,
	colorClass,
	delay = 0,
	normative,
}: {
	trait: TraitScore;
	colorClass: string;
	delay?: number;
	normative?: PercentileResult;
}) {
	const [expanded, setExpanded] = useState(false);
	const percent = ((trait.score - 1) / 4) * 100;
	const viLabel = DOMAIN_LABELS_VI[trait.domain] ?? trait.label;
	const insight = TRAIT_INSIGHTS[trait.domain];
	const tier: FiveTier = normative
		? getZTier(normative.zScore)
		: trait.level === 'high' ? 'high' : trait.level === 'low' ? 'low' : 'moderate';
	const tierText = getLevelLabel(tier);
	const badgeClass = getLevelBadgeClass(tier);
	const meanPercent = normative ? ((normative.mean - 1) / 4) * 100 : null;

	return (
		<div className="rounded-xl border-2 border-border/50 bg-background-secondary/30 p-3">
			<button className="w-full text-left" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-2">
						{insight && <span className="text-sm">{insight.icon}</span>}
						<span className="text-sm font-bold text-foreground">{viLabel}</span>
						<span className="text-[10px] text-muted">({trait.label})</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-sm font-black tabular-nums text-foreground">{trait.score.toFixed(2)}</span>
						<span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
							{tierText}
						</span>
						{normative && (
							<span className="text-[10px] text-muted tabular-nums" title={`Z = ${normative.zScore.toFixed(2)}`}>
								P{normative.percentile}
							</span>
						)}
						<span className="text-muted text-xs">{expanded ? '▲' : '▼'}</span>
					</div>
				</div>
				<div className="relative h-3 overflow-visible rounded-full bg-background-secondary">
					<motion.div
						className={`h-full rounded-full ${colorClass}`}
						initial={{ width: 0 }}
						animate={{ width: `${Math.max(percent, 2)}%` }}
						transition={{ duration: 0.8, delay, ease: 'easeOut' }}
					/>
					{meanPercent !== null && (
						<div
							className="absolute top-1/2 -translate-y-1/2 w-0.5 h-5 bg-foreground/40 rounded-full"
							style={{ left: `${meanPercent}%` }}
							title={`Nhóm tham chiếu TB: ${normative?.mean.toFixed(2)}`}
						/>
					)}
				</div>
				{normative && (
					<div className="mt-1 flex items-center gap-2 text-[10px] text-muted">
						<span>TB nhóm: {normative.mean.toFixed(2)}</span>
						<span>•</span>
						<span>{normative.interpretationVi}</span>
					</div>
				)}
			</button>
			<AnimatePresence>
				{expanded && insight && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.25 }}
						className="overflow-hidden"
					>
						<div className="mt-3 space-y-2.5 border-t border-border/50 pt-3">
							<p className="text-[11px] text-muted leading-relaxed">{insight.what}</p>
							<div className="rounded-lg bg-surface/60 px-3 py-2.5 border border-border/30">
								<p className="text-[11px] font-bold text-foreground mb-1">🎯 Điều này có nghĩa gì với bạn ({tierText}):</p>
								<p className="text-[11px] leading-relaxed text-foreground-secondary">{insight[tier]}</p>
							</div>
							{insight.derailment && (tier === 'very_high' || tier === 'high') && (
								<div className="rounded-lg bg-error-subtle/50 border border-error/20 px-3 py-2.5">
									<p className="text-[10px] font-black text-error mb-1">⚠️ Rủi ro chệch bánh (Derailment Risk)</p>
									<p className="text-[10px] leading-relaxed text-error/80">{insight.derailment}</p>
								</div>
							)}
							<div className="grid grid-cols-2 gap-2">
								<div className="rounded-lg bg-indigo-subtle/40 border border-indigo/10 px-2.5 py-2">
									<p className="text-[10px] font-bold text-indigo mb-1">💼 Phù hợp nghề nghiệp</p>
									<p className="text-[10px] leading-relaxed text-muted">{insight.career}</p>
								</div>
								<div className="rounded-lg bg-success-subtle/40 border border-success/10 px-2.5 py-2">
									<p className="text-[10px] font-bold text-success mb-1">📚 Bối cảnh học thuật</p>
									<p className="text-[10px] leading-relaxed text-muted">{insight.academic}</p>
								</div>
							</div>
							{insight.obLesson && (
								<div className="rounded-lg bg-purple-subtle/30 border border-purple/15 px-3 py-2.5">
									<p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 mb-1">🎓 Bài học Hành vi Tổ chức (OB)</p>
									<p className="text-[10px] leading-relaxed text-muted">{insight.obLesson}</p>
								</div>
							)}
							<p className="text-[10px] text-amber-600 dark:text-amber-400 bg-warning-subtle/40 border border-warning/15 px-2.5 py-2 rounded-lg">💡 <strong>Action cho sinh viên:</strong> {insight.tip}</p>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

// ─── Archetype Card ────────────────────────────────────────────────────────────

function ArchetypeCard({ archetype }: { archetype: ArchetypeProfile }) {
	const themeColors: Record<ArchetypeProfile['colorTheme'], string> = {
		amber: 'from-amber-500/20 via-orange-500/10 to-transparent border-amber-500/30',
		indigo: 'from-indigo-500/20 via-blue-500/10 to-transparent border-indigo-500/30',
		rose: 'from-rose-500/20 via-pink-500/10 to-transparent border-rose-500/30',
		teal: 'from-teal-500/20 via-emerald-500/10 to-transparent border-teal-500/30',
		purple: 'from-purple-500/20 via-violet-500/10 to-transparent border-purple-500/30',
		emerald: 'from-emerald-500/20 via-green-500/10 to-transparent border-emerald-500/30',
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.2 }}
			className={`relative overflow-hidden rounded-2xl border bg-linear-to-br ${themeColors[archetype.colorTheme]} p-6 sm:p-8`}
		>
			<div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-accent/5 blur-3xl" />
			<div className="relative">
				<div className="flex items-center gap-4">
					<span className="text-4xl">{archetype.icon}</span>
					<div>
						<h3 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
							{archetype.name}
						</h3>
						<p className="text-sm italic text-muted">{archetype.tagline}</p>
					</div>
				</div>
				<p className="mt-5 text-sm leading-relaxed text-foreground-secondary">
					{archetype.narrative}
				</p>
				<div className="mt-6 grid gap-4 sm:grid-cols-2">
					<div className="rounded-xl border border-success/20 bg-success-subtle/50 p-4">
						<h4 className="flex items-center gap-2 text-sm font-bold text-success">
							<span>💪</span> Điểm mạnh
						</h4>
						<ul className="mt-3 space-y-2">
							{archetype.strengths.map((s, i) => (
								<li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-foreground-secondary">
									<span className="mt-0.5 text-success">✓</span>
									{s}
								</li>
							))}
						</ul>
					</div>
					<div className="rounded-xl border border-error/20 bg-error-subtle/50 p-4">
						<h4 className="flex items-center gap-2 text-sm font-bold text-error">
							<span>⚠️</span> Điểm mù
						</h4>
						<ul className="mt-3 space-y-2">
							{archetype.blindspots.map((b, i) => (
								<li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-foreground-secondary">
									<span className="mt-0.5 text-error">!</span>
									{b}
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</motion.div>
	);
}

// ─── Invalid Result Card ───────────────────────────────────────────────────────

function InvalidResultCard({ reason }: { reason?: string }) {
	return (
		<div className="rounded-2xl border border-error/30 bg-error-subtle p-8 text-center">
			<div className="text-4xl">😔</div>
			<h3 className="mt-4 text-xl font-black text-foreground">Unable to Analyze Results</h3>
			<p className="mt-2 text-sm text-muted leading-relaxed max-w-md mx-auto">
				The submission did not pass the attention check. This can happen if you
				rushed through or didn't read the items carefully — please try again when you have time to focus.
				{reason && (
					<span className="mt-2 block text-xs text-error">Detail: {reason}</span>
				)}
			</p>
			<Link
				href="/personality-test"
				className="mt-5 inline-block rounded-xl bg-accent px-6 py-3 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
			>
				Retake the assessment →
			</Link>
		</div>
	);
}

// ─── Reference Group Selector ──────────────────────────────────────────────────

function ReferenceGroupSelector({
	label,
	options,
	value,
	onChange,
	detail,
}: {
	label: string;
	options: ReferenceGroupOption[];
	value: string;
	onChange: (id: string) => void;
	detail?: ReferenceGroupDetail;
}) {
	return (
		<div className="space-y-2">
			<label className="text-xs font-bold uppercase tracking-wider text-muted">
				{label}
			</label>
			<div className="space-y-1.5">
				{options.map((opt) => (
					<button
						key={opt.id}
						onClick={() => onChange(opt.id)}
						className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-all ${
							value === opt.id
								? 'border-accent bg-accent/10 ring-1 ring-accent/30'
								: 'border-border/60 bg-surface hover:border-border hover:bg-surface-hover'
						}`}
					>
						<span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
							value === opt.id
								? 'border-accent bg-accent'
								: 'border-muted/40'
						}`}>
							{value === opt.id && (
								<span className="h-1.5 w-1.5 rounded-full bg-white" />
							)}
						</span>
						<span className={`text-xs font-medium ${value === opt.id ? 'text-foreground' : 'text-muted'}`}>
							{opt.labelVi} <span className="text-muted/60">(N={opt.n.toLocaleString()})</span>
						</span>
					</button>
				))}
			</div>
			{detail && (
				<p className="text-[10px] text-muted leading-relaxed pl-1">
					📖 {detail.source}
				</p>
			)}
		</div>
	);
}

// ─── Percentile Comparison Table ──────────────────────────────────────────────

function PercentileComparisonTable({
	traits,
	normativeMap,
}: {
	traits: TraitScore[];
	normativeMap: Record<string, PercentileResult>;
}) {
	return (
		<div className="space-y-3">
			{traits.map((trait) => {
				const norm = normativeMap[trait.domain];
				if (!norm) return null;
				const viLabel = DOMAIN_LABELS_VI[trait.domain] ?? trait.label;
				const percentile = norm.percentile;
				const barWidth = Math.max(percentile, 3);
				let barColor = 'bg-muted/40';
				if (percentile >= 75) barColor = 'bg-linear-to-r from-success/70 to-success';
				else if (percentile >= 60) barColor = 'bg-linear-to-r from-teal/60 to-teal';
				else if (percentile <= 25) barColor = 'bg-linear-to-r from-error/60 to-error';
				else if (percentile <= 40) barColor = 'bg-linear-to-r from-warning/60 to-warning';
				else barColor = 'bg-linear-to-r from-indigo/40 to-indigo/70';

				return (
					<div key={trait.domain} className="group">
						<div className="flex items-center justify-between mb-1">
							<div className="flex items-center gap-2">
								<span className="text-xs font-bold text-foreground">{viLabel}</span>
								<span className="text-[10px] text-muted">({trait.label})</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-xs font-bold tabular-nums text-foreground">{trait.score.toFixed(2)}</span>
								<span className="text-[10px] text-muted tabular-nums">
									(TB: {norm.mean.toFixed(2)})
								</span>
							</div>
						</div>
						{/* Visual percentile bar */}
						<div className="relative h-6 rounded-lg bg-background-secondary/80 border border-border/30 overflow-hidden">
							<motion.div
								className={`h-full rounded-lg ${barColor}`}
								initial={{ width: 0 }}
								animate={{ width: `${barWidth}%` }}
								transition={{ duration: 0.8, ease: 'easeOut' }}
							/>
							{/* 50th percentile marker */}
							<div className="absolute top-0 left-1/2 h-full w-px bg-foreground/20" />
							{/* Percentile label */}
							<div className={`absolute inset-0 flex items-center ${percentile > 50 ? 'justify-start pl-2' : 'justify-end pr-2'}`}>
								<span className={`text-[10px] font-black tabular-nums ${
									percentile > 50 ? 'text-white drop-shadow-sm' : 'text-foreground'
								}`}>
									P{percentile}
								</span>
							</div>
						</div>
						<div className="flex items-center justify-between mt-0.5">
							<span className="text-[9px] text-muted">
								Z = {norm.zScore > 0 ? '+' : ''}{norm.zScore.toFixed(2)}
							</span>
							<span className="text-[9px] text-muted">
								{norm.interpretationVi}
							</span>
						</div>
					</div>
				);
			})}
		</div>
	);
}

// ─── Cross-trait insights ─────────────────────────────────────────────────────

interface CrossTraitInsight { icon: string; title: string; description: string; action: string; }
type OceanResult = NonNullable<PersonalityTestSessionDTO['result']>['ocean'];
type DarkTriadResult = NonNullable<PersonalityTestSessionDTO['result']>['darkTriad'];

function generateCrossTraitInsights(ocean: NonNullable<OceanResult>, dark: NonNullable<DarkTriadResult>): CrossTraitInsight[] {
	const ins: CrossTraitInsight[] = [];
	// ── Leadership potential ──
	if (ocean.extraversion.level === 'high' && ocean.conscientiousness.level !== 'low')
		ins.push({ icon: '🏆', title: 'Tiềm năng lãnh đạo thực sự', description: 'Hướng ngoại cao + kỷ luật tốt = profile Leader-Manager. Judge et al. (2002) meta-analysis cho thấy combo này dự báo cả leadership emergence LẪN effectiveness. Bạn vừa có charisma vừa có execution power — hiếm có.', action: 'Trong semester tới, xung phong làm project lead. Nhưng hãy dẫn dắt bằng empowerment (giao việc + trust), không phải bằng micro-management.' });
	// ── Creative confidence ──
	if (ocean.openMindedness.level === 'high' && dark.narcissism.level !== 'low')
		ins.push({ icon: '🚀', title: 'Nhà đổi mới tự tin', description: 'O cao + N vừa phải = innovation + khả năng "sell" ý tưởng. Đây chính là profile của nhiều successful founder: Steve Jobs, Elon Musk. Nhưng ranh giới giữa "visionary" và "delusional" rất mỏng.', action: 'Viết ra 3 ý tưởng và pitch cho 3 người khác nhau. Nếu cả 3 đều nói "thú vị nhưng..." — listen to the "but".' });
	// ── Perfectionism trap ──
	if (ocean.negativeEmotionality.level === 'high' && ocean.conscientiousness.level === 'high')
		ins.push({ icon: '⚡', title: '⚠️ BẪY CẦU TOÀN (Perfectionism Trap)', description: 'C cao + N cao = bạn đặt tiêu chuẩn cực cao VÀ tự đánh mình rất mạnh khi không đạt. Đây là công thức #1 cho academic burnout. Nghiên cứu Stoeber & Otto (2006): perfectionism "concern over mistakes" là toxic nhất.', action: 'Áp dụng "80% rule": Khi bài tập/project đạt 80%, DỪNG LẠI. Dùng 20% năng lượng còn lại cho rest & recovery.' });
	// ── Calm empath ──
	if (ocean.negativeEmotionality.level === 'low' && dark.psychopathy.level === 'low')
		ins.push({ icon: '🧘', title: 'Người hòa giải tự nhiên', description: 'Ổn định cảm xúc + đồng cảm cao = bạn giữ bình tĩnh TRONG KHI vẫn quan tâm sâu sắc đến người khác. Đây là profile lý tưởng cho mediator, crisis counselor, và người quản lý conflict trong team.', action: 'Khi nhóm bạn có conflict, hãy chủ động làm mediator: lắng nghe từng bên riêng, sau đó facilitate conversation chung.' });
	// ── Lone wolf strategist ──
	if (ocean.extraversion.level === 'low' && ocean.openMindedness.level === 'high')
		ins.push({ icon: '🐺', title: 'Deep Thinker — Nhà tư duy chiều sâu', description: 'Hướng nội + O cao = khả năng deep work vượt trội. Cal Newport (Deep Work): "Trong nền kinh tế tri thức, khả năng tập trung sâu là superpower." Bạn có nó tự nhiên.', action: 'Block 2-3 giờ/ngày cho deep work không bị gián đoạn. Tắt thông báo, đóng cửa phòng. Đây là khi bạn produce your best work.' });
	// ── Strategic diplomat ──
	if (ocean.agreeableness.level === 'high' && dark.machiavellianism.level !== 'low')
		ins.push({ icon: '🎯', title: 'Nhà ngoại giao chiến lược', description: 'Empathy + strategic thinking = bạn vừa hiểu người khác cảm thấy gì VÀ biết cách navigate tình huống. Đây là Political Skill (Ferris et al., 2005) ở dạng productive: influence without manipulation.', action: 'Đọc "Getting to Yes" (Fisher & Ury) — principled negotiation = win-win qua empathy + strategy.' });

	// ── HIGH DARK TRIAD COMBOS (Gritty warnings) ──
	const darkAvg = (dark.machiavellianism.score + dark.narcissism.score + dark.psychopathy.score) / 3;

	if (dark.machiavellianism.level === 'high' && dark.narcissism.level === 'high')
		ins.push({ icon: '🚨', title: '⚠️ "Confident Manipulator" Profile', description: 'M cao + N cao = bạn vừa manipulative vừa grandiose. Đây là combo nguy hiểm nhất trong tổ chức: bạn tin bạn deserve everything VÀ willing to game the system. Paulhus & Williams (2002) gọi đây là "dark core" mạnh nhất.', action: 'REALITY CHECK: Hỏi 3 người bạn tin cậy nhất: "Tôi có từng khiến bạn cảm thấy bị used không?" Lắng nghe câu trả lời dù đau.' });
	else if (dark.machiavellianism.level === 'high' && dark.psychopathy.level === 'high')
		ins.push({ icon: '🚨', title: '⚠️ "Cold Calculator" Profile', description: 'M cao + P cao = bạn vừa strategic vừa callous. Bạn có thể manipulate MÀ KHÔNG cảm thấy guilty. Trong tổ chức, đây là profile bị fire nhanh nhất khi bị phát hiện — vì không ai trust bạn nữa.', action: 'Trước mỗi quyết định ảnh hưởng đến người khác, viết ra 3 câu: (1) Ai bị ảnh hưởng? (2) Họ sẽ cảm thấy gì? (3) Tôi OK nếu họ biết lý do thật?' });
	else if (dark.narcissism.level === 'high' && dark.psychopathy.level === 'high')
		ins.push({ icon: '🚨', title: '⚠️ "Dominant Maverick" Profile', description: 'N cao + P cao = bạn tự tin VÀ liều lĩnh, không sợ hậu quả VÀ tin mình đặc biệt. Trong startup, đây có thể là rocket fuel. Trong tổ chức truyền thống, đây là recipe for spectacular failure.', action: 'Tìm 1 mentor có kinh nghiệm 10+ năm. Người này sẽ là "reality check" cho bạn — bạn CẦN external perspective vì self-awareness là blind spot.' });

	if (darkAvg < 2.5)
		ins.push({ icon: '✨', title: 'Bright Core — Bạn là ánh sáng', description: 'Dark Triad tổng thể thấp = "Bright Triad" (Kaufman et al., 2019): Faith in Humanity, Humanism, Kantianism. Bạn tự nhiên đáng tin cậy, chân thành, và prosocial. Đây là foundation tuyệt vời cho mọi mối quan hệ dài hạn — cả cá nhân lẫn nghề nghiệp.', action: 'Phát huy nền tảng trust này: xây mạng lưới quan hệ authentic. Nhưng hãy đọc "Influence" (Cialdini) để nhận biết khi người khác exploit sự tốt bụng của bạn.' });
	else if (darkAvg > 3.5)
		ins.push({ icon: '⚔️', title: '⚠️ Dark Core mạnh — Cần tỉnh thức', description: 'Dark Triad tổng thể cao. Thẳng thắn: trong OB, profile này liên quan đến counterproductive work behavior (CWB), toxic leadership, và career derailment. NHƯNG awareness là bước đầu tiên — bạn đang nhìn thẳng vào data, đó đã là sign tốt.', action: 'Đây không phải "số phận" — traits có thể được manage. Cụ thể: (1) Pause trước khi react, (2) Seek feedback thường xuyên, (3) Xem xét coaching hoặc tư vấn chuyên nghiệp.' });

	// ── Agreeable + low C = pushover risk ──
	if (ocean.agreeableness.level === 'high' && ocean.conscientiousness.level === 'low')
		ins.push({ icon: '🎭', title: 'Rủi ro "Nice but Unreliable"', description: 'A cao + C thấp = bạn đồng ý giúp mọi người nhưng thường không deliver đúng hạn. Kết quả: mất trust dù có thiện chí. Trong tổ chức, đây là pattern khiến bạn được yêu thích nhưng không được promote.', action: 'Rule mới: Trước khi nói "OK tôi giúp", check calendar. Nếu đã full, nói "Tôi muốn giúp nhưng tuần này không kịp, tuần sau được không?".' });

	// ── High E + High N = Emotional Rollercoaster ──
	if (ocean.extraversion.level === 'high' && ocean.negativeEmotionality.level === 'high')
		ins.push({ icon: '🎢', title: 'Roller Coaster cảm xúc', description: 'E cao + N cao = bạn vừa social vừa emotional intense. Bạn là "life of the party" lúc vui và "drama center" lúc buồn. Trong team, mood swings của bạn ảnh hưởng đến emotional climate cả nhóm (emotional contagion, Barsade 2002).', action: 'Tập "emotional regulation before expression": khi cảm xúc dâng cao, viết ra giấy trước, chờ 30 phút, rồi mới share.' });

	return ins.slice(0, 5);
}

// ─── Limitations Section ──────────────────────────────────────────────────────

function LimitationsSection() {
	const [open, setOpen] = useState(false);
	return (
		<div className="rounded-xl border-2 border-border bg-background-secondary/50">
			<button
				className="flex w-full items-center justify-between px-5 py-4 text-left"
				onClick={() => setOpen((v) => !v)}
			>
				<span className="text-xs font-black text-foreground uppercase tracking-wider">📌 Giới hạn & Bối cảnh nghiên cứu</span>
				<span className="text-muted text-xs">{open ? '▲' : '▼'}</span>
			</button>
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className="overflow-hidden"
					>
						<div className="px-5 pb-5 space-y-4">
							<div className="grid gap-3 sm:grid-cols-2">
								{[
									{ icon: '🔬', title: 'Tự báo cáo (Self-Report Bias)', text: 'Kết quả dựa trên tự đánh giá — có thể bị ảnh hưởng bởi social desirability bias (muốn trả lời "đúng đắn") và trạng thái tâm lý hiện tại (reference-group effect).' },
									{ icon: '📏', title: 'KHÔNG phải chẩn đoán lâm sàng', text: 'BFI-2-S và SD3 là thang đo nghiên cứu cho dân số bình thường. KHÔNG thay thế đánh giá tâm lý chuyên nghiệp hoặc chẩn đoán DSM-5. Dark Triad cao ≠ rối loạn nhân cách.' },
									{ icon: '🌍', title: 'Bối cảnh văn hóa (Cross-Cultural)', text: 'Normative data chủ yếu từ mẫu phương Tây. Ý nghĩa của từng trait có thể khác trong bối cảnh VN — ví dụ: A thấp ở phương Tây = "assertive", ở VN = "khó chịu".' },
									{ icon: '⏰', title: 'Tính cách ≠ Cố định', text: 'Tính cách tương đối ổn định nhưng THAY ĐỔI được: Roberts et al. (2006) cho thấy C tăng, N giảm từ 20-40 tuổi ("maturity principle"). Đây là snapshot, không phải bản án.' },
									{ icon: '🎯', title: 'Context Matters', text: 'KHÔNG CÓ profile nào là "tốt nhất". Mỗi trait có giá trị tùy context: N cao = tốt cho nghệ thuật, xấu cho phẫu thuật. Luôn đánh giá trong bối cảnh công việc cụ thể.' },
									{ icon: '📊', title: 'Kích thước hiệu ứng (Effect Size)', text: 'Tương quan giữa trait và outcomes thường r=0.2-0.4. Personality giải thích ~10-15% variance — yếu tố khác (skill, opportunity, effort) quan trọng không kém.' },
								].map((item) => (
									<div key={item.title} className="rounded-lg bg-surface/80 border border-border/40 px-3.5 py-2.5">
										<p className="text-[11px] font-bold text-foreground">{item.icon} {item.title}</p>
										<p className="mt-1 text-[10px] leading-relaxed text-muted">{item.text}</p>
									</div>
								))}
							</div>
							<div className="rounded-lg bg-background-secondary border border-border/40 px-4 py-3">
								<p className="text-[11px] font-bold text-foreground mb-2">📚 Tài liệu tham khảo chính</p>
								<ul className="space-y-1 text-[10px] text-muted">
									<li>• Soto, C. J., & John, O. P. (2017). The next Big Five Inventory (BFI-2). <em>JPSP, 113</em>(1), 117–143.</li>
									<li>• Jones, D. N., & Paulhus, D. L. (2014). Introducing the Short Dark Triad (SD3). <em>Assessment, 21</em>(1), 28–41.</li>
									<li>• Paulhus, D. L., & Williams, K. M. (2002). The Dark Triad of personality. <em>JRP, 36</em>, 556–563.</li>
									<li>• Barrick, M. R., & Mount, M. K. (1991). The Big Five personality dimensions and job performance. <em>Personnel Psychology, 44</em>, 1–26.</li>
									<li>• Judge, T. A., et al. (2002). Personality and leadership: A qualitative and quantitative review. <em>JAP, 87</em>, 765–780.</li>
									<li>• Hogan, R., & Hogan, J. (2001). Assessing leadership: A view from the dark side. <em>International Journal of Selection and Assessment, 9</em>, 40–51.</li>
									<li>• Roberts, B. W., et al. (2006). Patterns of mean-level change in personality traits across the life course. <em>Psychological Bulletin, 132</em>(1), 1–25.</li>
								</ul>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props { session: PersonalityTestSessionDTO; }

// ─── Results Interstitial — Mandatory "Read Before Results" Gate ─────────────

function ResultsInterstitial({ onConfirm }: { onConfirm: () => void }) {
	const [checked, setChecked] = useState(false);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="space-y-6"
		>
			{/* Header */}
			<div className="text-center">
				<span className="text-4xl">📖</span>
				<h2 className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
					Before You See Your Results
				</h2>
				<p className="mt-2 text-sm text-muted max-w-lg mx-auto leading-relaxed">
					Personality test results can be powerful — but only if you understand what they mean and what they <strong>don&apos;t</strong> mean. Please read carefully.
				</p>
			</div>

			{/* How to Read Results */}
			<div className="rounded-2xl border-2 border-accent/30 bg-surface p-5 sm:p-6 space-y-4">
				<div className="flex items-center gap-3">
					<span className="text-xl">🧭</span>
					<h3 className="text-sm font-black text-foreground uppercase tracking-wider">Hướng dẫn đọc kết quả</h3>
				</div>
				<div className="grid gap-3 sm:grid-cols-2">
					{[
						{ icon: '📊', title: 'Percentile (P)', text: 'Cho biết % người trong nhóm tham chiếu có điểm THẤP hơn bạn. P72 = bạn cao hơn 72% người trong nhóm. P50 = trung bình.' },
						{ icon: '📐', title: 'Z-score', text: 'Cho biết bạn cách trung bình nhóm bao nhiêu độ lệch chuẩn. Z=0 → đúng trung bình; |Z|>1 → khác biệt đáng kể; |Z|>1.5 → nổi bật.' },
						{ icon: '🎚️', title: 'Hệ thống 5 mức', text: 'Rất thấp ← Thấp ← Trung bình → Cao → Rất cao. Dựa trên Z-score, không phải điểm tuyệt đối. "Trung bình" = đa số mọi người, hoàn toàn bình thường.' },
						{ icon: '🎯', title: 'Nhóm tham chiếu', text: 'Điểm của bạn được so sánh với dữ liệu nghiên cứu quốc tế. Bạn có thể chuyển đổi nhóm tham chiếu để xem so sánh từ nhiều góc độ.' },
					].map((item) => (
						<div key={item.title} className="rounded-xl bg-background-secondary/80 border border-border/40 px-4 py-3">
							<p className="text-xs font-bold text-foreground">{item.icon} {item.title}</p>
							<p className="mt-1 text-[11px] leading-relaxed text-muted">{item.text}</p>
						</div>
					))}
				</div>
			</div>

			{/* Limitations & Research Context */}
			<div className="rounded-2xl border-2 border-warning/30 bg-surface p-5 sm:p-6 space-y-4">
				<div className="flex items-center gap-3">
					<span className="text-xl">⚠️</span>
					<h3 className="text-sm font-black text-foreground uppercase tracking-wider">Giới hạn & Bối cảnh nghiên cứu</h3>
				</div>
				<div className="grid gap-3 sm:grid-cols-2">
					{[
						{ icon: '🔬', title: 'Self-Report Bias', text: 'Kết quả dựa trên tự đánh giá — bị ảnh hưởng bởi social desirability ("muốn trả lời đẹp") và trạng thái tâm lý hiện tại. Kết quả có thể khác nếu bạn làm vào ngày khác.' },
						{ icon: '📏', title: 'KHÔNG phải chẩn đoán', text: 'BFI-2-S và SD3 là công cụ NGHIÊN CỨU. Dark Triad cao ≠ bạn xấu. KHÔNG thay thế đánh giá tâm lý chuyên nghiệp. Đây là educational tool.' },
						{ icon: '🌍', title: 'Bối cảnh văn hóa', text: 'Normative data chủ yếu từ mẫu phương Tây. Ý nghĩa trait có thể khác trong bối cảnh VN. Ví dụ: thấp Agreeableness ở phương Tây = "assertive", ở VN có thể = "khó chịu".' },
						{ icon: '📊', title: 'Tính cách ≠ Số phận', text: 'Personality giải thích ~10-15% variance trong cuộc sống. Skills, effort, opportunities, luck — tất cả đều quan trọng. Và tính cách CÓ THỂ thay đổi theo thời gian.' },
					].map((item) => (
						<div key={item.title} className="rounded-xl bg-warning-subtle/30 border border-warning/15 px-4 py-3">
							<p className="text-xs font-bold text-foreground">{item.icon} {item.title}</p>
							<p className="mt-1 text-[11px] leading-relaxed text-muted">{item.text}</p>
						</div>
					))}
				</div>
				<div className="rounded-xl bg-error-subtle/30 border border-error/20 px-4 py-3">
					<p className="text-xs font-bold text-error">🚨 Đặc biệt quan trọng với Dark Triad</p>
					<p className="mt-1 text-[11px] leading-relaxed text-muted">
						Dark Triad (Machiavellianism, Narcissism, Psychopathy) là <strong>đặc điểm tính cách bình thường</strong> trên phổ liên tục, KHÔNG phải nhãn "tốt/xấu".
						Mức cao không tự động nghĩa là tiêu cực — ở mức vừa phải, chúng liên quan đến tự tin, chiến lược, và bình tĩnh dưới áp lực.
						Kết quả được đưa ra để giúp bạn <strong>tự nhận thức</strong>, không phải để phán xét.
					</p>
				</div>
			</div>

			{/* Confirmation */}
			<div className="rounded-2xl border-2 border-border bg-surface p-5 sm:p-6">
				<label className="flex items-start gap-3 cursor-pointer group">
					<button
						onClick={() => setChecked(v => !v)}
						className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
							checked
								? 'border-accent bg-accent'
								: 'border-muted/50 group-hover:border-accent/50'
						}`}
					>
						{checked && (
							<svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						)}
					</button>
					<span className="text-sm text-foreground leading-relaxed">
						Tôi đã đọc và hiểu rằng đây là <strong>công cụ giáo dục</strong>, không phải chẩn đoán tâm lý.
						Kết quả mang tính tham khảo và phụ thuộc vào nhiều yếu tố. Tôi sẽ sử dụng kết quả để
						<strong> tự nhận thức và phát triển bản thân</strong>, không phải để gán nhãn.
					</span>
				</label>
				<motion.button
					onClick={onConfirm}
					disabled={!checked}
					className={`mt-5 w-full rounded-xl px-6 py-3.5 text-sm font-black transition-all ${
						checked
							? 'bg-accent text-accent-foreground hover:bg-accent-hover shadow-lg shadow-accent/20'
							: 'bg-muted/20 text-muted cursor-not-allowed'
					}`}
					whileTap={checked ? { scale: 0.98 } : {}}
				>
					{checked ? 'Xem kết quả của tôi →' : '☝️ Vui lòng xác nhận để tiếp tục'}
				</motion.button>
			</div>
		</motion.div>
	);
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function PersonalityResultsDashboard({ session }: Props) {
	const result = session.result;
	const [showResults, setShowResults] = useState(false);

	const [normativeData, setNormativeData] = useState<PercentilesApiResponse | null>(null);
	const [oceanGroup, setOceanGroup] = useState('bfi2-internet');
	const [darkTriadGroup, setDarkTriadGroup] = useState('sd3-community');
	const [isLoadingPercentiles, setIsLoadingPercentiles] = useState(false);

	const fetchPercentiles = useCallback(async (oGroup: string, dtGroup: string) => {
		setIsLoadingPercentiles(true);
		try {
			const res = await fetch(
				`/api/personality-test/${session.id}/percentiles?oceanGroup=${oGroup}&darkTriadGroup=${dtGroup}`
			);
			if (res.ok) {
				const json = await res.json();
				setNormativeData(json.data);
			}
		} catch {
			// Silently fail — percentile comparison is non-critical
		} finally {
			setIsLoadingPercentiles(false);
		}
	}, [session.id]);

	// Fetch percentiles on mount and when reference groups change
	useEffect(() => {
		if (result?.ocean && result?.darkTriad) {
			fetchPercentiles(oceanGroup, darkTriadGroup);
		}
	}, [result?.ocean, result?.darkTriad, oceanGroup, darkTriadGroup, fetchPercentiles]);

	// If no result or no computed scores at all, show invalid card
	if (!result || (!result.ocean && !result.darkTriad)) {
		return <InvalidResultCard reason={result?.invalidReason} />;
	}

	// Mandatory interstitial: student must confirm understanding before seeing results
	if (!showResults) {
		return <ResultsInterstitial onConfirm={() => setShowResults(true)} />;
	}

	const { ocean, darkTriad, archetype } = result;

	const oceanTraits: TraitScore[] = ocean
		? [
				ocean.extraversion,
				ocean.agreeableness,
				ocean.conscientiousness,
				ocean.negativeEmotionality,
				ocean.openMindedness,
			]
		: [];

	const darkTraits: TraitScore[] = darkTriad
		? [darkTriad.machiavellianism, darkTriad.narcissism, darkTriad.psychopathy]
		: [];

	const normativeMap = normativeData?.percentiles ?? {};
	const oceanGroupOptions = normativeData?.availableGroups?.filter(g => g.type === 'ocean') ?? [];
	const darkTriadGroupOptions = normativeData?.availableGroups?.filter(g => g.type === 'darkTriad') ?? [];

	return (
		<div className="space-y-6">
			{/* Attention Check Warning Banner */}
			{!result.isValid && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="rounded-2xl border-2 border-warning/40 bg-warning-subtle p-5"
				>
					<div className="flex items-start gap-3">
						<span className="text-2xl shrink-0">⚠️</span>
						<div>
							<h3 className="font-black text-foreground">Attention Check Not Passed</h3>
							<p className="mt-1 text-sm text-muted leading-relaxed">
								One or more attention-check items were answered incorrectly. Your results are shown below
								for <strong>educational purposes only</strong> and may not accurately reflect your personality profile.
								Consider retaking the test when you have time to focus.
							</p>
							{result.invalidReason && (
								<p className="mt-2 text-xs text-warning font-mono">Detail: {result.invalidReason}</p>
							)}
							<Link
								href="/personality-test"
								className="mt-3 inline-block rounded-lg bg-accent px-4 py-2 text-xs font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
							>
								Retake the test →
							</Link>
						</div>
					</div>
				</motion.div>
			)}

			{/* Header */}
			<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
				<p className="text-xs font-bold uppercase tracking-widest text-accent">Your results are ready ✨</p>
				<h2 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">Comprehensive Personality Profile</h2>
				<p className="mt-2 text-sm text-muted max-w-md mx-auto">
					Below is the full picture of your personality — based on two widely-researched psychological models.
				</p>
				{session.completedAt && (
					<p className="mt-2 text-xs text-muted">
						{new Date(session.completedAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
					</p>
				)}
			</motion.div>

			{/* Archetype */}
			{archetype && <ArchetypeCard archetype={archetype} />}

			{/* Radar Charts */}
			<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
				className="grid gap-6 sm:grid-cols-2">
				<div className="rounded-2xl border-2 border-indigo/30 bg-surface p-5 flex flex-col items-center shadow-sm">
					<p className="text-xs font-black uppercase tracking-wider text-indigo mb-1">🌟 5 nét tính cách lớn (OCEAN)</p>
					<p className="text-[10px] text-muted mb-4">BFI-2-S • Soto &amp; John, 2017</p>
					<RadarChart
						traits={oceanTraits.map(t => ({ label: (DOMAIN_LABELS_VI[t.domain] ?? t.label).split('/')[0], score: t.score }))}
						colorFill="rgba(99,102,241,0.2)"
						colorStroke="rgb(99,102,241)"
						size={220}
					/>
				</div>
				<div className="rounded-2xl border-2 border-rose/30 bg-surface p-5 flex flex-col items-center shadow-sm">
					<p className="text-xs font-black uppercase tracking-wider text-rose mb-1">🌑 Bản năng xã hội (Dark Triad)</p>
					<p className="text-[10px] text-muted mb-4">SD3 • Jones &amp; Paulhus, 2014</p>
					<RadarChart
						traits={darkTraits.map(t => ({ label: (DOMAIN_LABELS_VI[t.domain] ?? t.label).split('/')[0], score: t.score }))}
						colorFill="rgba(244,63,94,0.2)"
						colorStroke="rgb(244,63,94)"
						size={220}
					/>
					<div className="mt-4 rounded-lg bg-background-secondary p-2.5 w-full">
						<p className="text-[10px] leading-relaxed text-muted text-center">
							⚠️ Dark Triad cao không tự động có nghĩa xấu — mức vừa phải phản ánh trí tuệ chiến lược và khả năng lãnh đạo.
						</p>
					</div>
				</div>
			</motion.div>

			{/* Cross-Trait Insights */}
			{ocean && darkTriad && (
				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
					className="rounded-2xl border-2 border-accent/30 bg-surface p-5 sm:p-6 shadow-sm">
					<div className="flex items-center gap-3 mb-4">
						<span className="text-2xl">🔍</span>
						<div>
							<h3 className="text-sm font-black text-foreground uppercase tracking-wider">Điểm độc đáo của bạn</h3>
							<p className="text-xs text-muted">Những nhận định này xuất hiện khi kết hợp nhiều đặc điểm của bạn với nhau</p>
						</div>
					</div>
					<div className="grid gap-3 sm:grid-cols-2">
						{generateCrossTraitInsights(ocean, darkTriad).map((ins, i) => (
							<div key={i} className="rounded-xl border-2 border-border/60 bg-background-secondary/50 p-3.5 shadow-sm">
								<div className="flex items-start gap-2">
									<span className="text-base mt-0.5">{ins.icon}</span>
									<div>
										<p className="text-xs font-bold text-foreground">{ins.title}</p>
										<p className="mt-1 text-[11px] leading-relaxed text-muted">{ins.description}</p>
										<p className="mt-1.5 text-[10px] text-accent font-semibold">→ {ins.action}</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</motion.div>
			)}

			{/* Trait Detail Bars */}
			<div className="grid gap-6 lg:grid-cols-2">
				<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
					className="rounded-2xl border-2 border-indigo/30 bg-surface p-5 sm:p-6 shadow-sm">
					<div className="flex items-center gap-3 mb-4">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-subtle text-xl">🌟</div>
						<div>
							<h3 className="text-sm font-black text-foreground uppercase tracking-wider">5 nét tính cách lớn</h3>
							<p className="text-[10px] text-muted">👆 Nhấn vào từng mục để xem phân tích riêng cho bạn</p>
						</div>
					</div>
					<div className="space-y-3">
						{oceanTraits.map((trait, i) => (
							<TraitBar key={trait.domain} trait={trait}
								colorClass="bg-linear-to-r from-indigo to-purple"
								delay={0.35 + i * 0.1}
								normative={normativeMap[trait.domain]}
							/>
						))}
					</div>
				</motion.div>
				<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
					className="rounded-2xl border-2 border-rose/30 bg-surface p-5 sm:p-6 shadow-sm">
					<div className="flex items-center gap-3 mb-4">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-subtle text-xl">🌑</div>
						<div>
							<h3 className="text-sm font-black text-foreground uppercase tracking-wider">Bản năng xã hội</h3>
							<p className="text-[10px] text-muted">👆 Nhấn vào từng mục để xem phân tích riêng cho bạn</p>
						</div>
					</div>
					<div className="space-y-3">
						{darkTraits.map((trait, i) => (
							<TraitBar key={trait.domain} trait={trait}
								colorClass="bg-linear-to-r from-rose to-red-500"
								delay={0.4 + i * 0.1}
								normative={normativeMap[trait.domain]}
							/>
						))}
					</div>
				</motion.div>
			</div>

			{/* Normative Percentile Comparison */}
			<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
				className="rounded-2xl border-2 border-accent/30 bg-surface overflow-hidden shadow-sm">
				<div className="p-5 sm:p-6">
					<div className="flex items-center gap-3 mb-1">
						<span className="text-2xl">📊</span>
						<div>
							<h3 className="text-sm font-black text-foreground uppercase tracking-wider">Bạn ở đâu so với mọi người?</h3>
							<p className="text-xs text-muted mt-0.5">So sánh với nhóm tham chiếu nghiên cứu quốc tế</p>
						</div>
					</div>
					<div className="mt-4 grid gap-4 sm:grid-cols-2">
						{oceanGroupOptions.length > 0 && (
							<ReferenceGroupSelector label="Nhóm OCEAN" options={oceanGroupOptions} value={oceanGroup} onChange={setOceanGroup} detail={normativeData?.referenceGroupDetails?.ocean} />
						)}
						{darkTriadGroupOptions.length > 0 && (
							<ReferenceGroupSelector label="Nhóm Dark Triad" options={darkTriadGroupOptions} value={darkTriadGroup} onChange={setDarkTriadGroup} detail={normativeData?.referenceGroupDetails?.darkTriad} />
						)}
					</div>
					{isLoadingPercentiles && (
						<div className="mt-4 flex items-center justify-center py-6 text-sm text-muted">
							<div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent mr-2" />Đang tính toán percentile...
						</div>
					)}
					{!isLoadingPercentiles && normativeData && (
						<div className="mt-5 space-y-5">
							<div>
								<h4 className="text-xs font-bold uppercase tracking-wider text-indigo mb-2">🌟 5 nét tính cách lớn</h4>
								<PercentileComparisonTable traits={oceanTraits} normativeMap={normativeMap} />
							</div>
							<div>
								<h4 className="text-xs font-bold uppercase tracking-wider text-rose mb-2">🌑 Bản năng xã hội</h4>
								<PercentileComparisonTable traits={darkTraits} normativeMap={normativeMap} />
							</div>
							<div className="rounded-lg bg-background-secondary p-4">
								<h4 className="text-xs font-bold text-foreground mb-2">🎯 Hệ thống 5 mức (dựa trên Z-score)</h4>
								<div className="flex flex-wrap gap-2">
									{(['very_high', 'high', 'moderate', 'low', 'very_low'] as FiveTier[]).map((t) => (
										<span key={t} className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${getLevelBadgeClass(t)}`}>
											{getLevelLabel(t)} {t === 'very_high' ? '(Z≥1.5)' : t === 'high' ? '(Z≥0.5)' : t === 'moderate' ? '(-0.5≤Z<0.5)' : t === 'low' ? '(Z≥-1.5)' : '(Z<-1.5)'}
										</span>
									))}
								</div>
							</div>
							<div className="rounded-lg bg-background-secondary border border-border/30 p-3">
								<p className="text-[10px] text-muted leading-relaxed text-center">
									📖 <strong>Nhắc nhanh:</strong> P = percentile (% người có điểm thấp hơn bạn) · Z = độ lệch từ trung bình · Đường dọc trên bar = vị trí trung bình nhóm
								</p>
							</div>
						</div>
					)}
				</div>
			</motion.div>

			{/* Score Summary Table */}
			<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
				className="rounded-2xl border-2 border-border bg-surface overflow-hidden shadow-sm">
				<div className="p-5 sm:p-6">
					<h3 className="text-sm font-black text-foreground uppercase tracking-wider">📋 Bảng điểm chi tiết</h3>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-t border-border bg-background-secondary/50">
								{['Đặc điểm', 'Loại', 'Điểm', 'Z', 'Mức', 'Percentile'].map((h) => (
									<th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted">{h}</th>
								))}
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{[...oceanTraits, ...darkTraits].map((trait) => {
								const isOcean = ['extraversion', 'agreeableness', 'conscientiousness', 'negativeEmotionality', 'openMindedness'].includes(trait.domain);
								const norm = normativeMap[trait.domain];
								const tier: FiveTier = norm ? getZTier(norm.zScore) : (trait.level === 'high' ? 'high' : trait.level === 'low' ? 'low' : 'moderate');
								return (
									<tr key={trait.domain} className="transition-colors hover:bg-surface-hover/50">
										<td className="px-4 py-3 font-medium text-foreground">
											{DOMAIN_LABELS_VI[trait.domain] ?? trait.label}
											<span className="ml-1 text-xs text-muted">({trait.label})</span>
										</td>
										<td className="px-4 py-3">
											<span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${isOcean ? 'bg-indigo-subtle text-indigo' : 'bg-rose-subtle text-rose'}`}>
												{isOcean ? 'OCEAN' : 'Dark'}
											</span>
										</td>
										<td className="px-4 py-3 font-bold tabular-nums">{trait.score.toFixed(2)}</td>
										<td className="px-4 py-3 tabular-nums text-muted">{norm ? `${norm.zScore > 0 ? '+' : ''}${norm.zScore.toFixed(2)}` : '—'}</td>
										<td className="px-4 py-3">
											<span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${getLevelBadgeClass(tier)}`}>{getLevelLabel(tier)}</span>
										</td>
										<td className="px-4 py-3 text-xs tabular-nums text-muted">{norm ? `P${norm.percentile}` : (trait.percentile !== null ? `P${trait.percentile}` : '—')}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</motion.div>

			{/* Actions */}
			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
				className="flex flex-col gap-3 sm:flex-row sm:justify-center">
				<Link href="/personality-test" className="rounded-xl border border-border bg-surface px-6 py-3 text-center text-sm font-bold text-foreground transition-colors hover:bg-surface-hover">
					← Quay lại
				</Link>
				<Link href="/personality-test" className="rounded-xl bg-accent px-6 py-3 text-center text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover">
					Làm lại bài đánh giá 🔁
				</Link>
			</motion.div>

			{/* Limitations */}
			<LimitationsSection />
		</div>
	);
}
