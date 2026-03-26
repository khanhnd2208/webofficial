/* ════════════════════════════════════════════════════════════════════════
   Trait Insights — Bilingual content for each personality domain

   Each domain has:
   - EN and VI versions of all text
   - 5-tier interpretations
   - career / academic / OB / derailment content
   - student action tips
   ════════════════════════════════════════════════════════════════════════ */

import type { PersonalityDomain } from '@/types/personalityTest';
import type { FiveTier, Lang } from './i18n';

export interface TraitInsightContent {
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
	derailment?: string;
	obLesson?: string;
}

type InsightMap = Record<PersonalityDomain, TraitInsightContent>;

/* ─── English ──────────────────────────────────────────────────────────── */

const EN: InsightMap = {
	extraversion: {
		icon: '🗣️',
		what: 'Extraversion reflects your tendency to seek stimulation from the outside world — composed of 3 facets: Sociability (enjoying social interaction), Assertiveness (decisiveness, leading), and Energy Level (overall vitality). It\'s not just about "liking to talk" — it\'s how you recharge and engage with the world.',
		very_high: 'You\'re extremely outgoing — you "live" on social energy, naturally initiate, and feel restless when working alone for long. ⚠️ Watch out: in group projects, you may dominate and make introverted members feel "swallowed". Judge et al. (2002) found very high E relates to leadership emergence but NOT necessarily leadership effectiveness — you may get elected leader but that doesn\'t mean you lead well.',
		high: 'You enjoy connecting, have good group energy, and easily build rapport. Clear advantage for networking and cross-functional work. However, in some cultures high E can be read as "all talk, no action" — pair it with concrete follow-through.',
		moderate: 'You\'re an ambivert — flexible between social and solitary modes. Grant (2013, Wharton) found ambiverts actually outsell both extraverts and introverts because they know when to speak and when to listen.',
		low: 'You\'re introverted — you need alone time to process and recharge. This is NOT a weakness: Susan Cain\'s "Quiet" showed that 1/3 to 1/2 of the population is introverted, and many top CEOs (Bill Gates, Warren Buffett) are introverts. Your strengths: deep listening and deliberate thinking.',
		very_low: 'You\'re strongly introverted — social interaction is costly energy-wise. For your career ahead: you need specific strategies for networking (e.g., 1-on-1 coffee instead of big parties) and job interviews (prepare talking points carefully). Don\'t let your silence be misread as "lack of competence".',
		career: 'High E → Sales, Account Management, Events, PR, Training, Project Management. Low E → Research, Data Analysis, UX Research, Backend Dev, Editing, Technical Writing. Mid E → Consulting, Product Management, Business Analysis.',
		tip: 'For job interviews: E level doesn\'t matter as much as HOW you communicate value. Introverts: practice the STAR method (Situation-Task-Action-Result) for structured answers. Extraverts: practice pausing after each answer instead of rambling.',
		academic: 'Soto & John (2017): E predicts group work satisfaction and emergent leadership. Judge et al. (2002) meta-analysis: E has r=.31 with leadership emergence but only r=.16 with leadership effectiveness — "being elected" ≠ "leading well".',
	},
	agreeableness: {
		icon: '🤝',
		what: 'Agreeableness measures 3 facets: Compassion (empathy), Respectfulness (respect for social norms), and Trust (belief in others\' goodness). This isn\'t "being a pushover" — it\'s your tendency toward cooperation vs. competition in relationships, and one of the strongest predictors of success or failure in organizations.',
		very_high: 'You\'re extremely cooperative and empathetic — always putting others\' needs first. ⚠️ Real derailment risk: You may become an "organizational doormat" — everyone asks for help but nobody gives credit. In group projects, you may cover for free-riders without speaking up. Judge et al. (2012) found very high A relates to LOWER salary — the "nice penalty" is real, especially for men.',
		high: 'You\'re cooperative, empathetic, and build relationships well. Foundation for OCB (Organizational Citizenship Behavior) — going beyond your job description. But learn to say "no" gracefully and set boundaries.',
		moderate: 'You know when to cooperate and when to stand firm. Often the optimal level for management: enough empathy to understand employees, enough toughness to make hard decisions.',
		low: 'You lean toward rational, direct, and emotion-free decision-making. In OB, this suits roles needing objective decisions: restructuring, layoffs, M&A. But in harmony-oriented cultures, low A can be seen as "difficult" — learn diplomatic communication.',
		very_low: 'You\'re very independent and skeptical — low trust, self-interest first. ⚠️ Reality: in team-oriented work environments, this causes conflict quickly. Proactively show goodwill (e.g., volunteer for one small task) to build initial trust.',
		career: 'High A → Counseling, HR, Teaching, Healthcare, CSR, Social Work. Low A → Finance, Law, Strategy Consulting, Turnaround Management. Mid A → Product Management, Business Development.',
		tip: 'High A — practice saying "I need more time to think" instead of agreeing immediately. Low A — in your first 2 weeks at a new company, prioritize listening mode: take notes instead of arguing.',
		academic: 'Judge et al. (2012): High A → ~$7,000/year lower salary (agreeable penalty). Organ & Ryan (1995): A is the strongest predictor of OCB. Graziano & Eisenberg (1997): High A = prosocial behavior but also vulnerability to exploitation.',
		obLesson: 'In OB, Agreeableness directly relates to "Voice behavior" (Morrison, 2011): highly agreeable people are less likely to speak up about organizational problems for fear of disrupting harmony. This is a root cause of groupthink.',
	},
	conscientiousness: {
		icon: '📋',
		what: 'Conscientiousness has 3 facets: Organization (orderliness, systematic), Productiveness (efficiency, drive to complete), and Responsibility (reliability, keeping promises). This is the Big Five trait that best predicts job performance — more important than IQ in many contexts. If you could only pick 1 trait for hiring, most HR managers pick C.',
		very_high: 'You\'re extremely disciplined and organized — everything is planned, deadlines always met. ⚠️ Derailment risk: Perfectionism + burnout. Carter et al. (2016) found very high C relates to workaholism and difficulty delegating — you don\'t trust anyone to do it as well as you, leading to exhaustion. In group projects, you may become a micro-manager that frustrates the team.',
		high: 'You\'re reliable, plan clearly, and follow through well. Barrick & Mount (1991) meta-analysis confirmed C is the strongest predictor of job performance across ALL occupations (r=.22-.23). This is your "career insurance".',
		moderate: 'You balance discipline with flexibility. In startups or agile environments, this may be optimal — organized enough to deliver but flexible enough to pivot when needed.',
		low: 'You prefer flexibility and spontaneity. ⚠️ Hard truth: in today\'s job market, low C is the biggest red flag employers see — missed deadlines, no follow-up, forgotten emails. Good news: C is the trait MOST improvable through systems and habits (Roberts et al., 2006).',
		very_low: 'You operate mostly on impulse with little systematic approach. ⚠️ Serious warning for career readiness: this is a survival challenge in the workplace. START NOW: (1) calendar blocking, (2) daily to-do lists, (3) "touch it once" rule for email. Without systems, you rely on willpower — and willpower always loses to habits. 💡 GREAT NEWS: C is the MOST CHANGEABLE Big Five trait, especially in your 20s-30s. Neuroplasticity research shows your brain is at peak flexibility for forming new habits. Just practicing 1 small habit (e.g., writing a to-do list each morning) for 21 consecutive days literally rewires your brain.',
		career: 'High C → Finance, Healthcare, Engineering, Project Management, Quality Assurance. Low C → Creative roles WITH support systems (creative director with an assistant), Freelance WITH self-built routines.',
		tip: 'Regardless of your C score, build a system NOW: Inbox Zero for email, Weekly Review for goals, Time Blocking for your calendar. Use tools (Notion, Todoist, Google Calendar) instead of relying on memory. Low C + good system > High C + no system.',
		academic: 'Barrick & Mount (1991): C is the only universally valid predictor of job performance across all occupation types. Noftle & Robins (2007): C predicts GPA more strongly than SAT scores (r=.28 vs r=.25). Roberts et al. (2006): C naturally increases from 20-40 ("maturity principle").',
		obLesson: 'In OB, C relates to Self-Regulation Theory (Baumeister): the ability to control behavior toward long-term goals. It\'s also a core component of "Psychological Capital" (Luthans) — resilience and persistence.',
	},
	negativeEmotionality: {
		icon: '🌊',
		what: 'Negative Emotionality (Neuroticism) has 3 facets: Anxiety (worry, insecurity), Depression (sadness, pessimism), and Emotional Volatility (mood swings, irritability). This is NOT a "disorder" — it\'s a continuum showing how sensitive your threat detection system is.',
		very_high: 'Your threat detection system is very sensitive — you detect threats faster than most but also get more false alarms. ⚠️ Key risk: very high N + final-year stress can create an "anxiety spiral". Research shows N is the strongest predictor of burnout (Swider & Zimmerman, 2010). You NEED coping strategies BEFORE a crisis hits. 💡 GOOD NEWS: Your ability to anticipate risk is better than 90% of people. If you learn stress management (mindfulness, exercise, social support), you\'ll be the best risk manager and quality controller in any organization — because you see problems before they happen.',
		high: 'You\'re sensitive to stress and experience negative emotions more intensely than average. Upside: high N relates to creative achievement (Feist, 1998) — sensitivity helps you see nuances others miss. Downside: under deadline crunch, you tend to "catastrophize" (overestimate consequences).',
		moderate: 'You have normal emotional stability — worried when appropriate but recover quickly. A functional level for most environments.',
		low: 'You\'re "cool under pressure" — stress barely affects your performance. Huge advantage for high-stakes situations: interviews, presentations, negotiations. But be careful: low N sometimes comes with complacency — you may not recognize genuinely dangerous situations.',
		very_low: 'You\'re nearly "bulletproof" emotionally — calm even in crises. Extremely valuable for leadership, crisis management, and high-pressure roles. However, others may perceive you as "cold" or lacking empathy — proactively show care.',
		career: 'Low N → Leadership, Surgery, Pilot, Military Officer, Trading, Emergency Medicine. High N → Roles needing sensitivity: Art, Counseling, UX Research, Writing, Quality Assurance. Mid N → suits most roles.',
		tip: 'If high N, prepare an "emotional first-aid kit": (1) List of trusted people to call when stressed, (2) One physical activity daily (gym, running, yoga), (3) 5-minute journaling before bed. If low N, proactively check in on colleagues — don\'t assume everyone is "fine" like you.',
		academic: 'Swider & Zimmerman (2010): N is the strongest predictor of burnout (r=.44). Feist (1998): N positively relates to artistic creativity. Suls & Martin (2005): High N → interpretive bias — tendency to interpret ambiguous events negatively.',
		obLesson: 'In OB, N relates to Affective Events Theory (Weiss & Cropanzano, 1996): workplace emotions influence attitudes and behavior. High N people react more strongly to "affective events" (conflict, criticism) → they need emotional regulation skills.',
	},
	openMindedness: {
		icon: '🎨',
		what: 'Open-Mindedness has 3 facets: Intellectual Curiosity (love of learning), Aesthetic Sensitivity (appreciation for beauty), and Creative Imagination. This trait best predicts "lifelong learning" — the ability to adapt in a VUCA world (Volatility, Uncertainty, Complexity, Ambiguity).',
		very_high: 'You\'re extremely curious, creative, and love challenging conventions. You\'re an "idea machine" — always generating new concepts. ⚠️ Derailment risk: "Shiny object syndrome" — jumping from idea to idea without completing anything. If very high O + low C, you\'ll be a "dreamer who never delivers". Pairing high O with C is essential.',
		high: 'You love exploring, learning, and abstract thinking. In today\'s VUCA world, high O is a competitive advantage: you adapt faster when industry disruption hits. McCrae (1987): high O strongly relates to divergent thinking.',
		moderate: 'You balance innovation with practicality — willing to try new things but also keep what works. Suits most roles except pure creative or pure operational.',
		low: 'You lean toward practical, conventional, proven methods. In operational roles (logistics, manufacturing, compliance), this is a STRENGTH — you don\'t get distracted by "the next big thing" and focus on execution. But in startup or innovation environments, you may get stuck.',
		very_low: 'You\'re very traditional and strongly resist change. ⚠️ With current AI disruption, very low O is a serious risk — you may miss important signals about industry shifts. Proactively expose yourself to new ideas: read 1 article outside your field each week.',
		career: 'High O → Design Thinking, R&D, Startups, Innovation Labs, Strategy Consulting, Academic Research, UX Design. Low O → Accounting, Operations, Compliance, Quality Control, Process Engineering.',
		tip: 'High O — pick 1 idea and COMMIT for at least 3 months before pivoting. Low O — try ChatGPT/AI tools NOW because your industry IS being disrupted, whether you like it or not. Comfort with the status quo is a luxury the current era doesn\'t afford.',
		academic: 'McCrae (1987): O is the strongest predictor of divergent thinking. Chamorro-Premuzic (2006): O predicts academic performance in arts & humanities (r=.20-.30). George & Zhou (2001): High O + supportive environment = optimal creative performance.',
		obLesson: 'In OB, O relates to Absorptive Capacity (Cohen & Levinthal, 1990): the ability to recognize, assimilate, and apply new knowledge. Organizations need a mix of high-O (explore) and low-O (exploit) — this is the Ambidexterity challenge.',
	},
	machiavellianism: {
		icon: '♟️',
		what: 'Machiavellianism measures your tendency to "play power games" in relationships: willingness to manipulate, use social tactics, and prioritize outcomes over ethics. Named after Niccolò Machiavelli — author of "The Prince" (1513), which taught rulers to maintain power by any means. In organizations, high M is the dark version of "political skill".',
		very_high: 'You\'re a "strategic calculator" — always assessing which relationships are useful and willing to manipulate to achieve goals. ⚠️ SERIOUS DERAILMENT RISK: Hogan & Hogan (2001) research on "Dark Side of Leadership": very high M is one of the 11 most common derailment factors — you may advance quickly, but when discovered (AND YOU WILL BE), the fall is devastating. In practice: if you play politics between departments, you\'ll be blacklisted faster than you think — it\'s a small community.',
		high: 'You have strong strategic thinking and understand the "game" in organizations. Bright side: Political Skill (Ferris et al., 2005) — ability to read situations, build coalitions, and influence stakeholders. Dark side: without a moral compass, you\'ll optimize short-term gains and destroy long-term trust. Trust takes 10x longer to rebuild than to break.',
		moderate: 'You have good social awareness without being overly calculating — healthy "social intelligence". You understand organizational politics without getting caught up in the game. Often the optimal level for leadership.',
		low: 'You\'re straightforward, sincere, and transparent. Foundation for authentic leadership (Avolio & Gardner, 2005). But in organizational reality, you may be naive about office politics — at least RECOGNIZE that politics exist, even if you don\'t play.',
		very_low: 'You\'re very honest with nearly zero strategic calculation. ⚠️ Risk: in politically charged organizations (banking, real estate, government), you\'ll be exploited by high-M individuals. Read "Influence" by Robert Cialdini — not to manipulate, but to RECOGNIZE when you\'re being manipulated.',
		career: 'Mid M → Negotiation, Business Development, Consulting, Diplomacy, Government Relations. High M → High risk in every field — may succeed short-term but easily "cancelled" long-term. Low M → Trust-based roles: Doctor, Teacher, Non-profit, Social Enterprise.',
		tip: 'The boundary between "political skill" (good) and "manipulation" (bad) lies in 2 questions: (1) Are you willing to tell the truth when directly asked? (2) Are you willing to accept consequences if your tactic is discovered? If "no" to both, you\'re manipulating.',
		academic: 'Paulhus & Williams (2002): M = "strategic manipulation". Christie & Geis (1970): High M → success in "loose situations" (few rules) but failure in "tight situations" (heavy oversight). Dahling et al. (2009): High M → counterproductive work behavior (CWB) and reduced OCB.',
		derailment: '🚨 Specific derailment: If you badmouth colleagues to your boss to look better, you ARE using high M. When (not if) discovered, you lose not just the position but the reference — in a small industry, 1 bad reference can follow you for 5-10 years.',
		obLesson: 'OB concept: Organizational Politics (Mintzberg, 1983). High M reflects a tendency to use "political tactics": impression management, coalition building, blame deflection. Under ethical leadership, high M is controlled. Under weak leadership, high M becomes organizational cancer.',
	},
	narcissism: {
		icon: '👑',
		what: 'Narcissism measures the need for admiration, feelings of entitlement, and tendency to exploit others for self-esteem. IMPORTANT: This is subclinical narcissism — a normal personality trait, NOT Narcissistic Personality Disorder (NPD). At moderate levels, it relates to self-confidence and leadership emergence.',
		very_high: 'You have a very strong need for recognition and feel "special" compared to others. ⚠️ DERAILMENT RISK: Grijalva et al. (2015) meta-analysis: very high narcissism is a "double-edged sword" — relates to leadership emergence (+) BUT also interpersonal conflict, entitlement, and exploitation (-). In group projects, you may claim credit for team ideas, dismiss others\' input, or refuse "boring tasks". Result: team goes passive-aggressive or abandons you.',
		high: 'You\'re confident and want recognition — "healthy narcissism" per Kohut. This fuels self-promotion, public speaking, and entrepreneurship. But the line between "confident" and "arrogant" is thin — feedback from trusted people is ESSENTIAL for calibration.',
		moderate: 'Healthy self-confidence — you believe in yourself without needing to be the constant center of attention. Optimal level: enough confidence to present ideas, enough humility to receive feedback. Moderate narcissism relates to resilience and well-being (Sedikides et al., 2004).',
		low: 'You\'re humble and rarely seek the spotlight. But in a competitive job market, you need to learn self-advocacy: talking about your achievements isn\'t "bragging" — it\'s "communicating value".',
		very_low: 'You\'re very humble, nearly invisible in groups. ⚠️ Practical risk: in interviews and internships, you\'ll be overlooked. Recruiters aren\'t mind readers — if you don\'t speak up, they assume you have nothing to say. Practice an "elevator pitch" — 30 seconds on your 3 key strengths.',
		career: 'Mid N → CEO, Entrepreneurship, Sales, Politics, Performing Arts, Public Relations. High N → Risky in all roles requiring long-term teamwork. Low N → Research, Backend Engineering, Finance Analysis — roles evaluated by output, not visibility.',
		tip: 'High narcissism — before saying "my idea", ask "what does the team think?". Practice writing "we" instead of "I" in emails. Low narcissism — practice saying "I did…" instead of "the team did…" when YOU were the main contributor. You don\'t need humble-bragging, you need accurate attribution.',
		academic: 'Grijalva et al. (2015): Narcissism has a curvilinear relationship with leadership effectiveness — increases to a point, then DECREASES. Campbell et al. (2011): "Narcissistic leaders" create short-term gains but long-term organizational damage. Sedikides et al. (2004): moderate narcissism → psychological well-being.',
		derailment: '🚨 Top derailment: "Credit Appropriation" — the UNCONSCIOUS tendency to exaggerate your own contribution and minimize others\'. You may genuinely believe "without me, the project fails", but the team sees a very different story. In organizations, Glassdoor reviews and LinkedIn networks will reveal the truth. Prevention: after each project, ask yourself "Who besides me contributed to this outcome?" and proactively acknowledge them.',
		obLesson: 'OB concept: Leader-Member Exchange (LMX) Theory — high narcissism creates an "in-group" (admirers) and "out-group" (dissenters). Result: polarized team, talent leaves, only yes-men remain. This is the pattern of many startup founders ousted by their boards.',
	},
	psychopathy: {
		icon: '⚡',
		what: 'Subclinical Psychopathy measures 3 facets: Callousness (lack of empathy), Impulsivity (acting without thinking), and Thrill-seeking (craving intense experiences). IMPORTANT: This is a normal personality trait on a spectrum, NOT Antisocial Personality Disorder (ASPD). Everyone has different levels — at low-moderate levels, it relates to fearless dominance and stress immunity.',
		very_high: 'You show very strong impulsivity, thrill-seeking, and callousness. ⚠️ EXTREMELY SERIOUS DERAILMENT RISK: This is the most dangerous Dark Triad trait for career. Boddy (2011): "Corporate Psychopaths" — very high P in leadership causes bullying, fraud, and organizational destruction. In practice: you may say cruel things in conflicts without feeling remorse, break commitments out of boredom, or take extreme risks the team doesn\'t agree with.',
		high: 'You\'re bold, barely affected by fear, and have a "cool head" under pressure. Bright side: "Fearless Dominance" (Lilienfeld et al., 2012) — calm in crisis, decisive, no analysis paralysis. Dark side: you may hurt others without fully registering the impact. Your "blunt" words may make team members cry and you won\'t understand why.',
		moderate: 'You stay calm in tense situations and have the courage to make hard decisions. But you still care about consequences and people. Good functional level for leadership — "tough but fair".',
		low: 'You\'re highly empathetic, careful, and consider the impact of your actions. Excellent foundation for all relationships — personal and professional. You\'re naturally good at emotional labor and caregiving roles.',
		very_low: 'You\'re very empathetic and sensitive to others\' suffering. A gift for helping professions but also a vulnerability: you may experience "compassion fatigue" in high-conflict environments. And you may avoid decisions that cause pain to others — even when it\'s the right decision (e.g., firing an incompetent employee).',
		career: 'Low P → Healthcare, Teaching, Psychology, HR, Non-profit, Social Work. Mid P → Crisis Management, Surgery, Military, Trading, Venture Capital, Turnaround Consulting. High P → HIGH RISK in every position — impulsivity + callousness = career bomb.',
		tip: 'High P — BEFORE speaking/acting in conflict, count to 10 and ask: "If this conversation were recorded, would I want my boss to hear it?". Low P — learn to distinguish "empathy" (good) from "people-pleasing" (bad). You can care about people AND still make tough decisions.',
		academic: 'Boddy (2011): "Corporate Psychopaths" — high P in leadership causes organizational destruction, bullying, fraud. Lilienfeld et al. (2012): "Fearless Dominance" component can be positive — relates to heroism, courage, stress immunity. Hare (1999): Very high P in ~1% of population, subclinical high P in ~10%.',
		derailment: '🚨 Most specific derailment: If you say cruel things to colleagues ("Are you stupid?", "Everyone knows this") — even if YOU don\'t think it\'s a big deal — it becomes a story the ENTIRE company knows within 24 hours. In small industries, reputation spreads EXTREMELY fast through group chats and social media.',
		obLesson: 'OB concept: Emotional Intelligence (Goleman, 1995) — high P = low EQ, especially in the "empathy" and "social skills" components. EQ is a stronger predictor than IQ for leadership effectiveness at every level (Boyatzis, 2008). High P + high position = toxic leadership.',
	},
};

