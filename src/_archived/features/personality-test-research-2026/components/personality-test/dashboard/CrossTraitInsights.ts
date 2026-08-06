/* ════════════════════════════════════════════════════════════════════════
   Cross-Trait Insight Generator — pure logic, no UI

   Generates rich, professional-grade insights by analysing how
   multiple personality traits interact with each other.

   Style guide:
   • Every insight must read like professional psychological counsel
   • Never use shorthand like "X + Y = Z" or bullet-style equations
   • Always explain WHY the combination matters and WHAT to do about it
   • Include at least one academic reference per insight
   • Vietnamese version must be native-quality, not translated English
   ════════════════════════════════════════════════════════════════════════ */

import type { TraitScore } from "@/types/personalityTest";
import type { Lang } from "../i18n";

export interface CrossTraitInsight {
  emoji: string;
  title: string;
  description: string;
}

export function generateCrossTraitInsights(
  ocean: Record<string, TraitScore> | null,
  darkTriad: Record<string, TraitScore> | null,
  lang: Lang
): CrossTraitInsight[] {
  if (!ocean) return [];
  const insights: CrossTraitInsight[] = [];

  const E = ocean.extraversion?.score ?? 3;
  const A = ocean.agreeableness?.score ?? 3;
  const C = ocean.conscientiousness?.score ?? 3;
  const N = ocean.negativeEmotionality?.score ?? 3;
  const O = ocean.openMindedness?.score ?? 3;
  const M = darkTriad?.machiavellianism?.score ?? 3;
  const Narc = darkTriad?.narcissism?.score ?? 3;
  const P = darkTriad?.psychopathy?.score ?? 3;

  // ─── 1. Leadership Potential: High E + High C ───────────────────────────

  if (E >= 3.5 && C >= 3.5) {
    insights.push({
      emoji: "👑",
      title:
        lang === "vi"
          ? "Tiềm năng Lãnh đạo Tự nhiên"
          : "Natural Leadership Potential",
      description:
        lang === "vi"
          ? `Kết quả của bạn cho thấy sự kết hợp hiếm và có giá trị giữa hai trait quan trọng nhất cho lãnh đạo: Hướng ngoại cao mang lại cho bạn năng lượng xã hội, khả năng truyền cảm hứng và sự thoải mái khi đứng trước đám đông; trong khi Tận tâm cao đảm bảo bạn không chỉ nói hay mà còn thực hiện lời hứa một cách đáng tin cậy.

Meta-analysis kinh điển của Judge và cộng sự (2002) trên 78 nghiên cứu xác nhận đây chính là sự kết hợp dự báo mạnh nhất cho cả hai khía cạnh: được chọn làm lãnh đạo VÀ thực sự lãnh đạo hiệu quả. Extraversion giúp bạn nổi lên và được công nhận, Conscientiousness giúp bạn duy trì hiệu suất lâu dài — bù đắp chính xác cho nhau.

Lời khuyên thực tế: Hãy chủ động tìm kiếm các cơ hội lãnh đạo nhỏ ngay bây giờ — dẫn dắt một nhóm dự án, điều phối một sự kiện, hoặc đảm nhận vai trò mentor. Kỹ năng lãnh đạo phát triển qua thực hành, và bạn có nền tảng tính cách lý tưởng để xây dựng trên đó.`
          : `Your results reveal a rare and powerful combination of the two traits most predictive of leadership success: high Extraversion gives you social energy, the ability to inspire, and comfort in the spotlight; while high Conscientiousness ensures you don't just talk a good game — you deliver reliably on your commitments.

Judge and colleagues' (2002) landmark meta-analysis across 78 studies confirmed that this specific combination is the strongest predictor of both leadership emergence (being chosen to lead) AND leadership effectiveness (actually leading well). Extraversion helps you rise to visibility and build followership, while Conscientiousness ensures sustained performance and trust over time — each compensating for the other's potential weaknesses.

Practical advice: Actively seek small leadership opportunities now — lead a project team, coordinate an event, or take on a mentoring role. Leadership skills develop through practice, and you have the ideal personality foundation to build on.`,
    });
  }

  // ─── 2. Confident Innovator: High O + moderate Narc ────────────────────

  if (O >= 3.5 && Narc >= 2.5 && Narc <= 3.8) {
    insights.push({
      emoji: "🚀",
      title:
        lang === "vi"
          ? "Nhà Đổi mới Tự tin"
          : "Confident Innovator",
      description:
        lang === "vi"
          ? `Hồ sơ tính cách của bạn cho thấy một sự kết hợp đặc biệt hiệu quả cho đổi mới sáng tạo: Open-Mindedness cao nghĩa là bạn tự nhiên tò mò, sẵn sàng khám phá ý tưởng mới, và có khả năng nhìn thấy những kết nối mà người khác bỏ qua. Đồng thời, mức Narcissism vừa phải mang lại cho bạn sự tự tin cần thiết để không chỉ nghĩ ra ý tưởng — mà còn dám trình bày và bảo vệ chúng trước người khác.

Nghiên cứu của Silvia và cộng sự (2009) cho thấy sáng tạo đơn thuần không đủ nếu thiếu sự tự tin để truyền đạt ý tưởng. Nhiều người có Open-Mindedness cao nhưng quá khiêm tốn để chia sẻ, dẫn đến những ý tưởng hay bị mai một. Bạn nằm ở giao điểm tối ưu — có cả chiều sâu lẫn sự dũng cảm để hành động.

Lời khuyên: Hãy tận dụng thế mạnh này trong các buổi brainstorm, cuộc thi ý tưởng, hoặc khi cần đề xuất giải pháp mới. Chỉ cần lưu ý: đảm bảo bạn lắng nghe phản hồi về ý tưởng một cách cởi mở, vì xu hướng tự tin có thể khiến bạn gạt bỏ những góp ý có giá trị quá nhanh.`
          : `Your personality profile reveals a particularly effective combination for creative innovation: high Open-Mindedness means you are naturally curious, willing to explore new ideas, and capable of seeing connections others miss. At the same time, your moderate level of Narcissism gives you the confidence not just to generate ideas — but to present and defend them convincingly.

Silvia and colleagues (2009) demonstrated that creativity alone is insufficient without the confidence to communicate ideas effectively. Many highly open-minded people are too modest to share their thinking, leading to valuable ideas that never see the light of day. You sit at the optimal intersection — possessing both depth of thought and the courage to act on it.

Practical advice: Leverage this strength in brainstorming sessions, pitch competitions, or any situation requiring novel solutions. One caveat to watch: make sure you stay genuinely open to feedback on your ideas, because the confidence component can sometimes cause you to dismiss valuable criticism too quickly.`,
    });
  }

  // ─── 3. Perfectionism Trap: High C + High N ────────────────────────────

  if (C >= 3.5 && N >= 3.5) {
    insights.push({
      emoji: "⚠️",
      title:
        lang === "vi"
          ? "Vùng Cảnh báo: Bẫy Cầu toàn"
          : "Watch Zone: The Perfectionism Trap",
      description:
        lang === "vi"
          ? `Đây là một trong những tổ hợp tính cách cần được chú ý nhất trong kết quả của bạn. Conscientiousness cao nghĩa là bạn đặt tiêu chuẩn rất cao cho bản thân và thúc đẩy mình hoàn thành mọi thứ đúng cách. Negative Emotionality cao nghĩa là khi bạn không đạt được tiêu chuẩn đó — hoặc ngay cả khi sợ rằng mình có thể không đạt — bạn trải qua mức lo lắng đáng kể.

Kết quả: một vòng lặp mà các nhà nghiên cứu gọi là "perfectionism-anxiety cycle." Stoeber & Otto (2006) phân biệt giữa "perfectionistic strivings" (phấn đấu hoàn hảo — lành mạnh) và "perfectionistic concerns" (lo lắng về sự hoàn hảo — có hại). Với tổ hợp này, bạn dễ rơi vào phía concerns — làm việc rất chăm chỉ nhưng không bao giờ cảm thấy đủ, dẫn đến kiệt sức.

Lời khuyên cụ thể: Hãy thực hành quy tắc "80% là đủ tốt" cho những nhiệm vụ không then chốt. Tự hỏi: "Nếu tôi dành thêm 2 giờ nữa cho việc này, ai sẽ thực sự nhận ra sự khác biệt?" Nếu câu trả lời là không ai — hãy dừng lại. Năng lượng tiết kiệm được nên dành cho sự nghỉ ngơi và phục hồi, không phải cho nhiệm vụ tiếp theo.`
          : `This is one of the most important trait combinations to be aware of in your results. High Conscientiousness means you hold yourself to very high standards and push yourself to complete things properly. High Negative Emotionality means that when you fall short — or even when you fear you might — you experience significant anxiety and distress.

The result is what researchers call the "perfectionism-anxiety loop." Stoeber & Otto (2006) drew an important distinction between "perfectionistic strivings" (the healthy pursuit of excellence) and "perfectionistic concerns" (anxious worry about imperfection). With your combination, you are more susceptible to the concerns side — working extremely hard but never feeling it's quite enough, leading eventually to exhaustion.

Specific advice: Practice the "80% rule" for tasks that aren't mission-critical. Ask yourself: "If I spend two more hours on this, would anyone actually notice the difference?" If the answer is no — stop. Channel the saved energy into rest and recovery, not into the next task. Consider self-compassion exercises (Kristin Neff's research shows these are particularly effective for perfectionistic profiles) and deliberately schedule recovery time as non-negotiable.`,
    });
  }

  // ─── 4. Natural Mediator: High A + Low P ───────────────────────────────

  if (A >= 3.5 && P <= 2.5) {
    insights.push({
      emoji: "🕊️",
      title:
        lang === "vi"
          ? "Nhà Hoà giải Tự nhiên"
          : "Natural Mediator",
      description:
        lang === "vi"
          ? `Sự kết hợp giữa Agreeableness cao và Psychopathy thấp trong hồ sơ của bạn tạo nên một năng lực đặc biệt quý giá: khả năng hoà giải tự nhiên. Agreeableness cao cho bạn sự đồng cảm sâu sắc — bạn thực sự cảm nhận được cảm xúc của người khác và muốn giúp họ ổn. Psychopathy thấp nghĩa là sự đồng cảm đó chân thật và bền vững, không bị pha loãng bởi tính vị kỷ.

Trong môi trường nhóm, bạn thường đóng vai trò "chất keo" — người giữ cho mọi người gắn kết, xoa dịu căng thẳng, và đảm bảo không ai bị bỏ rơi. Graziano và cộng sự (2007) cho thấy những người có hồ sơ này thường được đồng nghiệp đánh giá là đáng tin cậy nhất.

Tuy nhiên, có một điểm mù quan trọng: sự đồng cảm không có ranh giới sẽ biến thành "people-pleasing." Hãy tự hỏi định kỳ: "Tôi đang hoà giải vì đây là điều đúng đắn, hay vì tôi không chịu được cảm giác ai đó không hài lòng?" Nếu là lý do thứ hai, đó là tín hiệu để thiết lập ranh giới rõ ràng hơn.`
          : `The combination of high Agreeableness and low Psychopathy in your profile creates a genuinely valuable capability: natural mediation. High Agreeableness gives you deep empathy — you genuinely feel what others are experiencing and want to help. Low Psychopathy means that empathy is authentic and sustained, not diluted by self-interest.

In team settings, you naturally fill the role of the "relational glue" — the person who keeps people connected, de-escalates tension, and ensures no one feels excluded. Graziano and colleagues (2007) found that individuals with this profile are consistently rated as the most trustworthy members of their teams.

However, there is an important blind spot: empathy without boundaries becomes people-pleasing. Ask yourself periodically: "Am I mediating because this is the right thing to do, or because I can't tolerate the discomfort of someone being unhappy?" If it's the second reason, that's a signal to establish clearer boundaries. Healthy mediation comes from strength, not from the inability to tolerate conflict.`,
    });
  }

  // ─── 5. Deep Thinker: High O + Low E ───────────────────────────────────

  if (O >= 3.5 && E <= 2.5) {
    insights.push({
      emoji: "🧐",
      title:
        lang === "vi"
          ? "Nhà Tư duy Sâu"
          : "Deep Thinker",
      description:
        lang === "vi"
          ? `Hồ sơ của bạn cho thấy tổ hợp mà giới tâm lý học gọi là "introvert intellectual" — và đây hoàn toàn không phải điểm yếu. Open-Mindedness cao mang lại trí tò mò mãnh liệt và khả năng tư duy phân kỳ. Extraversion thấp nghĩa là bạn xử lý ý tưởng sâu nhất khi ở một mình, trong không gian yên tĩnh.

Kaufman và cộng sự (2016) cho thấy nhiều bước đột phá quan trọng nhất trong lịch sử — từ Darwin đến Newton — đến từ những khoảnh khắc suy tư cô đơn, không phải brainstorming nhóm.

Thách thức thực tế: trong thế giới công việc hiện đại vốn thiên về Extraversion, ý tưởng hay nhất của bạn có thể không được nghe. Giải pháp: yêu cầu nhận agenda trước cuộc họp để chuẩn bị, viết ý tưởng ra email thay vì chỉ nói trực tiếp, và chọn 1–2 thời điểm chiến lược trong mỗi cuộc họp để phát biểu — chất lượng một phát biểu có trọng lượng hơn số lượng mười câu bình thường.`
          : `Your profile reveals a combination that psychologists call the "intellectual introvert" — and this is emphatically not a weakness. High Open-Mindedness gives you intense curiosity and strong divergent thinking. Low Extraversion means you process ideas most deeply in solitude, free from interruption.

Kaufman and colleagues (2016) demonstrated that many of history's most significant breakthroughs — from Darwin to Newton — emerged from sustained solitary reflection, not from group brainstorming. You have a natural capacity for this kind of deep thinking.

The practical challenge: in today's Extraversion-biased professional world, your best ideas may go unheard. The solution is not to change your personality, but to build systems that work with it: request meeting agendas in advance, communicate ideas in writing rather than only verbally, and choose one or two strategic moments in each meeting to speak up — the quality of one well-considered contribution carries more weight than ten surface-level comments.`,
    });
  }

  // ─── 6. Strategic Diplomat: High M + High A ────────────────────────────

  if (M >= 3.0 && A >= 3.5) {
    insights.push({
      emoji: "🎯",
      title:
        lang === "vi"
          ? "Nhà Ngoại giao Chiến lược"
          : "Strategic Diplomat",
      description:
        lang === "vi"
          ? `Đây là một trong những tổ hợp thú vị nhất trong hồ sơ của bạn. Agreeableness cao mang lại sự đồng cảm chân thật và khả năng xây dựng mối quan hệ bền chặt. Machiavellianism ở mức đáng kể nghĩa là bạn cũng hiểu rõ các động lực chính trị trong tổ chức — ai ảnh hưởng ai, quyết định thực sự được đưa ra ở đâu.

Ferris và cộng sự (2005) gọi sự kết hợp này là "Political Skill" — kỹ năng chính trị lành mạnh, và nghiên cứu cho thấy nó là một trong những yếu tố dự báo mạnh nhất cho thành công sự nghiệp dài hạn. Khác biệt then chốt so với thao túng: bạn điều hướng hệ thống để đạt mục tiêu, nhưng không bằng cách làm tổn thương người khác.

Lời khuyên: Thế mạnh này phù hợp đặc biệt cho quản lý dự án, business development, hoặc consulting. Điều cần cảnh giác: khi áp lực tăng, đảm bảo bạn không trượt từ "chiến lược" sang "thao túng." Ranh giới rất đơn giản: nếu hành động của bạn sẽ khiến bạn xấu hổ nếu mọi người biết, đó là thao túng; nếu bạn thoải mái giải thích lý do, đó là chiến lược.`
          : `This is one of the most interesting combinations in your profile. High Agreeableness gives you genuine empathy and the ability to build strong, lasting relationships. Meaningful Machiavellianism means you also understand organisational political dynamics — who influences whom, where decisions are really made.

Ferris and colleagues (2005) call this "Political Skill" — healthy political competence — and their research identifies it as one of the strongest predictors of long-term career success. The critical distinction from manipulation: you navigate systems to achieve goals, but not at the expense of others.

Practical advice: This strength suits roles like project management, business development, or consulting. The thing to watch under pressure: make sure you don't slide from "strategic" into "manipulative." The boundary is simple: if your action would embarrass you if everyone knew about it, that's manipulation; if you'd be comfortable explaining your reasoning openly, that's strategy.`,
    });
  }

  // ─── 7. Dark Triad Cluster Warning ─────────────────────────────────────

  if (M >= 3.5 && Narc >= 3.5 && P >= 3.5) {
    insights.push({
      emoji: "🚨",
      title:
        lang === "vi"
          ? "Tín hiệu Quan trọng: Cụm Dark Triad Đồng bộ Cao"
          : "Important Signal: Elevated Dark Triad Cluster",
      description:
        lang === "vi"
          ? `Kết quả cho thấy cả ba trait trong nhóm Dark Triad — Machiavellianism, Narcissism, và Psychopathy — đều ở mức cao. Paulhus & Williams (2002) gọi sự đồng bộ này là "Dark Core" — một xu hướng chia sẻ ở lõi: đặt lợi ích bản thân lên trên người khác trong các tương tác xã hội.

Điều quan trọng cần nhấn mạnh: đây KHÔNG phải chẩn đoán lâm sàng, và KHÔNG có nghĩa bạn là người xấu. Đây là thang đo subclinical — đo biến thiên bình thường trong dân số chung. Nhiều người thành công trong kinh doanh và lãnh đạo có hồ sơ tương tự.

Tuy nhiên, nghiên cứu cũng rõ ràng về rủi ro dài hạn: Hogan & Hogan (2001) xác định tổ hợp này là nguyên nhân hàng đầu của "leadership derailment" — thăng tiến nhanh nhờ chiến thuật, sau đó mất tín nhiệm dần vì đồng nghiệp cảm thấy bị lợi dụng. Lời khuyên thiết thực: hãy tìm một mentor đáng tin cậy, chủ động xin feedback 360° và lắng nghe — đặc biệt khi feedback đó gây khó chịu.`
          : `Your results indicate that all three Dark Triad traits — Machiavellianism, Narcissism, and Psychopathy — are elevated. Paulhus & Williams (2002) call this convergence the "Dark Core" — a shared tendency to prioritise self-interest over others in social interactions.

Important to emphasise: this is NOT a clinical diagnosis, and it does NOT mean you are a bad person. This is a subclinical measure capturing normal variation in the general population. Many successful people in business and leadership have similar profiles.

However, the research is clear about long-term risks: Hogan & Hogan (2001) identified this combination as a leading cause of "leadership derailment" — rapid advancement through tactical skill, followed by gradual loss of credibility as relationship damage accumulates. Practical advice: find a trusted mentor, proactively seek 360-degree feedback, and listen to it — especially when it is uncomfortable to hear.`,
    });
  }

  // ─── 8. Bright Core ───────────────────────────────────────────────────

  if (A >= 3.5 && C >= 3.5 && M <= 2.5 && Narc <= 2.5 && P <= 2.5) {
    insights.push({
      emoji: "✨",
      title:
        lang === "vi"
          ? "Nền tảng Sáng: Xương sống Tổ chức"
          : "Bright Core: Organisational Backbone",
      description:
        lang === "vi"
          ? `Hồ sơ của bạn cho thấy sự kết hợp mà bất kỳ tổ chức nào cũng cần: Agreeableness cao (hợp tác và quan tâm đến người khác), Conscientiousness cao (hoàn thành công việc đúng cách và đúng hạn), và tất cả ba trait Dark Triad ở mức thấp (không chơi trò chính trị, không cần ngưỡng mộ, và không thờ ơ với cảm xúc đồng nghiệp).

Organ & Ryan (1995) xác nhận đây là tổ hợp dự báo mạnh nhất cho Hành vi Công dân Tổ chức (OCB) — những hành động vượt ngoài yêu cầu công việc mà giữ cho tổ chức vận hành trơn tru. Bạn là loại người mà các nhà nghiên cứu gọi là "organizational citizen" — người mà mọi nhóm cần nhưng ít khi có đủ.

Điều cần chú ý: trong các môi trường cạnh tranh cao, người có hồ sơ như bạn có thể bị bỏ qua khi phân phối phần thưởng — vì bạn không tự quảng bá. Hãy đảm bảo đóng góp của bạn được nhìn thấy, không phải bằng khoe khoang, mà bằng cách chủ động báo cáo kết quả rõ ràng và cụ thể.`
          : `Your profile reveals a combination every organisation needs: high Agreeableness (cooperative, caring), high Conscientiousness (delivers quality work reliably), and all three Dark Triad traits at low levels (no politics, no need for constant admiration, genuine care for colleagues' feelings).

Organ & Ryan (1995) confirmed this is the strongest predictor of Organisational Citizenship Behaviour (OCB) — discretionary actions beyond formal requirements that keep organisations running smoothly. You are what researchers call an "organisational citizen" — the person every team needs but rarely has enough of.

What to watch: in highly competitive environments, people with your profile can be overlooked when rewards are distributed — precisely because you don't self-promote. Make sure your contributions are visible to decision-makers, not through boasting, but through proactive, clear reporting of your results and impact.`,
    });
  }

  // ─── 9. Resilient Under Pressure: Low N + High C ──────────────────────

  if (N <= 2.5 && C >= 3.5) {
    insights.push({
      emoji: "🛡️",
      title:
        lang === "vi"
          ? "Bền bỉ Dưới Áp lực"
          : "Resilient Under Pressure",
      description:
        lang === "vi"
          ? `Sự kết hợp giữa Negative Emotionality thấp và Conscientiousness cao tạo nên "psychological hardiness" — khả năng chịu áp lực và duy trì hiệu suất khi mọi thứ trở nên khó khăn. Bạn không dễ bị cuốn vào lo lắng hay hoảng loạn, và thay vì chỉ bình tĩnh, bạn còn hành động — lên kế hoạch và thực hiện ngay cả trong hoàn cảnh khó khăn.

Luthans và cộng sự (2007) xác định tổ hợp này là thành phần cốt lõi của Psychological Capital (PsyCap) — vốn tâm lý dự báo hiệu suất vượt trên cả trí tuệ và kinh nghiệm. Bạn là người mà nhóm quay sang trong khủng hoảng.

Lời khuyên: Đừng coi nhẹ thế mạnh này — nó hiếm hơn bạn nghĩ. Hãy tận dụng trong các vai trò đòi hỏi sự bình tĩnh và kỷ luật đồng thời: quản lý dự án áp lực cao, consulting, hoặc bất kỳ tình huống nào cần ai đó giữ đầu lạnh và tay nóng.`
          : `The combination of low Negative Emotionality and high Conscientiousness creates what researchers call "psychological hardiness" — the capacity to sustain performance when things get difficult. You aren't easily swept into anxiety, and beyond staying calm, you take action — planning and executing even under adverse conditions.

Luthans and colleagues (2007) identified this as a core component of Psychological Capital (PsyCap) — psychological resources that predict performance above and beyond intelligence and experience. You are the person teams turn to in a crisis.

Practical advice: Don't undervalue this strength — it is rarer than you think. Leverage it in roles requiring simultaneous composure and discipline: high-pressure project management, consulting, or any situation that needs someone with a cool head and steady hands.`,
    });
  }

  // ─── 10. The Empathic Worrier: High A + High N ────────────────────────

  if (A >= 3.5 && N >= 3.5) {
    insights.push({
      emoji: "💙",
      title:
        lang === "vi"
          ? "Người Quan tâm Sâu sắc — Cần Bảo vệ Bản thân"
          : "Deep Carer — Protect Yourself",
      description:
        lang === "vi"
          ? `Hồ sơ cho thấy bạn vừa đồng cảm sâu sắc (Agreeableness cao) vừa trải qua cảm xúc tiêu cực mạnh mẽ (Negative Emotionality cao). Bạn không chỉ cảm nhận nỗi đau của người khác — bạn hấp thụ nó. Khi đồng nghiệp gặp khó khăn, bạn là người đầu tiên nhận ra và muốn giúp, nhưng nỗi đau của họ cũng trở thành gánh nặng cảm xúc của bạn.

Figley (1995) ghi nhận đây chính xác là cơ chế dẫn đến "compassion fatigue" — kiệt sức vì quan tâm quá nhiều, phổ biến ở giáo viên, nhân viên y tế và nhân viên xã hội. Khác biệt then chốt: "compassion" lành mạnh nói "Tôi thấy bạn đau và tôi muốn giúp"; "empathic distress" nói "Tôi thấy bạn đau và bây giờ tôi cũng đau."

Lời khuyên: Hãy xây dựng "biên giới cảm xúc" rõ ràng. Giới hạn thời gian lắng nghe vấn đề của người khác mỗi ngày; sau mỗi cuộc trò chuyện nặng nề, dành 5 phút cho bản thân; và nhớ rằng bạn không thể giúp ai nếu bạn đã kiệt sức.`
          : `Your profile shows you are both deeply empathetic (high Agreeableness) and experience negative emotions intensely (high Negative Emotionality). You don't just sense other people's pain — you absorb it. When a colleague is struggling, you're the first to notice, but their pain becomes your emotional burden too.

Figley (1995) documented this as the exact mechanism behind "compassion fatigue" — exhaustion from caring too much. The critical distinction: healthy compassion says "I see you're hurting and I want to help"; empathic distress says "I see you're hurting and now I'm hurting too."

Practical advice: Build clear emotional boundaries. This doesn't mean caring less — it means caring without losing yourself. Limit time absorbing others' problems each day; after every heavy conversation, take five minutes for yourself; and remember you cannot pour from an empty cup. Your capacity to help depends on maintaining your own reserves first.`,
    });
  }

  // ─── 11. The Ambitious Visionary: High E + High O + High Narc ─────────

  if (E >= 3.5 && O >= 3.5 && Narc >= 3.0) {
    insights.push({
      emoji: "🌟",
      title:
        lang === "vi"
          ? "Người Có Tầm nhìn Đầy Tham vọng"
          : "The Ambitious Visionary",
      description:
        lang === "vi"
          ? `Ba trait này kết hợp tạo nên hồ sơ kinh điển của những nhà khởi nghiệp có sức ảnh hưởng. Extraversion cao cho bạn khả năng truyền cảm hứng và kết nối. Open-Mindedness cao cho bạn tầm nhìn và khả năng thấy cơ hội nơi người khác thấy rào cản. Narcissism ở mức đáng kể cho bạn sự tự tin để theo đuổi tầm nhìn đó ngay cả khi mọi người còn hoài nghi.

Hmieleski & Lerner (2016) cho thấy hồ sơ này phổ biến ở cả startup thành công và thất bại. Sự khác biệt nằm ở khả năng lắng nghe phản hồi và điều chỉnh. Những người có tầm nhìn mà cũng biết lắng nghe thì bay cao; những người gạt bỏ mọi góp ý thì rơi.

Câu hỏi tự vấn quan trọng nhất: "Lần cuối cùng tôi thay đổi ý kiến vì ai đó thuyết phục tôi bằng lý lẽ tốt hơn là khi nào?" Nếu bạn không nhớ, đó là tín hiệu đáng suy nghĩ.`
          : `These three traits combine to create the classic profile of influential entrepreneurs. High Extraversion gives you the ability to inspire and connect. High Open-Mindedness gives you vision and the capacity to see opportunities where others see obstacles. Meaningful Narcissism gives you the confidence to pursue that vision even when others are sceptical.

Hmieleski & Lerner (2016) found this profile among both successful and unsuccessful startup founders. The differentiator: the ability to listen to feedback and adapt. Visionaries who also listen soar; visionaries who dismiss input fall.

The most important self-check question: "When was the last time I changed my mind because someone convinced me with better reasoning?" If you can't remember, that's a signal worth sitting with.`,
    });
  }

  // ─── 12. The Quiet Achiever: Low E + High C + Low Narc ────────────────

  if (E <= 2.5 && C >= 3.5 && Narc <= 2.5) {
    insights.push({
      emoji: "🏔️",
      title:
        lang === "vi"
          ? "Người Thành đạt Thầm lặng"
          : "The Quiet Achiever",
      description:
        lang === "vi"
          ? `Hồ sơ cho thấy tổ hợp "quiet achiever": bạn tạo ra kết quả xuất sắc (Conscientiousness cao), nhưng không tìm kiếm ánh đèn sân khấu (Extraversion thấp) và không cần sự ngưỡng mộ (Narcissism thấp). Bạn hoàn thành công việc không phải vì muốn được khen, mà vì bạn tin đó là cách đúng đắn.

Điểm mạnh: độ tin cậy của bạn cực kỳ hiếm và quý giá. Barrick & Mount (1991) xác nhận hiệu suất thực tế dài hạn phụ thuộc vào Conscientiousness hơn bất kỳ trait nào khác. Qua thời gian, đồng nghiệp và quản lý sẽ nhận ra.

Thách thức: thế giới công việc không tự động thưởng cho "làm tốt trong im lặng." Visibility là yếu tố cần thiết bên cạnh performance. Bạn không cần trở thành người hướng ngoại — nhưng cần học cách nói về đóng góp của mình rõ ràng, cụ thể. "Tôi đã hoàn thành X, kết quả là Y" không phải khoe khoang — đó là thông tin cần thiết để người khác đánh giá đúng giá trị của bạn.`
          : `Your profile reveals the "quiet achiever" pattern: you produce excellent results (high Conscientiousness), but don't seek the spotlight (low Extraversion) and don't need admiration (low Narcissism). You complete work not for recognition, but because you believe it's right.

The strength: your reliability is extremely rare and valuable. Barrick & Mount (1991) confirmed long-term performance depends on Conscientiousness more than any other trait. Over time, colleagues and managers notice.

The challenge: the professional world doesn't automatically reward excellence in silence. Visibility is a necessary complement to performance. You don't need to become an extrovert — but you need to communicate your contributions clearly. "I completed X, and the result was Y" is not bragging — it is essential information that allows others to accurately assess your value.`,
    });
  }

  return insights;
}
