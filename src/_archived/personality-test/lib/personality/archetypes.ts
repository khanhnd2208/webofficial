/* ════════════════════════════════════════════════════════════════════════
   Archetype Engine

   Personality archetype/persona profile generation.
   Matches scored trait profiles against a set of archetype rules
   and returns the best-fitting persona.

   Each archetype has:
   - A match function that scores how well the profile fits
   - Strengths, blindspots, and narrative text
   - A color theme for UI rendering
   ════════════════════════════════════════════════════════════════════════ */

import type {
	OceanScores,
	DarkTriadScores,
	ArchetypeProfile,
} from '@/types/personalityTest';

// ─── Archetype Rule Interface ──────────────────────────────────────────────────

interface ArchetypeRule {
	name: string;
	tagline: string;
	nameVi: string;
	taglineVi: string;
	icon: string;
	colorTheme: ArchetypeProfile['colorTheme'];
	/** Returns a priority score (0 = no match). Higher = stronger match. */
	match: (ocean: OceanScores, dark: DarkTriadScores) => number;
	strengths: string[];
	blindspots: string[];
	narrative: string;
	strengthsVi: string[];
	blindspotsVi: string[];
	narrativeVi: string;
}

// ─── Archetype Rules ───────────────────────────────────────────────────────────

const ARCHETYPE_RULES: ArchetypeRule[] = [
	// ── 1. The Strategic Executor ──
	{
		name: 'The Strategic Executor',
		tagline: 'Discipline meets strategic awareness',
		nameVi: 'Nhà Thực thi Chiến lược',
		taglineVi: 'Kỷ luật kết hợp nhận thức chiến lược',
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
			'Exceptional project execution — you deliver results consistently, even when facing significant obstacles or ambiguity',
			'Strategic resource allocation — you read organisational politics with unusual clarity and know how to mobilise support for your goals',
			'Long-term planning combined with pragmatic flexibility — you can hold a vision while adapting tactics as circumstances change',
			'High reliability under pressure — when deadlines tighten and stakes rise, your performance actually improves rather than deteriorates',
		],
		blindspots: [
			'You may unconsciously sacrifice team morale for efficiency — the "mission over people" mindset that delivers short-term results but erodes loyalty over time',
			'Prone to information hoarding as a power lever — sharing information selectively to maintain strategic advantage, which colleagues eventually notice and resent',
			'Risk of becoming the person who "always has an agenda" — even when your intentions are good, the perception of constant calculation can undermine trust',
			'The "Brilliant Jerk" trap is real for this profile: organisations ultimately remove people who deliver results but destroy team culture — no matter how talented they are',
		],
		narrative:
			'You combine the disciplined work ethic of high Conscientiousness with the strategic calculus of elevated Machiavellianism. In organisations, you are the person who gets things done — efficiently, precisely, and with full awareness of the political landscape. You understand not just what needs to happen, but who needs to be brought on board and how to navigate resistance. Your danger zone? When your pragmatism crosses into manipulation, you risk becoming the leader people respect but never truly trust. Research consistently shows that long-term career success depends more on accumulated trust than on accumulated tactics — and trust, once lost, is exponentially harder to rebuild than it was to build in the first place.',
		strengthsVi: [
			'Thực thi dự án xuất sắc — bạn đạt kết quả một cách nhất quán, ngay cả khi đối mặt với rào cản lớn hoặc sự mơ hồ',
			'Phân bổ nguồn lực chiến lược — bạn đọc vị chính trị tổ chức với sự rõ ràng hiếm có và biết cách huy động hỗ trợ cho mục tiêu của mình',
			'Lập kế hoạch dài hạn kết hợp với tính linh hoạt thực dụng — bạn có thể giữ vững tầm nhìn trong khi điều chỉnh chiến thuật khi hoàn cảnh thay đổi',
			'Độ tin cậy cao dưới áp lực — khi deadline gấp gáp và rủi ro tăng, hiệu suất của bạn thực sự cải thiện thay vì suy giảm',
		],
		blindspotsVi: [
			'Bạn có thể vô thức hy sinh tinh thần nhóm cho hiệu quả — tư duy "nhiệm vụ trên con người" mang lại kết quả ngắn hạn nhưng xói mòn lòng trung thành theo thời gian',
			'Có xu hướng giữ thông tin như đòn bẩy quyền lực — chia sẻ thông tin có chọn lọc để duy trì lợi thế chiến lược, điều mà đồng nghiệp cuối cùng sẽ nhận ra và bất bình',
			'Nguy cơ trở thành người "luôn có mưu tính" — ngay cả khi ý định của bạn là tốt, nhận thức về sự tính toán liên tục có thể làm suy yếu niềm tin',
			'Bẫy "Brilliant Jerk" rất thực với hồ sơ này: tổ chức cuối cùng sẽ loại bỏ người tạo ra kết quả nhưng phá hủy văn hóa nhóm — dù họ tài năng đến đâu',
		],
		narrativeVi:
			'Bạn kết hợp đạo đức làm việc kỷ luật của Tận tâm cao với tư duy tính toán chiến lược của Machiavellianism cao. Trong tổ chức, bạn là người hoàn thành công việc — hiệu quả, chính xác, và với nhận thức đầy đủ về bối cảnh chính trị. Bạn hiểu không chỉ điều gì cần xảy ra, mà còn ai cần được thuyết phục và cách điều hướng sự kháng cự. Vùng nguy hiểm của bạn? Khi sự thực dụng vượt qua ranh giới thao túng, bạn có nguy cơ trở thành lãnh đạo mà mọi người tôn trọng nhưng không bao giờ thực sự tin tưởng. Nghiên cứu cho thấy nhất quán: thành công sự nghiệp dài hạn phụ thuộc vào niềm tin tích lũy hơn là chiến thuật tích lũy — và niềm tin, một khi mất, khó xây dựng lại hơn gấp bội so với ban đầu.',
	},

	// ── 2. The Charismatic Disruptor ──
	{
		name: 'The Charismatic Disruptor',
		tagline: 'Magnetic presence with a volatile core',
		nameVi: 'Nhà Đổi mới Lôi cuốn',
		taglineVi: 'Sức hút mạnh mẽ với năng lượng bùng nổ',
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
			'Exceptional at inspiring and rallying teams around a bold vision — your enthusiasm is genuinely contagious and opens doors that stay closed for others',
			'Natural confidence that creates opportunities — you walk into rooms and conversations with an energy that commands attention and builds momentum',
			'High energy and risk tolerance that drives innovation — while others hesitate at the edge of uncertainty, you step forward with conviction',
			'Comfortable taking bold, calculated risks — your willingness to act decisively when others are paralysed by analysis creates real competitive advantage',
		],
		blindspots: [
			'Feedback resistance — you may unconsciously dismiss criticism as jealousy, incompetence, or irrelevance, missing valuable signals for course correction',
			'Risk of over-promising and under-delivering to maintain your image — the gap between your vision and your execution can erode credibility over time',
			'Can unconsciously create a "cult of personality" that stifles the dissent and diversity of thought your team actually needs to succeed',
			'May prioritise personal glory over collective success — this is often invisible to you but very visible to colleagues, and it quietly drives your best people away',
		],
		narrative:
			'Your high Extraversion gives you magnetic social energy, amplified by a Narcissistic confidence that makes you a natural centre of gravity in any room. You thrive in roles requiring vision-casting, persuasion, and the boldness to pursue opportunities others dismiss. This is the profile of many successful entrepreneurs, keynote speakers, and change leaders. The critical blind spot to understand: you may confuse admiration for genuine connection, and your need for validation can quietly sabotage the very relationships you depend on. Grijalva and colleagues (2015) found that this profile follows an inverted-U curve with leadership effectiveness — it accelerates early success but becomes a liability as its interpersonal costs accumulate. The antidote is not less confidence — it is more genuine curiosity about what other people think, especially when they disagree with you.',
		strengthsVi: [
			'Xuất sắc trong việc truyền cảm hứng và tập hợp nhóm quanh tầm nhìn táo bạo — sự nhiệt tình của bạn thực sự lan tỏa và mở ra những cánh cửa mà người khác không thể',
			'Sự tự tin tự nhiên tạo ra cơ hội — bạn bước vào bất kỳ phòng nào với năng lượng thu hút sự chú ý và tạo đà tiến',
			'Năng lượng cao và khả năng chịu rủi ro thúc đẩy đổi mới — khi người khác do dự, bạn tiến về phía trước với niềm tin',
			'Thoải mái đưa ra quyết định táo bạo — sự sẵn sàng hành động dứt khoát khi người khác bị tê liệt bởi phân tích tạo ra lợi thế cạnh tranh thực sự',
		],
		blindspotsVi: [
			'Xu hướng kháng cự phản hồi — bạn có thể vô thức gạt bỏ phê bình như là sự đố kỵ hay thiếu năng lực, bỏ lỡ các tín hiệu quý giá để điều chỉnh',
			'Nguy cơ hứa hẹn quá nhiều để duy trì hình ảnh — khoảng cách giữa tầm nhìn và thực thi có thể xói mòn uy tín theo thời gian',
			'Có thể vô thức tạo ra "cult of personality" khiến sự bất đồng và đa dạng tư duy — thứ nhóm bạn thực sự cần — bị đè nén',
			'Có thể ưu tiên vinh quang cá nhân hơn thành công tập thể — điều này thường vô hình với bạn nhưng rất rõ ràng với đồng nghiệp, và nó âm thầm đẩy những người giỏi nhất ra đi',
		],
		narrativeVi:
			'Hướng ngoại cao mang lại cho bạn năng lượng xã hội từ tính, được khuếch đại bởi sự tự tin Ái kỷ khiến bạn trở thành trung tâm hấp dẫn tự nhiên trong bất kỳ phòng nào. Bạn phát huy trong các vai trò đòi hỏi truyền đạt tầm nhìn, thuyết phục, và sự táo bạo. Đây là hồ sơ của nhiều doanh nhân thành công, diễn giả, và lãnh đạo thay đổi. Điểm mù then chốt cần hiểu: bạn có thể nhầm lẫn sự ngưỡng mộ với kết nối thực sự, và nhu cầu được xác nhận có thể âm thầm phá hoại chính những mối quan hệ bạn phụ thuộc vào. Grijalva và cộng sự (2015) phát hiện hồ sơ này theo đường cong chữ U ngược với hiệu quả lãnh đạo — nó đẩy nhanh thành công ban đầu nhưng trở thành gánh nặng khi chi phí quan hệ tích lũy. Thuốc giải không phải là ít tự tin hơn — mà là nhiều sự tò mò chân thành hơn về suy nghĩ của người khác, đặc biệt khi họ không đồng ý với bạn.',
	},

	// ── 3. The Detached Analyst ──
	{
		name: 'The Detached Analyst',
		tagline: 'Calm intellect, high cost of disconnection',
		nameVi: 'Nhà Phân tích Siêu lý trí',
		taglineVi: 'Trí tuệ bình tĩnh, cái giá của sự tách biệt',
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
			'Calm under crisis — you can make clear-headed decisions when everyone else is paralysed by emotion or panic, making you invaluable in emergencies',
			'Sees systemic patterns others miss — your analytical open-mindedness lets you step back and identify root causes while others are still reacting to symptoms',
			'Capable of making hard, unpopular decisions without emotional paralysis — restructuring, downsizing, and strategic pivots are where you add the most value',
			'Valuable in turnarounds and crisis leadership — organisations in trouble need someone who can see clearly through the fog of collective anxiety',
		],
		blindspots: [
			'Emotional detachment can drift into indifference to human cost — and this often happens so gradually that you genuinely don\'t notice until the damage is done',
			'May unconsciously view people as "resources" to be optimised — a perspective that erodes team trust slowly but irreversibly once colleagues sense it',
			'Risk of creating toxic environments disguised as "high performance" culture — where results look good on paper but people are burning out quietly',
			'Long-term isolation as colleagues learn to keep their distance — this is the single highest career cost of this profile, and it is often invisible until it is too late',
		],
		narrative:
			'Your combination of Open-Mindedness, emotional stability (low Negative Emotionality), and elevated subclinical Psychopathy creates a profile of intellectual fearlessness. You can design complex systems, analyse problems without flinching, and make tough calls others cannot bring themselves to make. In crisis situations, you are often the most valuable person in the room. However — and this is critical — your emotional detachment, while an asset in crisis, becomes a serious liability in sustained relationships. The research is unambiguous: the long-term cost of low empathy in leadership is isolation, talent flight, and eventual organisational pushback. Boddy (2011) documented that organisations with leaders high on this profile show measurably higher rates of counterproductive behaviour across the entire workforce — not because the leader intends harm, but because the emotional climate they create makes others feel unseen and unsafe.',
		strengthsVi: [
			'Bình tĩnh trong khủng hoảng — bạn đưa ra quyết định sáng suốt khi mọi người khác bị tê liệt bởi cảm xúc, khiến bạn vô giá trong tình huống khẩn cấp',
			'Nhìn thấy các mô hình hệ thống mà người khác bỏ lỡ — sự cởi mở phân tích cho phép bạn lùi lại và xác định nguyên nhân gốc rễ khi người khác còn đang phản ứng với triệu chứng',
			'Có khả năng đưa ra quyết định khó, không được lòng mà không bị tê liệt cảm xúc — tái cơ cấu, cắt giảm nhân sự, và xoay trục chiến lược là nơi bạn thêm giá trị nhất',
			'Có giá trị trong các tình huống xoay chuyển và lãnh đạo khủng hoảng — tổ chức gặp khó khăn cần ai đó có thể nhìn rõ xuyên qua sương mù lo lắng tập thể',
		],
		blindspotsVi: [
			'Sự tách biệt cảm xúc có thể trượt sang thờ ơ với cái giá con người — và điều này thường xảy ra từ từ đến mức bạn thực sự không nhận ra cho đến khi thiệt hại đã xảy ra',
			'Có thể vô thức coi người khác là "nguồn lực" cần tối ưu — góc nhìn này xói mòn niềm tin nhóm chậm nhưng không thể đảo ngược khi đồng nghiệp cảm nhận được',
			'Nguy cơ tạo ra môi trường độc hại được ngụy trang bằng văn hóa "hiệu suất cao" — nơi kết quả trên giấy trông tốt nhưng con người đang kiệt sức trong im lặng',
			'Sự cô lập dài hạn khi đồng nghiệp học cách giữ khoảng cách — đây là chi phí sự nghiệp cao nhất của hồ sơ này, và nó thường vô hình cho đến khi đã quá muộn',
		],
		narrativeVi:
			'Sự kết hợp giữa Cởi mở, ổn định cảm xúc (Negative Emotionality thấp), và Psychopathy dưới lâm sàng cao tạo nên hồ sơ không sợ hãi về trí tuệ. Bạn có thể thiết kế hệ thống phức tạp, phân tích vấn đề không nao núng, và đưa ra quyết định khó mà người khác không thể. Trong khủng hoảng, bạn thường là người có giá trị nhất trong phòng. Tuy nhiên — và đây là điều then chốt — sự tách biệt cảm xúc, tuy là tài sản trong khủng hoảng, lại trở thành gánh nặng nghiêm trọng trong các mối quan hệ lâu dài. Nghiên cứu rõ ràng: chi phí dài hạn của sự thiếu đồng cảm trong lãnh đạo là cô lập, mất nhân tài, và cuối cùng bị tổ chức phản kháng. Boddy (2011) ghi nhận rằng tổ chức có lãnh đạo hồ sơ này cho thấy tỷ lệ hành vi phản tác dụng cao hơn đo lường được — không phải vì lãnh đạo cố ý gây hại, mà vì bầu không khí cảm xúc họ tạo ra khiến người khác cảm thấy không được thấy và không an toàn.',
	},

	// ── 4. The Empathic Strategist ──
	{
		name: 'The Empathic Strategist',
		tagline: 'Heart of gold, mind of a chess player',
		nameVi: 'Nhà Chiến lược Đồng cảm',
		taglineVi: 'Trái tim vàng, tư duy kỳ thủ',
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
			'Reads people with remarkable accuracy — you combine genuine empathy with strategic thinking, allowing you to understand both what people feel and what they need',
			'Builds genuine alliances while maintaining awareness of political dynamics — you navigate organisations with both warmth and wisdom',
			'Excellent mediator and conflict resolver — you use social intelligence to find solutions that address underlying interests, not just surface positions',
			'Trusted enough to receive confidential information, strategically astute enough to use it wisely — this combination is exceptionally rare and valuable',
		],
		blindspots: [
			'Internal conflict between genuine care and calculated moves can create significant stress and self-doubt — "Am I being authentic or strategic right now?"',
			'Risk of being perceived as "two-faced" if your strategic awareness overrides your authenticity — others may sense the calculation even when your intentions are good',
			'May over-invest emotionally in strategic relationships, leading to burnout when those investments don\'t pay off as expected',
			'Could unconsciously rationalise manipulative behaviour as "helping" others — the road from empathic strategy to benevolent manipulation is shorter than it appears',
		],
		narrative:
			'You are the rare profile that balances genuine warmth with strategic awareness. High Agreeableness gives you authentic empathy — you truly care about people and can feel what they are experiencing. Your Machiavellian awareness means you also understand the political game — who holds influence, where decisions are really made, and how to navigate complex stakeholder dynamics. Ferris and colleagues (2005) identify this combination as the highest form of "Political Skill" — the capacity to influence others in ways that feel genuine because they largely are genuine. Your challenge is maintaining integrity when your strategic mind tempts you to "manage" people rather than truly connect with them. The line between strategic empathy and empathic manipulation is thin, and only you can monitor which side you are on in any given moment.',
		strengthsVi: [
			'Đọc vị con người với độ chính xác đáng kinh ngạc — bạn kết hợp đồng cảm chân thật với tư duy chiến lược, hiểu cả cảm xúc lẫn nhu cầu thực sự của người khác',
			'Xây dựng liên minh chân thành trong khi duy trì nhận thức về động lực chính trị — bạn điều hướng tổ chức với cả sự ấm áp lẫn trí tuệ',
			'Hoà giải và giải quyết xung đột xuất sắc — bạn dùng trí tuệ xã hội để tìm giải pháp giải quyết lợi ích sâu xa, không chỉ lập trường bề mặt',
			'Đủ đáng tin để nhận thông tin bí mật, đủ nhạy bén chiến lược để sử dụng nó khôn ngoan — sự kết hợp này cực kỳ hiếm và có giá trị',
		],
		blindspotsVi: [
			'Xung đột nội tâm giữa sự quan tâm chân thật và tính toán chiến lược có thể tạo ra căng thẳng đáng kể — "Mình đang chân thành hay đang tính toán?"',
			'Nguy cơ bị nhìn nhận là "hai mặt" nếu nhận thức chiến lược lấn át sự chân thật — người khác có thể cảm nhận sự tính toán ngay cả khi ý định của bạn tốt',
			'Có thể đầu tư cảm xúc quá mức vào các mối quan hệ chiến lược, dẫn đến kiệt sức khi khoản đầu tư đó không được đền đáp',
			'Có thể vô thức hợp lý hóa hành vi thao túng thành "giúp đỡ" người khác — con đường từ chiến lược đồng cảm đến thao túng nhân từ ngắn hơn vẻ ngoài',
		],
		narrativeVi:
			'Bạn là hồ sơ hiếm có cân bằng sự ấm áp chân thành với nhận thức chiến lược. Agreeableness cao mang lại cho bạn đồng cảm chân thật — bạn thực sự quan tâm đến mọi người. Nhận thức Machiavellian nghĩa là bạn cũng hiểu trò chơi chính trị — ai giữ ảnh hưởng, quyết định được đưa ra ở đâu, và cách điều hướng các bên liên quan phức tạp. Ferris và cộng sự (2005) xác định tổ hợp này là hình thức cao nhất của "Kỹ năng Chính trị" — khả năng ảnh hưởng người khác theo cách cảm thấy chân thật vì phần lớn nó đúng là chân thật. Thách thức của bạn là duy trì sự chính trực khi tư duy chiến lược cám dỗ bạn "quản lý" con người thay vì kết nối thực sự. Ranh giới giữa đồng cảm chiến lược và thao túng đồng cảm rất mỏng, và chỉ bạn mới có thể giám sát bạn đang ở phía nào trong mỗi khoảnh khắc.',
	},

	// ── 5. The Vulnerable Perfectionist ──
	{
		name: 'The Vulnerable Perfectionist',
		tagline: 'Driven by anxiety, sharpened by standards',
		nameVi: 'Người Cầu toàn Nhạy cảm',
		taglineVi: 'Được thúc đẩy bởi lo lắng, mài sắc bởi tiêu chuẩn',
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
			'Exceptionally thorough — you catch errors and inconsistencies that others overlook, because your heightened vigilance turns every detail into a signal worth checking',
			'Deeply self-aware about your limitations — this drives genuine improvement rather than the complacent self-satisfaction that holds many talented people back',
			'High accountability — you take personal ownership of failures rather than deflecting blame, which builds real credibility with colleagues and supervisors over time',
			'Produces consistently high-quality work — your intrinsic standards create output that others can rely on, and this reputation compounds throughout your career',
		],
		blindspots: [
			'Analysis paralysis — the pursuit of perfection can delay critical decisions, costing you opportunities that reward speed over precision',
			'Chronic self-doubt can undermine your leadership presence and authority — others may interpret your hesitation as lack of conviction rather than thoughtful deliberation',
			'High risk of burnout from sustained emotional intensity paired with relentless standards — Stoeber & Otto (2006) found this is one of the most burnout-prone personality profiles',
			'May inadvertently project your anxiety onto team members — when your worry becomes the team\'s worry, it creates a culture of fear rather than a culture of excellence',
		],
		narrative:
			'Your high Conscientiousness drives you to excel, but it is fuelled by an anxious engine (high Negative Emotionality). You are the person who triple-checks everything — not because you are simply thorough by nature, but because your anxiety genuinely will not let you rest until it is right. This can produce extraordinary work. Some of the most precise, most reliable, most carefully crafted output in any organisation comes from this profile. But the personal cost is real and cumulative. Swider & Zimmerman (2010) found that the combination of high standards and high emotional reactivity is one of the strongest predictors of professional burnout. Your most important growth edge is not working harder — it is learning that "good enough, delivered on time" is often more valuable than "perfect, delivered late." Self-compassion is not softness; it is the structural support that makes sustained excellence possible.',
		strengthsVi: [
			'Kỹ lưỡng đặc biệt — bạn phát hiện lỗi và sự không nhất quán mà người khác bỏ qua, vì sự cảnh giác cao biến mọi chi tiết thành tín hiệu đáng kiểm tra',
			'Tự nhận thức sâu sắc về giới hạn của mình — điều này thúc đẩy cải thiện thực sự thay vì sự tự mãn cản trở nhiều người tài năng khác',
			'Trách nhiệm cao — bạn nhận trách nhiệm cá nhân về thất bại thay vì đổ lỗi, xây dựng uy tín thực sự với đồng nghiệp và cấp trên theo thời gian',
			'Tạo ra công việc chất lượng cao nhất quán — tiêu chuẩn nội tại của bạn tạo ra đầu ra mà người khác có thể tin cậy, và danh tiếng này tích lũy suốt sự nghiệp',
		],
		blindspotsVi: [
			'Tê liệt phân tích — sự theo đuổi hoàn hảo có thể trì hoãn quyết định quan trọng, khiến bạn mất cơ hội mà tốc độ được thưởng hơn độ chính xác',
			'Sự tự nghi ngờ mãn tính có thể làm suy yếu sự hiện diện lãnh đạo — người khác có thể hiểu sự do dự của bạn là thiếu quyết tâm thay vì suy nghĩ cẩn thận',
			'Nguy cơ kiệt sức cao từ cường độ cảm xúc bền vững kết hợp tiêu chuẩn không ngừng — Stoeber & Otto (2006) xác nhận đây là một trong những hồ sơ dễ kiệt sức nhất',
			'Có thể vô tình chiếu lo lắng của mình lên thành viên nhóm — khi lo lắng của bạn trở thành lo lắng của cả nhóm, nó tạo ra văn hóa sợ hãi thay vì văn hóa xuất sắc',
		],
		narrativeVi:
			'Tận tâm cao thúc đẩy bạn xuất sắc, nhưng nó được tiếp nhiên liệu bởi một động cơ lo lắng (Negative Emotionality cao). Bạn là người kiểm tra mọi thứ ba lần — không phải vì bạn đơn giản kỹ lưỡng, mà vì sự lo lắng thực sự không cho bạn nghỉ ngơi cho đến khi mọi thứ đúng. Điều này có thể tạo ra công việc phi thường. Nhưng chi phí cá nhân là thực và tích lũy. Swider & Zimmerman (2010) phát hiện tổ hợp tiêu chuẩn cao với phản ứng cảm xúc mạnh là một trong những dự báo mạnh nhất về kiệt sức chuyên nghiệp. Điểm phát triển quan trọng nhất của bạn không phải là làm việc chăm chỉ hơn — mà là học rằng "đủ tốt, giao đúng hạn" thường có giá trị hơn "hoàn hảo, giao muộn." Lòng tự trắc ẩn không phải sự yếu đuối; đó là nền tảng cấu trúc giúp sự xuất sắc bền vững trở nên khả thi.',
	},

	// ── 6. The Balanced Operator ──
	{
		name: 'The Balanced Operator',
		tagline: 'Steady hands, clear conscience',
		nameVi: 'Người Vận hành Cân bằng',
		taglineVi: 'Tay vững chắc, lương tâm trong sáng',
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
			'High interpersonal trust — teams genuinely feel safe and supported around you, which is the foundation of psychological safety that drives innovation and honest communication',
			'Consistent, reliable performance without drama or politics — you are the person others count on when everything else is chaotic, and that reliability compounds into real career capital',
			'Excellent at building sustainable, healthy team cultures — you model the behaviour that creates environments where people do their best work and stay long-term',
			'Genuine integrity that creates deep organisational loyalty — people follow you not out of fear or ambition, but because they trust your character and your judgment',
		],
		blindspots: [
			'May be outmanoeuvred by more politically savvy colleagues who understand organisational dynamics that you find distasteful or choose to ignore',
			'Risk of being overlooked for promotions in highly competitive environments — your lack of self-promotion means decision-makers may not fully appreciate your contributions',
			'Could be slow to recognise or respond to manipulative behaviour in others — your own integrity can create a blind spot about how others operate',
			'May avoid necessary confrontation in pursuit of harmony — sometimes the kindest and most responsible thing is to address a problem directly, even when it is uncomfortable',
		],
		narrative:
			'Your profile shows low Dark Triad tendencies paired with constructive personality traits — you are cooperative, reliable, and principled. In any organisation, you are the backbone: the person who holds things together when others are playing games, cutting corners, or chasing personal advantage. In healthy organisations, people like you thrive and rise. The research by Organ & Ryan (1995) confirms that this is the profile most strongly associated with Organisational Citizenship Behaviour — the discretionary good that keeps institutions functioning. The risk you face is not internal — it is contextual. In toxic environments, your integrity can become a disadvantage when others play games you refuse to engage in. The strategic skill to develop is not political manoeuvring — it is learning to recognise toxic environments early and choosing to invest your talents where they will be valued, not exploited.',
		strengthsVi: [
			'Niềm tin giữa các cá nhân cao — nhóm thực sự cảm thấy an toàn và được hỗ trợ bên bạn, đây là nền tảng của an toàn tâm lý thúc đẩy đổi mới và giao tiếp trung thực',
			'Hiệu suất nhất quán, đáng tin cậy không có drama hay chính trị — bạn là người mà người khác tin tưởng khi mọi thứ hỗn loạn, và sự tin cậy đó tích lũy thành vốn sự nghiệp thực sự',
			'Xuất sắc trong việc xây dựng văn hóa nhóm bền vững, lành mạnh — bạn làm gương cho hành vi tạo ra môi trường nơi mọi người làm việc tốt nhất và gắn bó lâu dài',
			'Sự chính trực chân thật tạo ra lòng trung thành tổ chức sâu sắc — người ta theo bạn không phải vì sợ hay tham vọng, mà vì họ tin vào nhân cách và phán đoán của bạn',
		],
		blindspotsVi: [
			'Có thể bị qua mặt bởi đồng nghiệp có kỹ năng chính trị cao hơn — người hiểu các động lực tổ chức mà bạn thấy khó chịu hoặc chọn bỏ qua',
			'Nguy cơ bị bỏ qua khi thăng tiến trong môi trường cạnh tranh cao — việc thiếu tự quảng bá nghĩa là người ra quyết định có thể không đánh giá đúng đóng góp của bạn',
			'Có thể chậm nhận ra hoặc phản ứng với hành vi thao túng ở người khác — sự chính trực của bạn có thể tạo ra điểm mù về cách người khác hoạt động',
			'Có thể tránh đối đầu cần thiết để giữ hòa thuận — đôi khi điều tử tế và có trách nhiệm nhất là giải quyết vấn đề trực tiếp, dù không thoải mái',
		],
		narrativeVi:
			'Hồ sơ của bạn cho thấy xu hướng Dark Triad thấp kết hợp với các trait tính cách xây dựng — bạn hợp tác, đáng tin cậy và có nguyên tắc. Trong bất kỳ tổ chức nào, bạn là xương sống: người giữ mọi thứ gắn kết khi người khác đang chơi trò, cắt góc, hay theo đuổi lợi thế cá nhân. Trong tổ chức lành mạnh, người như bạn phát triển. Nghiên cứu của Organ & Ryan (1995) xác nhận đây là hồ sơ gắn liền mạnh nhất với Hành vi Công dân Tổ chức. Rủi ro bạn đối mặt không đến từ bên trong — mà từ bối cảnh. Trong môi trường độc hại, sự chính trực có thể trở thành bất lợi. Kỹ năng chiến lược cần phát triển không phải là mưu mẹo chính trị — mà là học cách nhận ra môi trường độc hại sớm và chọn đầu tư tài năng nơi nó được đánh giá cao, không bị khai thác.',
	},
];

