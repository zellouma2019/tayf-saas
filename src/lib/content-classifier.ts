// ═══════════════════════════════════════════════════════════════
// مصنّف محتوى موحّد — نظام تسجيل نقاط مرجّح (weighted multi-signal)
// يحل محل سلاسل if/else القديمة التي تتوقف عند أول تطابق فقط.
// يُستخدم من محلل PDF ومحلل DOCX معاً لضمان قواعد متسقة وقابلة للصيانة.
// ═══════════════════════════════════════════════════════════════

import type { ServiceType } from "@/lib/print-config";

export interface ClassificationSignal {
  /** الحقل الذي طابق فيه النمط: اسم الملف / النص / العنوان الوصفي */
  source: "filename" | "text" | "metadata";
  /** الوزن المضاف عند التطابق */
  weight: number;
  /** وصف قصير للتفسير */
  reason: string;
}

export interface CategoryRule {
  id: string;
  detectedService: ServiceType;
  detectedServiceName: string;
  fileNature: string;
  /** أنماط في اسم الملف — وزن أعلى لأنها إشارة نية صريحة من المستخدم */
  filenamePatterns: RegExp[];
  /** أنماط في محتوى النص المستخرج */
  textPatterns: RegExp[];
  /** وزن الإشارة الواحدة من اسم الملف */
  filenameWeight: number;
  /** وزن الإشارة الواحدة من النص (عادة أقل لأن الكلمة قد تتكرر عرضياً) */
  textWeight: number;
  /** حد أقصى لعدد إشارات النص المحتسبة (لمنع تضخم النتيجة بتكرار كلمة واحدة) */
  maxTextHits: number;
  /** دفعة إضافية شرطية بحسب عدد الصفحات */
  pageCountBonus?: (pageCount: number) => { bonus: number; reason: string } | null;
  suggestions: {
    color: string;
    paperSize: string;
    paperType: string;
    binding: string;
  };
  baseInsight: string;
}