/* ─── Vietnamese ───────────────────────────────────────────────────────── */

const VI: InsightMap = {
	extraversion: {
		icon: '🗣️',
		what: 'Extraversion (Hướng ngoại) phản ánh xu hướng tìm kiếm sự kích thích từ thế giới bên ngoài — gồm 3 thành phần: Sociability (thích giao tiếp), Assertiveness (quyết đoán, dẫn dắt), và Energy Level (mức năng lượng). Đây không chỉ là "thích nói chuyện" — mà là cách bạn lấy năng lượng và tương tác với thế giới.',
		very_high: 'Bạn cực kỳ hướng ngoại — bạn "sống" bằng năng lượng xã hội, chủ động khởi xướng và cảm thấy tù túng khi phải làm việc một mình lâu. ⚠️ Cẩn thận: trong đồ án nhóm, bạn có thể chiếm sóng và khiến thành viên hướng nội cảm thấy bị "nuốt chửng". Judge et al. (2002) cho thấy E rất cao liên quan đến emergent leadership nhưng KHÔNG nhất thiết đến leadership effectiveness.',
		high: 'Bạn thích giao tiếp, năng lượng tốt trong nhóm và dễ kết nối. Đây là lợi thế rõ ràng cho networking và làm việc cross-functional. Tuy nhiên, E cao đôi khi bị đánh giá là "nói nhiều hơn làm" — hãy kết hợp với hành động cụ thể.',
		moderate: 'Bạn là ambivert — linh hoạt chuyển đổi giữa giao tiếp và độc lập. Grant (2013, Wharton) cho thấy ambivert thực ra bán hàng tốt hơn cả người hướng ngoại thuần, vì họ biết khi nào nên nói và khi nào nên lắng nghe.',
		low: 'Bạn hướng nội — cần thời gian riêng để xử lý thông tin và nạp năng lượng. Đây KHÔNG phải nhược điểm: Susan Cain trong "Quiet" đã chỉ ra rằng 1/3 đến 1/2 dân số là introvert, và nhiều CEO thành công nhất là hướng nội. Bạn mạnh ở deep listening và deliberate thinking.',
		very_low: 'Bạn rất hướng nội — tương tác xã hội tiêu tốn nhiều năng lượng. Với sự nghiệp sắp tới: bạn cần chiến lược cụ thể cho networking (ví dụ: 1-on-1 coffee thay vì party lớn) và phỏng vấn (chuẩn bị kỹ talking points). Đừng để sự im lặng bị hiểu lầm là "thiếu năng lực".',
		career: 'E cao → Sales, Account Management, Event, PR, Training, Quản lý dự án. E thấp → Nghiên cứu, Data Analysis, UX Research, Backend Dev, Editing, Technical Writing. E trung bình → Consulting, Product Management, Business Analysis.',
		tip: 'Trong phỏng vấn xin việc, E không quan trọng bằng CÁCH bạn thể hiện giá trị. Người hướng nội nên tập STAR method. Người hướng ngoại nên tập dừng lại sau mỗi câu trả lời thay vì nói tràn.',
		academic: 'Soto & John (2017): E dự báo satisfaction trong công việc nhóm và emergent leadership. Judge et al. (2002): E có r=.31 với leadership emergence nhưng chỉ r=.16 với leadership effectiveness.',
	},
	agreeableness: {
		icon: '🤝',
		what: 'Agreeableness (Dễ chịu) đo lường 3 khía cạnh: Compassion (lòng trắc ẩn), Respectfulness (tôn trọng quy tắc xã hội), và Trust (niềm tin vào người khác). Đây không phải "dễ bảo" mà là thiên hướng hợp tác vs. cạnh tranh trong mối quan hệ.',
		very_high: 'Bạn cực kỳ hợp tác và đồng cảm — luôn đặt nhu cầu người khác lên trước. ⚠️ Bạn dễ trở thành "organizational doormat" — ai cũng nhờ nhưng không ai ghi nhận. Judge et al. (2012): A rất cao liên quan đến lương THẤP hơn — "nice penalty" là có thật.',
		high: 'Bạn hợp tác, đồng cảm, và xây dựng mối quan hệ tốt. Đây là nền tảng cho OCB (Organizational Citizenship Behavior). Nhưng cần học cách nói "không" một cách tử tế.',
		moderate: 'Bạn biết khi nào cần hợp tác và khi nào cần đứng vững lập trường. Thường là mức tối ưu cho quản lý.',
		low: 'Bạn thiên về lý trí, trực tiếp, và ít bị cảm xúc chi phối. Phù hợp cho vai trò cần objective decision-making. Nhưng trong văn hóa VN thiên về harmony, A thấp có thể bị coi là "khó chịu" — cần học diplomatic communication.',
		very_low: 'Bạn rất độc lập và skeptical. ⚠️ Trong team project, điều này gây xung đột nhanh chóng. Hãy chủ động thể hiện thiện chí để xây dựng trust ban đầu.',
		career: 'A cao → Tư vấn tâm lý, HR, Giảng dạy, Y tế, CSR. A thấp → Tài chính, Luật, Consulting chiến lược. A trung bình → Product Management, Business Development.',
		tip: 'A cao — tập nói "Tôi cần thêm thời gian để suy nghĩ" thay vì đồng ý ngay. A thấp — trong 2 tuần đầu ở công ty mới, hãy ưu tiên listening mode.',
		academic: 'Judge et al. (2012): A cao → lương thấp hơn ~$7,000/năm. Organ & Ryan (1995): A là predictor mạnh nhất của OCB.',
		obLesson: 'Trong OB, Agreeableness liên quan đến "Voice behavior" (Morrison, 2011): người A cao ít dám lên tiếng về vấn đề trong tổ chức. Đây là nguyên nhân gốc rễ của groupthink.',
	},
	conscientiousness: {
		icon: '📋',
		what: 'Conscientiousness (Tận tâm) gồm 3 facet: Organization (ngăn nắp), Productiveness (hiệu suất), và Responsibility (trách nhiệm). Đây là trait dự báo job performance mạnh nhất — quan trọng hơn cả IQ trong nhiều bối cảnh.',
		very_high: 'Bạn cực kỳ có kỷ luật và tổ chức. ⚠️ Derailment risk: Perfectionism + burnout. Carter et al. (2016): C rất cao liên quan đến workaholism và khó delegate.',
		high: 'Bạn đáng tin cậy, có kế hoạch rõ ràng và follow-through tốt. Barrick & Mount (1991): C là predictor mạnh nhất cho job performance (r=.22-.23).',
		moderate: 'Bạn cân bằng giữa kỷ luật và linh hoạt. Trong môi trường startup/agile, đây có thể là mức optimal.',
		low: 'Bạn ưu tiên flexibility. ⚠️ C thấp là red flag lớn nhất mà employer nhìn thấy. Tin tốt: C là trait CÓ THỂ cải thiện được nhiều nhất.',
		very_low: 'Bạn hoạt động theo impulse. ⚠️ Đây là thách thức sống còn khi đi làm. BẮT ĐẦU NGAY: calendar blocking, to-do list, "touch it once" rule. 💡 C là trait DỄ THAY ĐỔI NHẤT, đặc biệt ở tuổi 20-30.',
		career: 'C cao → Tài chính, Y tế, Kỹ thuật, Project Management, QA. C thấp → Creative roles CÓ hệ thống hỗ trợ.',
		tip: 'Bất kể C score: xây 1 system ngay — Inbox Zero, Weekly Review, Time Blocking. Dùng tool thay vì dựa vào trí nhớ.',
		academic: 'Barrick & Mount (1991): C dự báo job performance across mọi occupation. Noftle & Robins (2007): C dự báo GPA mạnh hơn SAT (r=.28 vs r=.25).',
		obLesson: 'Trong OB, C liên quan đến Self-Regulation Theory (Baumeister) và "Psychological Capital" (Luthans).',
	},
	negativeEmotionality: {
		icon: '🌊',
		what: 'Negative Emotionality (Cảm xúc tiêu cực / Neuroticism) gồm 3 facet: Anxiety (lo lắng), Depression (buồn bã), và Emotional Volatility (biến động cảm xúc). Đây KHÔNG phải "bệnh" — mà cho thấy hệ thống cảnh báo nguy hiểm của bạn nhạy đến mức nào.',
		very_high: 'Hệ thống cảnh báo rất nhạy — bạn detect threats nhanh hơn người khác nhưng cũng false alarm nhiều hơn. ⚠️ N rất cao + stress = "anxiety spiral". Swider & Zimmerman (2010): N là predictor mạnh nhất cho burnout. 💡 TIN TỐT: Khả năng lường trước rủi ro của bạn xuất sắc hơn 90% mọi người.',
		high: 'Bạn nhạy cảm với stress và trải nghiệm cảm xúc tiêu cực mạnh hơn. Mặt tích cực: N cao liên quan đến creative achievement (Feist, 1998). Mặt tiêu cực: dễ "catastrophize" dưới deadline.',
		moderate: 'Bạn có sự ổn định cảm xúc ở mức bình thường. Mức chức năng tốt cho hầu hết environments.',
		low: 'Bạn khá "cool under pressure". Lợi thế cho high-stakes situations. Nhưng N thấp đôi khi đi kèm complacency.',
		very_low: 'Bạn gần như "bulletproof" về cảm xúc. Giá trị cực lớn cho leadership và crisis management. Nhưng có thể bị coi là "cold".',
		career: 'N thấp → Leadership, Surgery, Pilot, Trading. N cao → Roles cần sensitivity: Art, Counseling, UX Research, Writing, QA.',
		tip: 'Nếu N cao: chuẩn bị "emotional first-aid kit" — người tin cậy, hoạt động physical, journaling. Nếu N thấp: chủ động hỏi thăm đồng nghiệp.',
		academic: 'Swider & Zimmerman (2010): N → burnout (r=.44). Feist (1998): N → artistic creativity. Suls & Martin (2005): N → interpretive bias.',
		obLesson: 'Trong OB, N liên quan đến Affective Events Theory (Weiss & Cropanzano, 1996): cảm xúc tại nơi làm việc ảnh hưởng đến thái độ và hành vi.',
	},
	openMindedness: {
		icon: '🎨',
		what: 'Open-Mindedness (Cởi mở) gồm 3 facet: Intellectual Curiosity (tò mò trí tuệ), Aesthetic Sensitivity (nhạy cảm thẩm mỹ), và Creative Imagination. Đây là trait dự báo mạnh nhất cho "lifelong learning".',
		very_high: 'Bạn cực kỳ tò mò, sáng tạo, và thích thách thức quy ước. ⚠️ Derailment risk: "Shiny object syndrome". Nếu O rất cao + C thấp = "dreamer who never delivers".',
		high: 'Bạn thích khám phá, học hỏi và suy nghĩ trừu tượng. Trong thế giới VUCA hiện tại, O cao là competitive advantage.',
		moderate: 'Bạn cân bằng giữa đổi mới và thực tế. Phù hợp cho hầu hết roles.',
		low: 'Bạn thiên về practical, conventional. Trong operational roles, đây là STRENGTH.',
		very_low: 'Bạn rất truyền thống và resist change mạnh. ⚠️ Với AI disruption hiện tại, O rất thấp là rủi ro lớn.',
		career: 'O cao → Design Thinking, R&D, Startup, Innovation, Strategy Consulting, UX Design. O thấp → Kế toán, Operations, Compliance, QC.',
		tip: 'O cao — chọn 1 idea và COMMIT ít nhất 3 tháng. O thấp — thử AI tools NGAY vì industry đang bị disrupted.',
		academic: 'McCrae (1987): O là predictor mạnh nhất cho divergent thinking. George & Zhou (2001): O + supportive environment = creative performance tối ưu.',
		obLesson: 'Trong OB, O liên quan đến Absorptive Capacity (Cohen & Levinthal, 1990). Tổ chức cần mix high-O (explore) và low-O (exploit) — bài toán Ambidexterity.',
	},
	machiavellianism: {
		icon: '♟️',
		what: 'Machiavellianism (Mưu lược) đo lường xu hướng "chơi game quyền lực": sẵn sàng thao túng, sử dụng chiến thuật xã hội, và ưu tiên kết quả hơn đạo đức. Trong tổ chức, M cao là "political skill" phiên bản tối.',
		very_high: 'Bạn là "strategic calculator" — luôn tính toán mối quan hệ nào có lợi. ⚠️ DERAILMENT RISK NGHIÊM TRỌNG: Hogan & Hogan (2001): M rất cao là 1 trong 11 derailment factors phổ biến nhất.',
		high: 'Bạn có tư duy chiến lược mạnh. Mặt sáng: Political Skill. Mặt tối: thiếu moral compass → phá hủy trust dài hạn.',
		moderate: 'Bạn có social awareness tốt mà không quá tính toán — "trí tuệ xã hội" lành mạnh. Thường là mức optimal cho leadership trong bối cảnh VN.',
		low: 'Bạn trực tính, chân thành, transparent. Nền tảng cho authentic leadership. Nhưng có thể naive về office politics.',
		very_low: 'Bạn rất thành thật và gần như zero strategic calculation. ⚠️ Trong môi trường political, bạn sẽ bị exploit. Hãy đọc "Influence" của Cialdini — để nhận ra khi bị thao túng.',
		career: 'M vừa phải → Đàm phán, BD, Consulting, Diplomacy. M cao → Rủi ro cao. M thấp → Roles cần trust: Doctor, Teacher, Non-profit.',
		tip: 'Ranh giới giữa "political skill" và "manipulation": (1) Bạn có willing nói thật khi bị hỏi trực tiếp? (2) Bạn có chịu hậu quả nếu bị phát hiện?',
		academic: 'Paulhus & Williams (2002): M = "strategic manipulation". Christie & Geis (1970): M cao → thành công trong "loose situations" nhưng thất bại trong "tight situations".',
		derailment: '🚨 Nếu bạn nói xấu đồng nghiệp với sếp để được đánh giá cao hơn, bạn ĐANG dùng M cao. Khi bị phát hiện, bạn mất không chỉ thực tập mà còn reference — 1 reference xấu có thể theo bạn 5-10 năm.',
		obLesson: 'OB concept: Organizational Politics (Mintzberg, 1983). M cao phản ánh tendency dùng political tactics. Khi có ethical leadership, M cao bị kiểm soát. Khi leadership yếu, M cao trở thành cancer.',
	},
	narcissism: {
		icon: '👑',
		what: 'Narcissism (Ái kỷ) đo lường nhu cầu được ngưỡng mộ, cảm giác đặc biệt (entitlement), và xu hướng exploit người khác. QUAN TRỌNG: Đây là subclinical narcissism — KHÔNG phải NPD (Narcissistic Personality Disorder).',
		very_high: 'Bạn có nhu cầu được công nhận rất mạnh. ⚠️ DERAILMENT RISK: Grijalva et al. (2015): N rất cao là "double-edged sword" — leadership emergence (+) nhưng interpersonal conflict, entitlement (-). Trong đồ án nhóm: claim credit, dismiss ý kiến, từ chối boring tasks.',
		high: 'Bạn tự tin và muốn được công nhận — "healthy narcissism". Fuel cho self-promotion, public speaking, entrepreneurship. Nhưng ranh giới "confident" và "arrogant" rất mỏng.',
		moderate: 'Self-confidence lành mạnh — tin vào bản thân mà không cần luôn là trung tâm. Mức tối ưu.',
		low: 'Bạn khiêm tốn và ít tìm spotlight. Nhưng cần học self-advocacy: nói về achievements không phải "khoe" mà là "communicate value".',
		very_low: 'Bạn rất khiêm tốn, gần như invisible. ⚠️ Trong phỏng vấn, bạn sẽ bị overlooked. Tập "elevator pitch" — 30 giây về 3 strengths.',
		career: 'N vừa phải → CEO, Entrepreneurship, Sales, Politics, PR. N cao → Rủi ro trong roles cần teamwork dài hạn. N thấp → Research, Backend Engineering, Finance Analysis.',
		tip: 'N cao — hỏi "team nghĩ sao?" trước khi nói "ý tưởng của tôi". Viết "we" thay "I". N thấp — tập nói "Tôi đã làm..." khi bạn là người chủ lực.',
		academic: 'Grijalva et al. (2015): Narcissism có curvilinear relationship với leadership effectiveness. Campbell et al. (2011): "Narcissistic leaders" tạo short-term gains nhưng long-term damage.',
		derailment: '🚨 "Credit Appropriation" — xu hướng VÔ THỨC phóng đại đóng góp bản thân. Bạn có thể tin "không có mình thì dự án hỏng", nhưng team thấy khác. Sau mỗi project, hỏi "Ai ngoài mình đã đóng góp?".',
		obLesson: 'OB concept: Leader-Member Exchange (LMX) Theory — N cao tạo "in-group" (ngưỡng mộ) và "out-group" (không đồng ý). Team polarized, talent bỏ đi.',
	},
	psychopathy: {
		icon: '⚡',
		what: 'Subclinical Psychopathy (Thái nhân cách dưới lâm sàng) đo lường 3 khía cạnh: Callousness (thiếu đồng cảm), Impulsivity (bốc đồng), và Thrill-seeking (tìm cảm giác mạnh). QUAN TRỌNG: Đây là đặc điểm tính cách trên phổ BÌNH THƯỜNG, KHÔNG phải ASPD.',
		very_high: 'Bạn có xu hướng rất mạnh về impulsivity, thrill-seeking, callousness. ⚠️ DERAILMENT RISK CỰC KỲ NGHIÊM TRỌNG: Boddy (2011): "Corporate Psychopaths" — P rất cao gây bullying, fraud, organizational destruction.',
		high: 'Bạn liều lĩnh, ít bị ảnh hưởng bởi sợ hãi, "cool head" dưới áp lực. Mặt sáng: "Fearless Dominance". Mặt tối: có thể hurt người khác mà không register impact.',
		moderate: 'Bạn bình tĩnh trong tình huống căng thẳng và có can đảm đưa quyết định khó. "Tough but fair".',
		low: 'Bạn đồng cảm cao, careful, cân nhắc impact. Nền tảng tuyệt vời cho mọi mối quan hệ.',
		very_low: 'Bạn rất đồng cảm và nhạy cảm. Gift cho helping professions nhưng cũng vulnerability: "compassion fatigue". Có thể tránh né quyết định gây pain — dù đúng.',
		career: 'P thấp → Y tế, Giảng dạy, Tâm lý, HR, Non-profit. P vừa → Crisis Management, Surgery, Trading. P cao → HIGH RISK — impulsivity + callousness = career bomb.',
		tip: 'P cao — TRƯỚC KHI nói/hành động: "Nếu cuộc nói chuyện bị record, tôi có muốn sếp nghe không?". P thấp — phân biệt "empathy" và "people-pleasing".',
		academic: 'Boddy (2011): "Corporate Psychopaths". Lilienfeld et al. (2012): "Fearless Dominance" có thể positive. Hare (1999): P rất cao ở ~1% dân số.',
		derailment: '🚨 Nếu bạn nói lời tàn nhẫn ("Em ngu thế?") — dù bạn không coi là big deal — TOÀN BỘ công ty biết trong 24 giờ. Reputation trong ngành lan CỰC NHANH.',
		obLesson: 'OB concept: Emotional Intelligence (Goleman, 1995) — P cao = low EQ, đặc biệt ở "empathy" và "social skills". EQ mạnh hơn IQ cho leadership effectiveness (Boyatzis, 2008).',
	},
};

export function getTraitInsight(domain: PersonalityDomain, lang: Lang): TraitInsightContent {
	return lang === 'vi' ? VI[domain] : EN[domain];
}