// ─── Fallback ──────────────────────────────────────────────────────────────────

/**
 * Fallback archetype when no specific rule matches strongly.
 */
const FALLBACK_ARCHETYPE: ArchetypeProfile = {
	name: 'The Complex Mosaic',
	tagline: 'Defying simple categorization',
	nameVi: 'Bức Tranh Phức hợp',
	taglineVi: 'Không thể xếp vào một khuôn mẫu đơn giản',
	icon: '🧩',
	colorTheme: 'purple',
	strengths: [
		'Multifaceted personality that adapts naturally across different contexts — you are not one thing, and that versatility is a genuine professional asset',
		'No single dominant tendency means you can draw on different parts of yourself depending on what the situation requires — flexibility others cannot easily replicate',
		'Capable of understanding diverse perspectives because your own experience spans multiple modes of thinking and relating — this builds unusual cross-functional effectiveness',
		'Harder to predict, which can be a genuine advantage in negotiations, creative work, and situations where conventional approaches have failed',
	],
	blindspots: [
		'May struggle with a clear sense of professional identity or direction — when you can be many things, choosing one path can feel limiting or arbitrary',
		'Mixed motivations can create internal conflict during high-stakes decisions — different parts of your personality may pull you in different directions simultaneously',
		'Others may find it hard to "read" you, creating trust ambiguity — people tend to trust consistency, and your adaptability can sometimes be misread as unpredictability',
		'Risk of context-switching stress as different situations activate different aspects of your personality — this takes more energy than most people realise',
	],
	narrative:
		'Your personality profile doesn\'t fit neatly into a single archetype — and that is not a weakness. You are a complex blend of traits that manifests differently depending on context. Many of the most effective leaders and professionals in history have been "complex mosaics" rather than clean archetypes — they drew on different capacities for different situations. Your growth opportunity lies in developing self-awareness about which version of yourself shows up in different situations, and making that a conscious choice rather than an automatic reaction. The research on emotional intelligence (Goleman, 1995) suggests that this kind of self-awareness is the single most predictive competency for leadership effectiveness at every organisational level.',
	strengthsVi: [
		'Tính cách đa diện thích ứng tự nhiên qua các bối cảnh — bạn không phải một kiểu, và sự linh hoạt đó là tài sản chuyên nghiệp thực sự',
		'Không có xu hướng nào chiếm ưu thế nghĩa là bạn có thể khai thác các phần khác nhau của mình tuỳ tình huống — sự linh hoạt mà người khác khó sao chép',
		'Có khả năng hiểu các góc nhìn đa dạng vì trải nghiệm của bạn trải dài qua nhiều cách tư duy và quan hệ — điều này xây dựng hiệu quả xuyên chức năng hiếm có',
		'Khó đoán trước, có thể là lợi thế trong đàm phán, công việc sáng tạo, và các tình huống mà cách tiếp cận thông thường đã thất bại',
	],
	blindspotsVi: [
		'Có thể gặp khó khăn với bản sắc nghề nghiệp rõ ràng — khi bạn có thể là nhiều thứ, việc chọn một con đường có thể cảm thấy giới hạn',
		'Động lực hỗn hợp có thể tạo xung đột nội tâm trong quyết định quan trọng — các phần khác nhau của tính cách có thể kéo bạn theo các hướng khác nhau',
		'Người khác có thể thấy khó "đọc" bạn, tạo ra sự mơ hồ về niềm tin — vì mọi người có xu hướng tin vào sự nhất quán, và sự thích ứng đôi khi bị hiểu nhầm là khó đoán',
		'Nguy cơ căng thẳng chuyển đổi bối cảnh khi các tình huống khác nhau kích hoạt các khía cạnh khác nhau của tính cách — điều này tốn năng lượng hơn bạn nghĩ',
	],
	narrativeVi:
		'Hồ sơ tính cách của bạn không nằm gọn trong một archetype đơn lẻ — và đây không phải điểm yếu. Bạn là sự pha trộn phức tạp biểu hiện khác nhau tuỳ bối cảnh. Nhiều lãnh đạo và chuyên gia hiệu quả nhất trong lịch sử là "bức tranh phức hợp" hơn là các archetype rõ ràng — họ khai thác các năng lực khác nhau cho các tình huống khác nhau. Cơ hội phát triển của bạn nằm ở việc xây dựng nhận thức bản thân: phiên bản nào của bạn xuất hiện trong tình huống nào, và biến điều đó thành lựa chọn có ý thức thay vì phản ứng tự động. Nghiên cứu về trí tuệ cảm xúc (Goleman, 1995) cho thấy loại tự nhận thức này là năng lực dự báo mạnh nhất cho hiệu quả lãnh đạo ở mọi cấp độ tổ chức.',
};

// ─── Public API ────────────────────────────────────────────────────────────────

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
		nameVi: bestMatch.nameVi,
		taglineVi: bestMatch.taglineVi,
		icon: bestMatch.icon,
		colorTheme: bestMatch.colorTheme,
		strengths: bestMatch.strengths,
		blindspots: bestMatch.blindspots,
		narrative: bestMatch.narrative,
		strengthsVi: bestMatch.strengthsVi,
		blindspotsVi: bestMatch.blindspotsVi,
		narrativeVi: bestMatch.narrativeVi,
	};
}
