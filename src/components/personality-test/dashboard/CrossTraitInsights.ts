/* Cross-Trait Insight Generator — pure logic, no UI */

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

  // Leadership potential: High E + High C
  if (E >= 3.5 && C >= 3.5) {
    insights.push({
      emoji: "\u{1F451}",
      title:
        lang === "vi"
          ? "Ti\u1EC1m n\u0103ng L\u00E3nh \u0111\u1EA1o"
          : "Leadership Potential",
      description:
        lang === "vi"
          ? "S\u1EF1 k\u1EBFt h\u1EE3p gi\u1EEFa Extraversion cao v\u00E0 Conscientiousness cao cho th\u1EA5y b\u1EA1n c\u00F3 c\u1EA3 n\u0103ng l\u01B0\u1EE3ng x\u00E3 h\u1ED9i l\u1EABn k\u1EF7 lu\u1EADt \u0111\u1EC3 d\u1EABn d\u1EAFt. Judge et al. (2002): \u0111\u00E2y l\u00E0 combo m\u1EA1nh nh\u1EA5t cho leadership emergence + effectiveness."
          : "The combination of high Extraversion and high Conscientiousness gives you both the social energy and discipline to lead. Judge et al. (2002): this is the strongest combo for leadership emergence + effectiveness.",
    });
  }

  // Confident innovator: High O + moderate Narc
  if (O >= 3.5 && Narc >= 2.5 && Narc <= 3.8) {
    insights.push({
      emoji: "\u{1F680}",
      title:
        lang === "vi"
          ? "Nh\u00E0 \u0110\u1ED5i m\u1EDBi T\u1EF1 tin"
          : "Confident Innovator",
      description:
        lang === "vi"
          ? "Open-Mindedness cao k\u1EBFt h\u1EE3p v\u1EDBi m\u1EE9c Narcissism v\u1EEBa ph\u1EA3i t\u1EA1o n\u00EAn ng\u01B0\u1EDDi v\u1EEBa s\u00E1ng t\u1EA1o v\u1EEBa t\u1EF1 tin tr\u00ECnh b\u00E0y \u00FD t\u01B0\u1EDFng. B\u1EA1n kh\u00F4ng ch\u1EC9 ngh\u0129 ra ideas m\u00E0 c\u00F2n d\u00E1m push ch\u00FAng."
          : "High Open-Mindedness combined with moderate Narcissism makes you both creative AND confident presenting ideas. You don't just generate ideas \u2014 you dare to push them.",
    });
  }

  // Perfectionism trap: High C + High N
  if (C >= 3.5 && N >= 3.5) {
    insights.push({
      emoji: "\u26A0\uFE0F",
      title:
        lang === "vi"
          ? "B\u1EABy C\u1EA7u to\u00E0n"
          : "Perfectionism Trap",
      description:
        lang === "vi"
          ? "Conscientiousness cao + Negative Emotionality cao = perfectionism + anxiety. B\u1EA1n \u0111\u1EB7t ti\u00EAu chu\u1EA9n cao VÀ lo l\u1EAFng khi kh\u00F4ng \u0111\u1EA1t \u0111\u01B0\u1EE3c. \u0110\u00E2y l\u00E0 combo d\u1EC5 d\u1EABn \u0111\u1EBFn burnout nh\u1EA5t. C\u1EA7n: self-compassion v\u00E0 \"good enough\" mindset."
          : "High Conscientiousness + high Negative Emotionality = perfectionism + anxiety. You set high standards AND worry when you fall short. This combo leads to burnout most easily. Need: self-compassion and a \"good enough\" mindset.",
    });
  }

  // Natural mediator: High A + Low P
  if (A >= 3.5 && P <= 2.5) {
    insights.push({
      emoji: "\u{1F54A}\uFE0F",
      title:
        lang === "vi"
          ? "Nh\u00E0 H\u00F2a gi\u1EA3i T\u1EF1 nhi\u00EAn"
          : "Natural Mediator",
      description:
        lang === "vi"
          ? "Agreeableness cao + Psychopathy th\u1EA5p = b\u1EA1n r\u1EA5t \u0111\u1ED3ng c\u1EA3m v\u00E0 quan t\u00E2m \u0111\u1EBFn ng\u01B0\u1EDDi kh\u00E1c. B\u1EA1n l\u00E0 \"keo g\u1EAFn k\u1EBFt\" trong nh\u00F3m. Nhưng h\u00E3y c\u1EA9n th\u1EADn: empathy kh\u00F4ng c\u00F3 ranh gi\u1EDBi s\u1EBD tr\u1EDF th\u00E0nh people-pleasing."
          : "High Agreeableness + low Psychopathy = you're deeply empathetic and caring. You're the \"glue\" in any team. But be careful: empathy without boundaries becomes people-pleasing.",
    });
  }

  // Deep thinker: High O + Low E
  if (O >= 3.5 && E <= 2.5) {
    insights.push({
      emoji: "\u{1F9D0}",
      title:
        lang === "vi"
          ? "Nh\u00E0 T\u01B0 duy S\u00E2u"
          : "Deep Thinker",
      description:
        lang === "vi"
          ? "Open-Mindedness cao + Extraversion th\u1EA5p = b\u1EA1n t\u01B0 duy s\u00E2u v\u00E0 s\u00E1ng t\u1EA1o nh\u01B0ng \u01B0a x\u1EED l\u00FD \"internal\". B\u1EA1n l\u00E0 ki\u1EC3u introvert intellectual \u2014 \u00FD t\u01B0\u1EDFng hay nh\u1EA5t th\u01B0\u1EDDng \u0111\u1EBFn khi m\u1ED9t m\u00ECnh."
          : "High Open-Mindedness + low Extraversion = you think deeply and creatively but prefer processing internally. You're the intellectual introvert \u2014 your best ideas come in solitude.",
    });
  }

  // Strategic diplomat: High M + High A
  if (M >= 3.0 && A >= 3.5) {
    insights.push({
      emoji: "\u{1F3AF}",
      title:
        lang === "vi"
          ? "Nh\u00E0 Ngo\u1EA1i giao Chi\u1EBFn l\u01B0\u1EE3c"
          : "Strategic Diplomat",
      description:
        lang === "vi"
          ? "Machiavellianism kh\u00E1 cao + Agreeableness cao = b\u1EA1n v\u1EEBa hi\u1EC3u chi\u1EBFn l\u01B0\u1EE3c v\u1EEBa duy tr\u00EC \u0111\u01B0\u1EE3c m\u1ED1i quan h\u1EC7. \u0110\u00E2y l\u00E0 \"political skill\" l\u00E0nh m\u1EA1nh nh\u1EA5t (Ferris et al., 2005). B\u1EA1n \u0111\u00E0m ph\u00E1n gi\u1ECFi m\u00E0 kh\u00F4ng l\u00E0m m\u1EA5t l\u00F2ng ai."
          : "Moderate-high Machiavellianism + high Agreeableness = you understand strategy while maintaining relationships. This is the healthiest form of \"political skill\" (Ferris et al., 2005). You negotiate well without burning bridges.",
    });
  }

  // Dark combo: High M + High Narc + High P
  if (M >= 3.5 && Narc >= 3.5 && P >= 3.5) {
    insights.push({
      emoji: "\u{1F6A8}",
      title:
        lang === "vi"
          ? "C\u1EA3nh b\u00E1o: Dark Triad \u0111\u1ED3ng b\u1ED9 cao"
          : "Warning: High Dark Triad Cluster",
      description:
        lang === "vi"
          ? "C\u1EA3 3 traits Dark Triad \u0111\u1EC1u cao \u2014 Paulhus & Williams (2002) g\u1ECDi \u0111\u00E2y l\u00E0 \"Dark Core\". \u0110i\u1EC1u n\u00E0y KH\u00D4NG c\u00F3 ngh\u0129a b\u1EA1n x\u1EA5u, nh\u01B0ng c\u1EA7n self-awareness cao. H\u00E3y \u0111\u1EB7c bi\u1EC7t ch\u00FA \u00FD feedback t\u1EEB ng\u01B0\u1EDDi kh\u00E1c v\u00E0 t\u00ECm 1 mentor \u0111\u00E1ng tin c\u1EADy."
          : 'All 3 Dark Triad traits are elevated \u2014 Paulhus & Williams (2002) call this the "Dark Core". This does NOT mean you\'re bad, but it demands high self-awareness. Pay special attention to feedback from others and find a trusted mentor.',
    });
  }

  // Bright core: High A + High C + Low DT
  if (A >= 3.5 && C >= 3.5 && M <= 2.5 && Narc <= 2.5 && P <= 2.5) {
    insights.push({
      emoji: "\u{2728}",
      title:
        lang === "vi"
          ? "N\u1EC1n t\u1EA3ng S\u00E1ng"
          : "Bright Core",
      description:
        lang === "vi"
          ? "Agreeableness cao + Conscientiousness cao + Dark Triad th\u1EA5p = b\u1EA1n l\u00E0 n\u1EC1n t\u1EA3ng c\u1EE7a b\u1EA5t k\u1EF3 t\u1ED5 ch\u1EE9c n\u00E0o. \u0110\u00E1ng tin c\u1EADy, h\u1EE3p t\u00E1c, v\u00E0 \u0111\u1EA1o \u0111\u1EE9c. Organ & Ryan (1995): combo n\u00E0y d\u1EF1 b\u00E1o OCB t\u1ED1t nh\u1EA5t."
          : "High Agreeableness + high Conscientiousness + low Dark Triad = you're the foundation of any organization. Reliable, cooperative, and ethical. Organ & Ryan (1995): this combo best predicts OCB.",
    });
  }

  return insights;
}