// قواعد التصنيف — كل قاعدة مستقلة ويمكن أن تتنافس عدة قواعد على نفس الملف،
// فيفوز صاحب أعلى نقاط (بدل أول قاعدة تطابق كما كان سابقاً)
export const CATEGORY_RULES: CategoryRule[] = [
  {
    id: "cv",
    detectedService: "document",
    detectedServiceName: "طباعة مستند (سيرة ذاتية)",
    fileNature: "سيرة ذاتية",
    filenamePatterns: [/\bcv\b/i, /resume/i, /سيرة[_\s-]?ذاتية/],
    textPatterns: [/سيرة\s*ذاتية/, /curriculum\s*vitae/i, /\bresume\b/i, /الخبرات?\s*المهنية/, /work\s*experience/i, /education\b/i, /المؤهلات/],
    filenameWeight: 35,
    textWeight: 6,
    maxTextHits: 4,
    suggestions: { color: "bw", paperSize: "A4", paperType: "cardboard", binding: "none" },
    baseInsight: "سيرة ذاتية — ورق مقوّى أبيض وأسود يعطي انطباعاً احترافياً",
  },
  {
    id: "thesis",
    detectedService: "document",
    detectedServiceName: "طباعة مستند (بحث/أطروحة أكاديمية)",
    fileNature: "بحث/أطروحة",
    filenamePatterns: [/thesis/i, /أطروحة/, /رسالة[_\s-]?(ماجستير|دكتوراه)/, /memoire/i],
    textPatterns: [/thesis/i, /أطروحة/, /رسالة\s*ماجستير/, /رسالة\s*دكتوراه/, /jury\b/i, /لجنة\s*المناقشة/, /abstract\b/i, /résumé\b/i, /bibliograph/i, /مراجع\s*(و)?المصادر/],
    filenameWeight: 30,
    textWeight: 5,
    maxTextHits: 5,
    pageCountBonus: (p) => (p > 40 ? { bonus: 15, reason: "عدد صفحات كبير يتوافق مع أطروحة أكاديمية" } : null),
    suggestions: { color: "bw", paperSize: "A4", paperType: "normal", binding: "glue" },
    baseInsight: "أطروحة/بحث أكاديمي طويل — يُنصح بتجليد بالغراء وغلاف مقوّى",
  },
  {
    id: "report",
    detectedService: "document",
    detectedServiceName: "طباعة مستند (تقرير/مذكرة)",
    fileNature: "تقرير/مذكرة",
    filenamePatterns: [/report/i, /تقرير/, /memo/i, /مذكرة/, /بحث/, /دراسة/i, /study/i],
    textPatterns: [/تقرير/, /مذكرة/, /دراسة\s*حالة/, /المقدمة\s*والخاتمة/, /الفصل\s*الأول/, /introduction\b/i, /conclusion\b/i, /chapter\s*\d/i],
    filenameWeight: 20,
    textWeight: 4,
    maxTextHits: 5,
    pageCountBonus: (p) => (p > 15 ? { bonus: 8, reason: "مستند متوسط/طويل الطول" } : null),
    suggestions: { color: "bw", paperSize: "A4", paperType: "normal", binding: "spiral" },
    baseInsight: "مستند نصي — أبيض وأسود اقتصادي، تجليد لولبي إن طال",
  },
  {
    id: "card",
    detectedService: "card",
    detectedServiceName: "بطاقات",
    fileNature: "بطاقة",
    filenamePatterns: [/card/i, /بطاقة/, /دعوة/, /invite/i, /wedding/i, /زفاف/, /visite/i, /business[_\s-]?card/i],
    textPatterns: [/بطاقة\s*(عمل|دعوة|زفاف)/, /business\s*card/i, /you'?re\s*invited/i, /دعوة\s*(حضور|زفاف)/],
    filenameWeight: 32,
    textWeight: 8,
    maxTextHits: 3,
    suggestions: { color: "color", paperSize: "A6", paperType: "cardboard", binding: "none" },
    baseInsight: "بطاقة — ورق مقوّى + طباعة ملونة على الوجهين غالباً",
  },
  {
    id: "poster",
    detectedService: "poster",
    detectedServiceName: "ملصقات",
    fileNature: "ملصق/إعلان",
    filenamePatterns: [/poster/i, /ملصق/, /affiche/i, /flyer/i, /إعلان/, /banner/i, /بنر/],
    textPatterns: [/ملصق/, /إعلان\s*عن/, /عرض\s*خاص/, /احجز\s*الآن/, /call\s*to\s*action/i],
    filenameWeight: 30,
    textWeight: 6,
    maxTextHits: 3,
    suggestions: { color: "color", paperSize: "A3", paperType: "glossy", binding: "none" },
    baseInsight: "ملصق/إعلان — حجم A3 وورق لامع لألوان زاهية",
  },
  {
    id: "invoice",
    detectedService: "document",
    detectedServiceName: "طباعة مستند (فاتورة/وصل)",
    fileNature: "فاتورة/وصل",
    filenamePatterns: [/invoice/i, /فاتورة/, /receipt/i, /وصل/, /quotation/i, /عرض[_\s-]?سعر/],
    textPatterns: [/فاتورة\s*رقم/, /المبلغ\s*الإجمالي/, /invoice\s*(no|number)/i, /total\s*due/i, /رقم\s*الطلب/],
    filenameWeight: 25,
    textWeight: 7,
    maxTextHits: 3,
    suggestions: { color: "bw", paperSize: "A4", paperType: "normal", binding: "none" },
    baseInsight: "فاتورة/وصل — أبيض وأسود، وجه واحد",
  },
  {
    id: "exam",
    detectedService: "document",
    detectedServiceName: "طباعة مستند (ورقة اختبار)",
    fileNature: "ورقة اختبار/امتحان",
    filenamePatterns: [/exam/i, /اختبار/, /امتحان/, /quiz/i, /test/i],
    textPatterns: [/اختبار\s*(في|مادة)/, /أجب\s*عن/, /السؤال\s*(الأول|رقم)/, /علامة\s*(السؤال|من)/, /questions?\s*:/i],
    filenameWeight: 28,
    textWeight: 6,
    maxTextHits: 4,
    suggestions: { color: "bw", paperSize: "A4", paperType: "normal", binding: "none" },
    baseInsight: "ورقة اختبار — أبيض وأسود بتنسيق رسمي وجه واحد",
  },
];

export interface ClassificationResult {
  detectedService: ServiceType;
  detectedServiceName: string;
  fileNature: string;
  confidence: number;
  signals: ClassificationSignal[];
  suggestions: { color: string; paperSize: string; paperType: string; binding: string };
  insight: string;
  /** المرشح الثاني للشفافية — يساعد على كشف حالات الغموض بدل اختيار متسرّع */
  runnerUp?: { serviceName: string; score: number };
}

/**
 * يصنّف المستند عبر تسجيل نقاط لكل قاعدة من مصادر متعددة (اسم الملف + النص + عدد الصفحات)
 * بدل التوقف عند أول تطابق. النتيجة أكثر ثباتاً لأنها تعتمد على تراكم الأدلة لا الترتيب العشوائي للشروط.
 */
export function classifyDocumentContent(
  fileName: string,
  text: string,
  pageCount: number,
): ClassificationResult | null {
  const lowerName = fileName.toLowerCase();
  const lowerText = (text || "").toLowerCase();

  type Scored = { rule: CategoryRule; score: number; signals: ClassificationSignal[] };
  const scored: Scored[] = [];

  for (const rule of CATEGORY_RULES) {
    let score = 0;
    const signals: ClassificationSignal[] = [];

    for (const pat of rule.filenamePatterns) {
      if (pat.test(lowerName)) {
        score += rule.filenameWeight;
        signals.push({ source: "filename", weight: rule.filenameWeight, reason: `اسم الملف يطابق نمط "${pat.source}"` });
        break; // إشارة واحدة كافية من اسم الملف، لا داعي للتراكم
      }
    }

    let textHits = 0;
    for (const pat of rule.textPatterns) {
      if (textHits >= rule.maxTextHits) break;
      if (pat.test(lowerText)) {
        score += rule.textWeight;
        textHits++;
        signals.push({ source: "text", weight: rule.textWeight, reason: `محتوى النص يطابق نمط "${pat.source}"` });
      }
    }

    if (rule.pageCountBonus) {
      const b = rule.pageCountBonus(pageCount);
      if (b) {
        score += b.bonus;
        signals.push({ source: "metadata", weight: b.bonus, reason: b.reason });
      }
    }

    if (score > 0) scored.push({ rule, score, signals });
  }

  if (scored.length === 0) return null;

  scored.sort((a, b) => b.score - a.score);
  const winner = scored[0];
  const runnerUp = scored[1];

  // معايرة الثقة: نقاط أعلى + عدد إشارات أكثر = ثقة أعلى، لكن بحد أقصى واقعي
  const signalCount = winner.signals.length;
  const rawConfidence = 55 + Math.min(35, winner.score) + Math.min(8, signalCount * 2);
  // إن كان هناك منافس قريب جداً، نخفّض الثقة لأن التصنيف غامض
  const ambiguityPenalty = runnerUp && runnerUp.score >= winner.score * 0.75 ? 10 : 0;
  const confidence = Math.max(60, Math.min(97, rawConfidence - ambiguityPenalty));

  return {
    detectedService: winner.rule.detectedService,
    detectedServiceName: winner.rule.detectedServiceName,
    fileNature: winner.rule.fileNature,
    confidence,
    signals: winner.signals,
    suggestions: winner.rule.suggestions,
    insight: winner.rule.baseInsight,
    runnerUp: runnerUp ? { serviceName: runnerUp.rule.detectedServiceName, score: runnerUp.score } : undefined,
  };
}
